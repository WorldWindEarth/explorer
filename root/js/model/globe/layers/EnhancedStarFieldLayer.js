/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedStarFieldLayer observes the Globe's dateTime member.
 *
 * @exports EnhancedStarFieldLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs a starfield layer.
         * @param {Globe}  globe
         * @param {String}  starDataSource optional url for the stars data
         * @constructor
         */
        var EnhancedStarFieldLayer = function (globe, url) {
            var self = this;
            WorldWind.StarFieldLayer.call(this, url);

            this.displayName = "Star Field";

            // Update the star and sun location  based on the Globe's current time
            globe.dateTime.subscribe(function (newDateTime) {
                self.time = newDateTime; 
            });
        };
        // Inherit the AtmosphereLayer methods
        EnhancedStarFieldLayer.prototype = Object.create(WorldWind.StarFieldLayer.prototype);

        return EnhancedStarFieldLayer;
    }
);