/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define([
    'model/Constants',
    'model/Events',
    'model/util/ContextSensitive',
    'model/util/Formatter',
    'model/util/Openable',
    'model/util/Log',
    'model/util/Movable',
    'model/util/Removable',
    'model/util/Selectable',
    'model/util/WmtUtil',
    'knockout',
    'jquery',
    'jquery-growl',
    'worldwind'],
    function (
        constants,
        events,
        contextSensitive,
        formatter,
        openable,
        log,
        movable,
        removable,
        selectable,
        util,
        ko,
        $) {
        "use strict";

        /**
         * Constructs a TacticalSymbol wrapper around a Placemark and Layer.
         * @param {SymbolManager} manager
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
        var TacticalSymbol = function (manager, position, params) {
            var self = this,
                args = params || {},
                normalAttributes, highlightAttributes, placemark;

            this.globe = manager.globe;

            // TODO: assert validitiy of method arguments

            // Add the mix-in capabilites:

            // Make movable by the PickController: adds the isMovable, latitude and longitude
            // observables. The SymbolManager toggles the isMovable state when a symbol is selected.
            movable.makeMovable(this);

            // Make selectable via picking (see PickController): adds the "select" method
            selectable.makeSelectable(this, function (params) {   // define the callback that selects this symbol
                this.isMovable(params.selected);
                this.placemark.highlighted = params.selected;
                return true;    // return true to fire a EVENT_OBJECT_SELECTED event
            });

            // Make openable via menus: adds the isOpenable member and the "open" method
            openable.makeOpenable(this, function () {   // define the callback that "opens" this symbol
                // TODO: get the symbol editor ID from parameters
                // TODO: add error checking for existance of editor
                // TOOD: set openable false if no editor element defined in options/params
                // TODO: symbol editor should be assigned in the constructor
                var $editor = $("#symbol-editor"),
                    symbolEditor = ko.dataFor($editor.get(0));
                symbolEditor.open(this);
                return true; // return true to fire EVENT_OBJECT_OPENED event.
            });

            // Make deletable via menu: adds the isRemovable member and the "remove" method
            removable.makeRemovable(this, function () {     // define the callback that "removes" this symbol
                // TODO: Could ask for confirmation; return false if veto'd
                manager.removeMarker(self);     // Removes the symbol from the manager's observableArray
                return true;    // return true to fire a EVENT_OBJECT_REMOVED
            });

            // Make context sensitive by the PickController: adds the isContextSensitive member
            contextSensitive.makeContextSensitive(this, function () {    // define the function that shows the context sentive memnu
                $.growl({
                    title: self.name(),
                    message: "Location: " + self.toponym() + ", " + self.location()});
            });

            // Observables

            /** The unique id used to identify this particular symbol object */
            this.id = ko.observable(args.id || util.guid());
            /** The name of this symbol */
            this.name = ko.observable(args.name || "Symbol");
            /** The movable mix-in state */
            this.isMovable(args.isMovable === undefined ? false : args.isMovable);
            /** The latitude of this symbol -- set be by the Movable interface during pick/drag operations. See PickController */
            this.latitude(position.latitude)
            /** The longitude of this symbol -- may be set by the Movable interface during pick/drag operations See PickController */
            this.longitude(position.longitude);
            /** The lat/lon location string of this symbol */
            this.location = ko.computed(function () {
                return formatter.formatDecimalDegreesLat(self.latitude(), 3) + ", " + formatter.formatDecimalDegreesLon(self.longitude(), 3);
            });
            this.toponym = ko.observable("");

            // Properties

            /** The image source url, stored/recalled in the persistant store */
            this.source = args.imageSource;
            /** DOM element id to display view when this symbol is selected. */
            this.viewTemplateName = 'tactical-symbol-view-template';


            // Create the placemark property
            normalAttributes = new WorldWind.PlacemarkAttributes(TacticalSymbol.commonAttributes());
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
            this.placemark.eyeDistanceScalingThreshold = 4000000;
            this.placemark.highlightAttributes = highlightAttributes;
            this.placemark.label = this.name();
            // Configure the placemark to return this symbol object when the placemark is picked, 
            // See: PickController
            this.placemark.pickDelegate = this;

            // Synchronize the placemark to this symbol's the observable properties

            this.name.subscribe(function (newName) {
                self.placemark.label = newName;
            });
            this.latitude.subscribe(function (newLat) {
                self.placemark.position.latitude = newLat;
            });
            this.longitude.subscribe(function (newLon) {
                self.placemark.position.longitude = newLon;
            });

            // Self subscribe to move operations so we can update the toponyn when
            // the move is finished. We don't want to update during the move itself.
            this.on(events.EVENT_OBJECT_MOVE_FINISHED, this.refresh);

            this.refresh();
        };

        /**
         * Updates the symbol's place data.
         */
        TacticalSymbol.prototype.refresh = function () {
            //this.refreshPlace();
        };


        TacticalSymbol.commonAttributes = function () {
            var attributes = new WorldWind.PlacemarkAttributes(null);

            // Set up the common placemark attributes for symbols
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

        TacticalSymbol.imagePath = 'js/model/images/milstd2525c/64/';
        TacticalSymbol.templates = [
            {name: "Air ", imageSource: TacticalSymbol.imagePath + "sfap-----------.png"},
            {name: "Ground ", imageSource: TacticalSymbol.imagePath + "sfgp-----------.png"},
            {name: "Sea Surface ", imageSource: TacticalSymbol.imagePath + "sfsp-----------.png"},
            {name: "Sea Sub Surface ", imageSource: TacticalSymbol.imagePath + "sfup-----------.png"},
            {name: "SOF Unit ", imageSource: TacticalSymbol.imagePath + "sffp-----------.png"}
        ];

        return TacticalSymbol;
    }
);

