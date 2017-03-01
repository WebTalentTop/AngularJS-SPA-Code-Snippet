(function (global) {
    'use strict';

    global.realineModule.factory('HubBase', ['EventManager', function (EventManager) {

        var HubBase = Class.extend({
            init: function (hub) {
                this.eventManager = new EventManager();

                this.hub = hub;

                this.bindHubEvents();
            },

            bindHubEvents: function () {

            },
        });

        return HubBase;
    }]);

})(window);