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
        var NdfdService = {
            /** 
             * NDFD Single Point time series query. 
             * 
             * ndfdXMLclient.php Interface
             * Single Point Unsummarized Data: returns DWML-encoded NDFD data for a point.
             *
             * URL: https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php
             * Proxy: /ndfd/xml/rest
             * 
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Array} elements Array of zero or more NDFD element names; may be null.
             *  See: https://graphical.weather.gov/xml/docs/elementInputNames.php
             * @param {Function} callback 
             * @returns {jqXHR} 
             */
            getSinglePointTimeSeries: function (latitude, longitude, elements, callback) {
                var url = "http://emxsys.net/ndfd/xml/rest/ndfdXMLclient.php",
                    query,
                    i, max, element;

                query = "lat=" + latitude
                    + "&lon=" + longitude
                    + "&begin="     // empty: first available time
                    + "&end="       // empty: last available time
                    + "&Unit=e";    // e: english or m: metric

                max = elements ? elements.length : 0;
                if (max === 0) {
                    // The “glance” product returns all data between the start 
                    // and end times for the parameters maxt, mint, sky, wx, and icons 
                    query += "&product=glance";
                } else {
                    //  The “time-series” product returns all data between the 
                    //  start and end times for the selected weather parameters.
                    query += "&product=time-series";
                    for (i = 0, max = elements.length; i < max; i++) {
                        // The NDFD parameters that you are requesting.   
                        // For valid inputs see the NDFD Element Names Page:
                        // https://graphical.weather.gov/xml/docs/elementInputNames.php
                        // Example:
                        //  maxt=maxt&mint=mint 	
                        element = elements[i];
                        query += "&" + element + "=" + element;
                    }
                }
                
                return $.ajax({
                    url: url,
                    data: query,
                    dataType: "xml",
                    success: function (xml, textStatus, jqXHR) {
                        //console.log(textStatus.toUpperCase() + ": " + xml);
                        if (callback) {
                            callback(xml);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(textStatus.toUpperCase() + ": " + errorThrown);
                        if (callback) {
                            callback(null);
                        }
                    }
                });
            },

            /** 
             * NDFD Single Point glance query. 
             * 
             * ndfdXMLclient.php Interface
             * Single Point Unsummarized Data: returns DWML-encoded NDFD data for a point.
             *
             * URL: https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php
             * Proxy: /ndfd/xml/rest
             * 
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Function} callback Optional
             * @returns {jqXHR} 
             */
            getSinglePointGlance: function (latitude, longitude, callback) {
                var url = "http://emxsys.net/ndfd/xml/rest/ndfdXMLclient.php",
                    query = "lat=" + latitude
                    + "&lon=" + longitude
                    + "&begin="     // empty: first available time
                    + "&end="       // empty: last available time
                    + "&Unit=e"     // e: english or m: metric
                    + "&product=glance";

                return $.ajax({
                    url: url,
                    data: query,
                    dataType: "xml",
                    success: function (xml, textStatus, jqXHR) {
                        //console.log(textStatus.toUpperCase() + ": " + xml);
                        if (callback) {
                            callback(xml);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error(textStatus.toUpperCase() + ": " + errorThrown);
                        if (callback) {
                            callback(null);
                        }
                    }
                });
            }

        };
        return NdfdService;
    }
);