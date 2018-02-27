/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WebGLRenderingContext, WorldWind */

define(['milsymbol', 'worldwind'],
    function (ms) {
        "use strict";

        /**
         * 
         * @param {WorldWind.Position} position
         * @param {String} symbolCode
         * @param {Object} symbolModifiers
         * @returns {SymbolPlacemark}
         */
        var SymbolPlacemark = function (position, symbolCode, symbolModifiers) {
            
            var normalAttributes = SymbolPlacemark.getPlacemarkAttributes(
                symbolCode, symbolModifiers, SymbolPlacemark.LOW_LEVEL_OF_DETAIL);
            WorldWind.Placemark.call(this, position, true, normalAttributes);

            this.symbolCode = symbolCode;
            this.symbolModifiers = symbolModifiers;
            this.lastLevelOfDetail = SymbolPlacemark.LOW_LEVEL_OF_DETAIL;
            
            this.altitudeMode = WorldWind.ABSOLUTE;
            this.eyeDistanceScalingThreshold = 4000000;

        };
        SymbolPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);

        /**
         * Copies the contents of a specified placemark to this placemark.
         * @param {SymbolPlacemark} that The placemark to copy.
         */
        SymbolPlacemark.prototype.copy = function (that) {

            // Delegate to the super function
            WorldWind.Placemark.prototype.copy.call(this, that);

            this.symbolCode = that.symbolCode;
            this.symbolModifiers = that.symbolModifiers;
            this.lastLevelOfDetail = that.levelOfDetail;

            return this;
        };

        /**
         * Creates a new placemark that is a copy of this placemark.
         * @returns {SymbolPlacemark} The new placemark.
         */
        SymbolPlacemark.prototype.clone = function () {
            var clone = new EnhancedPlacemark(this.position);

            clone.copy(this);
            clone.pickDelegate = this.pickDelegate || this;

            return clone;
        };

        /**
         * Render this TacticalSymbol.
         * @param {DrawContext} dc The current draw context.
         */
        SymbolPlacemark.prototype.render = function (dc) {
            this.selectLevelOfDetail(dc);
            WorldWind.Placemark.prototype.render.call(this, dc);
        };

        /**
         * Returns an attibutes bundle for the given symbol code and modifiers.
         * @param {String} symbolCode
         * @param {Object} symbolModifiers bundle
         * @param {Number} levelOfDetail
         * @returns {WorldWind.PlacemarkAttributes}
         */
        SymbolPlacemark.getPlacemarkAttributes = function (symbolCode, symbolModifiers, levelOfDetail) {
            var symbol,
                basicModifiers = {size: symbolModifiers.size},
                attributes,
                size,
                anchor;

            // TODO create cache and retrieve from cache

            switch (levelOfDetail) {
                case SymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL:
                    // Use the full version of the SIDC code and the given modifiers
                    symbol = new ms.Symbol(symbolCode, symbolModifiers);
                    break;
                case SymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL:
                    // Use the full version of the SIDC code but with only basic modifiers
                    symbol = new ms.Symbol(symbolCode, basicModifiers);
                    break;
                case SymbolPlacemark.LOW_LEVEL_OF_DETAIL:
                // fall through to default
                default:
                    // Use a simplified version of the SIDC code and basid modifiers
                    symbol = new ms.Symbol(symbolCode.slice(0, 3) + "*------*****", basicModifiers);
            }
            size = symbol.getSize();
            anchor = symbol.getAnchor();

            attributes = new WorldWind.PlacemarkAttributes(null);
            attributes.imageSource = new WorldWind.ImageSource(symbol.asCanvas());
            attributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, anchor.x, // x offset
                WorldWind.OFFSET_PIXELS, 0); // Anchor at bottom    
//                WorldWind.OFFSET_PIXELS, size.height - anchor.y); // y offset converted to lower-left origin       

            attributes.depthTest = false;
            attributes.imageScale = 1.0;
            attributes.imageColor = WorldWind.Color.WHITE;

            attributes.drawLeaderLine = false;
            attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
            attributes.leaderLineAttributes.outlineWidth = 2;

            return attributes;
        };


        /**
         * Sets the far distance threshold; camera distances greater than this value use the low level of detail, and
         * distances less than this value but greater than the near threshold use the medium level of detail.
         */
        SymbolPlacemark.FAR_THRESHOLD = 5000000;
        /**
         * The near distance threshold; camera distances greater than this value but less that the far threshold use
         * the medium level of detail, and distances less than this value use the high level of detail.
         */
        SymbolPlacemark.NEAR_THRESHOLD = 3000000;
        SymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL = 0;
        SymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL = 1;
        SymbolPlacemark.LOW_LEVEL_OF_DETAIL = 2;

        /**
         * Sets the active attributes for the current distance to the camera and highlighted state.
         *
         * @param {DrawContext} dc The current draw context.
         */
        SymbolPlacemark.prototype.selectLevelOfDetail = function (dc) {

            var highlightChanged = this.lastHighlightState !== this.highlighted;

            // Determine the normal attributes based on the distance from the camera to the placemark
            if (this.eyeDistance > SymbolPlacemark.FAR_THRESHOLD) {
                // Low-fidelity: use a simplified SIDC code (without status) and no modifiers
                if (this.lastLevelOfDetail !== SymbolPlacemark.LOW_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = SymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, SymbolPlacemark.LOW_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = SymbolPlacemark.LOW_LEVEL_OF_DETAIL;
                }
            } else if (this.eyeDistance > SymbolPlacemark.NEAR_THRESHOLD) {
                // Medium-fidelity: use the regulation SIDC code but without modifiers
                if (this.lastLevelOfDetail !== SymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = SymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, SymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = SymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL;
                }
            } else {
                // High-fidelity: use the regulation SIDC code and the modifiers
                if (this.lastLevelOfDetail !== SymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = SymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, SymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = SymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL;
                }
            }

            if (highlightChanged) {
                // Use a distinct set of attributes when highlighted, otherwise use the shared attributes
                if (this.highlighted) {
                    // Create a copy of the shared attributes bundle and increase the scale
                    var largeScale = this.attributes.imageScale * 1.2;
                    this.attributes = new WorldWind.PlacemarkAttributes(this.attributes);
                    this.attributes.imageScale = largeScale;
                }
            }
            this.lastHighlightState = this.highlighted;

        };
        return SymbolPlacemark;
    });