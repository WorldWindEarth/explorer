/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

/**
 * The Globe module manages the WorldWindow object and add capabilities to the globe not found in the
 * Web World Wind library.
 *
 * @param {Knockout}
 * @param {Config}
 * @param {Events}
 * @param {Constants}
 * @param {EnhancedLookAtNavigator} EnhancedLookAtNavigator Doesn't allow the eye pos to go below the terrain.
 * @param {EnhancedTextSupport} EnhancedTextSupport Provides outline text.
 * @param {EnhancedViewControlsLayer} EnhancedViewControlsLayer Provides a vertical layout.
 * @param {KeyboardControls} KeyboardControls Provides keyboard navigation for the globe.
 * @param {LayoutManager}
 * @param {LocationWidget}
 * @param {Log} log Logger.
 * @param {Publisher}
 * @param {ReticuleLayer} ReticuleLayer Crosshairs.
 * @param {SelectController} SelectController Provides select and move of globe renderables.
 * @param {SkyBackgroundLayer} SkyBackgroundLayer Adaptive sky color.
 * @param {Sunlight}
 * @param {Terrain} Terrain Aspect, slope and elevation.
 * @param {TerrainProvider} TerrainProvider Provides terrain data.
 * @param {TimeWidget}
 * @param {TimeZoneLayer}
 * @param {Viewpoint} Viewpoint Eye position and target terrain.
 * @param {WorldWind} ww Web World Wind.
 * @returns {Globe}
 *
 * @author Bruce Schubert
 */
