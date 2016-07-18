/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */


define([
    'model/util/Log',
    'model/Explorer',
    'worldwind'],
    function (
        Log,
        explorer,
        ww) {
        "use strict";
        var EnhancedLookAtNavigator = function (worldWindow) {
            // Using Classic Inheriticance Pattern #3 - Rent and Set Prototype. See JavaScript Patterns
            WorldWind.LookAtNavigator.call(this, worldWindow);

            this.wwd = worldWindow;

            this.lastEyePosition = new WorldWind.Position();
            // Use the parent object's 'safe' settings for our initial 'last' settings
            this.lastLookAtLocation = new WorldWind.Location(this.lookAtLocation.latitude, this.lookAtLocation.longitude);
            this.lastRange = this.range;
            this.lastHeading = this.heading;
            this.lastTilt = this.tilt;
            this.lastRoll = this.roll;

// Prototyping method to keep crosshairs navigator centered on target during rotate and tilt...  
//            // Unregister the parent's tilt event handler and register our customized handler
//            var self = this;
//            this.tiltRecognizer.addGestureListener(function (recognizer) {
//                self.handleTilt(recognizer);
//            });
//

        };
        EnhancedLookAtNavigator.prototype = Object.create(WorldWind.LookAtNavigator.prototype);

        /**
         * Returns the intercept position of a ray from the eye to the lookAtLocation.
         * @returns {Position) The current terrain intercept position
         */
        EnhancedLookAtNavigator.prototype.terrainInterceptPosition = function () {
            var wwd = this.wwd,
                centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2),
                terrainObject = wwd.pickTerrain(centerPoint).terrainObject();

            if (terrainObject) {
                return terrainObject.position;
            }
        };


// Prototyping method to keep crosshairs navigator centered on target during rotate and tilt...  
//        /**
//         * Handles tilt requests
//         * @param {type} recognizer
//         */
//        EnhancedLookAtNavigator.prototype.handleTilt = function (recognizer) {
//            var state = recognizer.state,
//                translation = recognizer.translation,
//                viewport = this.worldWindow.viewport,
//                pixels,
//                degrees,
//                terrainIntercept,
//                intermediateNavState = this.intermediateState(),
//                navigatorState,
//                wwd = this.wwd,
//                centerPoint = new Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2),
//                ray,
//                point = new Vec3(0, 0, 0),
//                targetPoint = new Vec3(0, 0, 0),
//                cartesionPoint = new Vec3(0, 0, 0),
//                screenPoint = new Vec3(0, 0, 0),
//                windowPoint = new Vec2(0, 0),
//                position = new Position();
//
//
//            if (state === WorldWind.BEGAN) {
//                this.beginTilt = this.tilt;
//            } else if (state === WorldWind.CHANGED) {
//                // Compute the current translation in screen coordinates
//                pixels = -translation[1];
//
//                // Convert the translation from screen coordinates to degrees. Use the viewport dimensions as a metric
//                // for converting the gesture translation to a fraction of an angle
//                degrees = 90 * pixels / viewport.height;
//
//                // Apply the change in heading and tilt to this navigator's corresponding properties.
//                this.tilt = this.beginTilt + degrees;
//
//                // Capture the current position that we're looking at. 
//                terrainIntercept = this.terrainInterceptPosition();
//
//                // Apply the new tilt value and get the new state
//                navigatorState = this.currentState();
//
//                // Recompute the lookAtLocation using the new navigator state 
//                // using the ray passing thru the last terrain intercept
//                if (terrainIntercept) {
//                    wwd.globe.computePointFromPosition(
//                        terrainIntercept.latitude,
//                        terrainIntercept.longitude,
//                        terrainIntercept.altitude,
//                        cartesionPoint);
//
//                    navigatorState.project(cartesionPoint, screenPoint);
//                    navigatorState.convertPointToWindow(screenPoint, windowPoint);
//
//                    ray = navigatorState.rayFromScreenPoint(windowPoint);
//                    if (wwd.globe.intersectsLine(ray, point)) {
//                        if (wwd.globe.computePositionFromPoint(point[0], point[1], point[2], position)) {
//                            this.lookAtLocation.latitude = position.latitude;
//                            this.lookAtLocation.longitude = position.longitude;
//                        }
//                    }
//                }
//            }
//        };
//
        /**
         * Limit the navigator's position and orientation appropriately for the current scene.
         */
        EnhancedLookAtNavigator.prototype.applyLimits = function () {

            if (isNaN(this.lookAtLocation.latitude) || isNaN(this.lookAtLocation.longitude)) {
                Log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid lat/lon: NaN");
                this.lookAtLocation.latitude = this.lastLookAtLocation.latitude;
                this.lookAtLocation.longitude = this.lastLookAtLocation.longitude;
            }
            if (isNaN(this.range)) {
                Log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid range: NaN");
                this.range = this.lastRange;
            }
            if (isNaN(this.heading)) {
                Log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid heading: NaN");
                this.heading = this.lastHeading;
            }
            if (isNaN(this.tilt)) {
                Log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid tilt: NaN");
                this.tilt = this.lastTilt;
            }

            if (!this.validateEyePosition()) {
                // Eye position is invalid, so restore the last navigator settings
                this.lookAtLocation.latitude = this.lastLookAtLocation.latitude;
                this.lookAtLocation.longitude = this.lastLookAtLocation.longitude;
                this.range = this.lastRange;
                this.heading = this.lastHeading;
                this.tilt = this.lastTilt;
                this.roll = this.lastRoll;
            }
            // Clamp latitude to between -90 and +90, and normalize longitude to between -180 and +180.
            this.lookAtLocation.latitude = WorldWind.WWMath.clamp(this.lookAtLocation.latitude, -90, 90);
            this.lookAtLocation.longitude = WorldWind.Angle.normalizedDegreesLongitude(this.lookAtLocation.longitude);

            // Clamp range to values greater than 1 in order to prevent degenerating to a first-person navigator when
            // range is zero.
            this.range = WorldWind.WWMath.clamp(this.range, 1, explorer.NAVIGATOR_MAX_RANGE);

            // Normalize heading to between -180 and +180.
            this.heading = WorldWind.Angle.normalizedDegrees(this.heading);

            // Clamp tilt to between 0 and +90 to prevent the viewer from going upside down.
            this.tilt = WorldWind.WWMath.clamp(this.tilt, 0, 90);

            // Normalize heading to between -180 and +180.
            this.roll = WorldWind.Angle.normalizedDegrees(this.roll);

            // Apply 2D limits when the globe is 2D.
            if (this.worldWindow.globe.is2D() && this.enable2DLimits) {
                // Clamp range to prevent more than 360 degrees of visible longitude.
                var nearDist = this.nearDistance,
                    nearWidth = WorldWind.WWMath.perspectiveFrustumRectangle(this.worldWindow.viewport, nearDist).width,
                    maxRange = 2 * Math.PI * this.worldWindow.globe.equatorialRadius * (nearDist / nearWidth);
                this.range = WorldWind.WWMath.clamp(this.range, 1, maxRange);

                // Force tilt to 0 when in 2D mode to keep the viewer looking straight down.
                this.tilt = 0;
            }
            // Cache the nav settings 
            this.lastLookAtLocation.latitude = this.lookAtLocation.latitude;
            this.lastLookAtLocation.longitude = this.lookAtLocation.longitude;
            this.lastRange = this.range;
            this.lastHeading = this.heading;
            this.lastTilt = this.tilt;
            this.lastRoll = this.roll;

        };
        /**
         * Validate the eye position is not below the terrain.
         * @returns {Boolean}
         */
        EnhancedLookAtNavigator.prototype.validateEyePosition = function () {
            var wwd = this.wwd,
                navigatorState = this.intermediateState(),
                eyePoint = navigatorState.eyePoint,
                eyePos = new WorldWind.Position(),
                terrainElev;

            // Get the eye position in geographic coords
            wwd.globe.computePositionFromPoint(eyePoint[0], eyePoint[1], eyePoint[2], eyePos);
            if (!eyePos.equals(this.lastEyePosition)) {
                // Validate the new eye position to ensure it doesn't go below the terrain surface
                terrainElev = wwd.globe.elevationAtLocation(eyePos.latitude, eyePos.longitude);
                if (eyePos.altitude < terrainElev) {
                    //Log.error("EnhancedLookAtNavigator", "validateEyePosition", "eyePos (" + eyePos.altitude + ") is below ground level (" + terrainElev + ").");
                    return false;
                }
            }
            this.lastEyePosition.copy(eyePos);
            return true;
        };


        /**
         * Returns a new NavigatorState without calling applyLimits(). 
         * See also LookAtNavigator.currentState().
         * @returns {NavigatorState}
         */
        EnhancedLookAtNavigator.prototype.intermediateState = function () {
            // this.applyLimits(); -- Don't do this!!
            var globe = this.worldWindow.globe,
                lookAtPosition = new WorldWind.Position(
                    this.lookAtLocation.latitude,
                    this.lookAtLocation.longitude,
                    0),
                modelview = WorldWind.Matrix.fromIdentity();

            modelview.multiplyByLookAtModelview(lookAtPosition, this.range, this.heading, this.tilt, this.roll, globe);

            return this.currentStateForModelview(modelview);
        };

        return EnhancedLookAtNavigator;
    }
);

