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
window.DEBUG = false;

/**
 * Require.js bootstrapping javascript
 */
requirejs.config({
    // Path mappings for the logical module names
    paths: {
        // Bootstrap responsive layout
        'bootstrap': window.DEBUG ? 'libs/bootstrap/v3.3.6/bootstrap.min' : 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min',
        // d3 graphics library
        'd3': window.DEBUG ? 'libs/d3/d3' : 'https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.min',
        // RequireJS plugin to wait for DOM ready
        'domReady': 'libs/require/domReady',
        // Dragula drag-n-drop library
        'dragula': 'libs/dragula/dragula',
        // Knockout Model-View-View Model
        'knockout': window.DEBUG ? 'libs/knockout/knockout-3.4.0.debug' : 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.2/knockout-min',
        // RequireJS plugin to load 'i18n!' prefixed modules
        'i18n': 'libs/require/i18n',
        // The ubuiqutious JQuery library
        'jquery': window.DEBUG ? 'libs/jquery/jquery-2.1.3' : 'http://code.jquery.com/jquery-2.2.4.min',
        // JQuery UI elements
        'jqueryui': window.DEBUG ? 'libs/jquery-ui/jquery-ui-1.11.4' : 'http://code.jquery.com/ui/1.12.1/jquery-ui.min',
        // JQuery UI based 'growl' messaging
        'jquery-growl': 'libs/jquery-plugins/jquery.growl',
        // Moment date/time library
        'moment': window.DEBUG ? 'libs/moment/moment-2.14.1.min' : 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.min',
        // URL search param parsing
        'url-search-params': 'libs/url-search-params/url-search-params.max.amd',
        // RequireJS plugin to load text/html files using the 'text!' prefixed modules
        'text': 'libs/require/text',
        // VisJS charting library
        'vis': window.DEBUG ? 'libs/vis/v4.16.1/vis' : 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min',
        // NASA WorldWind
        'worldwind': window.DEBUG ? 'libs/webworldwind/v0.9.0/worldwind' : 'https://files.worldwind.arc.nasa.gov/artifactory/web/0.9.0/worldwind.min'
    },
    // Increase the time to wait before giving up on loading a script to avoid timeout erros on slow 3G connections (default 7s)
    waitSeconds: 15,
    // Shim configuration for Bootstrap's JQuery dependency
    shim: {
        "bootstrap": {
            deps: ["jquery"],
            exports: "$.fn.popover"
        }
    }
});

/**
 * Override the RequireJS error handling to provide some user feedback.
 * @param {Object} err
 */
requirejs.onError = function (err) {
    if (err.requireType === 'timeout') {
        alert("A timeout occurred while loading scripts.\n\
The server may be busy or you have a slow connection.\n\
Try refreshing the page or try again later.\n\n" + err);
    } else {
        throw err;
    }
};

/**
 * The application's main entry point, called in index.html
 * 
 * @param {Config} config Explorer configuration
 * @param {Constants} constants Explorer constants
 * @param {JQuery} $
 * @param {domReady} domReady RequireJS plugin called once the DOM is ready
 */
require([
    'model/Config',
    'model/Constants',
    'jquery',
    'domReady',
    'worldwind'],
        function (config, constants, $, domReady) { // this callback gets executed after all modules defined in the array are loaded
            "use strict";
            //
            // This function is called once the DOM is ready.
            //
            domReady(function () {
                // -----------------------------------------------------------
                // Add handlers for UI elements
                // -----------------------------------------------------------
                // Auto-collapse navbar when its tab items are clicked
                $('.navbar-collapse a[role="tab"]').click(function () {
                    $('.navbar-collapse').collapse('hide');
                });
                // Auto-scroll-into-view expanded dropdown menus
                $('.dropdown').on('shown.bs.dropdown', function (event) {
                    event.target.scrollIntoView(false); // align to bottom
                });
                // Auto-expand menu section-bodies when not small
                $(window).resize(function () {
                    if ($(window).width() >= 768) {
                        $('.section-body').collapse('show');
                    }
                });

                // ----------------
                // Setup WorldWind
                // ----------------
                WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
                if (window.DEBUG) {
                    // Use local resources
                    WorldWind.configuration.baseUrl = WorldWind.WWUtil.currentUrlSansFilePart() + "/" + constants.WORLD_WIND_PATH;
                }
                // Initialize the WorldWindow virtual globe with the specified HTML5 canvas
                var wwd = new WorldWind.WorldWindow("globe-canvas");
                // Provide an initial location to view
                wwd.navigator.lookAtLocation.latitude = config.startupLatitude;
                wwd.navigator.lookAtLocation.longitude = config.startupLongitude;
                wwd.navigator.range = config.startupAltitude;
                // Add initial background layer(s) to display during startup
                wwd.addLayer(new WorldWind.BMNGOneImageLayer());

                // ------------------
                // Setup the Explorer
                // ------------------
                // This call to require loads the Explorer and its dependencies asynchronisly 
                // while the WorldWind globe is loading its background layer(s)
                require(['model/Explorer'], function (Explorer) {
                    // Initialize the Explorer with a WorldWind virtual globe to "explore"
                    var explorer = new Explorer(wwd);
                    // Now that the MVVM is set up, restore the model from the previous session.
                    explorer.restoreSession();
                    // Add event handler to save the session when the window closes
                    window.onbeforeunload = function () {
                        explorer.saveSession();
                        // Return null to close quietly on Chrome and FireFox.
                        return null;
                    };
                });
            });
        });





