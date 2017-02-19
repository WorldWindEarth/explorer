/* 
 * Copyright (c) 2016, Bruce Schubert.
 * The MIT License.
 */
"use strict";
require.config({
    baseUrl: 'js/',
    paths: {
        'jquery': 'libs/jquery/jquery-2.1.3',
        'QUnit': 'libs/qunit/qunit-1.21.0',
        'worldwind': 'libs/webworldwind/worldwind'
    },
    shim: {
        'QUnit': {
            exports: 'QUnit',
            init: function () {
                QUnit.config.autoload = false;
                QUnit.config.autostart = false;
            }
        }
    }
});

// require the unit tests.
require([
    'QUnit',
    'tests/services/NdfdServiceTest',
    'tests/sun/SolarCalculatorTest'],
    function (QUnit, NdfdServiceTest, SolarCalculatorTest) {

        // Run the tests.
        SolarCalculatorTest.run();
        NdfdServiceTest.run();

        // Start QUnit.
        QUnit.load();
        QUnit.start();
    }
);



