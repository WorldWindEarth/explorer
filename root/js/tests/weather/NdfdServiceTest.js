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
    'model/weather/NdfdForecast',
    'model/weather/NdfdService',
    'QUnit'],
    function ($, NdfdForecast, ndfd, QUnit) {
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
                ndfd.getSinglePointTimeSeries(lat, lon, null)
                    .done(function (data) {
                        assert.ok(data !== null, "'glance' prodect is not null");
                        console.log(data);

                        var forecast = new NdfdForecast(data);
                        console.log(forecast);
                    })
                    .always(function () {
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
                    elements = [
                        "maxt",
                        "mint",
                        "temp",
                        "dew",
                        "appt",
                        "pop12",
                        "qpf",
                        "snow",
                        "sky",
                        "rh",
                        "maxrh",
                        "minrh",
                        "wspd",
                        "wdir",
                        "wgust",
                        "wx",
                        "icons",
                        "waveh",
                        "iceaccum",
                        "wwa",
                        "conhazo",
                        "critfireo",
                        "dryfireo",
                        "precipa_r",
                        "sky_r",
                        "td_r",
                        "temp_r",
                        "wdir_r",
                        "wspd_r",
                        "ptornado",
                        "phail",
                        "ptstmwinds",
                        "pxtornado",
                        "pxhail",
                        "pxtstmwinds",
                        "ptotsvrtstm",
                        "pxtotsvrtst",
                        "tmpabv14d",
                        "tmpblw14d",
                        "tmpabv30d",
                        "tmpblw30d",
                        "tmpabv90d",
                        "tmpblw90d",
                        "prcpabv14d",
                        "prcpblw14d",
                        "prcpabv30d",
                        "prcpblw30d",
                        "prcpabv90d",
                        "prcpblw90d",
                        "incw34",
                        "incw50",
                        "incw64",
                        "cumw34",
                        "cumw50",
                        "cumw64"],
                    asyncDone = assert.async();

                // Request the 'time-series' project
                ndfd.getSinglePointTimeSeries(lat, lon, elements)
                    .done(function (data) {
                        assert.ok(data !== null, "'time-series' product is not null");
                        console.log(data);
                        var forecast = new NdfdForecast(data);
                        console.log(forecast);
                    })
                    .always(function () {
                        asyncDone();
                    });
            });

        };

        // Run the tests
        return {run: testRunner};
    });

