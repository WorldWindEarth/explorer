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
 * @param {NationalWeatherService} ndfd National Digitial Forecast Database (NDFD)
 * @param {QUnit} QUnit module
 * @returns {NationalWeatherServiceTest}
 */
define([
    'model/services/NationalWeatherService',
    'QUnit'],
    function (ndfd, QUnit) {
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
                // Tell QUnit to wait for the finished() call inside the Deferred.done.
                var finished = assert.async(),
                    lat = 34.2,
                    lon = -119.2;

                // Request the 'glance' product
                ndfd.getSinglePointTimeSeries(lat, lon, null).done(function (data) {
                    assert.ok(data !== null, "'glance' prodect is not null");
                    console.log(data);
                    finished();
                });
            }),
                /**
                 * Test singlePointTimeSeries 'time-series' product.
                 * @param {Assert} assert QUnit.assert namespace
                 */
                QUnit.test("NDFD singlePointTimeSeries - time-series", function (assert) {
                    // Tell QUnit to wait for the finished() call inside the Deferred.done.
                    var lat = 34.2,
                        lon = -119.2,
                        elements = ["qpf"],
                        finished = assert.async();

                    // Request the 'time-series' project
                    var jqXHR = ndfd.getSinglePointTimeSeries(lat, lon, elements);

                    jqXHR.done(function (data) {
                        assert.ok(data !== null, "'time-series' product is not null");
                        console.log(data);
                        finished();
                    });
                });

        };

        // Run the tests
        return {run: testRunner};
    });

