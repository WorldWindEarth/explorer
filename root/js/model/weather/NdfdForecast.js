/* 
 * The MIT License.
 * Copyright (c) 2015-2017 Bruce Schubert.
 */

/**
 * Digital Weather Markup Language (DWML) parser. This class is responsible for parsing a DWML
 * forecast from the NWS.
 *
 * See service description: http://products.weather.gov/PDD/Extensible_Markup_Language.pdf
 *
 * See NDFD elements: http://www.nws.noaa.gov/ndfd/technical.htm#elements
 *
 * See DWML XML schema (Note: view source): http://graphical.weather.gov/xml/DWMLgen/schema/DWML.xsd
 *
 *
 *
 * An example:
 * <pre>
 * {@code
 * <xmlDoc xmlns:xsd="http://www.w3.org/2001/XMLSchema"
 *      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0"
 *      xsi:noNamespaceSchemaLocation="http://www.nws.noaa.gov/forecasts/xml/DWMLgen/schema/DWML.xsd">
 *   <head>
 *       <product srsName="WGS 1984" concise-name="time-series" operational-mode="official">
 *           <title>NOAA's National Weather Service Forecast Data</title>
 *           <field>meteorological</field>
 *           <category>forecast</category>
 *           <creation-date refresh-frequency="PT1H">2014-03-28T12:28:58Z</creation-date>
 *       </product>
 *       <source>
 *           <more-information>http://www.nws.noaa.gov/forecasts/xml/</more-information>
 *           <production-center>
 *               Meteorological Development Laboratory
 *               <sub-center>Product Generation Branch</sub-center>
 *           </production-center>
 *           <disclaimer>http://www.nws.noaa.gov/disclaimer.html</disclaimer>
 *           <credit>http://www.weather.gov/</credit>
 *           <credit-logo>http://www.weather.gov/images/xml_logo.gif</credit-logo>
 *           <feedback>http://www.weather.gov/feedback.php</feedback>
 *       </source>
 *   </head>
 *   <data>
 *       <location>
 *           <location-key>point1</location-key>
 *           <point latitude="34.25" longitude="-119.20"/>
 *       </location>
 *       <moreWeatherInformation applicable-location="point1">
 *           http://forecast.weather.gov/MapClick.php?textField1=34.25&textField2=-119.20
 *       </moreWeatherInformation>
 *       <time-layout time-coordinate="local" summarization="none">
 *           <layout-key>k-p3h-n36-1</layout-key>
 *           <start-valid-time>2014-03-28T08:00:00-07:00</start-valid-time>
 *           ...
 *       </time-layout>
 *       <time-layout time-coordinate="local" summarization="none">
 *           <layout-key>k-p3h-n20-2</layout-key>
 *           <start-valid-time>2014-03-28T08:00:00-07:00</start-valid-time>
 *           ...
 *        </time-layout>
 *        <time-layout time-coordinate="local" summarization="none">
 *           <layout-key>k-p24h-n8-3</layout-key>
 *            <start-valid-time>2014-03-28T01:00:00-07:00</start-valid-time>
 *            <end-valid-time>2014-03-28T05:00:00-07:00</end-valid-time>
 *            <start-valid-time>2014-03-28T05:00:00-07:00</start-valid-time>
 *            <end-valid-time>2014-03-29T05:00:00-07:00</end-valid-time>
 *            <start-valid-time>2014-03-29T05:00:00-07:00</start-valid-time>
 *       </time-layout>
 *       <parameters applicable-location="point1">
 *            <temperature type="hourly" units="Fahrenheit" time-layout="k-p3h-n36-1">
 *                <name>Temperature</name>
 *                <value>49</value>
 *                ...
 *            </temperature>
 *            <wind-speed type="sustained" units="knots" time-layout="k-p3h-n36-1">
 *                <name>Wind Speed</name>
 *                <value>5</value>
 *                ...
 *            </wind-speed>
 *            <direction type="wind" units="degrees true" time-layout="k-p3h-n36-1">
 *                <name>Wind Direction</name>
 *                <value>50</value>
 *                ...
 *            </direction>
 *            <cloud-amount type="total" units="percent" time-layout="k-p3h-n36-1">
 *                <name>Cloud Cover Amount</name>
 *                <value>29</value>
 *                ...
 *            </cloud-amount>
 *            <fire-weather type="risk from wind and relative humidity" time-layout="k-p24h-n8-3">
 *                <name>
 *                    Fire Weather Outlook from Wind and Relative Humidity
 *                </name>
 *                <value>No Areas</value>
 *                <value>No Areas</value>
 *                <value>No Areas</value>
 *            </fire-weather>
 *            <wind-speed type="gust" units="knots" time-layout="k-p3h-n20-2">
 *                <name>Wind Speed Gust</name>
 *                <value>5</value>
 *                ...
 *            </wind-speed>
 *            <humidity type="relative" units="percent" time-layout="k-p3h-n36-1">
 *                <name>Relative Humidity</name>
 *                <value>93</value>
 *                ...
 *            </humidity>
 *            <weather time-layout="k-p3h-n36-1">
 *                <name>Weather Type, Coverage, and Intensity</name>
 *                <weather-conditions>
 *                    <value coverage="patchy" intensity="none" weather-type="fog" qualifier="none">
 *                        <visibility xsi:nil="true"/>
 *                    </value>
 *                </weather-conditions>
 *                <weather-conditions/>
 *                ...
 *            </weather>
 *        </parameters>
 *    </data>
 *</xmlDoc>
 * } </pre>
 *
 * @author Bruce Schubert <bruce@emxsys.com>
 */


