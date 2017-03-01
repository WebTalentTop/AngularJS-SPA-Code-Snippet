(function (global) {
    'use strict';

    global.realineModule.factory('$', [function () {
        return global.jQuery.noConflict();
    }]);

    global.realineModule.factory('_', [function () {
        return global._;
    }]);

    global.realineModule.factory('momentObj', [function () {
        return {
            moment: global.moment
        };
    }]);

})(window);