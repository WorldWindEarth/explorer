/* 
 * Copyright (c) 2016, Bruce Schubert.
 * The MIT License
 */

/**
 * QUnit unit tests
 * 
 * See: http://qunitjs.com/cookbook/
 * See: https://api.qunitjs.com/category/assert/
 * 
 * @param {NdfdService} ndfd National Digitial Forecast Database (NDFD)
 * @param {QUnit} QUnit module
 * @returns {NdfdServiceTest}
 */
define(['jquery',
    'model/services/NdfdService',
    'QUnit',
    'model/weather/NdfdForecast'],
    function ($, ndfd, QUnit, NdfdForecast) {
        "use strict";
        /**
         * Test runner for NDFD tests
         */
        var testRunner = function () {
            /**
             * Test singlePointTimeSeries 'glance' product.
             * @param {Assert} assert QUnit.assert namespace
             */
            QUnit.test("NDFD singlePointTimeSeries - glance", function (assert) {
                var lat = 34.2,
                    lon = -119.2,
                    asyncDone = assert.async(); // callback

                // Request the 'glance' product
                ndfd.getSinglePointTimeSeries(lat, lon, null).done(function (data) {
                    assert.ok(data !== null, "'glance' prodect is not null");
                    console.log(data);

                    var forecast = new NdfdForecast(data);
                    console.log(forecast);
                    
                    asyncDone();
                });
            });
            
            /**
             * Test singlePointTimeSeries 'time-series' product.
             * @param {Assert} assert QUnit.assert namespace
             */
            QUnit.test("NDFD singlePointTimeSeries - time-series", function (assert) {
                // Tell QUnit to wait for the finished() call inside the Deferred.done.
                var lat = 34.2,
                    lon = -119.2,
                    elements = ["qpf"],
                    asyncDone = assert.async();

                // Request the 'time-series' project
                var jqXHR = ndfd.getSinglePointTimeSeries(lat, lon, elements);

                jqXHR.done(function (data) {
                    assert.ok(data !== null, "'time-series' product is not null");
                    console.log(data);
                    asyncDone();
                });
            });

        };

        // Run the tests
        return {run: testRunner};
    });

