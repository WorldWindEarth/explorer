/* 
 * Copyright (c) 2016, Bruce Schubert.
 * The MIT License
 */

/**
 * PlaceService QUnit tests
 * 
 * See: https://api.qunitjs.com/category/assert/
 * 
 * @param {PlaceService} placeService object
 * @param {QUnit} QUnit module
 * @returns {NationalWeatherServiceTest}
 */
define([
    'model/services/PlaceService', 
    'QUnit'],
        function (placeService, QUnit) {
            "use strict";
            /**
             * Test runner for PlaceService tests
             */
            var testRunner = function () {
                var place = "";
                
                placeService.placefinder(
                    34.2,   // latitude
                    -119.2, // longitude
                    function(results) {   // callback to process results
                        place = results
                });
                

                test("PlaceService.placefinder Results", function (assert) {   // Passing in the QUnit.assert namespace
                    console.log("results: " + place);
                    assert.ok(place !== null, "Results not null");
                });
                
            };
            
            // Run the tests
            return {run: testRunner};
        });

