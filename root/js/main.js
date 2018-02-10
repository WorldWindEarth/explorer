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
        'bootstrap': window.DEBUG ? 'libs/bootstrap/v3.3.6/bootstrap.min' : 'libs/bootstrap/v3.3.6/bootstrap',
        'd3': window.DEBUG ? 'libs/d3/d3' : 'libs/d3/d3.min',
        'dragula': 'libs/dragula/dragula',
        'knockout': window.DEBUG ? 'libs/knockout/knockout-3.4.0.debug' : 'libs/knockout/knockout-3.4.0',
        'jquery': window.DEBUG ? 'libs/jquery/jquery-2.1.3' : 'libs/jquery/jquery-2.1.3.min',
        'jqueryui': window.DEBUG ? 'libs/jquery-ui/jquery-ui-1.11.4' : 'libs/jquery-ui/jquery-ui-1.11.4.min',
        'jquery-growl': 'libs/jquery-plugins/jquery.growl',
        'moment': window.DEBUG ? 'libs/moment/moment-2.14.1.min' : 'libs/moment/moment-2.14.1.min',
        'url-search-params': 'libs/url-search-params/url-search-params.max.amd',
        'vis': window.DEBUG ? 'libs/vis/v4.16.1/vis' : 'libs/vis/v4.16.1/vis.min',
        'worldwind': window.DEBUG ? 'libs/webworldwind/v0.9.0/worldwind' : 'https://files.worldwind.arc.nasa.gov/artifactory/web/0.9.0/worldwind.min',
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
 * The application's main entry point, called in index.html
 * 
 * @param {Knockout} ko
 * @param {JQuery} $
 * @param {Config} config Explorer configuration object
 * @param {Constants} constants Explorer constants
 */
require([
    'knockout',
    'jquery',
    'model/Config',
    'model/Constants',
    'jqueryui',
    'worldwind'], function (ko, $, config, constants) { // this callback gets executed after all modules defined in the array are loaded
    
    "use strict";

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

    // --------------------------------------------------------
    // Add a custom Knockout binding for JQueryUI slider 
    // See: http://knockoutjs.com/documentation/custom-bindings.html
    // --------------------------------------------------------
    ko.bindingHandlers.slider = {
        init: function (element, valueAccessor, allBindings) {
            var options = allBindings().sliderOptions || {};
            // Initialize a slider with the given options
            $(element).slider(options);

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





