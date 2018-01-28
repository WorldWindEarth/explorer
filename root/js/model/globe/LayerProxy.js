/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

/**
 * The LayerProxy modude is used to create a proxy for a WorldWind.Layer object. The proxy
 * wraps the layer object and is endowed with additional observable properties that allow it 
 * to controlled by the LayerManager and be displayed in the MVVM views.
 * 
 * @param {Knockout} ko
 * @param {Moment} moment
 * @returns {LayerProxy}
 */
define([
    'knockout',
    'moment',
    'worldwind'],
    function (ko, moment) {
        "use strict";

        /**
         * @constructor
         * @param {WorldWind.Layer} layer
         * @returns {LayerProxy}
         */
        var LayerProxy = function (layer, globe) {
            var self = this;

            /**
             * The WorldWind layer proxied by this object
             * @type WorldWind.Layer
             */
            this.wwLayer = layer;

            //
            // Observables
            //

            /**
             * The unique ID for this object (in the current session).
             * @type Number
             */
            this.id = ko.observable(LayerProxy.nextLayerId++);

            /**
             * The layer category used to group layers.
             * @type String
             */
            this.category = ko.observable(layer.category);

            /**
             * The name used for this layer in the layer lists.
             * @type String
             */
            this.name = ko.observable(layer.displayName);

            /**
             * The enabled (visible) state of this layer.
             * @type Boolean
             */
            this.enabled = ko.observable(layer.enabled);

            /**
             * The optional URL to a legend image.
             * @type String
             */
            this.legendUrl = ko.observable(layer.legendUrl ? layer.legendUrl.url : '');

            /**
             * The opacity (tranparency) setting for this layer.
             * @type Number
             */
            this.opacity = ko.observable(layer.opacity);

            /**
             * The sort order of this layer in its category.
             * @type Number
             */
            this.order = ko.observable();

            /**
             * Flag to determine if this layer should appear in its category's layer list.
             * @type Boolean
             */
            this.showInMenu = ko.observable(layer.showInMenu);

            /**
             * Flag to indicate if this layer is should expose its details in the layer manager.
             * @type Boolean
             */
            this.showDetails = ko.observable(false);

            /**
             * Flag to indicate if this layer is currently selected in the layer manager.
             * @type Boolean
             */
            this.selected = ko.observable(false);

            /**
             * The observable current time within the layer's time sequence.
             * @type {Moment} 
             */
            this.currentTime = ko.observable(layer.time ? moment(layer.time) : null);
            
            // Internal. Intentionally not documented.
            this.time = ko.pureComputed({
                /**
                 * @returns {Date}
                 */
                read: function () {
                    return this.wwLayer.time;
                },
                /**
                 * @param {Date} newDateTime
                 */
                write: function (newDateTime) {
                    var timeSequence = this.wwLayer.timeSequence,
                        startTime = timeSequence.startTime,
                        intervalMs = timeSequence.intervalMilliseconds,
                        elapsedMs, newTime;
                    // Select a time sequence from the new value and 
                    // set the time to beginning of the time sequence
                    if (intervalMs && startTime < newDateTime) {
                        elapsedMs = newDateTime.getTime() - startTime.getTime();
                        newTime = timeSequence.getTimeForScale(elapsedMs / intervalMs);
                        // Update the time dimensioned layer
                        this.wwLayer.time = newTime;
                        // Update the observable
                        this.currentTime(moment(newTime));
                        // Update the display
                        globe.redraw();
                    }    
                },
                owner: this
            });

            /**
             * 
             */
            this.currentTimeText = ko.pureComputed(function () {
                var dateTime = this.currentTime(),
                    timeText, dateText;
                if (dateTime) {
                    timeText = dateTime.format(globe.use24Time() ? "HH:mm" : "h:mm A");
//                    dateText = dateTime.format("MMM D, YY");
                    dateText = dateTime.format("YYYY-MM-DD");
                    return dateText + " " + timeText;
                }
            }, this);

            this.currentTimeScale = ko.observable(0);
            this.currentTimeScale.subscribe(function (newValue) {
                var selectedTime = this.wwLayer.timeSequence().getTimeForScale(newValue / 100);
                if (this.time() !== selectedTime) {
                    this.time(selectedTime);
                }
            }, this);


            /**
             * Returns the name annotated with the layer's current
             * time sequence, if this a time dimensioned layer.
             */
            this.annotatedName = ko.pureComputed(function () {
                if (this.currentTime()) {
                    return this.name() + " [" + this.currentTimeText() + "]";
                } else {
                    return this.name();
                }
            }, this);



            this.stepTimeForward = function () {
                var timeSequence = self.wwLayer.timeSequence();
                if (timeSequence) {
                    var nextTime = timeSequence.next() || timeSequence.next();
                    self.time(nextTime);
                    self.currentTimeScale(timeSequence.scaleForCurrentTime * 100);
                }
            };


            this.stepTimeBackward = function () {
                var timeSequence = self.wwLayer.timeSequence();
                if (timeSequence) {
                    var previousTime = this.wwLayer.timeSequence().previous() || this.wwLayer.timeSequence().previous();
                    self.time(previousTime);
                    self.currentTimeScale(timeSequence.scaleForCurrentTime * 100);
                }
            };

            //
            // Event handlers
            //

            /**
             * Forwards enabled state changes to the proxied layer object.
             * @param {Boolean} newValue - The new state
             */
            this.enabled.subscribe(function (newValue) {
                this.wwLayer.enabled = newValue;
            }, this);

            /**
             * Forwards opacity changes to the proxied layer object.
             * @param {Boolean} newValue - The new opacity
             */
            this.opacity.subscribe(function (newValue) {
                this.wwLayer.opacity = newValue;
            }, this);

            // Subscription to the globe's dateTime observable.
            // This subscription updates this layer's timeSequence
            // to the current time maintained by the globe.
            if (layer.timeSequence) {
                globe.dateTime.subscribe(function (newDateTime) {
                    // Update the time observable, which will
                    // select a frame from the time sequence
                    // and update the currentTime observable.
                    this.time(newDateTime);
                }, this);
            }            
        };

        /**
         * The next ID to be assigned.
         * @type Number
         * @inner
         * @static
         */
        LayerProxy.nextLayerId = 0;

        return LayerProxy;
    }
);

