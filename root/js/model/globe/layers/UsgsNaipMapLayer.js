/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * The USGS NAIP Base Map layer.
 * 
 * See: https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WMSServer?request=GetCapabilities&service=WMS
 * 
 * @returns {UsgsNaipMapLayer}
 */

define([
    'model/globe/layers/EnhancedWmsLayer',
    'worldwind'],
    function (EnhancedWmsLayer) {
        "use strict";

        /**
         * Constructs a USGS Imagery Topo map layer.
         * @constructor
         * @augments WmsLayer
         */
        var UsgsNaipMapLayer = function () {
            var cfg = {
                title: "USGS NAIP Imagery",
                version: "1.3.0",
//              service: "https://services.nationalmap.gov/arcgis/services/USGSNAIPPlus/MapServer/WmsServer?",
                service: "https://emxsys.net/USGSNAIPPlus/MapServer/WmsServer?",
                layerNames: "1",
                sector: new WorldWind.Sector(-90.0, 90.0, -180, 180),
                levelZeroDelta: new WorldWind.Location(180, 180),
                numLevels: 19,
                format: "image/png",
                size: 256,
                coordinateSystem: "EPSG:4326", // optional
                styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
            };

            EnhancedWmsLayer.call(this, cfg);

            // Make this layer opaque
            this.opacity = 1.0;

            this.urlBuilder.transparent = true;
        };

        UsgsNaipMapLayer.prototype = Object.create(EnhancedWmsLayer.prototype);

        return UsgsNaipMapLayer;
    }
);