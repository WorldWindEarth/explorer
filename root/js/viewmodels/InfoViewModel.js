/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Info content module
 *
 * @param {WeatherScoutView} WeatherScoutView module
 * @param {Knockout} ko library
 * @param {JQuery} $ library
 * @returns {InfoViewModel}
 */
define(['viewmodels/WeatherScoutView', 'knockout', 'jquery'],
    function (WeatherScoutView, ko, $) {
        "use strict";

        /**
         * 
         * @constructor
         * @param {Globe} globe
         * @param {String} viewFragment HTML
         * @param {String} appendToId View element parent id
         * @returns {InfoViewModel}
         */
        function InfoViewModel(globe, viewFragment, appendToId) {
            var self = this,
                domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.globe = globe;

            // Get a reference to the SelectController's selectedItem observable
            this.selectedItem = this.globe.selectController.lastSelectedItem;

            // Load the Knockout custom binding used in the #weather-scout-view-template
            this.wxScoutView = new WeatherScoutView();

            // The viewTemplate defines the content displayed in the output pane.
            this.viewTemplateName = ko.observable(null);

            // Update the view template from the selected object.
            this.selectedItem.subscribe(function (newItem) {
                // Determine if the new item has a view template
                if (newItem !== null) {
                    if (typeof newItem.viewTemplateName !== "undefined") {
                        self.viewTemplateName(newItem.viewTemplateName);
                    } else {
                        self.viewTemplateName(null);
                    }
                }
            });

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return InfoViewModel;
    }
);
