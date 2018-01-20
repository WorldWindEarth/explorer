/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'model/Constants'],
    function (ko, $, constants) {
        "use strict";
        /**
         *
         * @param {Globe} globe
         * @param {MarkerManager} markerManager
         * @constructor
         */
        function MarkersViewModel(globe, markerManager, viewElementId, viewUrl, appendToId) {
            var self = this,
                wwd = globe.wwd;

            this.view = null;
            this.markersLayer = globe.findLayer(constants.LAYER_NAME_MARKERS);
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

            //
            // Load the view html into the DOM and apply the Knockout bindings
            //
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) {
                    // Load the view html into the specified DOM element
                    $("#" + appendToId).append(data);

                    // Update the view member
                    self.view = document.getElementById(viewElementId);

                    // Binds the view to this view model.
                    ko.applyBindings(self, self.view);
                }
            });

        }

        return MarkersViewModel;
    }
);