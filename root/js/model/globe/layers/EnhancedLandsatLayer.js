/* 
 * Copyright (c) 2017 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedWmsLayer provides vendor parameters to the GeoServer WMS GetMap 
 * requests.
 *
 * @exports EnhancedWmsLayer
 * @author Bruce Schubert
 */
define([
    'WorldWindFixes', 
    'worldwind'],
    function (WorldWindFixes) {
        "use strict";

        var EnhancedLandsatLayer = function () {
            // This LevelSet configuration captures the Landsat resolution of 1.38889E-04 degrees/pixel
            WorldWind.TiledImageLayer.call(this,
                WorldWind.Sector.FULL_SPHERE, new WorldWind.Location(45, 45), 12, "image/jpeg", "BMNGLandsat256", 256, 256);

            this.displayName = "Blue Marble & Landsat";
            this.pickEnabled = false;

            this.urlBuilder = new WorldWind.WmsUrlBuilder("https://mapserver.northernhorizon.org/worldwind25/wms",
                "BlueMarble-200405,esat", "", "1.3.0");
        };

        EnhancedLandsatLayer.prototype = Object.create(WorldWind.TiledImageLayer.prototype);

        return EnhancedLandsatLayer;
    }
);