define(['knockout',
        'model/Config',
        'model/Constants',
        'model/Events',
        'model/globe/layers/EnhancedAtmosphereLayer',
        'model/globe/EnhancedLookAtNavigator',
        'model/globe/EnhancedTextSupport',
        'model/globe/layers/EnhancedViewControlsLayer',
        'model/globe/KeyboardControls',
        'model/globe/LayerManager',
        'model/globe/widgets/LocationWidget',
        'model/util/Log',
        'model/util/Publisher',
        'model/globe/layers/ReticuleLayer',
        'model/globe/SelectController',
        'model/globe/layers/SkyBackgroundLayer',
        'model/globe/Sunlight',
        'model/globe/Terrain',
        'model/globe/TerrainProvider',
        'model/globe/widgets/TimeWidget',
        'model/globe/layers/TimeZoneLayer',
        'model/globe/Viewpoint',
        'model/util/WmtUtil',
        'worldwind'],
    function (ko,
              config,
              constants,
              events,
              EnhancedAtmosphereLayer,
              EnhancedLookAtNavigator,
              EnhancedTextSupport,
              EnhancedViewControlsLayer,
              KeyboardControls,
              LayerManager,
              LocationWidget,
              log,
              publisher,
              ReticuleLayer,
              SelectController,
              SkyBackgroundLayer,
              Sunlight,
              Terrain,
              TerrainProvider,
              TimeWidget,
              TimeZoneLayer,
              Viewpoint,
              util,
              ww) {
        "use strict";
        /**
         * Creates a Globe object which manages a WorldWindow object created for the given canvas.
         * @constructor
         * @param {WorldWindow} wwd The WorldWindow object.
         * @param {Object} options Optional. Example (with defaults):
         *  {
             *      showBackground: true
             *      showReticule: true, 
             *      showViewControls: true, 
             *      includePanControls: true, 
             *      includeRotateControls: true, 
             *      includeTiltControls: true, 
             *      includeZoomControls: true, 
             *      includeExaggerationControls: false, 
             *      includeFieldOfViewControls: false, 
             *  }
         * @returns {Globe}
         */
        var Globe = function (wwd, options) {
            // Mix-in Publisher capability (publish/subscribe pattern)
            publisher.makePublisher(this);

            this.wwd = wwd;

            // Observable properties
            this.timeZoneOffsetHours = ko.observable(0); // default to UTC
            this.timeZoneName = ko.observable("UTC"); // default to UTC
            this.dateTime = ko.observable(new Date(0));
            this.viewpoint = ko.observable(Viewpoint.ZERO).extend({rateLimit: 100});
            this.terrainAtMouse = ko.observable(Terrain.ZERO);
            this.sunlight = ko.observable(new Sunlight(
                this.dateTime(),
                this.viewpoint().target.latitude,
                this.viewpoint().target.longitude)).extend({rateLimit: 100});

            // Override the default TextSupport with our custom verion that draws outline text
            this.wwd.drawContext.textSupport = new EnhancedTextSupport();
            // Add support for animating the globe to a position.
            this.goToAnimator = new WorldWind.GoToAnimator(this.wwd);
            this.isAnimating = false;
            // Add the custom navigator *before* the select controller
            // so the select controller can consume the mouse events
            // and preempt the globe pan/drag operations when moving objects.
            // Event handlers are called in the reverse order in which
            // they are registered.
            this.wwd.navigator = new EnhancedLookAtNavigator(this.wwd);
            this.wwd.highlightController = new WorldWind.HighlightController(this.wwd);
            this.selectController = new SelectController(this.wwd);
            this.keyboardControls = new KeyboardControls(this);
            this.layerManager = new LayerManager(this);
            this.resizeTimer = null;
            this.canvasWidth = null;
            // Add terrain services (aspect, slope) to the globe
            this.terrainProvider = new TerrainProvider(this);

            // Create the standard background, view controls and widget layers

            var self = this,
                showBackground = options ? options.showBackground : true,
                showReticule = options ? options.showReticule : true,
                showViewControls = options ? options.showViewControls : true,
                showWidgets = options ? options.showWidgets : true,
                includePanControls = options ? options.includePanControls : true,
                includeRotateControls = options ? options.includeRotateControls : true,
                includeTiltControls = options ? options.includeTiltControls : true,
                includeZoomControls = options ? options.includeZoomControls : true,
                includeExaggerationControls = options ? options.includeExaggerationControls : true,
                includeFieldOfViewControls = options ? options.includeFieldOfViewControls : false,
                controls,
                widgets;

            // Add optional background layers
            if (showBackground || showBackground === undefined) {
                this.layerManager.addOverlayLayer(new TimeZoneLayer(), {
                    enabled: true,
                    pickEnabled: true,
                    opacity: 0.1
                });
                this.layerManager.addEffectLayer(new EnhancedAtmosphereLayer(this));
            }


            // Adjust the level of detail based on screen properties
//            this.adjustTiledImageLayerDetailHints();


            // Add optional reticule
            if (showReticule || showReticule === undefined) {
                this.layerManager.addWidgetLayer(new ReticuleLayer());
            }


            // Add optional view controls layer
            if (showViewControls || showViewControls === undefined) {
                controls = new EnhancedViewControlsLayer(this.wwd);
                controls.showPanControl = includePanControls;
                controls.showHeadingControl = includeRotateControls;
                controls.showTiltControl = includeTiltControls;
                controls.showZoomControl = includeZoomControls;
                controls.showExaggerationControl = includeExaggerationControls;
                controls.showFieldOfViewControl = includeFieldOfViewControls;
                this.layerManager.addWidgetLayer(controls);
            }


            // Add optional time and location widgets
            if (showWidgets || showWidgets === undefined) {
                widgets = new WorldWind.RenderableLayer(constants.LAYER_NAME_WIDGETS);
                widgets.addRenderable(new TimeWidget(this));
                widgets.addRenderable(new LocationWidget(this));
                this.layerManager.addWidgetLayer(widgets);
            }

            // Add handler to redraw the WorldWindow during resize events
            // to prevent the canvas from looking distorted.
            // Adjust the level of detail proportional to the
            // window size.
            $(window).resize(function () {
                self.wwd.redraw();

//                clearTimeout(self.resizeTimer);
//                self.resizeTimer = setTimeout(function () {
//                    self.adjustTiledImageLayerDetailHints();
//                }, 2000);
            });

            // Ensure keyboard controls are operational by
            // setting focus to the globe
            this.wwd.addEventListener("click", function (event) {
                self.setFocus();
            });

            // Internals
            this.lastEyePoint = new WorldWind.Vec3();
            this.lastViewpoint = new Viewpoint(WorldWind.Position.ZERO, Terrain.ZERO);
            this.lastMousePoint = new WorldWind.Vec2();
            this.lastSolarTarget = new Terrain(0, 0, 0, 0, 0);
            this.lastSolarTime = new Date(0);
            this.SUNLIGHT_DISTANCE_THRESHOLD = 10000; // meters
            this.SUNLIGHT_TIME_THRESHOLD = 15; // minutes

            // Perform initial updates for time and sunlight
            this.updateDateTime(new Date());

            // Subscribe to rate-throttled viewpoint updates
            this.viewpoint.subscribe(this.updateTimeZoneOffset, this);
        };

        /**
         *
         * @param {Date} time
         */
        Globe.prototype.updateDateTime = function (time) {
            if (this.dateTime().valueOf() === time.valueOf()) {
                return;
            }
            // Update the sunlight angles when the elapsed time has gone past the threshold (15 min)
            if (util.minutesBetween(this.lastSolarTime, time) > this.SUNLIGHT_TIME_THRESHOLD) {
                this.updateSunlight(time, this.lastSolarTarget.latitude, this.lastSolarTarget.longitude);
            }
            //log.info("Globe", "updateDateTime", time.toLocaleString());

            this.dateTime(time); // observable
        };

        /**
         * Updates the date/time with the an adjusted time (+/- minutues).
         * @param {Number} minutes The number of minutes (+/-) added or subtracted from the current application time.
         */
        Globe.prototype.incrementDateTime = function (minutes) {
            var msCurrent = this.dateTime().valueOf(),
                msNew = msCurrent + (minutes * 60000);
            this.updateDateTime(new Date(msNew));
        };

        /**
         * Updates model properties associated with the globe's view.
         */
        Globe.prototype.updateEyePosition = function () {
            var viewpoint = this.getViewpoint(), // computes the viewpoint
                target = viewpoint.target,
                time = this.dateTime();

            // Initiate a request to update the sunlight property when we've moved a significant distance
            if (!this.lastSolarTarget || this.lastSolarTarget.distanceBetween(target) > this.SUNLIGHT_DISTANCE_THRESHOLD) {
                this.lastSolarTarget.copy(target);
                this.updateSunlight(time, target.latitude, target.longitude);
            }

            this.viewpoint(viewpoint);  // observable
        };

        /**
         * Updates the time zone offset.
         */
        Globe.prototype.updateTimeZoneOffset = function () {
            var canvasCenter = new WorldWind.Vec2(this.wwd.canvas.width / 2, this.wwd.canvas.height / 2),
                pickList = this.wwd.pick(canvasCenter),
                i, len, pickedObject, userObject, record, layer;

            if (pickList.hasNonTerrainObjects()) {

                for (i = 0, len = pickList.objects.length; i < len; i++) {
                    pickedObject = pickList.objects[i];
                    if (pickedObject.isTerrain) {
                        continue;
                    }
                    userObject = pickedObject.userObject;
                    if (userObject.userProperties) {
                        layer = userObject.userProperties.layer;
                        if (layer && layer instanceof TimeZoneLayer) {
                            record = userObject.userProperties.record;
                            if (record) {   // DBaseRecord
                                // Update observables
                                this.timeZoneName(record.values.time_zone);
                                this.timeZoneOffsetHours(record.values.zone);
                                break;
                            }
                        }
                    }
                }
            }
        };

        /**
         * Updates the terrainAtMouse observable property.
         *
         * @param {Vec2} mousePoint Mouse point or touchpoint coordiantes.
         */
        Globe.prototype.updateMousePosition = function (mousePoint) {
            if (mousePoint.equals(this.lastMousePoint)) {
                return;
            }
            this.lastMousePoint.copy(mousePoint);
            var terrain = this.getTerrainAtScreenPoint(mousePoint);

            this.terrainAtMouse(terrain);   // observable
        };

        Globe.prototype.updateSunlight = function (time, latitude, longitude) {
            this.lastSolarTime = time;
            this.lastSolarTarget.latitude = latitude;
            this.lastSolarTarget.longitude = longitude;

            this.sunlight(new Sunlight(time, latitude, longitude)); // observable
        };

        /**
         * Adjusts the level of detail to be proportional to the window size.
         * If the window is twice the size of the base, then the detailHint should be 0.2;
         * if the window half the size then the detail level should be -0.2.
         */
        Globe.prototype.adjustTiledImageLayerDetailHints = function () {
            var width = $(this.wwd.canvas).width(),
                i, len, layer,
                detailHint;

            if (this.canvasWidth === width) {
                return;
            }
            this.canvasWidth = width;

            if (width < 1000) {
                // Mobile
                detailHint = -0.1;
//            } else if (width < 970) {
//                detailHint = 0.0;
//            } else if (width < 1170) {
//                detailHint = 0.1;
//            } else if (width < 1400) {
//                detailHint = 0.15;
            } else {
                detailHint = util.linearInterpolation(width, 1000, 2000, 0, 0.4);
            }

            // $(window).width() / parseFloat($("body").css("font-size"));

            // Process TiledImageLayers
            for (i = 0, len = this.wwd.layers.length; i < len; i++) {
                layer = this.wwd.layers[i];
                if (layer instanceof WorldWind.TiledImageLayer) {
                    layer.detailHint = detailHint;
                }
            }
        };

        /**
         * Finds the World Wind Layer in the layer list with the given display name.
         * @param {String} name Display name of the layer
         * @returns {Layer}
         */
        Globe.prototype.findLayer = function (name) {
            var layer,
                i, len;
            for (i = 0, len = this.wwd.layers.length; i < len; i++) {
                layer = this.wwd.layers[i];
                if (layer.displayName === name) {
                    return layer;
                }
            }
        };

        /**
         * Gets terrain at the given latitude and longitude.
         * @param {Number} latitude
         * @param {Number} longitude
         * @return {Terrain} A WMT Terrain object at the given lat/lon.
         */
        Globe.prototype.getTerrainAtLatLon = function (latitude, longitude) {
            return this.terrainProvider.terrainAtLatLon(latitude, longitude);
        };

        /**
         * EXPERIMENTAL!!
         * Gets terrain at the given latitude and longitude.
         * @param {Number} latitude
         * @param {Number} longitude
         * @param {Number} targetResolution: The desired elevation resolution, in radians. (To compute radians from
         * meters, divide the number of meters by the globe's radius.) Default 1/WorldWind.EARTH_RADIUS.
         * @return {Terrain} An Explorer Terrain object at the given lat/lon.
         */
        Globe.prototype.getTerrainAtLatLonHiRes = function (latitude, longitude, targetResolution) {
            return this.terrainProvider.terrainAtLatLon(latitude, longitude, targetResolution || 1 / WorldWind.EARTH_RADIUS);
        };

        /**
         * Gets terrain at the screen point.
         * @param {Vec2} screenPoint Point in screen coordinates for which to get terrain.
         * @return {Terrain} A WMT Terrain object at the screen point.
         */
        Globe.prototype.getTerrainAtScreenPoint = function (screenPoint) {
            var terrainObject,
                terrain;
            // Get the WW terrain at the screen point, it supplies the lat/lon
            terrainObject = this.wwd.pickTerrain(screenPoint).terrainObject();
            if (terrainObject) {
                // Get the WMT terrain at the picked lat/lon
                terrain = this.terrainProvider.terrainAtLatLon(
                    terrainObject.position.latitude,
                    terrainObject.position.longitude);
            } else {
                // Probably above the horizon.
                terrain = new Terrain();
                terrain.copy(Terrain.INVALID);
            }
            return terrain;
        };

        /**
         * Gets the current viewpoint at the center of the viewport.
         * @@returns {Viewpoint} A Viewpoint representing the the eye position and the target position.
         */
        Globe.prototype.getViewpoint = function () {
            try {
                var wwd = this.wwd,
                    centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2),
                    navigatorState = wwd.navigator.currentState(),
                    eyePoint = navigatorState.eyePoint,
                    eyePos = new WorldWind.Position(),
                    target, viewpoint;
                // Avoid costly computations if nothing changed
                if (eyePoint.equals(this.lastEyePoint)) {
                    return this.lastViewpoint;
                }
                this.lastEyePoint.copy(eyePoint);
                // Get the current eye position
                wwd.globe.computePositionFromPoint(eyePoint[0], eyePoint[1], eyePoint[2], eyePos);
                // Get the target (the point under the reticule)
                target = this.getTerrainAtScreenPoint(centerPoint);
                // Return the viewpoint
                viewpoint = new Viewpoint(eyePos, target);
                this.lastViewpoint.copy(viewpoint);
                return viewpoint;
            } catch (e) {
                log.error("Globe", "getViewpoint", e.toString());
                return Viewpoint.INVALID;
            }
        };

        /**
         * Updates the globe via animation.
         * @param {Number} latitude Reqd.
         * @param {Number} longitude Reqd.
         * @param {Number} range Optional.
         * @param {Function} callback Optional.
         */
        Globe.prototype.goto = function (latitude, longitude, range, callback) {
            if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                log.error("Globe", "gotoLatLon", "Invalid Latitude and/or Longitude.");
                return;
            }
            var self = this;
            if (this.isAnimating) {
                this.goToAnimator.cancel();
            }
            this.isAnimating = true;
            this.goToAnimator.goTo(new WorldWind.Position(latitude, longitude, range), function () {
                self.isAnimating = false;
                if (callback) {
                    callback();
                }
            });
        };

        /**
         * Updates the globe without animation.
         * @param {Number} latitude Reqd.
         * @param {Number} longitude Reqd.
         * @param {Number} range Optional.
         */
        Globe.prototype.lookAt = function (latitude, longitude, range) {
            if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                log.error("Globe", "lookAt", "Invalid Latitude and/or Longitude.");
                return;
            }
            this.wwd.navigator.lookAtLocation.latitude = latitude;
            this.wwd.navigator.lookAtLocation.longitude = longitude;
            if (range) {
                this.wwd.navigator.range = range;
            }
            this.wwd.redraw();
        };

        /**
         * Redraws the globe.
         */
        Globe.prototype.redraw = function () {
            this.wwd.redraw();
        };

        /**
         * Refreshes temporal layers.
         */
        Globe.prototype.refreshLayers = function () {
            var i, len, layer;

            // Process TiledImageLayers
            for (i = 0, len = this.wwd.layers.length; i < len; i++) {
                layer = this.wwd.layers[i];
                if (layer.isTemporal) {
                    layer.refresh();
                }
                this.wwd.redraw();
            }

        };

        /**
         * Resets the viewpoint to the startup configuration settings.
         */
        Globe.prototype.reset = function () {
            this.wwd.navigator.lookAtLocation.latitude = Number(config.startupLatitude);
            this.wwd.navigator.lookAtLocation.longitude = Number(config.startupLongitude);
            this.wwd.navigator.range = Number(config.startupAltitude);
            this.wwd.navigator.heading = Number(config.startupHeading);
            this.wwd.navigator.tilt = Number(config.startupTilt);
            this.wwd.navigator.roll = Number(config.startupRoll);
            this.wwd.redraw();
        };

        /**
         * Resets the viewpoint to north up.
         */
        Globe.prototype.resetHeading = function () {
            this.wwd.navigator.heading = Number(0);
            this.wwd.redraw();
        };

        /**
         * Resets the viewpoint to north up and nadir.
         */
        Globe.prototype.resetHeadingAndTilt = function () {
            // Tilting the view will change the location due to a bug in
            // the early release of WW.  So we set the location to the
            // current crosshairs position (viewpoint) to resolve this issue
            var viewpoint = this.getViewpoint(),
                lat = viewpoint.target.latitude,
                lon = viewpoint.target.longitude;
            this.wwd.navigator.heading = 0;
            this.wwd.navigator.tilt = 0;
            this.wwd.redraw(); // calls applyLimits which changes the location

            this.lookAt(lat, lon);
        };

        Globe.prototype.setFocus = function () {
            this.wwd.canvas.focus();
        };

        /**
         * Establishes the projection for this globe.
         * @param {String} projectionName A PROJECTION_NAME_* constant.
         */
        Globe.prototype.setProjection = function (projectionName) {
            if (projectionName === constants.PROJECTION_NAME_3D) {
                if (!this.roundGlobe) {
                    this.roundGlobe = new WorldWind.Globe(new WorldWind.EarthElevationModel());
                }

                if (this.wwd.globe !== this.roundGlobe) {
                    this.wwd.globe = this.roundGlobe;
                }
            } else {
                if (!this.flatGlobe) {
                    this.flatGlobe = new WorldWind.Globe2D();
                }

                if (projectionName === constants.PROJECTION_NAME_EQ_RECT) {
                    this.flatGlobe.projection = new WorldWind.ProjectionEquirectangular();
                } else if (projectionName === constants.PROJECTION_NAME_MERCATOR) {
                    this.flatGlobe.projection = new WorldWind.ProjectionMercator();
                } else if (projectionName === constants.PROJECTION_NAME_NORTH_POLAR) {
                    this.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("North");
                } else if (projectionName === constants.PROJECTION_NAME_SOUTH_POLAR) {
                    this.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("South");
                } else if (projectionName === constants.PROJECTION_NAME_NORTH_UPS) {
                    this.flatGlobe.projection = new WorldWind.ProjectionUPS("North");
                } else if (projectionName === constants.PROJECTION_NAME_SOUTH_UPS) {
                    this.flatGlobe.projection = new WorldWind.ProjectionUPS("South");
                } else if (projectionName === constants.PROJECTION_NAME_NORTH_GNOMONIC) {
                    this.flatGlobe.projection = new WorldWind.ProjectionGnomonic("North");
                } else if (projectionName === constants.PROJECTION_NAME_SOUTH_GNOMONIC) {
                    this.flatGlobe.projection = new WorldWind.ProjectionGnomonic("South");
                }

                if (this.wwd.globe !== this.flatGlobe) {
                    this.wwd.globe = this.flatGlobe;
                }
            }
            this.wwd.redraw();
        };

        return Globe;
    }
);
