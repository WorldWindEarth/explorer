/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/**
 * The LayerSettings module is responsible for managing the view that
 * presents controls for a single layer.
 * 
 * @param {Knockout} ko
 * @param {JQuery} $
 * @returns {LayerSettingsL#12.LayerSettings}
 */
define(['knockout', 'jquery'],
    function (ko, $) {
        "use strict";

        /**
         * Constructs a LayerSettings view model and binds it to the given
         * view element. 
         * @constructor
         * @param {Globe} globe The globe model
         * @param {String} viewElementID The element ID of the view for the Knockout binding
         * @param {String} viewUrl The url for the view fragement's html
         * @returns {LayerSettings}
         */
        function LayerSettings(globe, viewElementID, viewUrl) {
            var self = this;

            // Setup internals and observables

            /**
             * The DOM element containing the view fragment.
             * @type {Element}
             */
            this.view = null;
            
            /**
             * The Globe that renders the layer.
             * @type {Globe}
             */
            this.globe = globe;
            
            /**
             * The layer manager for the layer.
             * @type {LayerManager}
             */
            this.layerManager = globe.layerManager;

            /**
             * The observable current layer being managed.
             * @type {Layer} observable Layer
             */
            this.currentLayer = ko.observable();

            /**
             * The time in milliseconds to display each frame of the time sequence.
             * @type {Number}
             * @default 1000 milliseconds
             */
            this.frameTime = 1000;

            /**
             * The observable time sequence this player controls.
             * @type {PeriodicTimeSequence} 
             * @default null
             */
            this.timeSequence = ko.observable();

            /**
             * The observable current time within the time sequence.
             * @type {Date} 
             */
            this.currentTime = ko.observable();
            this.currentTimeScale = ko.observable(0);
            this.isPlaying = ko.observable(false);
            this.isRepeating = ko.observable(false);
            this.legendUrl = ko.observable('');
            this.opacity = ko.observable(0);

            // Forward changes from observable(s) to the the layer object
            this.opacity.subscribe(function (newValue) {
                if (this.currentLayer()) {
                    this.currentLayer().opacity(newValue);
                }
            }, this);

            this.currentTime.subscribe(function (newValue) {
                console.log("New current time: " + newValue);
                if (this.currentLayer() && newValue) {
                    this.globe.dateTime(newValue);
                }
            }, this);

            this.currentTimeScale.subscribe(function (newValue) {
                var selectedTime = this.timeSequence().getTimeForScale(newValue / 100);
                if (this.currentTime() !== selectedTime) {
                    this.currentTime(selectedTime);
                }
            }, this);

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

        }
        ;

        /**
         * Opens the Layer Settings dialog
         * @param {type} layer
         */
        LayerSettings.prototype.open = function (layer) {

            // Stop the time series player when we change layers
            if (this.isPlaying()) {
                this.isPlaying(!this.isPlaying());
            }

            // Update observables
            this.currentLayer(layer);
            this.timeSequence(layer.wwLayer.timeSequence);
            this.legendUrl(layer.legendUrl());
            this.opacity(layer.opacity());

            // Get the view element and wrap it in a JQuery dialog
            var $view = $(this.view);
            $view.dialog({
                autoOpen: false
            });
            // Update the dialog title
            $view.dialog("option", "title", layer.name());
            // Show the dialog
            $view.dialog("open");
        };

        /**
         * Move the current layer to the top of its category.
         */
        LayerSettings.prototype.onMoveLayerToTop = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'top');
        };

        /**
         * Move the current layer to the bottom of its category.
         */
        LayerSettings.prototype.onMoveLayerToBottom = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'bottom');
        };

        /**
         * Move the current layer up one in its category.
         */
        LayerSettings.prototype.onMoveLayerUp = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'up');
        };

        /**
         * Move the current layer up down one in its category.
         */
        LayerSettings.prototype.onMoveLayerDown = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'down');
        };

        LayerSettings.prototype.onPlay = function (event) {
            if (!this.timeSequence()) {
                return;
            }

            this.isPlaying(!this.isPlaying());

            var self = this;
            var playFunction = function () {
                if (self.timeSequence() && self.isPlaying()) {
                    var nextTime = self.timeSequence().next();
                    if (nextTime) {
                        self.currentTime(self.timeSequence().currentTime);
                        self.currentTimeScale(self.timeSequence().scaleForCurrentTime * 100);
                        //self.updateTimeDisplay(nextTime.toUTCString());
                        window.setTimeout(playFunction, self.frameTime);
                    } else if (self.isRepeating()) {
                        self.timeSequence().reset();
                        window.setTimeout(playFunction, self.frameTime);
                    } else {
                        self.isPlaying(false);
                    }

                }
            };

            if (this.isPlaying()) {
                window.setTimeout(playFunction, this.frameTime);
            }

        };

        LayerSettings.prototype.onStepBackward = function (event) {
            if (!this.isPlaying()) {
                if (this.timeSequence()) {
                    var previousTime = this.timeSequence().previous() || this.timeSequence().previous();
                    this.currentTime(previousTime);
                    this.currentTimeScale(this.timeSequence().scaleForCurrentTime * 100);
                }
            }
        };

        LayerSettings.prototype.onStepForward = function (event) {
            if (!this.isPlaying()) {
                if (this.timeSequence()) {
                    var nextTime = this.timeSequence().next() || this.timeSequence().next();
                    this.currentTime(nextTime);
                    this.currentTimeScale(this.timeSequence().scaleForCurrentTime * 100);
                }
            }
        };

        LayerSettings.prototype.onRepeat = function (event) {
            this.isRepeating(!this.isRepeating());
        };




        return LayerSettings;
    }
);