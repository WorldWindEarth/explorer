/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/*global WorldWind*/

/**
 * Search content module.
 * @param {Knockout} ko library
 */
define(['knockout', 'worldwind'],
    function (ko) {
        "use strict";
        /**
         * The view model for the Search panel.
         * @constructor
         * @param {Globe} globe The globe that provides the supported projections
         * @param {String} viewElementId  
         */
        function SearchViewModel(globe, viewElementId) {
            var self = this,
                wwd = globe.wwd;

            this.geocoder = new WorldWind.NominatimGeocoder();
            this.goToAnimator = new WorldWind.GoToAnimator(wwd);
            this.searchText = ko.observable('');

            this.onEnter = function (data, event) {
                if (event.keyCode === 13) {
                    self.performSearch();
                }
                return true;
            };

            this.performSearch = function () {
                var queryString = self.searchText();
                if (queryString) {
                    var latitude, longitude;
                    if (queryString.match(WorldWind.WWUtil.latLonRegex)) {
                        var tokens = queryString.split(",");
                        latitude = parseFloat(tokens[0]);
                        longitude = parseFloat(tokens[1]);
                        self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                    } else {
                        self.geocoder.lookup(queryString, function (geocoder, result) {
                            if (result.length > 0) {
                                latitude = parseFloat(result[0].lat);
                                longitude = parseFloat(result[0].lon);
                                self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                            }
                        });
                    }
                }
            };

            // Binds the view to this view model.
            ko.applyBindings(this, document.getElementById(viewElementId));

        }
        return SearchViewModel;
    }
);
