/*
 * Copyright 2003-2006, 2009, 2017, United States Government, as represented by the Administrator of the
 * National Aeronautics and Space Administration. All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @exports OpenTopoMapLayer
 */
define([],
    function () {
        "use strict";

        /**
         * Constructs an OpenTopoMap layer (see: https://opentopomap.org/about).
         * OpenTopoMap is licensed under CC-BY-SA . This means that the card may be 
         * used free of charge and free of charge, as long as attribution always 
         * takes place and the transfer is possible under the same conditions.
         * 
         * The tiles can be retrieved using the following path:
         * https://{a|b|c}.tile.opentopomap.org/{z}/{x}/{y}.png
         * 
         * As license text the following should be clearly visible:
         * Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)
         * 
         * The card style is under the same license and can be accessed via Github .
         * 
         * @alias OpenTopoMapLayer
         * @constructor
         * @augments MercatorTiledImageLayer
         * @classdesc Provides a layer that shows Open Topo Map imagery.
         *
         * @param {String} displayName This layer's display name. "Open Topo Map" if this parameter is
         * null or undefined.
         */
        var OpenTopoMapLayer = function (displayName) {
            this.imageSize = 256;
            displayName = displayName || "OpenTopoMap";

            WorldWind.MercatorTiledImageLayer.call(this,
                new WorldWind.Sector(-85.05, 85.05, -180, 180), new WorldWind.Location(85.05, 180), 17, "image/png", displayName,
                this.imageSize, this.imageSize);

            this.displayName = displayName;
            this.pickEnabled = false;

            this.detailControl = 1.25;
            
            // Create a canvas we can use when unprojecting retrieved images.
            this.destCanvas = document.createElement("canvas");
            this.destContext = this.destCanvas.getContext("2d");

            // Slippy Map url builder
            var counter = 0;
            this.urlBuilder = {
                urlForTile: function (tile, imageFormat) {
                    var servers = ['a','a','a'],
                      index = ++counter % 3,
                      server = servers[index]
//                    return "https://" + server + ".tile.opentopomap.org/" +
//                        (tile.level.levelNumber + 1) + "/" + tile.column + "/" + tile.row + ".png";
                    return "https://mapserver.northernhorizon.org/opentopomap/" +
                        (tile.level.levelNumber + 1) + "/" + tile.column + "/" + tile.row + ".png";                }
            };
        };

        OpenTopoMapLayer.prototype = Object.create(WorldWind.MercatorTiledImageLayer.prototype);

        OpenTopoMapLayer.prototype.doRender = function (dc) {
            WorldWind.MercatorTiledImageLayer.prototype.doRender.call(this, dc);
            if (this.inCurrentFrame) {
                dc.screenCreditController.addCredit("Data © OpenStreetMap-Contributors, SRTM | Map © OpenTopoMap (CC-BY-SA)", WorldWind.Color.BLACK);
            }            
        };

        // Overridden from TiledImageLayer.
        OpenTopoMapLayer.prototype.createTopLevelTiles = function (dc) {
            this.topLevelTiles = [];

            this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 0));
            this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 1));
            this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 0));
            this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 1));
        };

        // Determines the Bing map size for a specified level number.
        OpenTopoMapLayer.prototype.mapSizeForLevel = function (levelNumber) {
            return 256 << (levelNumber + 1);
        };

        return OpenTopoMapLayer;
    }
)
