/* 
 * Copyright (c) 2016, Bruce Schubert.
 * The MIT License
 */

/**
 * QUnit unit tests
 * 
 * See: https://api.qunitjs.com/category/assert/
 * 
 * @param {NationalWeatherService} nws object
 * @param {QUnit} QUnit module
 * @returns {NationalWeatherServiceTest}
 */
define([
    'model/services/NationalWeatherService',
    'QUnit'],
    function (nws, QUnit) {
        "use strict";
        /**
         * Test runner for NWS tests
         */
        var testRunner = function () {
            var pointForecast = "";

//            // Get a pointForecast to test
//            nws.ndfdPointForecast(
//                34.2, // latitude
//                -119.2, // longitude
//                function (results) {   // callback to process results
//                    pointForecast = results
//                });


            test("NWS makeCORSRequest", function (assert) {   // Passing in the QUnit.assert namespace
                var url = "https://graphical.weather.gov/xml/SOAP_server/ndfdXMLclient.php?lat=34.2&lon=-119.2&product=time-series&begin=&end=&Unit=e&temp=temp&rh=rh&wspd=wspd&wdir=wdir&sky=sky&wgust=wgust&wx=wx&critfireo=critfireo";

                var xhr = nws.createCORSRequest('GET', url);
                assert.ok(xhr !== null, "CORS request is not null");

                // Response handlers.
                xhr.onload = function () {
                    var text = xhr.responseText;
                    alert('Response from CORS request to ' + url + ': ' + text);
                };

                xhr.onerror = function () {
                    alert('Woops, there was an error making the request.');
                };

                xhr.send();
                
            });


//            test("testXml", function (assert) {   // Passing in the QUnit.assert namespace
//                console.log("Point Forecast results: " + pointForecast);
//                assert.ok(pointForecast !== null, "point forecast not null");
//            });

        };

        // Run the tests
        return {run: testRunner};
    });

