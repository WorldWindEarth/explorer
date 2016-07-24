/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define([
    'knockout',
    'jquery',
    'jquery-growl',
    'model/Constants',
    'model/util/ContextSensitive',
    'model/util/Openable',
    'model/util/Log',
    'model/util/Movable',
    'model/util/Removable',
    'model/util/Selectable',
    'model/util/WmtUtil',
    'worldwind'],
        function (ko,
                $,
                growl,
                constants,
                contextSensitive,
                openable,
                log,
                movable,
                removable,
                selectable,
                util) {
            "use strict";

            /**
             * Constructs a BasicMarker wrapper around a Placemark and Layer.
             * @param {MarkerManager} manager
             * @param {Position} position
             * @param {Object} params Parameters object containing:
             * {    
             *      id: optional, must be unique, will be assigned if missing
             *      name: optional, will be assigned if missing
             *      isMovable: optional, will be set to true if missing
             *      editor: 
             *  }
             * @constructor
             */
            var BasicMarker = function (manager, position, params) {
                var self = this,
                        args = params || {},
                        normalAttributes, highlightAttributes, placemark;

                // TODO: assert validitiy of method arguments

                // Add the mix-in capabilites:

                // Make movable by the SelectController: adds the isMovable member.
                //  The MarkerManager toggles the isMovable state when a marker is selected.
                movable.makeMovable(this);

                // Make selectable via picking (see SelectController): adds the "select" method
                selectable.makeSelectable(this, function () {   // define the callback that selects this marker
                    // The manager will toggle the exclusive highlighted state
                    // i.e., only a single marker can be highlighted at one time.
                    manager.selectMarker(self);                      
                    return true;    // return true to fire a EVENT_OBJECT_SELECTED event
                });
                
                // Make openable via menus: adds the isOpenable member and the "open" method
                openable.makeOpenable(this, function () {   // define the callback that "opens" this marker
                    // TODO: get the marker editor ID from parameters
                    // TODO: add error checking for existance of editor
                    // TOOD: set openable false if no editor element defined in options/params
                    var $editor = $("#marker-editor"),
                            markerEditor = ko.dataFor($editor.get(0));
                    this.select();
                    markerEditor.open(this);
                    return true; // return true to fire EVENT_OBJECT_OPENED event.
                });

                // Make deletable via menu: adds the isRemovable member and the "remove" method
                removable.makeRemovable(this, function () {     // define the callback that "removes" this marker
                    // TODO: Could ask for confirmation; return false if veto'd
                    manager.removeMarker(self); // Removes the marker from the manager's observableArray
                    return true;    // return true to fire a EVENT_OBJECT_REMOVED
                });

                // Make context sensitive by the SelectController: adds the isContextSensitive member
                contextSensitive.makeContextSenstive(this, function () {    // define the function that shows the context sentive memnu
                    $.growl({title: "TODO", message: "Show menu with delete, open, and lock/unlock"});
                });

                // Observables
                
                /** The unique id used to identify this particular marker object */
                this.id = ko.observable(args.id || util.guid());
                /** The name of this marker */
                this.name = ko.observable(args.name || "Marker");
                /** The latitude of this marker -- set be by the Movable interface during pick/drag operations. See SelectController */
                this.latitude = ko.observable(position.latitude);
                /** The longitude of this marker -- may be set by the Movable interface during pick/drag operations See SelectController */
                this.longitude = ko.observable(position.longitude);
                /** The movable state */
                this.isMovable = ko.observable(args.isMovable === undefined ? true : args.isMovable);
                /** The lat/lon location string of this marker */
                this.location = ko.computed(function () {
                    return "Lat " + self.latitude().toPrecision(4).toString() + "\n" + "Lon " + self.longitude().toPrecision(5).toString();
                });
                
                // Properties
                
                /** The image source url, stored/recalled in the persistant store */
                this.source = args.imageSource;
                /** The default movable state is false; a marker must be selected to be movable. */
                this.isMovable = false;
                
                // Create the placemark property
                normalAttributes = new WorldWind.PlacemarkAttributes(BasicMarker.commonAttributes());
                if (args.imageSource) {
                    normalAttributes.imageSource = args.imageSource;
                } else {
                    // When there no imageSource, Placemark will draw a colored square
                    normalAttributes.imageScale = 20;   // size of the square, in pixels
                    normalAttributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 0.5);
                }
                highlightAttributes = new WorldWind.PlacemarkAttributes(normalAttributes);
                highlightAttributes.imageScale = normalAttributes.imageScale * 1.2;

                this.placemark = new WorldWind.Placemark(position, true, normalAttributes); // eye distance scaling enabled
                this.placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                this.placemark.eyeDistanceScalingThreshold = 2000000;
                this.placemark.highlightAttributes = highlightAttributes;
                this.placemark.label = this.name();
                // Configure the placemark to return this marker object when the placemark is picked, 
                // See: SelectController
                this.placemark.pickDelegate = this;

                // Synchronize the placemark to the observable (writeable) properties of this marker

                this.name.subscribe(function (newName) {
                    self.placemark.label = newName;
                });
                this.latitude.subscribe(function (newLat) {
                    self.placemark.position.latitude = newLat;
                });
                this.longitude.subscribe(function (newLon) {
                    self.placemark.position.longitude = newLon;
                });

            };

            BasicMarker.commonAttributes = function () {
                var attributes = new WorldWind.PlacemarkAttributes(null);

                // Set up the common placemark attributes for markers
                attributes.depthTest = true;
                attributes.imageScale = 0.7;
                attributes.imageColor = WorldWind.Color.WHITE;
                attributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.3,
                        WorldWind.OFFSET_FRACTION, 0.0);
                attributes.labelAttributes.color = WorldWind.Color.YELLOW;
                attributes.labelAttributes.offset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 1.0);
                attributes.labelAttributes.color = WorldWind.Color.WHITE;
                attributes.labelAttributes.depthTest = true;
                attributes.drawLeaderLine = true;
                attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
                attributes.leaderLineAttributes.outlineWidth = 2;
                return attributes;
            };

            BasicMarker.imagePath = constants.WORLD_WIND_PATH + 'images/pushpins/';
            BasicMarker.templates = [
                {name: "Red ", imageSource: BasicMarker.imagePath + "castshadow-red.png"},
                {name: "Black ", imageSource: BasicMarker.imagePath + "castshadow-black.png"},
                {name: "Green ", imageSource: BasicMarker.imagePath + "castshadow-green.png"},
                {name: "Blue ", imageSource: BasicMarker.imagePath + "castshadow-blue.png"},
                {name: "Teal ", imageSource: BasicMarker.imagePath + "castshadow-teal.png"},
                {name: "Orange ", imageSource: BasicMarker.imagePath + "castshadow-orange.png"},
                {name: "Purple ", imageSource: BasicMarker.imagePath + "castshadow-purple.png"},
                {name: "Brown ", imageSource: BasicMarker.imagePath + "castshadow-brown.png"},
                {name: "White ", imageSource: BasicMarker.imagePath + "castshadow-white.png"}
            ];

            return BasicMarker;
        }
);

