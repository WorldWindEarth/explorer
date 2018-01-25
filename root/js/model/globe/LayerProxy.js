/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

/**
 * The LayerProxy modude is used to create a proxy for a WorldWind.Layer object. The proxy
 * wraps the layer object and is endowed with additional observable properties that allow it 
 * to controlled by the LayerManager and be displayed in the MVVM views.
 * 
 * @param {Knockout} ko
 * @returns {LayerProxy}
 */
define([
    'knockout',
    'worldwind'],
    function (ko) {
        "use strict";

        /**
         * @constructor
         * @param {WorldWind.Layer} layer
         * @returns {LayerProxy}
         */
        var LayerProxy = function (layer) {
            var self = this;

            /**
             * The WorldWind layer proxied by this object
             * @type WorldWind.Layer
             */
            this.wwLayer = layer;
            
            //
            // Observables
            //
            
            /**
             * The unique ID for this object (in the current session).
             * @type Number
             */
            this.id = ko.observable(LayerProxy.nextLayerId++);
            
            /**
             * The layer category used to group layers.
             * @type String
             */
            this.category = ko.observable(layer.category);
            
            /**
             * The name used for this layer in the layer lists.
             * @type String
             */
            this.name = ko.observable(layer.displayName);
            
            /**
             * The enabled (visible) state of this layer.
             * @type Boolean
             */
            this.enabled = ko.observable(layer.enabled);
            
            /**
             * The optional URL to a legend image.
             * @type String
             */
            this.legendUrl = ko.observable(layer.legendUrl ? layer.legendUrl.url : '');
            
            /**
             * The opacity (tranparency) setting for this layer.
             * @type Number
             */
            this.opacity = ko.observable(layer.opacity);
            
            /**
             * The sort order of this layer in its category.
             * @type Number
             */
            this.order = ko.observable();
            
            /**
             * Flag to determine if this layer should appear in its category's layer list.
             * @type Boolean
             */
            this.showInMenu = ko.observable(layer.showInMenu);
            
            /**
             * Flag to indicate if this layer is currently selected in the layer manager.
             * @type Boolean
             */
            this.selected = ko.observable(false);

            //
            // Event handlers
            //

            /**
             * Forwards enabled state changes to the proxied layer object.
             * @param {Boolean} newValue - The new state
             */
            this.enabled.subscribe(function (newValue) {
                self.wwLayer.enabled = newValue;
            });
            
            /**
             * Forwards opacity changes to the proxied layer object.
             * @param {Boolean} newValue - The new opacity
             */
            this.opacity.subscribe(function (newValue) {
                self.wwLayer.opacity = newValue;
            });

            // Mix-in the "openable" capability -- adds the isOpenable member and the "open" method. 
            // 
            // Opens the "layer-settings" JQuery dialog.
//            openable.makeOpenable(this, function () {   // define the callback that "opens" this layer
//                // Get the view model bound to the "layer-settings" element. See main.js for bindings
//                var layerDialog = ko.dataFor($("#layer-settings").get(0));
//                layerDialog.open(this);
//                return true; // return true to fire EVENT_OBJECT_OPENED event.
//            });
        };

        /**
         * The next ID to be assigned.
         * @type Number
         * @inner
         * @static
         */
        LayerProxy.nextLayerId = 0;

        return LayerProxy;
    }
);

