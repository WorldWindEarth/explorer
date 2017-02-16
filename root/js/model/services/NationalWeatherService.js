/* 
 * Copyright (c) 2017, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 */

/*global define, $ */

/**
 * National Weather Service (NWS) National Digital Forecast Database (NDFD) XML Web Service.
 * 
 * NOAA's National Weather Service offers several XML services:
 *  Forecasts, Watch/warnings, Current Observations, Tropical Cyclone Advisories, 
 *  and Storm Prediction Center Forecast Products
 * 
 * See: https://graphical.weather.gov/xml/rest.php (REST interface)
 * and: http://graphical.weather.gov/xml/  (SOAP interface)
 * and: http://www.nws.noaa.gov/ndfd/technical.htm
 * 
 * For NWS weather icons see: http://www.nws.noaa.gov/weather/images/fcicons/
 * and: https://graphical.weather.gov/xml/xml_fields_icon_weather_conditions.php
 * 
 * <pre>
 * Forecast Element Names
 *
 * NDFD Parameter                                                   Input Name
 * ==============                                                   ==========
 * Maximum Temperature                                              maxt
 * Minimum Temperature                                              mint
 * 3 Hourly Temperature                                             temp
 * Dewpoint Temperature                                             dew
 * Apparent Temperature                                             appt
 * 12 Hour Probability of Precipitation                             pop12
 * Liquid Precipitation Amount                                      qpf
 * Snowfall Amount                                                  snow
 * Cloud Cover Amount                                               sky
 * Relative Humidity                                                rh
 * Maximum Relative Humidity                                        maxrh
 * Minimum Relative Humidity                                        minrh
 * Wind Speed                                                       wspd
 * Wind Direction                                                   wdir
 * Wind Gust                                                        wgust
 * Weather                                                          wx
 * Weather Icons                                                    icons
 * Wave Height                                                      waveh
 * Ice Accumulation                                                 iceaccum
 * Watches, Warnings, and Advisories                                wwa
 * Convective Hazard Outlook                                        conhazo
 * Fire Weather from Wind and Relative Humidity                     critfireo
 * Fire Weather from Dry Thunderstorms                              dryfireo
 * Real-time Mesoscale Analysis Precipitation                       precipa_r
 * Real-time Mesoscale Analysis GOES Effective Cloud Amount         sky_r
 * Real-time Mesoscale Analysis Dewpoint Temperature                td_r
 * Real-time Mesoscale Analysis Temperature                         temp_r
 * Real-time Mesoscale Analysis Wind Direction                      wdir_r
 * Real-time Mesoscale Analysis Wind Speed                          wspd_r
 * Probability of Tornadoes                                         ptornado
 * Probability of Hail                                              phail
 * Probability of Damaging Thunderstorm Winds                       ptstmwinds
 * Probability of Extreme Tornadoes                                 pxtornado
 * Probability of Extreme Hail                                      pxhail
 * Probability of Extreme Thunderstorm Winds                        pxtstmwinds
 * Probability of Severe Thunderstorms                              ptotsvrtstm
 * Probability of Extreme Severe Thunderstorms                      pxtotsvrtstm
 * Probability of 8- To 14-Day Average Temperature Above Normal     tmpabv14d
 * Probability of 8- To 14-Day Average Temperature Below Normal     tmpblw14d
 * Probability of One-Month Average Temperature Above Normal        tmpabv30d
 * Probability of One-Month Average Temperature Below Normal        tmpblw30d
 * Probability of Three-Month Average Temperature Above Normal      tmpabv90d
 * Probability of Three-Month Average Temperature Below Normal      tmpblw90d
 * Probability of 8- To 14-Day Total Precipitation Above Median     prcpabv14d
 * Probability of 8- To 14-Day Total Precipitation Below Median     prcpblw14d
 * Probability of One-Month Total Precipitation Above Median        prcpabv30d
 * Probability of One-Month Total Precipitation Below Median        prcpblw30d
 * Probability of Three-Month Total Precipitation Above Median      prcpabv90d
 * Probability of Three-Month Total Precipitation Below Median      prcpblw90d
 * Probabilistic Tropical Cyclone Wind Speed >34 Knots (Incremental) 	incw34
 * Probabilistic Tropical Cyclone Wind Speed >50 Knots (Incremental) 	incw50
 * Probabilistic Tropical Cyclone Wind Speed >64 Knots (Incremental) 	incw64
 * Probabilistic Tropical Cyclone Wind Speed >34 Knots (Cumulative) 	cumw34
 * Probabilistic Tropical Cyclone Wind Speed >50 Knots (Cumulative) 	cumw50
 * Probabilistic Tropical Cyclone Wind Speed >64 Knots (Cumulative) 	cumw64
 * </pre>
 * 
 * @param {type} constants
 * @param {type} log
 * @param {type} util
 * @returns {NationWeatherService}
 */
