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
        function TacticalSymbolEditor(viewElementID, viewUrl) {
            var self = this;
            
            this.view = null;
            this.symbol = ko.observable({});


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


            this.open = function (symbol) {
                console.log("Open Symbol: " + symbol.name());
                
                // Update observable(s)
                self.symbol(symbol);

                // Open the dialog
                var $symbolEditor = $(self.view);
                $symbolEditor.dialog({
                    autoOpen: false,
                    title: "Edit Symbol"
                });
                $symbolEditor.dialog("open");
            };

        }

        return TacticalSymbolEditor;
    }
);