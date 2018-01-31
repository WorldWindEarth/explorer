/* 
 * The MIT License.
 * Copyright (c) 2015, 2016 Bruce Schubert
 */

/*global define, WorldWind*/

/**
 *
 * @param {Wmt} wmt WMT constants.
 * @param {WorldWind} ww WorldWind dependency that doesn't redefine global.
 * @returns {RelativeHumidity}
 */
define(['model/Constants',
    'model/globe/EnhancedGeographicText',
    'worldwind'],
    function (constants,
        EnhancedGeographicText
        ) {
        "use strict";

        /**
         * Creates a GeographicText component for displaying relative humidity in a WeatherMapSymbol.
         * @constructor
         * @param {Number} latitude
         * @param {Number} longitude
         * @param {String} relHumidityPct
         * @returns {RelativeHumidity}
         */
        var RelativeHumidity = function (latitude, longitude, relHumidityPct) {
            EnhancedGeographicText.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), relHumidityPct, true);

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            this.alwaysOnTop = false;
            this.attributes = new WorldWind.TextAttributes(null);
            this.attributes.scale = 1.0;
            this.attributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 1.3, // Left
                WorldWind.OFFSET_FRACTION, 1.3);    // Lower
            this.attributes.color = WorldWind.Color.CYAN;
            this.attributes.depthTest = false;
            //this.declutterGroup = 3; // same as airtemp

        };
        // Inherit Placemark parent methods
        RelativeHumidity.prototype = Object.create(EnhancedGeographicText.prototype);


        /**
         * Creates a clone of this object.
         * @returns {RelativeHumidity}
         */
        RelativeHumidity.prototype.clone = function () {
            var clone = new RelativeHumidity(this.position.latitude, this.position.longitude, this.text);
            clone.copy(this);
            clone.pickDelegate = this.pickDelegate ? this.pickDelegate : this;
            clone.attributes = new WorldWind.TextAttributes(this.attributes);
            return clone;
        };


        return RelativeHumidity;
    }
);