define(['jquery', 'model/util/Log', 'worldwind'
],
    function ($, log, ww) {
        "use strict";
        var NdfdForecast = function (xmlDoc) {
            if (!xmlDoc) {
                throw new WorldWind.ArgumentError(
                    log.error("NdfdForecast", "constructor", "No XML DOM specified."));
            }

            var $xml = $(xmlDoc),
                $head = $xml.find("head"),
                $data = $xml.find("data");


            this.locations = this.parseLocations($data);
            this.timeLayouts = this.parseTimeLayouts($data);
            this.paramters = this.parseParameters(this.locations, this.timeLayouts, $data);

        };
        /**
         * Traverses the data node to obtain the location values.
         * 
         * @param {JQuery} $data The DWML data node
         * @returns {Array} An array of location objects
         */
        NdfdForecast.prototype.parseLocations = function ($data) {
            var locations = [];
            $data.find('location').each(function () {
                var key = $(this).find('location-key').text(),
                    pt = $(this).find('point'),
                    lat = pt.attr("latitude"),
                    lon = pt.attr('longitude');
                locations[locations.length] = {key: key, latitude: lat, longitude: lon};
            });
            return locations;
        };
        /**
         * Traverses the data node to obtain the time-layout arrays.
         * @param {JQuery} $data The DWML data node
         * @returns {Array} Multidimentional array [layout-key][times]
         */
        NdfdForecast.prototype.parseTimeLayouts = function ($data) {
            var timeLayouts = [];   // return value

            // Process each time-layout node
            $data.find('time-layout').each(function () {
                // Add a time layout object to the array
                var key = $(this).find('layout-key').text();
                timeLayouts[timeLayouts.length] = {key: key, times: []};

                // Process each start-valid-time child node
                $(this).find('start-valid-time').each(function () {
                    // Add the time value to the array
                    var layout = timeLayouts[timeLayouts.length - 1],
                        times = layout.times,
                        time = $(this).text();
                    // Add the time value
                    times[times.length] = time;
                });
            });
            return timeLayouts;
        };
        /**
         * Traverses the data node to obtain the parameters for each location.
         * @param {JQuery} $data The DWML data node
         * @returns {Array} Multidimentional array [layout-key][times]
         */
        NdfdForecast.prototype.parseParameters = function (locations, timeLayouts, $data) {
            var parameters = [];   // return value

            // Process each 'parameters' node
            $data.find('parameters').each(function () {
                var $param = $(this),
                    location = $param.attr('applicable-location');

                // Process each child node
                $param.children().each(function () {

                    var $node = $(this),
                        key = $node[0].tagName,
                        type = $node.attr('type'),
                        units = $node.attr('units'),
                        timeLayout = $node.attr('time-layout'),
                        name = $node.find('name').text();

                    // Add a parameter object
                    parameters[parameters.length] = {
                        key: key,
                        type: type,
                        units: units,
                        timeLayout: timeLayout,
                        name: name,
                        values: []};

                    // Process each value and add it to the parameter
                    $node.find('value').each(function () {

                        var parameter = parameters[parameters.length - 1],
                            values = parameter.values,
                            value = $(this).text();
                        // Add the value to the parameter object
                        values[values.length] = value;

                    });
                    $node.find('weather-conditions').each(function () {
                        var $cond = $(this),
                            $value = $cond.find('value'),
                            coverage = $value.attr('coverage'),
                            intensity = $value.attr('intensity'),
                            weatherType = $value.attr('weather-type'),
                            qualifier = $value.attr('qualifier');

                        // Add the value to the parameter object
                        //values[values.length] = value;

                    });
                    $node.find('hazard-conditions').each(function () {
                        var $cond = $(this),
                            $value = $cond.find('value'),

                        // Add the value to the parameter object
                        //values[values.length] = value;

                    });
                    $node.find('icon-link').each(function () {
                        var $cond = $(this),
                            $value = $cond.find('value'),

                        // Add the value to the parameter object
                        //values[values.length] = value;

                    });
                });
            });
            return parameters;
        };
        return NdfdForecast;
    }
);
