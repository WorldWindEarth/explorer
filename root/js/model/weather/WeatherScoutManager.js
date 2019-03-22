/*
 * The MIT License
 * Copyright (c) 2016 Bruce Schubert.
 */


/*global define*/

define([
    'model/weather/WeatherScout',
    'model/Constants',
    'model/util/Log',
    'knockout',
    'worldwind'],
    function (
        WeatherScout,
        constants,
        log,
        ko) {
        "use strict";
        /**
         * Constructs a WeatherScoutManager that manages a collection of 
         * WeatherScouts.
         * @param {Globe} globe
         * @param {WorldWind.Layer} layer
         * @returns {WeatherScoutManager}
         */
        var WeatherScoutManager = function (globe, layer) {
            var self = this;
            this.globe = globe;
            this.layer = layer || globe.findLayer(constants.LAYER_NAME_WEATHER);
            if (!this.layer) {
                log.error("WeatherScoutManager", "constructor", "missingLayer");
            }           
            this.scouts = ko.observableArray();
            this.scoutCount = ko.observable(0);
            this.selectedScout = null;

            // Subscribe to "arrayChange" events in the scouts array.
            // Here is where we add/remove scouts from WW layer.
            this.scouts.subscribe(function (changes) {
                // See: http://blog.stevensanderson.com/2013/10/08/knockout-3-0-release-candidate-available/
                changes.forEach(function (change) {
                    if (change.status === 'added' && change.moved === undefined) {
                        // Ensure the name is unique by appending a suffix if reqd.
                        // (but not if the array reordered -- i.e., moved items)
                        self.doEnsureUniqueName(change.value);
                        self.doAddScoutToLayer(change.value);
                    } else if (change.status === 'deleted' && change.moved === undefined) {
                        // When a scout is removed we must remove the renderable,
                        // (but not if the array reordered -- i.e., moved items)
                        self.doRemoveScoutFromLayer(change.value);
                    }
                });
                self.scoutCount(self.scouts().length);
            }, null, "arrayChange");

            /**
             * Adds the given scout to to the manager.
             * @param {WeatherScout} scout
             */
            this.addScout = function (scout) {
                // The array event handler will ensure name uniqueness and add to a layer
                self.scouts.push(scout);
            };

            /**
             * Centers the globe other the given scout.
             * @param {WeatherScout} scout
             */
            this.gotoScout = function (scout) {
                self.globe.goto(scout.latitude(), scout.longitude());
            };

            /**
             * Finds the weather scout with the given id.
             * @param {String} id System assigned id for the scout.
             * @returns {WeatherScout} The scout object if found, else null.
             */
            this.findScout = function (id) {
                var scout, i, len;

                for (i = 0, len = self.scouts().length; i < len; i += 1) {
                    scout = self.scouts()[i];
                    if (scout.id === id) {
                        return scout;
                    }
                }
                return null;
            };

            /**
             * Removes the given scout from the manager.
             * @param {WeatherScout} scout
             */
            this.removeScout = function (scout) {
                self.scouts.remove(scout);
            };

            /**
             * Invokes refresh on all the scouts managed by this manager.
             */
            this.refreshScouts = function () {
                var i, max;

                for (i = 0, max = self.scouts().length; i < max; i++) {
                    self.scouts()[i].refresh();
                }
            };
            
            // Internal method to ensure the name is unique by appending a suffix if reqd.
            this.doEnsureUniqueName = function (scout) {
                scout.name(self.generateUniqueName(scout));
            };

            // Internal method to add the scout to the layer.
            this.doAddScoutToLayer = function (scout) {
                self.layer.addRenderable(scout.renderable);
            };

            // Internal method to remove the scout's renderable from its layer.
            this.doRemoveScoutFromLayer = function (scout) {
                var i, max, renderable = scout.renderable;
                // Remove the renderable from the renderable layer
                for (i = 0, max = self.layer.renderables.length; i < max; i++) {
                    if (self.layer.renderables[i] === renderable) {
                        self.layer.renderables.splice(i, 1);
                        break;
                    }
                }
            };


            /**
             * Saves the weather scouts collection to local storage.
             */
            this.saveScouts = function () {
                var validScouts = [],
                    scoutsString,
                    i, len, scout;

                // Knockout's toJSON cannot process a WeatherScout object...
                // it appears to recurse and a call stack limit is reached.
                // So we create a simplfied the object here to pass to toJSON.
                for (i = 0, len = self.scouts().length; i < len; i++) {
                    scout = self.scouts()[i];
                    if (!scout.invalid) {
                        validScouts.push({
                            id: scout.id,
                            name: scout.name,
                            latitude: scout.latitude,
                            longitude: scout.longitude,
                            isMovable: scout.isMovable
                        });
                    }
                }
                scoutsString = ko.toJSON(validScouts, ['id', 'name', 'latitude', 'longitude', 'isMovable']);
                localStorage.setItem(constants.STORAGE_KEY_WEATHER_SCOUTS, scoutsString);
            };

            /**
             * Restores the weather scouts collection from local storage.
             */
            self.restoreScouts = function () {
                var string = localStorage.getItem(constants.STORAGE_KEY_WEATHER_SCOUTS),
                    array, i, max,
                    position, params;
                if (!string || string === 'null') {
                    return;
                }
                // Convert JSON array to array of WeatherScout objects
                array = JSON.parse(string);
                for (i = 0, max = array.length; i < max; i++) {
                    position = new WorldWind.Position(array[i].latitude, array[i].longitude, 0);
                    params = {id: array[i].id, name: array[i].name, isMovable: array[i].isMovable};
                    self.addScout(new WeatherScout(self, position, params));
                }
            };

            /**
             * Generates a unique name by appending a suffix '(n)'.
             * @param {WeatherScout} scout
             * @returns {String}
             */
            this.generateUniqueName = function (scout) {
                var uniqueName = scout.name().trim(),
                    otherScout,
                    isUnique,
                    suffixes,
                    seqNos,
                    n, i, len;

                // Loop while name not unique
                do {
                    // Assume uniqueness, set to false if we find a matching name
                    isUnique = true;

                    // Test the name for uniqueness with the other scouts
                    for (i = 0, len = self.scouts().length; i < len; i += 1) {
                        otherScout = self.scouts()[i];
                        if (otherScout === scout) {
                            continue; // Don't test with self
                        }
                        if (otherScout.name() === uniqueName) {
                            isUnique = false;

                            // check for existing suffix '(n)' and increment
                            suffixes = uniqueName.match(/[(]\d+[)]$/);
                            if (suffixes) {
                                // increment an existing suffix's sequence number
                                seqNos = suffixes[0].match(/\d+/);
                                n = parseInt(seqNos[0], 10) + 1;
                                uniqueName = uniqueName.replace(/[(]\d+[)]$/, '(' + n + ')');
                            } else {
                                // else if no suffix, create one
                                uniqueName += ' (2)';   // The first duplicate is #2
                            }
                            // Break out of the for loop and recheck uniqueness
                            break;
                        }
                    }
                } while (!isUnique);

                return uniqueName;
            };

        };
        return WeatherScoutManager;
    }
);

