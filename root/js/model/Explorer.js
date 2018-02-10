/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind*/


define([
    'knockout',
    'url-search-params',
    'model/Config',
    'model/globe/Globe',
    'model/util/Log',
    'model/util/Settings',
    'model/markers/MarkerManager',
    'model/weather/WeatherScoutManager',
    'viewmodels/BookmarkViewModel',
    'viewmodels/GlobeViewModel',
    'viewmodels/InfoViewModel',
    'viewmodels/LayersViewModel',
    'viewmodels/LayerSettings',
    'viewmodels/MarkerEditor',
    'viewmodels/MarkersViewModel',
    'viewmodels/ProjectionsViewModel',
    'viewmodels/SearchViewModel',
    'viewmodels/SettingsViewModel',
    'viewmodels/WeatherScoutEditor',
    'viewmodels/WeatherViewModel',
    'worldwind'], function (
        ko,
        URLSearchParams,
        config,
        Globe,
        log,
        settings,
        MarkerManager,
        WeatherScoutManager,
        BookmarkViewModel,
        GlobeViewModel,
        InfoViewModel,
        LayersViewModel,
        LayerSettings,
        MarkerEditor,
        MarkersViewModel,
        ProjectionsViewModel,
        SearchViewModel,
        SettingsViewModel,
        WeatherScoutEditor,
        WeatherViewModel
        ) {
    "use strict";
    /**
     * @constructor
     * @param {WorldWind.WorldWindow} wwd
     * @returns {ExplorerL#31.Explorer}
     */
    var Explorer = function (wwd) {

        var self = this;
        this.wwd = wwd;

        // Create our Globe model objectmodel explorer's primary globe that's 
        // Define the configuration for the primary globe
        var globeOptions = {
            showBackground: true,
            showReticule: true,
            showViewControls: true,
            includePanControls: config.showPanControl,
            includeRotateControls: true,
            includeTiltControls: true,
            includeZoomControls: true,
            includeExaggerationControls: config.showExaggerationControl,
            includeFieldOfViewControls: config.showFieldOfViewControl};

        this.globe = new Globe(wwd, globeOptions);

        // Load additional layers and layer options
        this.globe.layerManager.loadDefaultLayers();

        // Configure the manager of objects on the globe
        this.markerManager = new MarkerManager(this.globe);
        this.weatherManager = new WeatherScoutManager(this.globe);

        // Configure the objects used to animate the globe when performing "go to" operations
        this.goToAnimator = new WorldWind.GoToAnimator(this.wwd);
        this.isAnimating = false;

        // Internal. Intentionally not documented.
        this.updateTimeout = null;
        this.updateInterval = 200;   // throttle the spatial data updates to 5hz

        // Setup to update each time the World Window is repainted.
        this.wwd.redrawCallbacks.push(function () {
            self.handleRedraw();
        });

        // Setup an interval to update the current time
        this.autoUpdateTimeEnabled = ko.observable(true);
        this.dateTimeInterval = window.setInterval(function () {
            if (self.autoUpdateTimeEnabled()) {
                self.globe.updateDateTime(new Date());
            }
        }, 30000);  // Update every 30 seconds

        // Setup to track the cursor position relative to the World Window's canvas. Listen to touch events in order
        // to recognize and ignore simulated mouse events in mobile browsers.
        window.addEventListener("mousemove", function (event) {
            self.handleMouseEvent(event);
        });
        window.addEventListener("touchstart", function (event) {
            self.handleTouchEvent(event);
        });


        // --------------------------------------------------------
        // Initialize the view models with their assigned views
        // --------------------------------------------------------
        new GlobeViewModel(self, {
            markerManager: self.markerManager,
            weatherManager: self.weatherManager},
                "globe", "js/views/globe.html", "globe");

        new SearchViewModel(self.globe, "search");
        new BookmarkViewModel(self.globe, "bookmark", "js/views/bookmark.html", "right-navbar");
        new ProjectionsViewModel(self.globe, "projections", "js/views/projections.html", "right-navbar");

        // Tab Panels
        new LayersViewModel(self.globe, "layers", "js/views/layers.html", "left-sidebar");
        new MarkersViewModel(self.globe, self.markerManager, "markers", "js/views/markers.html", "left-sidebar");
        new WeatherViewModel(self.globe, self.weatherManager, "weather", "js/views/weather.html", "left-sidebar");
        new SettingsViewModel(self.globe, "settings", "js/views/settings.html", "left-sidebar");
        new InfoViewModel(self.globe, "info", "js/views/info.html", "info-panel");

        // Dialogs
        new LayerSettings(self.globe, "layer-settings-dialog", "js/views/layer-settings.html");
        new MarkerEditor("marker-editor", "js/views/marker-editor.html");
        new WeatherScoutEditor("weather-scout-editor", "js/views/weather-scout-editor.html");

    };

    /**
     *
     * @param {Number} latitude
     * @param {Number} longitude
     * @param {Object} params
     */
    Explorer.prototype.identifyFeaturesAtLatLon = function (latitude, longitude, params) {
        var arg = params || {};

        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            log.error("Explorer", "identifyFeaturesAtLatLon", "Invalid Latitude and/or Longitude.");
            return;
        }
    };

    /**
     * Centers the globe on the given lat/lon via animation.
     * @param {Number} latitude
     * @param {Number} longitude
     * @param {Number} eyeAltitude optional
     */
    Explorer.prototype.gotoLatLonAlt = function (latitude, longitude, eyeAltitude) {
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            log.error("Explorer", "gotoLatLonAlt", "Invalid Latitude and/or Longitude.");
            return;
        }
        // TODO: Make AGL and MSL elevations a function of the model
        // TODO: Eye Position a property of the model
        // 
        var self = this,
                viewpoint = this.globe.getViewpoint(),
                eyeAltMsl = viewpoint.eye.altitude,
                eyePosGrdElev = this.globe.terrainProvider.elevationAtLatLon(viewpoint.eye.latitude, viewpoint.eye.longitude),
                tgtPosElev = this.globe.terrainProvider.elevationAtLatLon(latitude, longitude),
                eyeAltAgl = eyeAltitude || Math.max(eyeAltMsl - eyePosGrdElev, 100),
                tgtEyeAltMsl = Math.max(tgtPosElev + eyeAltAgl, 100);

        // HACK: Force the view to nadir to avoid bug where navigator looks at target at 0 MSL.
        // This will establish the crosshairs on the target.
        this.wwd.navigator.range = eyeAltMsl;
        this.wwd.navigator.tilt = 0;
        this.wwd.redraw();

        this.globe.goto(latitude, longitude, tgtEyeAltMsl, function () {
            self.updateSpatialData();
        });
    };

    /**
     * Returns the terrain at the reticule.
     * @returns {Terrain} Explorer.model.viewpoint.target}
     */
    Explorer.prototype.getTargetTerrain = function () {
        return this.globe.getViewpoint().target;
    };

    /**
     * Restores all the persistant data from a previous session.
     * This method must be called after World Wind has finished
     * updating. 
     */
    Explorer.prototype.restoreSession = function () {
        log.info('Explorer', 'restoreSession', 'Restoring the model and view.');
        this.markerManager.restoreMarkers();
        this.weatherManager.restoreScouts();
        this.restoreSessionView();
        // Update all time sensitive objects
        this.globe.updateDateTime(new Date());

        // Force a refresh now that everything is setup.
        this.globe.redraw();
    };

    // Internal method
    Explorer.prototype.restoreSessionView = function () {
        // TODO: Create a Bookmark class similar to the Settings class with generate and restore methods
        var urlParameters, lat, lon, alt, heading, tilt, roll;

        // Check if URL string has globe camera params associated. 
        // See Globe.getCameraParams()
        // The '.slice(1)' operation removes the question mark separator.
        urlParameters = new URLSearchParams(window.location.search.slice(1));

        // Initalize the view from a URL
        if (urlParameters.has("lat") && urlParameters.has("lon") && urlParameters.has("alt")) {
            lat = Number(urlParameters.get("lat"));
            lon = Number(urlParameters.get("lon"));
            alt = Number(urlParameters.get("alt"));
            heading = Number(urlParameters.get("heading"));
            tilt = Number(urlParameters.get("tilt"));
            roll = Number(urlParameters.get("roll"));
            if (isNaN(lat) || isNaN(lon) || isNaN(alt)) {
                log.warning("Explorer", "restoreSessionView", "URL lat,lon,alt values invalid. Using default values instead.");
                // fall thru to use previous session settings
            } else {
                if (isNaN(heading) || isNaN(tilt) || isNaN(roll)) {
                    log.warning("Explorer", "restoreSessionView", "URL camera values invalid. Ignoring.");
                    // fall thru to use previous session settings
                } else {
                    this.wwd.navigator.heading = heading;
                    this.wwd.navigator.tilt = tilt;
                    this.wwd.navigator.roll = roll;
                    this.wwd.redraw();
                }
                // FIX THIS: viewpoint is not updating!
//                            this.globe.lookAt(lat, lon, alt);
//                            this.globe.updateEyePosition(); // update time widget
                this.gotoLatLonAlt(lat, lon, alt);
                
                return;
            }
        }
        // Restore previous session If there isn't a bookmark url
        settings.restoreSessionSettings(this);

    };

    /**
     * Saves the current session to the persistent store.
     * See the call to window.onUnload(...) in WmtClient.
     */
    Explorer.prototype.saveSession = function () {
        log.info('Explorer', 'saveSession', 'Saving the model and view.');
        this.saveSessionView();
        this.markerManager.saveMarkers();
        this.weatherManager.saveScouts();
        this.globe.layerManager.saveLayers();
    };

    // Internal method.
    Explorer.prototype.saveSessionView = function () {
        settings.saveSessionSettings(this);
    };

    /**
     * Updates the view model with current globe viewpoint.
     */
    Explorer.prototype.updateSpatialData = function () {
        var wwd = this.wwd,
                mousePoint = this.mousePoint,
                centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2);

        // Use the mouse point when we've received at least one mouse event. Otherwise assume that we're
        // on a touch device and use the center of the World Window's canvas.
        if (!mousePoint) {
            this.globe.updateMousePosition(centerPoint);
        } else if (wwd.viewport.containsPoint(mousePoint)) {
            this.globe.updateMousePosition(mousePoint);
        }
        // Update the viewpoint
        if (!this.isAnimating) {
            this.globe.updateEyePosition();
        }
    };

    /**
     * handleRedraw is a callback used to update the spatial view models.
     * when the view is redrawn.
     */
    Explorer.prototype.handleRedraw = function () {
        var self = this;
        if (self.updateTimeout) {
            return; // we've already scheduled an update; ignore redundant redraw events
        }
        self.updateTimeout = window.setTimeout(function () {
            // Update the geospatial view models
            self.updateSpatialData();
            self.updateTimeout = null;
        }, self.updateInterval);
    };

    Explorer.prototype.handleMouseEvent = function (event) {
        if (this.isTouchDevice) {
            return; // ignore simulated mouse events in mobile browsers
        }
        this.mousePoint = this.wwd.canvasCoordinates(event.clientX, event.clientY);
        this.wwd.redraw();
    };

    //noinspection JSUnusedLocalSymbols
    Explorer.prototype.handleTouchEvent = function () {
        this.isTouchDevice = true; // suppress simulated mouse events in mobile browsers
        this.mousePoint = null;

    };

    return Explorer;
});