/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global require, requirejs, WorldWind */

/**
 * Set DEBUG true to use debug versions of the libraries; set false to use
 * the minified versions for production.
 * @type Boolean
 */
window.DEBUG = true;

/**
 * Require.js bootstrapping javascript
 */
requirejs.config({
// Path mappings for the logical module names
    paths: {
        'dragula': 'libs/dragula/dragula',
        'knockout': window.DEBUG ? 'libs/knockout/knockout-3.4.0.debug' : 'libs/knockout/knockout-3.4.0',
        'jquery': window.DEBUG ? 'libs/jquery/jquery-2.1.3' : 'libs/jquery/jquery-2.1.3.min',
        'jqueryui': window.DEBUG ? 'libs/jquery-ui/jquery-ui-1.11.4' : 'libs/jquery-ui/jquery-ui-1.11.4.min',
        'jquery-growl': 'libs/jquery-plugins/jquery.growl',
        'bootstrap': window.DEBUG ? 'libs/bootstrap/v3.3.6/bootstrap.min' : 'libs/bootstrap/v3.3.6/bootstrap',
        'moment': window.DEBUG ? 'libs/moment/moment-2.14.1.min' : 'libs/moment/moment-2.14.1.min',
        'd3': window.DEBUG ? 'libs/d3/d3' : 'libs/d3/d3.min',
        'url-search-params': 'libs/url-search-params/url-search-params.max.amd',
        'vis': window.DEBUG ? 'libs/vis/v4.16.1/vis' : 'libs/vis/v4.16.1/vis.min',
        'worldwind': window.DEBUG ? 'libs/webworldwind/v0.9.0/worldwind' : '//files.worldwind.arc.nasa.gov/artifactory/web/0.9.0/worldwind.min',
        'model': 'model' // root application path
    },
    // Shim configuration for Bootstrap's JQuery dependency
    shim: {
        "bootstrap": {
            deps: ["jquery"],
            exports: "$.fn.popover"
        }
    }
});

/**
 * A top-level require call executed by the Application.
 * 
 */
require([
    'knockout',
    'jquery',
    'jqueryui',
    'worldwind',
    'model/Config',
    'model/Constants',
    'model/Explorer',
    'model/globe/Globe',
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
    'viewmodels/WeatherViewModel'],
    function (ko, $, jqueryui, ww,
        config,
        constants,
        explorer,
        Globe,
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
        WeatherViewModel) { // this callback gets executed when all required modules are loaded
        "use strict";
        // ----------------
        // Setup the globe
        // ----------------
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = ww.WWUtil.currentUrlSansFilePart() + "/" + constants.WORLD_WIND_PATH;

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
            includeFieldOfViewControls: config.showFieldOfViewControl},
            globe;

        // Create the explorer's primary globe that's associated with the specified HTML5 canvas
        globe = new Globe(new WorldWind.WorldWindow("globe-canvas"), globeOptions);

        // Load additional layers and layer options
        globe.layerManager.loadDefaultLayers();

        // Initialize the Explorer object with a basic Globe to "explore"
        explorer.initialize(globe);

        // --------------------------------------------------------
        // Add a custom Knockout binding for JQuery slider 
        // See: http://knockoutjs.com/documentation/custom-bindings.html
        // --------------------------------------------------------
        ko.bindingHandlers.slider = {
            init: function (element, valueAccessor, allBindings) {
                var options = allBindings().sliderOptions || {};
                // Initialize a slider with the given options
                $(element).slider(options);

// Commented out to prevent duplicate updates as a result of the update event
// causing a second update to the observable with possibly a differnt value
// than was to trigger the update event.
//                // Register a listener on completed changes to the slider                
//                $(element).on("slidechange", function (event, ui) {
//                    var observable = valueAccessor();
//                    observable(ui.value);
//                });
//                
                // Resister a listener on mouse moves to the handle
                $(element).on("slide", function (event, ui) {
                    var observable = valueAccessor();
                    observable(ui.value);
                });
                // Cleanup - See http://knockoutjs.com/documentation/custom-bindings-disposal.html
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $(element).slider("destroy");
                });
            },
            update: function (element, valueAccessor) {
                // Update the slider when the bound value changes
                var value = ko.unwrap(valueAccessor());
                $(element).slider("value", isNaN(value) ? 0 : value);
            }
        };

        // --------------------------------------------------------
        // Initialize the view models with their assigned views
        // --------------------------------------------------------
        new GlobeViewModel(globe, {
            markerManager: explorer.markerManager,
            weatherManager: explorer.weatherManager},
            "globe", "js/views/globe.html", "globe");

        new SearchViewModel(globe, "search");
        new BookmarkViewModel(globe, "bookmark", "js/views/bookmark.html", "right-navbar");
        new ProjectionsViewModel(globe, "projections", "js/views/projections.html", "right-navbar");

        // Tab Panels
        new LayersViewModel(globe, "layers", "js/views/layers.html", "left-sidebar");
        new MarkersViewModel(globe, explorer.markerManager, "markers", "js/views/markers.html", "left-sidebar");
        new WeatherViewModel(globe, explorer.weatherManager, "weather", "js/views/weather.html", "left-sidebar");
        new SettingsViewModel(globe, "settings", "js/views/settings.html", "left-sidebar");
        new InfoViewModel(globe, "info", "js/views/info.html", "info-panel");

        // Dialogs
        new LayerSettings(globe, "layer-settings-dialog", "js/views/layer-settings.html");
        new MarkerEditor("marker-editor", "js/views/marker-editor.html");
        new WeatherScoutEditor("weather-scout-editor", "js/views/weather-scout-editor.html");


        // -----------------------------------------------------------
        // Add handlers to auto-expand/collapse the menus
        // -----------------------------------------------------------
        // Auto-expand menu section-bodies when not small
        $(window).resize(function () {
            if ($(window).width() >= 768) {
                $('.section-body').collapse('show');
            }
        });
        // Auto-collapse navbar when its tab items are clicked
        $('.navbar-collapse a[role="tab"]').click(function () {
            $('.navbar-collapse').collapse('hide');
        });
        // Auto-scroll-into-view expanded dropdown menus
        $('.dropdown').on('shown.bs.dropdown', function (event) {
            event.target.scrollIntoView(false); // align to bottom
        });

        // ------------------------------------------------------------
        // Add handlers to save/restore the session
        // -----------------------------------------------------------
        // Add event handler to save the current view (eye position) and markers when the window closes
        window.onbeforeunload = function () {
            explorer.saveSession();
            // Return null to close quietly on Chrome and FireFox.
            return null;
        };

        // Now that MVC is set up, restore the model from the previous session.
        explorer.restoreSession();
    }
);
