/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind, $ */

/**
 * The USGS TNM Topo Base Map layer.
 * 
 * See: https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/WMTS/1.0.0/WMTSCapabilities.xml
 * 
 * @returns {UsgsTopoBaseMapLayer}
 */
define([
    'jquery',
    'worldwind'],
    function () {
    "use strict";
    /**
     * Constructs a USGS Topo map layer.
     * @constructor
     * @augments Layer
     */
    var UsgsTopoBaseMapLayer = function () {
        WorldWind.Layer.call(this, "USGS Topo Basemap");
        
        // Web Map Tiling Service information from
        var serviceAddress = "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/WMTS/1.0.0/WMTSCapabilities.xml";
        var layerIdentifier = "USGSTopo";
        var self = this;

        // Called asynchronously to parse and create the WMTS layer
        var createLayer = function (xmlDom) {
            // Create a WmtsCapabilities object from the XML DOM
            var wmtsCapabilities = new WorldWind.WmtsCapabilities(xmlDom);
            // Retrieve a WmtsLayerCapabilities object by the desired layer name
            var wmtsLayerCapabilities = wmtsCapabilities.getLayer(layerIdentifier);
            // Form a configuration object from the WmtsLayerCapabilities object
            var wmtsConfig = WorldWind.WmtsLayer.formLayerConfiguration(wmtsLayerCapabilities);
            // Create the WMTS Layer from the configuration object
            self.wmtsLayer = new WorldWind.WmtsLayer(wmtsConfig);
        };

        // Called if an error occurs during WMTS Capabilities document retrieval
        var logError = function (jqXhr, text, exception) {
            console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
        };

        $.get(serviceAddress).done(createLayer).fail(logError);
    };
    UsgsTopoBaseMapLayer.prototype = Object.create(WorldWind.Layer.prototype);
 
    /**
     * Refreshes the data associated with this layer. The behavior of this function varies with the layer
     * type. For image layers, it causes the images to be re-retrieved from their origin.
     */
    UsgsTopoBaseMapLayer.prototype.refresh = function () {
        if (this.wmtsLayer) {
            return this.wmtsLayer.refresh(dc);
        }
    };

    /**
     * Subclass method called to display this layer. Subclasses should implement this method rather than the
     * [render]{@link Layer#render} method, which determines enable, pick and active altitude status and does not
     * call this doRender method if the layer should not be displayed.
     * @param {DrawContext} dc The current draw context.
     * @protected
     */
    UsgsTopoBaseMapLayer.prototype.doRender = function (dc) {
        if (this.wmtsLayer) {
            return this.wmtsLayer.doRender(dc);
        }
    };

    /**
     * Indicates whether this layer is within the current view. Subclasses may override this method and
     * when called determine whether the layer contents are visible in the current view frustum. The default
     * implementation always returns true.
     * @param {DrawContext} dc The current draw context.
     * @returns {boolean} true If this layer is within the current view, otherwise false.
     * @protected
     */
    UsgsTopoBaseMapLayer.prototype.isLayerInView = function (dc) {
        if (this.wmtsLayer) {
            return this.wmtsLayer.isLayerInView(dc);
        }
    };

    return UsgsTopoBaseMapLayer;
});
