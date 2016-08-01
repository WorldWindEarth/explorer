/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Output content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {OutputViewModel}
 */
define(['knockout',
        'jquery',
        'model/Constants'],
    function (ko, $, constants) {

        /**
         * The view model for the Output panel.
         * @constructor
         */
        function OutputViewModel(globe) {
            var self = this;
            
            this.globe = globe;
            
            // Get a reference to the SelectController's selectedItem observable
            this.selectedItem = this.globe.selectController.lastSelectedItem;
            
            this.viewTemplateName = ko.observable(null);
            
            this.selectedItem.subscribe(function(newItem) {
                // Determine if the new item has a view template
                if (newItem!==null) {
                    if (typeof newItem.viewTemplateName !== "undefined") {
                        self.viewTemplateName(newItem.viewTemplateName);
                    }
                }
                
            });
        }

        return OutputViewModel;
    }
);
