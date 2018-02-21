/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define([
    'text!libs/milsymbol/2525C warfighting.json',
    'text!libs/milsymbol/2525C signals-intelligence.json',
    'text!libs/milsymbol/2525C stability-operations.json',
    'text!libs/milsymbol/2525C emergency-managment.json',
    'knockout',
    'jquery',
    'jqueryui',
    'text'],
    function (
        warfighting2525c,
        signalsIntel2525c,
        stabilityOps2525c,
        emergencyMgmt2525c,
        ko,
        $) {
        "use strict";
        /**
         * @constructor
         * @param {String} viewFragment HTML
         * @returns {TacticalSymbolEditor}
         */
        function TacticalSymbolEditor(viewFragment) {
            var self = this,
                warfighting = JSON.parse(warfighting2525c),
                signals = JSON.parse(signalsIntel2525c),
                stability = JSON.parse(stabilityOps2525c),
                emergency = JSON.parse(emergencyMgmt2525c);

            // Load the view fragment into the DOM's body.
            // Wrap the view in a hidden div for use in a JQuery UI dialog.
            var $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            this.view = $view.children().first().get(0);

            // The symbol object to be edited 
            this.symbol = ko.observable({});

            // Symbol Coding 
            this.schemes = ko.observableArray([warfighting, signals, stability, emergency]);
            this.selectedScheme = ko.observable();

            this.dimensions = ko.observableArray([]);
            this.selectedDimension = ko.observable();

            this.functions = ko.observableArray([]);
            this.selectedFunction = ko.observable();

            this.modifiers1 = ko.observableArray([]);
            this.selectedModifier1 = ko.observable();

            this.modifiers2 = ko.observableArray([]);
            this.selectedModifier2 = ko.observable();

            this.status = [
                {value: "-", name: "-"},
                {value: "P", name: "P: Present"},
                {value: "C", name: "C: Present/Fully Capable"},
                {value: "F", name: "F: Present/Full To Capacity"},
                {value: "D", name: "D: Present/Damaged"},
                {value: "X", name: "X: Present/Destroyed"},
                {value: "A", name: "A: Anticipated/Planned"}
            ];
            this.selectedStatus = ko.observable();

            this.affiliations = [
                {value: "U", name: "U: Unknown"},
                {value: "F", name: "F: Friend"},
                {value: "N", name: "N: Neutral"},
                {value: "H", name: "H: Hostile"},
                {value: "P", name: "P: Pending"},
                {value: "A", name: "A: Assumed Friend"},
                {value: "S", name: "S: Suspect"},
                {value: "G", name: "G: Exercise Pending"},
                {value: "W", name: "W: Exercise Unknown"},
                {value: "D", name: "D: Exercise Friend"},
                {value: "L", name: "L: Exercise Neutral"},
                {value: "M", name: "M: Exercise Assumed Friend"},
                {value: "J", name: "J: Joker"},
                {value: "K", name: "K: Faker"},
                {value: "O", name: "O: None Specified"}
            ];
            this.selectedAffiliation = ko.observable();


            this.selectedScheme.subscribe(function (scheme) {
                self.dimensions.removeAll();
                for (var obj in scheme) {
                    if (scheme[obj].name) {
                        self.dimensions.push(scheme[obj]);
                    }
                }
            });

            this.selectedDimension.subscribe(function (dimension) {
                var functions, modifiers, obj;
                self.functions.removeAll();
                self.modifiers1.removeAll();
                self.modifiers2.removeAll();
                if (dimension) {
//                self.functions(newOption["main icon"]);
                    functions = dimension["main icon"];
                    for (obj in functions) {
                        self.functions.push(functions[obj]);
                    }

                    modifiers = dimension["modifier 1"];
                    for (obj in modifiers) {
                        self.modifiers1.push({value: obj, name: modifiers[obj].name});
                    }

                    modifiers = dimension["modifier 2"];
                    for (obj in modifiers) {
                        self.modifiers2.push({value: obj, name: modifiers[obj].name});
                    }
                }
            });

            this.onSave = function () {
                var icon = self.selectedFunction(),
                    codingScheme = icon ? icon["code scheme"] : "S",
                    stdIdentity = self.selectedAffiliation() ? self.selectedAffiliation().value : "U",
                    battleDim = icon ? icon["battle dimension"] : "Z",
                    operationalStatus = self.selectedStatus() ? self.selectedStatus().value : "-",
                    functionId = icon ? icon["code"] : "------",
                    modifier1 = self.selectedModifier1() ? self.selectedModifier1().value : "-",
                    modifier2 = self.selectedModifier2() ? self.selectedModifier1().value : "-",
                    symbolCode;

                symbolCode = codingScheme +
                    stdIdentity +
                    battleDim +
                    operationalStatus +
                    functionId +
                    modifier1 +
                    modifier2 ;

                console.log(symbolCode);
                self.symbol().symbolCode(symbolCode);
            };


            this.open = function (symbol) {
                console.log("Open Symbol: " + symbol.name());
                // Update observable(s)
                self.symbol(symbol);
                // Open the dialog
                var $symbolEditor = $(self.view);
                $symbolEditor.dialog({
                    autoOpen: false,
                    title: "Edit MIL-STD-25252C",
                    buttons: {
                        "Save": function () {
                            self.onSave();
                            $(this).dialog("close");
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });
                $symbolEditor.dialog("open");
            };
            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return TacticalSymbolEditor;
    }
);