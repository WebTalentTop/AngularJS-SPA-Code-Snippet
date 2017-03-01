(function (global) {
    'use strict';

    global.realineMessenger.factory('BusyIndicator', ['$log', function ($log) {
        var BusyIndicator = Class.extend({
            init: function () {
                this.__ClassName = 'BusyIndicator';
                this.requestCount = 0;
            },

            begin: function () {
                this.requestCount++;
            },

            end: function () {
                if (this.requestCount < 1) {
                    $log.debug('BusyIndicator: tried to decrease counter: ' + this.requestCount);
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

        return BusyIndicator;
    }]);
})(window);