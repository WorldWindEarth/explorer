/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Info content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {InfoViewModel}
 */
define([
    'knockout',
    'jquery',
    'viewmodels/WeatherScoutView'],
        function (ko, $, WeatherScoutView) {

            /**
             * 
             * @constructor
             * @param {Globe} globe
             * @param {String} viewElementId View element id
             * @param {String} viewUrl View fragment file
             * @param {String} appendToId View element parent id
             * @returns {InfoViewModelL#18.InfoViewModel}
             */
            function InfoViewModel(globe, viewElementId, viewUrl, appendToId) {
                var self = this;

                this.view = null;
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

            return InfoViewModel;
        }
);
