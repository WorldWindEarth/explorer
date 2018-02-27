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

            // Operational status name/value pairs for dropdown lists
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

            // Standard identity name/value pairs for dropdown lists
            this.affiliations = [
                {value: "U", name: "U: Unknown"},
                {value: "F", name: "F: Friend"},
                {value: "N", name: "N: Neutral"},
                {value: "H", name: "H: Hostile"},
                {value: "P", name: "P: Pending"},
                {value: "J", name: "J: Joker"},
                {value: "K", name: "K: Faker"},
                {value: "S", name: "S: Suspect"},
                {value: "A", name: "A: Assumed Friend"},
                {value: "G", name: "G: Exercise Pending"},
                {value: "W", name: "W: Exercise Unknown"},
                {value: "D", name: "D: Exercise Friend"},
                {value: "L", name: "L: Exercise Neutral"},
                {value: "M", name: "M: Exercise Assumed Friend"},
                {value: "O", name: "O: None Specified"}
            ];
            this.selectedAffiliation = ko.observable();

            // Symbology scheme objects for dropdown lists 
            this.schemes = ko.observableArray([
                {value: "S", name: "S: " + warfighting.name, code: "WAR", symbols: warfighting},
                {value: "I", name: "I: " + signals.name, code: "SIGINT", symbols: signals},
                {value: "O", name: "O: " + stability.name, code: "STBOPS", symbols: stability},
                {value: "E", name: "E: " + emergency.name, code: "EMS", symbols: emergency}]);
            this.selectedScheme = ko.observable();

            this.dimensions = ko.observableArray([]);
            this.selectedDimension = ko.observable();

            this.functions = ko.observableArray([]);
            this.selectedFunction = ko.observable();

            this.modifiers1 = ko.observableArray([]);
            this.selectedModifier1 = ko.observable();

            this.modifiers2 = ko.observableArray([]);
            this.selectedModifier2 = ko.observable();


            this.selectedScheme.subscribe(function (scheme) {
                self.dimensions.removeAll();
                for (var obj in scheme.symbols) {
                    if (scheme.symbols[obj].name) {
                        self.dimensions.push({
                            name: scheme.symbols[obj].name,
                            functions: scheme.symbols[obj]["main icon"],
                            modifiers1: scheme.symbols[obj]["modifier 1"],
                            modifiers2: scheme.symbols[obj]["modifier 2"]});
                    }
                }
            });

            this.selectedDimension.subscribe(function (dimension) {
                var functions, obj, item, lastItemIdx;
                self.functions.removeAll();
                self.modifiers1.removeAll();
                self.modifiers2.removeAll();
                if (dimension) {
                    functions = dimension.functions;
                    for (obj in functions) {
                        item = functions[obj];
                        lastItemIdx = item.name.length - 1;
                        self.functions.push({
                            // Replace preceeding elements in the name hierarchy wih en dashes  
                            name: "\u2013 ".repeat(lastItemIdx) + item.name[lastItemIdx],
                            function: functions[obj]});
                    }
                    // Extract the modifiers for this dimension
                    for (obj in dimension.modifiers1) {
                        self.modifiers1.push({
                            value: obj, 
                            name: dimension.modifiers1[obj].name
                        });
                    }
                    for (obj in dimension.modifiers2) {
                        self.modifiers2.push({
                            value: obj, 
                            name: dimension.modifiers2[obj].name
                        });
                    }
                }
            });

            this.symbol.subscribe(function (newSymbol) {
                var symbolCode = newSymbol.symbolCode(),
                    codingScheme = symbolCode.substring(0, 1),
                    stdIdentity = symbolCode.substring(1, 2),
                    battleDim = symbolCode.substring(2, 3),
                    operationalStatus = symbolCode.substring(3, 4),
                    functionId = symbolCode.substring(4, 10),
                    scheme, affiliation, opStatus, icon, dimension;

                scheme = self.schemes().find(function (element) {
                    return element.value === codingScheme;
                });
                self.selectedScheme(scheme);

                dimension = self.dimensions().find(function (element) {
                    return element.functions.find(function (iconElement) {
                        return iconElement["battle dimension"] === battleDim
                            && iconElement["code"] === functionId;
                    });
                });
                self.selectedDimension(dimension);

                if (self.selectedDimension()) {
                    // The 'functions' obserable array contains the name/function pairs
                    // for the selected dimension
                    icon = self.functions().find(function (element) {
                        return element.function.code === functionId;
                    });
                    self.selectedFunction(icon);
                }

                affiliation = self.affiliations.find(function (element) {
                    return element.value === stdIdentity;
                });
                self.selectedAffiliation(affiliation);

                opStatus = self.status.find(function (element) {
                    return element.value === operationalStatus;
                });
                self.selectedStatus(opStatus);


            });

            this.onSave = function () {
                var icon = self.selectedFunction() ? self.selectedFunction().function : null,
                    codingScheme = self.selectedScheme() ? self.selectedScheme().value : "S",
                    stdIdentity = self.selectedAffiliation() ? self.selectedAffiliation().value : "U",
                    operationalStatus = self.selectedStatus() ? self.selectedStatus().value : "-",
                    battleDim = icon ? icon["battle dimension"] : "Z",
                    functionId = icon ? icon["code"] : "------",
                    modifier1 = self.selectedModifier1() ? self.selectedModifier1().value : "-",
                    modifier2 = self.selectedModifier2() ? self.selectedModifier1().value : "-",
                    symbolCode;

                symbolCode = 
                    codingScheme +
                    stdIdentity +
                    battleDim +
                    operationalStatus +
                    functionId +
                    modifier1 +
                    modifier2;

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
                    title: "Edit Tactical Symbol",
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