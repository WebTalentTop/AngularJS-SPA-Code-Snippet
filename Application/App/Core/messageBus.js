(function (global) {
    'use strict';

    global.realineModule.factory('messageBus', ['EventManager', function (eventManager) {
        return new eventManager();
    }]);
})(window);