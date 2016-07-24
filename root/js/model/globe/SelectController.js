/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

define([
    'knockout',
    'worldwind'],
    function (
        ko,
        ww) {
        "use strict";
        /**
         * The SelectController operates on picked objects containing the Selectable, 
         * Movable, Openable and/or ContextSensitive capabilites.
         * @constructor
         * @param {WorldWindow} worldWindow
         * @returns {SelectController}
         */
        var SelectController = function (worldWindow) {
            var self = this;
            
            this.wwd = worldWindow;
            // Flag to signal that dragging/moving has been initiated.
            // When dragging, the mouse event is consumed, i.e., not propagated.
            this.isDragging = false;
            // Flag to signal if a touch tap has occured.
            // Used to determine single or double tap.
            this.tapped = false;
            // The time in ms to wait for a double tap
            this.DOUBLE_TAP_INTERVAL = 250;
            // The list of selected items under the mouse cursor
            this.selectedItem = ko.observable(null);
            // The top item in the pick list
            this.pickedItem = null;
            // Caches the clicked item for dblclick to process 
            this.clickedItem = null;

            // Listen for mouse down to select an item
            this.wwd.addEventListener("mousedown", function (event) {
                self.handlePick(event);
            });
            // Listen for mouse moves and tap gestutes to move an item
            this.wwd.addEventListener("mousemove", function (event) {
                self.handlePick(event);
            });
            // Listen for mouse up to release an item
            this.wwd.addEventListener("mouseup", function (event) {
                self.handlePick(event);
            });
            this.wwd.addEventListener("mouseout", function (event) {
                self.handlePick(event);
            });
            // Listen for single clicks to select an item
            this.wwd.addEventListener("click", function (event) {
                self.handlePick(event);
            });
            // Listen for double clicks to open an item
            this.wwd.addEventListener("dblclick", function (event) {
                self.handlePick(event);
            });
            // Listen for right clicks to open menu
            this.wwd.addEventListener("contextmenu", function (event) {
                self.handlePick(event);
            });

            // Listen for touch
            this.wwd.addEventListener("touchstart", function (event) {
                self.handlePick(event);
            });
            this.wwd.addEventListener("touchmove", function (event) {
                self.handlePick(event);
            });
            this.wwd.addEventListener("touchend", function (event) {
                self.handlePick(event);
            });
        };
        /**
         * Performs the pick apply the appropriate action on the selected item.
         * @param {Event or TapRecognizer} o The input argument is either an Event or a TapRecognizer. Both have the 
         *  same properties for determiningthe mouse or tap location.
         */
        SelectController.prototype.handlePick = function (o) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var self = this,
                type = o.type,
                x, y,
                button = o.button,
                redrawRequired,
                pickList,
                terrainObject,
                isTouchDevice = false;

            // Get our X,Y values from the event; 
            // determine if this is a touch device.
            if (type.substring(0, 5) === 'touch') {
                isTouchDevice = true;
                // Use the first touches entry
                // Note: x, y remain undefined for touchend
                if (o.touches.length > 0) {
                    x = o.touches[0].clientX;
                    y = o.touches[0].clientY;
                }
            } else {  // Mouse events...
                // Prevent handling of simulated mouse events on touch devices.
                if (isTouchDevice) {
                    return;
                }
                x = o.clientX;
                y = o.clientY;
            }
            redrawRequired = false;
            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            pickList = this.wwd.pick(this.wwd.canvasCoordinates(x, y));
            switch (type) {
                case 'touchstart':
                case 'mousedown':
                    // Handles right AND left-clicks, and touch event
                    if (pickList.hasNonTerrainObjects()) {
                        // Establish the picked item - may be used by 
                        // mouse, select, and open actions
                        this.pickedItem = pickList.topPickedObject();
                        if (this.pickedItem) {
                            // Capture the initial mouse/touch points for comparison in mousemove/touchmove
                            // to detemine if whether to initiate dragging of the picked item.
                            this.startX = x;
                            this.startY = y;
                        }
                    } else {
                        this.pickedItem = null;
                    }
                    break;
                case 'touchmove':
                case 'mousemove':
                    if (this.pickedItem) {
                        // Handle left-clicks and touch device 
                        if (this.isMovable(this.pickedItem) && (button === 0 || type === 'touchmove')) {
                            // To prevent confustion with clicks and taps,
                            // start dragging only if the mouse or touch
                            // point has moved a few pixels.
                            if (!this.isDragging &&
                                (Math.abs(this.startX - x) > 2 || Math.abs(this.startY - y) > 2)) {
                                this.isDragging = true;
                                this.startMove(this.pickedItem);
                            }
                            // Perform the actual move of the picked object
                            if (this.isDragging) {
                                // Get the new terrain coords at the pick point
                                terrainObject = pickList.terrainObject();
                                if (terrainObject) {
                                    this.doMove(this.pickedItem, terrainObject);
                                }
                            }
                        }
                    }
                    break;
                case 'touchend':
                case 'touchcancel':
                case 'mouseup':
                case 'mouseout':
                    if (this.pickedItem) {
                        // The end of a touch can signal either the end of a 
                        // drag/move operation or a tap/double-tap.
                        // If our isDragging flag is set, then it's a given
                        // that the touch/mouse event signals a move finished.
                        if (this.isDragging) {
                            this.finishMove(this.pickedItem);
                            this.pickedItem = null;
                        } else if (type === 'touchend') {
                            // Determine if touch event is a single tap or a double tap:
                            // Capture the first tap, and if another tap doesn't come in 
                            // within the alloted time, then perform single tap action.
                            if (!this.tapped) {
                                // Wait for another tap, if if doesn't happen,
                                // then perform the select action
                                this.clickedItem = this.pickedItem;
                                this.tapped = setTimeout(function () {
                                    self.tapped = null;
                                    self.doSelect(self.clickedItem);
                                }, this.DOUBLE_TAP_INTERVAL);
                            } else {
                                // A double tap has occured. Clear the pending
                                // single tap action and perform the open action
                                clearTimeout(this.tapped);
                                this.tapped = null;
                                this.doOpen(this.pickedItem);
                            }
                            this.pickedItem = null;
                        }
                    }
                    this.isDragging = false;
                    break;
                case 'click':
                    // Remember the clicked item for dblclick processing
                    this.clickedItem = this.pickedItem;
                    if (this.clickedItem) {
                        this.doSelect(this.clickedItem);
                    }
                    // Release the picked item so mousemove doesn't act on it
                    this.pickedItem = null;
                    break;
                case 'dblclick':
                    if (this.clickedItem) {
                        this.doOpen(this.clickedItem);
                    }
                    // Release the picked item so mousemove doesn't act on it
                    this.pickedItem = null;
                    break;
                case 'contextmenu':
                    this.isDragging = false;
                    if (this.pickedItem) {
                        this.doContextSensitive(this.pickedItem);
                        // Release the picked item so mousemove doesn't act on it
                        this.pickedItem = null;
                    }
                    break;
            }
            // Prevent pan/drag operations on the globe when we're dragging an object.
            if (this.isDragging) {
                o.stopImmediatePropagation();   // Try and prevent WW PanRecognizer TouchEvent from processing event
                o.preventDefault();
            }
            // Update the window if we changed anything.
            if (redrawRequired) {
                this.wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
            }
        };

        SelectController.prototype.doContextSensitive = function (pickedItem) {
            if (pickedItem.userObject.showContextMenu) {
                pickedItem.userObject.showContextMenu();
            } else {
                // Otherwise, build a context menu from standard capabilities
//              $('#globeContextMenu-popup').puimenu('show');
            }
        };

        SelectController.prototype.isMovable = function (pickedItem) {
            return pickedItem.userObject.isMovable;
        };
        SelectController.prototype.startMove = function (pickedItem) {
            if (pickedItem.userObject.moveStarted) {
                // Fires EVENT_OBJECT_MOVE_STARTED
                pickedItem.userObject.moveStarted();
            }
        };
        SelectController.prototype.doMove = function (pickedItem, terrainObject) {
            if (pickedItem.userObject.moveToLatLon) {
                // Fires EVENT_OBJECT_MOVED
                pickedItem.userObject.moveToLatLon(
                    terrainObject.position.latitude,
                    terrainObject.position.longitude);
            }
// Uncomment to allow ordinary renderables to be moved.                        
//                            // Or, move the object (a Renderable) if it has a position object
//                            else if (this.pickedItem.userObject.position) {
//                                this.pickedItem.userObject.position =
//                                    new WorldWind.Position(
//                                        terrainObject.position.latitude,
//                                        terrainObject.position.longitude,
//                                        this.pickedItem.userObject.position.elevation);
//                                redrawRequired = true;
//                            }
        };

        SelectController.prototype.finishMove = function (pickedItem) {
            // Test for a "Movable" capability    
            if (pickedItem.userObject.moveFinished) {
                // Fires EVENT_OBJECT_MOVE_FINISHED
                pickedItem.userObject.moveFinished();
            }
        };

        SelectController.prototype.doSelect = function (pickedItem) {
            if (pickedItem.userObject.select) {
                pickedItem.userObject.select();
                }
        };

        SelectController.prototype.doOpen = function (pickedItem) {
            if (pickedItem.userObject.open) {
                pickedItem.userObject.open();
            }
        };

        return SelectController;
    }
);