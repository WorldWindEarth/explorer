/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery'],
    function (ko, $) {
        "use strict";
        /**
         *
         * @constructor
         * @param {Globe} globe
         * @param {WeatherScoutManager} weatherScoutManager
         * @param {String} viewFragment HTML
         * @param {String} appendToId Parent element id
         * @returns {WeatherViewModel}
         */
        function WeatherViewModel(globe, weatherScoutManager, viewFragment, appendToId) {
            var domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.weatherScouts = weatherScoutManager.scouts;

            /** "Goto" function centers the globe on a selected weatherScout */
            this.gotoWeatherScout = function (weatherScout) {
                globe.goto(weatherScout.latitude(), weatherScout.longitude());
                globe.selectController.doSelect(weatherScout);
            };

            /** "Edit" function invokes a modal dialog to edit the weatherScout attributes */
            this.editWeatherScout = function (weatherScout) {
                if (weatherScout.isOpenable) {
                    weatherScout.open();
                }
            };

            /** "Remove" function removes a weatherScout from the globe */
            this.removeWeatherScout = function (weatherScout) {
                if (weatherScout.isRemovable) {
                    weatherScout.remove();
                }
            };

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return WeatherViewModel;
    }
);