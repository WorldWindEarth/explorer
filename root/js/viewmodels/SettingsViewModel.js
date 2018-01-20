/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Settings content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {SettingsViewModel}
 */
define(['knockout',
    'jquery',
    'model/Constants'],
    function (ko, $, constants) {

        /**
         * The view model for the Settings panel.
         * @constructor
         */
        function SettingsViewModel(globe, viewElementId, viewUrl, appendToId) {
            var self = this;

            this.globe = globe;
            this.timeZoneDetectEnabled = globe.timeZoneDetectEnabled;
            this.use24Time = globe.use24Time;

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

        return SettingsViewModel;
    }
);
