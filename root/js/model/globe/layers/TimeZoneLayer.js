/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The TimeZoneLayer.
 *
 * @exports TimeZoneLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs a time zone layer.
         * @constructor
         */
        var TimeZoneLayer = function () {

            WorldWind.RenderableLayer.call(this, "Time Zones");

            // Open Natural Earth 10m time zones simplified to .05deg resolution
            // See: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/timezones/
            var shapefilePath = ww.WWUtil.currentUrlSansFilePart() + "/data/timezones/ne_05deg_time_zones.shp",
                shapefile = new WorldWind.Shapefile(shapefilePath),
                shapeConfigurationCallback;

            shapeConfigurationCallback = function (attributes, record) {
                var configuration = {};
                configuration.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;
                configuration.attributes = new WorldWind.ShapeAttributes(null);
                // Fill the polygon with a random pastel color.
                configuration.attributes.interiorColor = new WorldWind.Color(
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.25);

                // Paint the outline in a darker variant of the interior color.
                configuration.attributes.outlineColor = new WorldWind.Color(
                    0.5 * configuration.attributes.interiorColor.red,
                    0.5 * configuration.attributes.interiorColor.green,
                    0.5 * configuration.attributes.interiorColor.blue,
                    0.5);

                return configuration;
            };

            shapefile.load(null, shapeConfigurationCallback, this);
        };

        // Inherit the RenderableLayer methods
        TimeZoneLayer.prototype = Object.create(WorldWind.RenderableLayer.prototype);

        return TimeZoneLayer;
    }
);