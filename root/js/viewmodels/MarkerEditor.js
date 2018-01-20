/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'jqueryui'],
    function (ko, $) {
        "use strict";
        /**
         *
         * @constructor
         */
        function MarkerEditor(viewElementID, viewUrl) {
            var self = this;
            
            this.view = null;
            this.marker = ko.observable({});


            // Load the view html into the DOM and apply the Knockout bindings
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) {
                    // Load the view html into the DOM's body
                    $('body').append(data);

                    // Update the view 
                    self.view = document.getElementById(viewElementID);

                    // Binds the view to this view model.
                    ko.applyBindings(self, self.view);
                }
            });


            this.open = function (marker) {
                console.log("Open Marker: " + marker.name());
                
                // Update observable(s)
                self.marker(marker);

                // Open the dialog
                var $markerEditor = $(self.view);
                $markerEditor.dialog({
                    autoOpen: false,
                    title: "Edit Marker"
                });
                $markerEditor.dialog("open");
            };

        }

        return MarkerEditor;
    }
);