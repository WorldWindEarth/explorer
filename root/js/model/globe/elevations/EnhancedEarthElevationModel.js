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
 * @exports EarthElevationModel
 */
define([
//        'model/globe/elevations/EmxsysGebcoElevationCoverage',
//        'model/globe/elevations/EmxsysSrtmElevationCoverage',
        'model/globe/elevations/EnhancedAsterV2ElevationCoverage',
        'model/globe/elevations/EnhancedGebcoElevationCoverage',
        'model/globe/elevations/EnhancedUsgsNedElevationCoverage',
        'model/globe/elevations/EnhancedUsgsNedHiElevationCoverage',
        'worldwind'
    ],
    function (
//              EmxsysGebcoElevationCoverage,
//              EmxsysSrtmElevationCoverage,
              EnhancedAsterV2ElevationCoverage,
              EnhancedGebcoElevationCoverage,
              EnhancedUsgsNedElevationCoverage,
              EnhancedUsgsNedHiElevationCoverage,
              WorldWind) {
        "use strict";

        /**
         * Constructs an EarthElevationModel consisting of three elevation coverages GEBCO, Aster V2, and USGS NED.
         * @alias EarthElevationModel
         * @constructor
         */
        var EarthElevationModel = function () {
            WorldWind.ElevationModel.call(this);

//            this.addCoverage(new EmxsysGebcoElevationCoverage());
//            this.addCoverage(new EmxsysSrtmElevationCoverage());
            this.addCoverage(new EnhancedGebcoElevationCoverage());
            this.addCoverage(new EnhancedAsterV2ElevationCoverage());
            this.addCoverage(new EnhancedUsgsNedElevationCoverage());
            this.addCoverage(new EnhancedUsgsNedHiElevationCoverage());
        };

        EarthElevationModel.prototype = Object.create(WorldWind.ElevationModel.prototype);

        return EarthElevationModel;
    });