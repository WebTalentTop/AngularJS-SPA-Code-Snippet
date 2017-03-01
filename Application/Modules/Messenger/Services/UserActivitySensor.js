(function (global) {
    'use strict';

    global.realineMessenger.factory('UserActivitySensor',
    ['EventManager', 'utils', '$document', '$',
        function (EventManager, utils, $document, $) {

            var events = "mousemove keydown wheel DOMMouseScroll mousewheel mousedown touchstart touchmove MSPointerDown MSPointerMove",
                USER_ACTIVITY_EVENT = 'user activity';

            var UserActivitySensor = Class.extend({
                init: function () {
                    this.eventManager = new EventManager();

                    this.sensorId = utils.common.newGuid();
                    this.element = $document;
                    this.events = $.trim((events + " ").split(" ").join("." + this.sensorId + ' '));
                    this.mouse = {
                        pageX: null,
                        pageY: null,
                    };

                    this.isMonitoring = false;
                },

                isEnabled: function () {
                    return this.isMonitoring;
                },

                start: function () {
                    if (!this.isMonitoring) {
                        this.element.on(this.events, this.handleEvent.bind(this));
                        this.isMonitoring = true;
                    }
                },

                stop: function () {
                    if (this.isMonitoring) {
                        this.element.off("." + this.sensorId);
                        this.isMonitoring = false;
                    }
                },

                handleEvent: function (e) {
                    /*
                    mousemove is kinda buggy, it can be triggered when it should be idle.
                    Typically is happening between 115 - 150 milliseconds after idle triggered.
                    @psyafter & @kaellis report "always triggered if using modal (jQuery ui, with overlay)"
                    @thorst has similar issues on ios7 "after $.scrollTop() on text area"
                    */
                    if (e.type === "mousemove") {
                        // if coord are same, it didn't move
                        if (e.pageX === this.mouse.pageX && e.pageY === this.mouse.pageY) {
                            return;
                        }
                        // if coord don't exist how could it move
                        if (typeof e.pageX === "undefined" && typeof e.pageY === "undefined") {
                            return;
                        }
                        //// under 200 ms is hard to do, and you would have to stop, as continuous activity will bypass this
                        //var elapsed = (+new Date()) - obj.olddate;
                        //if (elapsed < 200) {
                        //    return;
                        //}
                    }

                    this.fire();

                    // update mouse coord
                    this.mouse.pageX = e.pageX;
                    this.mouse.pageY = e.pageY;
                },

                bind: function (handler, thisArg) {
                    this.eventManager.bind(USER_ACTIVITY_EVENT, handler, thisArg);
                },

                unbind: function (handler, thisArg) {
                    this.eventManager.detach(USER_ACTIVITY_EVENT, handler, thisArg);
                },

                fire: function () {
                    var event = {
                        type: USER_ACTIVITY_EVENT,
                        sender: this
                    };

                    this.eventManager.fire(event);
                },

                reset: function () {
                    this.stop();
                }
            });

            return UserActivitySensor;
        }
    ]);

})(window);