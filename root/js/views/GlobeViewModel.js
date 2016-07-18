/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'jqueryui',
    'model/globe/markers/BasicMarker',
    'model/Config',
    'model/Constants',
    'model/util/WmtUtil',
    'worldwind'
],
        function (ko, $, jqueryui,
                BasicMarker,
                config,
                constants,
                util,
                ww) {
            "use strict";
            /**
             *
             * @param {Globe} globe The globe object
             * @param {MarkerManager} markerManager
             * @constructor
             */
            function GlobeViewModel(globe, markerManager) {
                var self = this,
                        commonAttributes = BasicMarker.commonAttributes();

                // Create the marker templates used in the marker palette
                self.markerPalette = ko.observableArray([
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-red.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-green.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-blue.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-orange.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-teal.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-purple.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-white.png", attributes: commonAttributes},
                    {imageSource: "http://worldwindserver.net/webworldwind/images/pushpins/castshadow-black.png", attributes: commonAttributes}
                ]);
                // The currently selected marker icon in the marker palette
                self.selectedMarkerTemplate = ko.observable(self.markerPalette()[0]);

                // Used for cursor style and click handling
                self.dropIsArmed = ko.observable(false);
                // The dropCallback is supplied with the click position and the dropObject.
                self.dropCallback = null;
                // The object passed to the dropCallback
                self.dropObject = null;

                /**
                 * Arms the click-drop handler to add a marker to the globe. See: handleClick below.
                 */
                self.armDropMarker = function () {
                    self.dropIsArmed(true);
                    self.dropCallback = self.dropMarkerCallback;
                    self.dropObject = self.selectedMarkerTemplate();
                };

                // Invoke armDropMarker when a template is selected from the palette
                self.selectedMarkerTemplate.subscribe(self.armDropMarker);

                // This "Drop" action callback creates and adds a marker to the globe 
                // when the globe is clicked while dropIsArmed is true.
                self.dropMarkerCallback = function (position, markerTemplate) {
                    var attributes = new WorldWind.PlacemarkAttributes(markerTemplate.attributes),
                            placemark = new WorldWind.Placemark(position, false, attributes);

                    // Set the placemark properties and  attributes
                    placemark.label = config.markerLabels;
                    attributes.imageSource = markerTemplate.imageSource;

                    // Add the placemark to the layer and to the observable array
                    markerManager.addMarker(new BasicMarker(markerManager, placemark));
                };

                /**
                 * Handles a click on the WorldWindow. If a "drop" action callback has been
                 * defined, it invokes the dropCallback function with the picked location.
                 */
                self.handleDropClick = function (event) {
                    if (!self.dropIsArmed()) {
                        return;
                    }
                    var type = event.type,
                            x, y,
                            pickList,
                            terrain;
                    // Get the clicked window coords
                    switch (type) {
                        case 'click':
                            x = event.clientX;
                            y = event.clientY;
                            break;
                        case 'touchend':
                            if (!event.changedTouches[0]) {
                                return;
                            }
                            x = event.changedTouches[0].clientX;
                            y = event.changedTouches[0].clientY;
                            break;
                    }
                    if (self.dropCallback) {
                        // Get all the picked items
                        pickList = globe.wwd.pickTerrain(globe.wwd.canvasCoordinates(x, y));
                        // Terrain should be one of the items if the globe was clicked
                        terrain = pickList.terrainObject();
                        if (terrain) {
                            self.dropCallback(terrain.position, self.dropObject);
                        }
                    }
                    self.dropIsArmed(false);
                    event.stopImmediatePropagation();
                };
                // Assign the click handler to the WorldWind
                globe.wwd.addEventListener('click', function (event) {
                    self.handleDropClick(event);
                });


                self.intervalMinutes = 0;
                self.onTimeFastBackward = function () {
                    self.intervalMinutes = -60 * 24;
                };
                self.onTimeStepBackward = function () {
                    self.intervalMinutes = -60;
                };
                self.onTimeReset = function () {
                    globe.updateDateTime(new Date());
                };
                self.onTimeStepForward = function () {
                    self.intervalMinutes = 60;
                };
                self.onTimeFastForward = function () {
                    self.intervalMinutes = 60 * 24;
                };
                self.updateDateTime = function () {
                    globe.incrementDateTime(self.intervalMinutes);
                };
                var intervalId = [];
                $(".repeatButton").mousedown(function () {
                    intervalId.push(setInterval(self.updateDateTime, 100));
                }).mouseup(function () {
                    for (var i = 0, len = intervalId.length; i < len; i++) {
                        clearInterval(intervalId[i]);
                    }
                    intervalId = [];
                    self.intervalMinutes = 0;
                });

                $('#timeControlSlider').slider({
                    animate: 'fast',
                    min: -100,
                    max: 100,
                    orientation: 'horizontal',
                    stop: function () {
                        $("#timeControlSlider").slider("value", "0");
                    }
                });

                this.onSlide = function (event, ui) {
                    console.log("onSlide: " + ui.value);
                    globe.incrementDateTime(self.sliderValueToMinutes(ui.value));
                };
                self.sliderValueToMinutes = function (value) {
                    var val, factor = 50;
                    if (value < 45 && value > -45) {
                        val = Math.min(Math.max(value, -45), 45);
                        return Math.sin(val * util.DEG_TO_RAD) * factor;
                    }
                    val = Math.abs(value) - 44;
                    return Math.pow(val, 1.5) * (value < 0 ? -1 : 1) * factor;
                };

                //$("#timeControlSlider").on('mousedown', $.proxy(this.onMousedown, this));
                //$("#timeControlSlider").on('mouseup', $.proxy(this.onMouseup, this));
                // The slide event provides events from the keyboard
                $("#timeControlSlider").on('slide', $.proxy(this.onSlide, this));

                self.timeSliderValue = ko.observable(0);
                self.onTimeSliderStop = function () {
                    self.timeSliderValue(0);
                };
            }

            return GlobeViewModel;
        }
);