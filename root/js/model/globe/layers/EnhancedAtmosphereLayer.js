/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedAtmosphereLayer observes the Globe's sunlight member.
 *
 * @exports EnhancedAtmosphereLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs an atmosphere layer.
         * @param {Globe}  globe
         * @param {String}  url
         * @constructor
         */
        var EnhancedAtmosphereLayer = function (globe, url) {
            var self = this;
            WorldWind.AtmosphereLayer.call(this, url);

            this.displayName = "Atmosphere & Day/Night";

            // Update the star and sun location  based on the Globe's current time
            globe.dateTime.subscribe(function (newDateTime) {
                self.time = newDateTime; 
            });
        };
        // Inherit the AtmosphereLayer methods
        EnhancedAtmosphereLayer.prototype = Object.create(WorldWind.AtmosphereLayer.prototype);

        return EnhancedAtmosphereLayer;
    }
);