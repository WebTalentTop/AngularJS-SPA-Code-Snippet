(function (global) {
    'use strict';

    global.realineModule.filter('manufactureYearsFilter', function () {
        return function (input, start, step) {
            if (start === 0) {
                start = new Date().getFullYear();
            } else {
                start = parseInt(start);
            }

            for (var i = start; i >= start + step; --i) {
                input.push(i);
            }
            return input;
        };
    });
})(window);