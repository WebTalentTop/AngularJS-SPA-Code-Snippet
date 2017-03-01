(function (global) {
    'use strict';

    global.Realine = global.Realine || {};

    global.realineModule = global.angular.module('realine', [
        'ngRoute',
        'ngAnimate',
        'ngCookies',
        //'ui.bootstrap.modal',
        //'ui.bootstrap.typeahead',
        //'ui.bootstrap.bindHtml',
        //'ui.bootstrap.typeahead',
        //'ui.bootstrap.collapse',
        //'ngFileUpload',
        'ngSanitize',
        //'ui.select',
        'pasvaz.bindonce',
        'cgBusy',
        'ngStorage',
        'angular-cross-storage',
        'realine-config'
    ]);

    global.realineModule.factory('configurator', function () {
        return global.Realine && global.Realine.configurator || {};
    });

    global.realineModule.factory('containers', function () {
        return global.Realine && global.Realine.containers || {};
    });

    global.app.extendAppModules(['realine']);

    global.realineModule.factory('extendApplier', function () {
        return global.Realine && global.Realine.extendApplier || {};
    });
})(window);
