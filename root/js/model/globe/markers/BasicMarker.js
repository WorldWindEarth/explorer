/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout',
    'jquery', 'jquery-growl',
    'model/util/ContextSensitive',
    'model/util/Openable',
    'model/util/Log',
    'model/util/Movable',
    'model/util/Removable',
    'model/util/WmtUtil',
    'worldwind'],
        function (ko,
                $,
                growl,
                contextSensitive,
                openable,
                log,
                movable,
                removable,
                util) {
            "use strict";

            /**
             * Constructs a BasicMarker wrapper around a Placemark and Layer.
             * @param {MarkerManager} manager
             * @param {Placemark} placemark
             * @param {string} id A GUID-like string
             * @constructor
             */
            var BasicMarker = function (manager, placemark, id) {
                var self = this;
                // Add the mix-in capabilites:
                //  Make movable by the SelectController: Fires the EVENT_OBJECT_MOVE... events.
                //  set isMovable true/false to enable or disable dragging by SelectController
                movable.makeMovable(this);
                //  Make openable via menus: Fires the EVENT_OBJECT_OPENED event on success.
                //  set isOpenable true/false to enable or disable open capability
                openable.makeOpenable(this, function () {
                    // TODO: get the marker editor ID from parameters
                    // TODO: add error checking for existance of editor
                    // TOOD: set openable false if no editor element defined in options/params
                    var $editor = $("#marker-editor"),
                        markerEditor = ko.dataFor($editor.get(0));
                    markerEditor.open(this);
                    return true; // return true to fire EVENT_OBJECT_OPENED event.
                });
                //  Make deletable via menu: Fires the EVENT_OBJECT_REMOVED event on success.
                //  set isRemovable true/false to enable or disable delete capability
                removable.makeRemovable(this, function () {
                    // TODO: Could ask for confirmation; return false if veto'd
                    manager.removeMarker(self); // Removes the marker from the manager's observableArray
                    return true;    // return true to fire a EVENT_OBJECT_REMOVED
                });
                //  Make context sensitive by the SelectController: shows the context menu.
                contextSensitive.makeContextSenstive(this, function () {
                    $.growl({title: "TODO", message: "Show menu with delete, open, and lock/unlock"});
                });

                // Properties
                this.placemark = placemark;
                this.source = placemark.attributes.imageSource; // this property exists for persistence in localStorage

                // Observables
                /** The unique id used to identify this particular marker object */
                this.id = ko.observable(id || util.guid());
                /** The name of this marker */
                this.name = ko.observable(placemark.label);
                /** The latitude of this marker -- set be by the Movable interface during pick/drag operations. See SelectController */
                this.latitude = ko.observable(placemark.position.latitude);
                /** The longitude of this marker -- may be set by the Movable interface during pick/drag operations See SelectController */
                this.longitude = ko.observable(placemark.position.longitude);
                /** The lat/lon location string of this marker */
                this.location = ko.computed(function () {
                    return "Lat " + self.latitude().toPrecision(4).toString() + "\n" + "Lon " + self.longitude().toPrecision(5).toString();
                });

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

                // Configure the placemark to return this marker object when the placemark is picked, 
                // See: SelectController
                placemark.pickDelegate = this;

            };

            BasicMarker.commonAttributes = function () {
                var attributes = new WorldWind.PlacemarkAttributes(null);

                // Set up the common placemark attributes for markers
                attributes.imageScale = 1;
                attributes.imageColor = WorldWind.Color.WHITE;
                attributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.3,
                        WorldWind.OFFSET_FRACTION, 0.0);
                attributes.labelAttributes.color = WorldWind.Color.YELLOW;
                attributes.labelAttributes.offset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 1.0);
                attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
                attributes.drawLeaderLine = true;

                return attributes;
            };

            BasicMarker.editor = {
            };
            return BasicMarker;
        }
);

