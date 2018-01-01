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
            this.parameters = this.parseParameters(this.locations, this.timeLayouts, $data);
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

                var $key = $(this).find('location-key'),
                    $point = $(this).find('point'),
                    $city = $(this).find('city'),
                    $nwsZone = $(this).find('nws-zone'),
                    $area = $(this).find('area'),
                    location = {
                        key: $key.text()
                    };

                // The locations contains exactly one of the following child elements...

                if ($point.length > 0) {
                    //
                    // Process  a point object
                    //
                    location.point = {
                        latitude: Number($point.attr("latitude")),
                        longitude: Number($point.attr("longitude")),
                    };
                    location.toString = function () {
                        return this.point.latitude + ", " + this.point.longitude
                    };

                } else if ($city.length > 0) {
                    //
                    // Assign a city object
                    //
                    location.city = {
                        name: $city.text(),
                        state: $city.attr('state')
                    };
                    location.toString = function () {
                        return this.city.name + ", " + this.city.state
                    };

                } else if ($nwsZone.length > 0) {
                    //
                    // Assign a NWS forecast zone
                    //
                    location.nwsZone = {
                        name: $nwsZone.text(),
                        state: $nwsZone.attr('state')
                    };
                    location.toString = function () {
                        return this.nwsZone.name + ", " + this.nwsZone.state
                    };

                } else if ($area.length > 0) {
                    //
                    // Process an area: a circle or rectangle
                    //
                    location.area = {
                        type: $area.attr('area-type')
                    };
                    $area.find(location.area.type).each(function () {
                        var $geom = $(this), $center, $radius;
                        if (location.area.type === 'circle') {
                            // Assign the circle components
                            $center = $geom.find('point');
                            $radius = $geom.find('radius');
                            location.area.center = {
                                latitude: Number($center.attr("latitude")),
                                longitude: Number($center.attr("longitude"))};
                            location.area.radius = $radius.text();
                            location.area.units = $radius.attr('radius-units');
                        } else if (location.area.type === 'rectangle') {
                            // Assign the four geographic points that define the rectangle
                            location.area.points = [];
                            $geom.find('point').each(function () {
                                location.area.points[location.area.points] = {
                                    latitude: Number($(this).attr("latitude")),
                                    longitude: Number($(this).attr("longitude"))};
                            });
                        }
                    });
                } else {
                    throw new Error(log.error("NdfdForecast", "parseLocations", "No location dectected for: " + location.key));
                }

                locations.push(location);
            });
            return locations;
        };
        /**
         * Traverses the data node to obtain the time-layout arrays.
         * 
         * @param {JQuery} $data The DWML data node
         * @returns {Array} An array of time-layout objects: [{layout-key, startValidTimes, endValidTimes (optional)}]
         */
        NdfdForecast.prototype.parseTimeLayouts = function ($data) {

            var timeLayouts = {};   // return value

            // Process each time-layout node
            $data.find('time-layout').each(function () {
                // Create a time layout object
                var $this = $(this),
                    $key = $this.find('layout-key'),
                    $startTime = $this.find('start-valid-time'),
                    $endTime = $this.find('end-valid-time'),
                    timeLayout = {
                        key: $key.text(),
                        timeCooridinate: $this.attr('time-coordinate'),
                        startValidTimes: []
                    };

                // Process the start-valid-time child nodes (one or more) and add them to the layout
                $startTime.each(function () {
                    var $time = $(this),
                        periodName = $time.attr('period-name'), // optional attribute
                        len = timeLayout.startValidTimes.push(new Date($time.text()));
                    // Check for the optional period-name
                    if (periodName) {
                        if (timeLayout.periodNames === undefined) {
                            timeLayout.periodNames = []; // create a new sparse array
                        }
                        // Add the period-name at the same array pos as its start-valid-time element
                        timeLayout.periodNames[len - 1] = periodName;
                    }
                });

                // Process the end-valid-time child nodes (zero or more) and add them to the layout
                if ($endTime.length > 0) {
                    timeLayout.endValidTimes = [];  // create the array
                    $endTime.each(function () {
                        timeLayout.endValidTimes.push(new Date($(this).text()));
                    });
                }

                // timeLayouts.push(timeLayout);
                timeLayouts[$key.text()] = timeLayout;
            });
            return timeLayouts;
        };
        
        /**
         * Traverses the data node to obtain the parameters for each location and time.
         * 
         * See: https://graphical.weather.gov/xml/DWMLgen/schema/parameters.xsd
         * 
         * @param {Array} locations Array of location objects
         * @param {Array} timeLayouts Array of time-layout objects
         * @param {JQuery} $data The DWML data node
         * 
         * @returns {Array} Array of parameter objects
         */
        NdfdForecast.prototype.parseParameters = function (locations, timeLayouts, $data) {
            var self = this,
                parameters = [];   // return value
            //
            // Process the 'parameters' for each location
            //
            $data.find('parameters').each(function () {
                var $param = $(this),
                    locationKey = $param.attr('applicable-location'),
                    location = self.getLocation(locationKey);

                $param.children().each(function () {
                    var $node = $(this),
                        $name = $node.children('name'),
                        tagName = $node[0].tagName,
                        type = $node.attr('type'),
                        units = $node.attr('units'),
                        layoutKey = $node.attr('time-layout'),
                        categoricalTable = $node.attr('catagorical-table'),
                        conversionTable = $node.attr('conversion-table'),
                        param;

                    //    
                    // Build the parameters array entry
                    //
                    param = {
                        // TODO: rename "parameter" to "element"
                        parameter: tagName,
                        location: location
                    };
                    if ($name.length > 0) {
                        param.name = $name.text();
                    }
                    if (layoutKey) {
                        param.timeLayout = self.getTimeLayout(layoutKey);
                    }
                    if (type) {
                        param.type = type;
                    }
                    if (units) {
                        param.units = units;
                    }
                    if (categoricalTable) {
                        param.categoricalTable = categoricalTable;
                    }
                    if (conversionTable) {
                        param.conversionTable = conversionTable;
                    }

                    if (tagName === 'weather') {
                        //
                        // Process the weather-conditions nodes: one per time period
                        //
                        $node.children('weather-conditions').each(function () {
                            if (param.weatherConditions === undefined) {
                                param.weatherConditions = [];
                            }
                            var values = [];

                            // 0 or more values per weather-condition
                            $(this).children('value').each(function () {
                                var $value = $(this);
                                values.push({
                                    coverage: $value.attr('coverage'),
                                    intensity: $value.attr('intensity'),
                                    additive: $value.attr('additive'),
                                    weatherType: $value.attr('weather-type'),
                                    qualifier: $value.attr('qualifier')
                                });
                            });
                            param.weatherConditions.push(values);
                        });


                    } else if (tagName === 'convective-hazard') {
                        //
                        // Process the outlook nodes: 0 or 1
                        //
                        $node.children('outlook').each(function () {
                            var $outlook = $(this);
                            param.outlook = {
                                name: $outlook.children('name').text(),
                                timeLayout: self.getTimeLayout($outlook.attr('time-layout')),
                                values: []
                            };
                            $outlook.children('value').each(function () {
                                param.outlook.values.push($(this).text());
                            });
                        });
                        //
                        // Process the severe-component nodes: 0 to 8 
                        //
                        $node.children('severe-component').each(function () {
                            if (param.severeComponents === undefined) {
                                param.severeComponents = [];
                            }
                            var $component = $(this),
                                component = {
                                    name: $component.children('name').text(),
                                    timeLayout: self.getTimeLayout($component.attr('time-layout')),
                                    type: $component.attr('type'),
                                    units: $component.attr('units'),
                                    values: []
                                };
                            $component.find('value').each(function () {
                                var value = $(this).text();
                                component.values.push(Number.isNaN(value) ? value : Number(value));
                            });
                            param.severeComponents.push(component);
                        });

                    } else if (tagName === 'climate-anomaly') {
                        //
                        // Process the weekly, monthly and seasonal nodes: 0-4 each
                        //
                        if (param.climateAnomalies === undefined) {
                            param.climateAnomalies = [];
                        }
                        $node.children().each(function () {
                            var $anomaly = $(this),
                                anomaly = {
                                    name: $anomaly.children('name').text(),
                                    timeLayout: self.getTimeLayout($anomaly.attr('time-layout')),
                                    period: $anomaly[0].tagName,
                                    type: $anomaly.attr('type'),
                                    units: $anomaly.attr('units'),
                                    values: []
                                };

                            $anomaly.find('value').each(function () {
                                var value = $(this).text();
                                anomaly.values.push(Number.isNaN(value) ? value : Number(value));
                            });
                            param.climateAnomalies.push(anomaly);
                        });
                    } else if (tagName === 'hazard') {
                        //
                        // Process the hazard-conditions nodes
                        //
                        $node.children('hazard-conditions').each(function () {
                            if (param.hazards === undefined) {
                                param.hazards = [];
                            }
                            var $cond = $(this);
                            param.hazards.push($cond.text());
                        });

                    } else if (tagName === 'conditions-icon') {
                        //
                        // Process the icon-link nodes
                        //
                        $node.find('icon-link').each(function () {
                            if (param.icons === undefined) {
                                param.icons = [];
                            }
                            param.icons.push($(this).text());
                        });
                    } else {
                        //
                        // Process all other parameter 'value' nodes
                        //
                        $node.children('value').each(function () {

                            if (param.values === undefined) {
                                param.values = [];
                            }
                            var $value = $(this),
                                value = $value.text(),
                                upperRange = $value.attr('upper-range'),
                                lowerRange = $value.attr('lower-range'),
                                idx;

                            // Add the value as a String or a Number
                            param.values.push(Number.isNaN(value) ? value : Number(value));

                            // Get the new value's position for use in the upper/lower range arrays
                            idx = param.values.length - 1;

                            // Check for the optional upper-range attribute
                            if (upperRange) {
                                if (param.upperRange === undefined) {
                                    param.upperRange = []; // create a new sparse array
                                }
                                // Add the upper range at the same array pos as the value
                                param.upperRange[idx] = Number(upperRange);
                            }
                            // Check for the optional lower-range attribute
                            if (lowerRange) {
                                if (param.lowerRange === undefined) {
                                    param.lowerRange = []; // create a new sparse array
                                }
                                // Add the lower range at the same array pos as the value
                                param.lowerRange[idx] = Number(lowerRange);
                            }

                            // TODO: test if value is xsi:nil, e.g. <visibility xsi:nil="true"/>

                        });
                    }
                    param.toString = function () {
                        return this.name;
                    };
                    // Add a parameter object to the return array
                    parameters.push(param);
                });
            });
            return parameters;
        };

        NdfdForecast.prototype.parseParameterNode = function ($node) {

        };

        NdfdForecast.prototype.getAirTemps = function () {
            var i, max, param, timeLayout,
                j, numValues, airTemps = [];
            for (i = 0, max = this.parameters.length; i < max; i++) {
                param = this.parameters[i];
                if (param.parameter === 'temperature' && param.type === 'apparent') {
                    // Get the time layout for this parameter
                    timeLayout = this.getTimeLayout(param.layoutKey);
                    // Build the return array
                    for (j = 0, numValues = param.values.length; j < numValues; j++) {
                        airTemps.push([timeLayout[j], param.values[j]]);
                    }
                }
            }
            return airTemps;
        };



        NdfdForecast.prototype.getLocation = function (locationKey) {
            // TODO: test for locationKey
            var i, max, location;
            for (i = 0, max = this.locations.length; i < max; i++) {
                location = this.locations[i];
                if (location.key === locationKey) {
                    return location;
                }
            }
            return null;
        };

        NdfdForecast.prototype.getTimeLayout = function (layoutKey) {
            // TODO: Test for layoutKey
//            var i, max, layout;
//            for (i = 0, max = this.timeLayouts.length; i < max; i++) {
//                layout = this.timeLayouts[i];
//                if (layout.key === layoutKey) {
//                    return layout;
//                }
//            }
//            return null;
            return this.timeLayouts[layoutKey];
        };

        NdfdForecast.prototype.getHourlyTemperatureValues = function () {
            return this.getWeather('temperature', 'hourly');
        };
        NdfdForecast.prototype.getRelativeHumidityValues = function () {
            return this.getWeather('humidity', 'relative');
        };

        /**
         * 
         * @param {String} parameter Parameter name, e.g., "temperature"
         * @param {String} type Parameter type, e.g., "hourly"
         * @returns {Array} Array of time/value for the given parameter: [{startTime, endTime, value}] 
         */
        NdfdForecast.prototype.getWeather = function (parameter, type) {
            var param = this.getParameter(parameter, type);
            return this.getValues(param);
        };
        
        /**
         * 
         * @param {String} parameter Parameter name, e.g., "temperature"
         * @param {String} type Parameter type, e.g., "hourly"
         * @returns {Array} Array of time/value for the given parameter: [{startTime, endTime, value}] 
         */
        NdfdForecast.prototype.getHourlyWeather = function (parameter, type) {
            var wxValues = this.getWeather(parameter, type),
                first = wxValues
            
            
            return this.getValues(param);
        };
        
        

        NdfdForecast.prototype.getParameter = function (parameter, type) {
            // TODO: Test validity of arguments
            var i, max, param;
            for (var i = 0, max = this.parameters.length; i < max; i++) {
                param = this.parameters[i];
                if (param.parameter === parameter && param.type === type) {
                    return param;
                }
            }
            // TODO: throw error if not found?
            return null;
        };
        

        NdfdForecast.prototype.getValues = function (wxParam) {
            var timeLayout,
                j, len, 
                values = [];

            if (wxParam) {
                // Get the time layout for this parameter
                timeLayout = wxParam.timeLayout;
                // Build the array: get the values for each start time (end times are optional)
                for (j = 0, len = timeLayout.startValidTimes.length; j < len; j++) {
                    values.push({
                        startTime: timeLayout.startValidTimes[j],
                        endTime: timeLayout.endValidTimes ? timeLayout.endValidTimes[j] : null, 
                        value: wxParam.values[j]
                    });
                }
            }
            return values;
        };
        
        return NdfdForecast;
    }
);
