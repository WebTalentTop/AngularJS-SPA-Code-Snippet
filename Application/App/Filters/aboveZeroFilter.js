(function (global) {
    'use strict';
    global.realineModule.filter('aboveZeroFilter', function () {
        return function (text) {
            return text > 0 ? '+' + text : text;
        };
    });
})(window);