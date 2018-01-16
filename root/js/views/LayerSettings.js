/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery'],
    function (ko, $) {
        "use strict";
        /**
         *
         * @constructor
         */
        function LayerSettings(globe) {
            var self = this;

            this.currentLayer = null;
            this.legendUrl = ko.observable('');
            this.opacity = ko.observable(0);

            // Forward changes from observable(s) to the the layer object
            this.opacity.subscribe(function (newValue) {
                if (this.currentLayer) {
                    this.currentLayer.opacity(newValue);
                }
            }, this);
            
            // Initializing the JQuery dialog (before the Knockout binding is applied)
            $("#layer-settings-dialog").dialog({
                autoOpen: false,
            });

            /**
             * Opens the Layer Settings dialog
             * @param {type} layer
             */
            this.open = function (layer) {
                console.log("Open Layer: " + layer.name());
                // Update view model and observables
                self.currentLayer = layer;
                self.legendUrl(layer.legendUrl());
                self.opacity(layer.opacity());

                // Update the dialog title
                $('#layer-settings-dialog').dialog("option", "title", layer.name());
                // Open the dialog
                $('#layer-settings-dialog').dialog("open");
            };

            this.onMoveLayerToTop = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'top');
            };
            this.onMoveLayerToBottom = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'bottom');
            };
            this.onMoveLayerUp = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'up');
            };
            this.onMoveLayerDown = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'down');
            };


        }
        return LayerSettings;
    }
);