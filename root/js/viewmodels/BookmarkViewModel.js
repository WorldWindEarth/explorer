/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2017 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * * The BookmarkViewModel opens dialog with a bookmark URL ready for copying to the clipboard.
 * 
 * @param {object} ko  
 * @param {object} $ JQuery
 * @param {class} BookmarkDialog 
 * @returns {BookmarkViewModel}
 */
define(['knockout', 'jquery', 'viewmodels/BookmarkDialog'],
    function (ko, $, BookmarkDialog) {
        "use strict";
        /**
         * @constructor
         * @param {Globe} globe
         * @returns BookmarkViewModel
         */
        function BookmarkViewModel(globe, viewElementId, viewUrl, appendToId) {
            var self = this;
            
            this.view = null;
            this.globe = globe;

            // Create bookmakr dialog object and bind it to the DOM
            this.dialog = new BookmarkDialog("bookmark-dialog", "js/views/bookmark-dialog.html");

            this.onBookmark = function () {

                // Generate a bookmark for the current scene
                var bookmark = window.location.origin + window.location.pathname + "?"
                    + globe.layerManager.getWmsLayersParam() + "&"
                    + globe.getCameraParams();
                // TODO: The bookmark should be generated from Bookmark class

                // Open the copy-bookmark dialog
                self.dialog.open(bookmark);
            };

            // Load the view html into the DOM and apply the Knockout bindings
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

        return BookmarkViewModel;
    }
);