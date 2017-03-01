(function (global) {
    'use strict';

    global.realineModule.filter('defaultValue', function () {
        //returns default value if input is null, undefined, empty string
        return function (input, defaultValue) {
            if (!input) {
                return defaultValue;
            }
            else {
                return input;
            }
        };
    });
})(window);