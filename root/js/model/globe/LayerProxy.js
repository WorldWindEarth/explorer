/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define([
    'knockout',
    'jquery',
    'model/util/Openable',
    'worldwind'],
    function (ko, $, openable) {
        "use strict";

        var LayerProxy = function (layer) {
            var self = this;

            this.wwLayer = layer;
            this.id = ko.observable(LayerProxy.nextLayerId++);
            this.category = ko.observable(layer.category);
            this.name = ko.observable(layer.displayName);
            this.enabled = ko.observable(layer.enabled);
            this.legendUrl = ko.observable(layer.legendUrl ? layer.legendUrl.url : '');
            this.opacity = ko.observable(layer.opacity);
            this.order = ko.observable();
            this.showInMenu = ko.observable(layer.showInMenu);

            // Forward changes from enabled and opacity observables to the the layer object
            this.enabled.subscribe(function (newValue) {
                layer.enabled = newValue;
            });
            this.opacity.subscribe(function (newValue) {
                layer.opacity = newValue;
            });

            // Mix-in the "openable" capability -- adds the isOpenable member and the "open" method. 
            // 
            // Opens the "layer-settings" JQuery dialog.
            openable.makeOpenable(this, function () {   // define the callback that "opens" this layer
                // Get the view model bound to the "layer-settings" element. See main.js for bindings
                var layerDialog = ko.dataFor($("#layer-settings").get(0));
                layerDialog.open(this);
                return true; // return true to fire EVENT_OBJECT_OPENED event.
            });
        };
        
        LayerProxy.nextLayerId = 0;

        return LayerProxy;
    }
);

