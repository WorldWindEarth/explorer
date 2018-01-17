/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * The LayerSettings module is responsible for managing the view that
 * presents controls for a single layer.
 * 
 * @param {Knockout} ko
 * @param {JQuery} $
 * @returns {LayerSettingsL#12.LayerSettings}
 */
define(['knockout', 'jquery'],
    function (ko, $) {
        "use strict";

        /**
         * Constructs a LayerSettings view model and binds it to the given
         * view element. 
         * 
         * @param {Globe} globe The globe model
         * @param {String} viewElementID The element ID of the view for the Knockout binding
         * @param {String} viewUrl The url for the view fragement's html
         * @returns {LayerSettings}
         */
        function LayerSettings(globe, viewElementID, viewUrl) {
            var self = this;
            
            // Setup internals and observables
            this.currentLayer = null;
            this.legendUrl = ko.observable('');
            this.opacity = ko.observable(0);
            // Forward changes from observable(s) to the the layer object
            this.opacity.subscribe(function (newValue) {
                if (this.currentLayer) {
                    this.currentLayer.opacity(newValue);
                }
            }, this);

            // Load the view html into the DOM and apply the Knockout bindings
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) { 
                    // Load the view html into the DOM's body
                    $('body').append(data); 
                    // Binds the view to this view model.
                    ko.applyBindings(self, document.getElementById(viewElementID));
                }
            });            
                        
            /**
             * Opens the Layer Settings dialog
             * @param {type} layer
             */
            this.open = function (layer) {
                var $view = $("#" + elementID);
                // Update internals and observables
                self.currentLayer = layer;
                self.legendUrl(layer.legendUrl());
                self.opacity(layer.opacity());
                
                $view.dialog({
                    autoOpen: false
                });      
                // Update the dialog title
                $view.dialog("option", "title", layer.name());
                // Show the dialog
                $view.dialog("open");
            };

            /**
             * Move the current layer to the top of its category.
             */
            this.onMoveLayerToTop = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'top');
            };
            
            /**
             * Move the current layer to the bottom of its category.
             */
            this.onMoveLayerToBottom = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'bottom');
            };
            
            /**
             * Move the current layer up one in its category.
             */
            this.onMoveLayerUp = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'up');
            };
            
            /**
             * Move the current layer up down one in its category.
             */
            this.onMoveLayerDown = function () {
                globe.layerManager.moveLayer(self.currentLayer, 'down');
            };

        }
        return LayerSettings;
    }
);