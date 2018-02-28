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
        function WeatherScoutEditor(viewFragment) {
            var self = this;
            
            // Load the view fragment into the DOM's body.
            // Wrap the view in a hidden div for use in a JQuery UI dialog.
            var $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            this.view = $view.children().first().get(0);

            this.scout = ko.observable({});

            this.open = function (scout) {
                console.log("Open Wx Scout: " + scout.name());
                self.scout(scout);

                // Prepare a JQuery UI dialog
                var $editorElement = $(self.view);
                $editorElement.dialog({
                    autoOpen: false,
                    title: "Edit Weather Scout"
                });

                // Open the dialog
                $editorElement.dialog("open");
            };

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);

        }

        return WeatherScoutEditor;
    }
);