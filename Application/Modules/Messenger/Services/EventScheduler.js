(function (global) {
    'use strict';

    global.realineMessenger.factory('EventScheduler', [
        '$timeout', '$interval', function ($timeout, $interval) {

            var EventScheduler = Class.extend({

                init: function (callbackFunc, eventInterval) {
                    this.interval = null;
                    this.stopTimer = null;
                    this.callbackFunc = callbackFunc;
                    this.eventInterval = eventInterval;
                },

                start: function () {
                    if (!this.interval) {
                        this.callbackFunc();
                        this.interval = $interval(this.callbackFunc, this.eventInterval);
                    }

                    if (this.stopTimer) {
                        $timeout.cancel(this.stopTimer);
                        this.stopTimer = null;
                    }

                    this.stopTimer = $timeout(this.stop.bind(this), this.eventInterval);
                },

                stop: function () {
                    if (this.interval) {
                        $interval.cancel(this.interval);
                        this.interval = null;
                    }

                    if (this.stopTimer) {
                        $timeout.cancel(this.stopTimer);
                        this.stopTimer = null;
                    }
                }
            });

            return EventScheduler;
        }
    ]);
})(window);