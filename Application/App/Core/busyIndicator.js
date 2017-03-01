(function (global) {
    'use strict';

    global.realineModule.factory('busyIndicator', ['$log', function ($log) {
        var busyIndicator = Class.extend({
            init: function () {
                this.__ClassName = 'busyIndicator';
                this.requestCount = 0;
            },

            begin: function () {
                this.requestCount++;
            },

            end: function () {
                if (this.requestCount < 1) {
                    $log.debug('busyIndicator: tried to decrease counter: ' + this.requestCount);
                    return;
                }

                this.requestCount--;
            },

            isBusy: function () {
                return this.requestCount > 0;
            },

            reset: function () {
                this.requestCount = 0;
            }
        });

        return busyIndicator;
    }]);
})(window);