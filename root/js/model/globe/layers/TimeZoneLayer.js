/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The TimeZoneLayer, derived from Open Natural Earth 10m time zones.
 *
 * See: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/timezones/
 *
 * @exports TimeZoneLayer
 * @author Bruce Schubert
 */
define(['model/globe/layers/ShapefileLayer',
        'worldwind'],
    function (ShapefileLayer,
              ww) {
        "use strict";
        /**
         * Constructs a time zone layer.
         * @constructor
         */
        var TimeZoneLayer = function () {
            // Open Natural Earth 10m time zones have been simplified to .05deg resolution
            // See: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/timezones/
            ShapefileLayer.call(this,
                ww.WWUtil.currentUrlSansFilePart() + "/data/timezones/ne_05deg_time_zones.shp",
                "Time Zones");
        };

        // Inherit the ShapefileLayer methods
        TimeZoneLayer.prototype = Object.create(ShapefileLayer.prototype);


        return TimeZoneLayer;
    }
);