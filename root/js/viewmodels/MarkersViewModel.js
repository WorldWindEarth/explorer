/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery'],
    function (ko, $) {
        "use strict";
        /**
         * @constructor
         * @param {Globe} globe
         * @param {MarkerManager} markerManager
         * @param {String} viewFragment HTML
         * @param {String} appendToId Parent element id
         * @returns {MarkersViewModel}
         */
        function MarkersViewModel(globe, markerManager, viewFragment, appendToId) {
            var domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.markers = markerManager.markers;   // observable array

            /** "Goto" function centers the globe on a selected marker */
            this.gotoMarker = function (marker) {
                globe.goto(marker.latitude(), marker.longitude());
            };

            /** "Edit" function invokes a modal dialog to edit the marker attributes */
            this.editMarker = function (marker) {
                if (marker.isOpenable()) {
                    globe.selectController.doSelect(marker);
                    marker.open();
                }
            };

            /** "Remove" function removes a marker from the globe */
            this.removeMarker = function (marker) {
                if (marker.isRemovable()) {
                    marker.remove();
                }
            };

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return MarkersViewModel;
    }
);