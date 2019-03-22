/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * D3 PROTOTYPE - WeatherScout content module.
 *
 * @param {type} ko
 * @param {type} $
 * @param {type} vis
 * @returns {WeatherScoutView}
 */
define(['knockout',
    'jquery',
    'vis'],
    function (ko, $, vis) {

        /**
         * The view for an individual WeatherScout.
         * @constructor
         */
        function WeatherScoutView(globe) {
            var self = this;

            this.globe = globe;
            this.airTempGraph = null;
            this.relHumidityGraph = null;
            this.windSpeedGraph = null;
            this.skyCoverGraph = null;

            // Define a custom binding used in the #weather-scout-view-template template
            ko.bindingHandlers.visualizeTemperature = {
                init: function (element, valueAccessor, allBindings, viewModel/*deprecated*/, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                    if (self.airTempGraph) {
                        self.airTempGraph.destroy();
                    }
                    self.drawAirTemperatureGraph(element, bindingContext.$data);
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                }
            };
            // Define a custom binding used in the #weather-scout-view-template template
            ko.bindingHandlers.visualizeHumidity = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                    if (self.relHumidityGraph) {
                        self.relHumidityGraph.destroy();
                    }
                    self.drawRelativeHumidityGraph(element, bindingContext.$data);
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                }
            };
            // Define a custom binding used in the #weather-scout-view-template template
            ko.bindingHandlers.visualizeWinds = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                    if (self.windSpeedGraph) {
                        self.windSpeedGraph.destroy();
                    }
                    self.drawWindSpeedGraph(element, viewModel);
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                }
            };
            // Define a custom binding used in the #weather-scout-view-template template
            ko.bindingHandlers.visualizeSkyCover = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                    if (self.skyCoverGraph) {
                        self.skyCoverGraph.destroy();
                    }
                    self.drawSkyCoverGraph(element, viewModel);
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                }
            };

            this.globe.dateTime.subscribe(function (newDate) {
                if (self.airTempGraph) {
                    self.airTempGraph.setCurrentTime(newDate);
                }
                if (self.relHumidityGraph) {
                    self.relHumidityGraph.setCurrentTime(newDate);
                }
                if (self.windSpeedGraph) {
                    self.windSpeedGraph.setCurrentTime(newDate);
                }
                if (self.skyCoverGraph) {
                    self.skyCoverGraph.setCurrentTime(newDate);
                }
            });
        }

        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawAirTemperatureGraph = function (element, wxScout) {
            var self = this,
                forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["F"],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                className: 'air-temp-style1',
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'circle' // square, circle
                    },
                    shaded: {
                        orientation: 'bottom' // top, bottom
                    }
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.airTemperatureF, group: 0, label: 'F'});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 32, max: 120}
                    },
                    icons: false
                },
                clickToUse: true,
                moveable: false,
                zoomable: false,
                height: 200,
                graphHeight: 150
            };

            // Add a 2D graph to the element
            this.airTempGraph = new vis.Graph2d(element, dataset, groups, options);
            this.airTempGraph.setCurrentTime(this.globe.dateTime());
            this.airTempGraph.on("click", function (properties) {
                if (properties.time) {
                    self.globe.dateTime(properties.time);
                }
            });
        };


        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawRelativeHumidityGraph = function (element, wxScout) {
            var self = this,
                forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["RH %"],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                className: 'rel-humidity-style1',
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'circle' // square, circle
                    },
                    shaded: {
                        orientation: 'bottom' // top, bottom
                    },
                    yAxisOrientation: 'right'
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.relaltiveHumidityPct, group: 0});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 0, max: 100}
                    }
                },
                clickToUse: true,
                moveable: false,
                zoomable: false,
                height: 200,
                graphHeight: 150
            };

            // Add a 2D graph to the element
            this.relHumidityGraph = new vis.Graph2d(element, dataset, groups, options);
            this.relHumidityGraph.setCurrentTime(this.globe.dateTime());
            this.relHumidityGraph.on("click", function (properties) {
                if (properties.time) {
                    self.globe.dateTime(properties.time);
                }
            });
        };

        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawWindSpeedGraph = function (element, wxScout) {
            var self = this,
                forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["Wind Speed"],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                className: 'wind-speed-style1',
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'circle' // square, circle
                    },
                    shaded: {
                        orientation: 'bottom' // top, bottom
                    },
                    yAxisOrientation: 'right'
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.windSpeedKts, group: 0});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 0, max: 50}
                    }
                },
                clickToUse: true,
                moveable: false,
                height: 200,
                graphHeight: 150,
                maxHeight: 200
            };

            // Add a 2D graph to the element
            this.windSpeedGraph = new vis.Graph2d(element, dataset, groups, options);
            this.windSpeedGraph.setCurrentTime(this.globe.dateTime());
            this.windSpeedGraph.on("click", function (properties) {
                if (properties.time) {
                    self.globe.dateTime(properties.time);
                }
            });
        };

        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawSkyCoverGraph = function (element, wxScout) {
            var self = this,
                forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["Sky Cover %"],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                className: 'sky-cover-style1',
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'circle' // square, circle
                    },
                    shaded: {
                        orientation: 'bottom' // top, bottom
                    },
                    yAxisOrientation: 'right'
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.skyCoverPct, group: 0});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 0, max: 100}
                    }
                },
                clickToUse: true,
                moveable: false,
                height: 200,
                graphHeight: 150,
                maxHeight: 200
            };

            // Add a 2D graph to the element
            this.skyCoverGraph = new vis.Graph2d(element, dataset, groups, options);
            this.skyCoverGraph.setCurrentTime(this.globe.dateTime());
            this.skyCoverGraph.on("click", function (properties) {
                if (properties.time) {
                    self.globe.dateTime(properties.time);
                }
            });
        };

        return WeatherScoutView;
    }
);

