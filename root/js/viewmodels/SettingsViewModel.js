/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Settings content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {SettingsViewModel}
 */
define(['knockout',
    'jquery',
    'model/Constants'],
    function (ko, $, constants) {

        /**
         * The view model for the Settings panel.
         * @constructor
         */
        function SettingsViewModel(globe, viewElementId, viewUrl, appendToId) {
            var self = this,
                skyLayer, starsLayer, atmosphereLayer, timeZoneLayer, viewControls, widgets, crosshairs;

            this.globe = globe;
            this.layerManager = globe.layerManager;


            skyLayer = this.layerManager.findLayer(constants.LAYER_NAME_SKY);
            starsLayer = this.layerManager.findLayer(constants.LAYER_NAME_STARS);
            atmosphereLayer = this.layerManager.findLayer(constants.LAYER_NAME_ATMOSPHERE);
            timeZoneLayer = this.layerManager.findLayer(constants.LAYER_NAME_TIME_ZONES);
            viewControls = this.layerManager.findLayer(constants.LAYER_NAME_VIEW_CONTROLS);
            widgets = this.layerManager.findLayer(constants.LAYER_NAME_WIDGETS); 
            crosshairs = this.layerManager.findLayer(constants.LAYER_NAME_RETICLE); 

            //
            // Observables
            //
            /**
             * The globe's timeZoneDetectEnabled observable setting.
             */
            this.timeZoneDetectEnabled = globe.timeZoneDetectEnabled;
            /**
             * The globe's use24Time observable setting.
             */
            this.use24Time = globe.use24Time;
            /**
             * Tracks the current background color selection. Used by radio buttons in the view.
             */
            this.backgroundColor = ko.observable(skyLayer && skyLayer.enabled() ? "blue" : "black");
            /**
             * The current state of the blue background layer (settable).
             */
            this.blueBackgroundEnabled = skyLayer ? skyLayer.enabled : ko.observable();
            /**
             * The state of the black background (read-only).
             */
            this.blackBackgroundEnabled = ko.computed(function() {return skyLayer ? !skyLayer.enabled() : true});
            /**
             * The current state of the star field layer (settable).
             */
            this.starsBackgroundEnabled = starsLayer ? starsLayer.enabled : ko.observable();
            /**
             * The current state of the atmosphere layer (settable)
             */
            this.atmosphereBackgroundEnabled = atmosphereLayer ? atmosphereLayer.enabled : ko.observable();
            /**
             * The current opacity level for the atmosphere's nightime effect
             */
            this.nightOpacity = atmosphereLayer ? atmosphereLayer.opacity : ko.observable();
            
            this.timeZonesEnabled = timeZoneLayer ? timeZoneLayer.enabled : ko.observable();
            this.timeZonesOpacity = timeZoneLayer ? timeZoneLayer.opacity : ko.observable();

            this.viewControlsEnabled = viewControls ? viewControls.enabled : ko.observable();
            this.widgetsEnabled = widgets ? widgets.enabled : ko.observable();
            this.crosshairsEnabled = crosshairs ? crosshairs.enabled : ko.observable();

            /**
             * Background color selection handler
             */
            this.backgroundColor.subscribe(function (newValue) {
                switch (newValue) {
                case "blue":
                    self.blueBackgroundEnabled(true);
                    self.starsBackgroundEnabled(false);
                    break;
                case "black":
                    self.blueBackgroundEnabled(false);
                    // The sky background layer manipulates the canvas' background color.
                    // When it's disabled, the last used color remains in the canvas.
                    // Set the background color to the default when the background is disabled.
                    $(self.globe.wwd.canvas).css('background-color', 'black');
                    break;
                }
            });


            /**
             * Turn off stars if the default background layer is enabled
             */
            this.blueBackgroundEnabled.subscribe(function (newValue) {
                if (newValue) {
                    self.starsBackgroundEnabled(false);
                } else {
                    // The sky background layer manipulates the canvas' background color.
                    // When it's disabled, the last used color remains in the canvas.
                    // Set the background color to the default when disabled.
                    $(self.globe.wwd.canvas).css('background-color', 'black');
                }
            });

            //
            // Load the view html into the DOM and apply the Knockout bindings
            //
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) {
                    // Load the view html into the specified DOM element
                    $("#" + appendToId).append(data);

                    // Update the view member
                    self.view = document.getElementById(viewElementId);

                    // Binds the view to this view model.
                    ko.applyBindings(self, self.view);
                }
            });

        }

        return SettingsViewModel;
    }
);
