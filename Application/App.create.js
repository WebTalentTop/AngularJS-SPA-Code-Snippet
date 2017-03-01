(function (global) {
    'use strict';

    global.app = global.angular.module('app', ['realine', 'pasvaz.bindonce']);

    global.app.extendAppModules = function (requireModules) {
        if (!(requireModules instanceof Array)) {
            return;
        }

        for (var i = 0; i < requireModules.length; ++i) {
            this.requires.push(requireModules[i]);
        }
    };
})(window);