define(['jquery',
    'model/Constants',
    'model/util/Log',
    'model/util/WmtUtil'],
    function ($,
        constants,
        log,
        util) {
        "use strict";
        var NationalWeatherService = {
            //NDFD_REST_URI: "http://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?",
            //NDFD_REST_URI: "https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?",
            //    NDFD_SOAP_URI: "https://graphical.weather.gov/xml/SOAP_server/ndfdXMLclient.php?whichClient=NDFDgen",
            
            /**
             * See: https://www.html5rocks.com/en/tutorials/cors/
             * See:https://www.nczonline.net/blog/2010/05/25/cross-domain-ajax-with-cross-origin-resource-sharing/
             * @param {type} method
             * @param {type} url
             * @returns {XDomainRequest|XMLHttpRequest}
             */
            createCORSRequest: function (method, url) {
                var xhr = new XMLHttpRequest();
                if ("withCredentials" in xhr) {

                    // Check if the XMLHttpRequest object has a "withCredentials" property.
                    // "withCredentials" only exists on XMLHTTPRequest2 objects.
                    xhr.open(method, url, false);
                } else if (typeof XDomainRequest !== "undefined") {

                    // Otherwise, check if XDomainRequest.
                    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
                    xhr = new XDomainRequest();
                    xhr.open(method, url);
                } else {

                    // Otherwise, CORS is not supported by the browser.
                    xhr = null;
                }
                return xhr;
            },

//        var xhr = createCORSRequest('GET', url);
//            if (!xhr) {
//        throw new Error('CORS not supported');
//        },
            /** 
             * NDFD Single Point query 
             * */
            ndfdPointForecast: function (latitude, longitude, callback) {
//                var url = "https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php",
                var url = "https://graphical.weather.gov/xml/SOAP_server/ndfdXMLclient.php",
                    query = "lat=" + latitude
                    + "&lon=" + longitude
                    + "&product=time-series"
                    + "&begin=" // empty: first available time
                    + "&end="   // empty: last available time
                    + "&Unit=e" // e: english or m: metric
                    + "&temp=temp"
                    + "&rh=rh"
                    + "&wspd=wspd"
                    + "&wdir=wdir"
                    + "&sky=sky"
                    + "&wgust=wgust"
                    + "&wx=wx"
                    + "&critfireo=critfireo"
                    + "&callback=?";
                console.log(url + '?' + query);
                $.ajax({
                    url: url,
                    data: query,
                    dataType: "xml",
                    async: false,
                    /**
                     * 
                     * @param {Anything} data
                     * @param {String} textStatus
                     * @param {jqXHR} jqXHR
                     */
                    success: function (data, textStatus, jqXHR) {
//                        var json = JSON.parse(response);
//                        callback(json.feature);
                        console.log(textStatus.toUpperCase() + ": " + data);
                        callback(data);
                    },
                    /**
                     * 
                     * @param {jaXHR} jqXHR
                     * @param {String} textStatus
                     * @param {String} errorThrown
                     */
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(textStatus.toUpperCase() + ": " + errorThrown)
                        callback(null);
                    }
                });
            }

        };
        return NationalWeatherService;
    }
);