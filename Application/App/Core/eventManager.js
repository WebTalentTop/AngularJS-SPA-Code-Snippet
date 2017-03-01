(function (global) {
    'use strict';

    global.realineModule.factory('EventManager', ['$log', function ($log) {
        var undefined;

        var EventManager = Class.extend({
            init: function () {
                this._listeners = {};
            },

            /*
            * @function 
            * @name addListener
            * @param type {string} property name
            * @param listener {function} function (event{target, type, property}){}
            * @param context (object) context will be 'this' in handler
            */
            bind: function (type, listener, context) {
                if (this._listeners[type] === undefined) {
                    this._listeners[type] = [];
                }

                this._listeners[type].push({ handler: listener, context: context });
            },

            bindOnce: function (type, listener, context) {
                if (this._listeners[type] === undefined) {
                    this._listeners[type] = [];
                }

                this._listeners[type].push({
                    handler: function (ctx, i) {
                        return function(event) {
                            listener.call(context, event);
                            if (ctx._listeners[type] instanceof Array) {
                                ctx._listeners[type].splice(i, 1);
                            }
                        };
                    }(this, this._listeners[type].length),
                    context: context
                });
            },

            /*
            * @function
            * @name fire
            * @param event event{target, type, property} 
            * @returns {boolean} - true if has listeners
            */
            fire: function (event) {
                if (typeof event == "string") {
                    event = { type: event };
                }

                if (!event.type) {
                    throw new Error("Event object missing 'type' property.");
                }

                if (this._listeners[event.type] instanceof Array) {
                    var listeners = this._listeners[event.type];

                    if (listeners.length === 0) {
                        return false;
                    }

                    for (var i = 0; i < listeners.length; i++) {
                        //try {
                            listeners[i].handler.call(listeners[i].context, event);
                        //}
                        //catch (e) {
                        //    Error.exception(e); //it hides real exception stack
                        //}
                    }

                    return true;
                }

                return false;
            },

            /*
            * @function 
            * @name removeListener
            * @param type {string} property name
            * @param listener {function} function (event{target, type, property}){}
            */
            detach: function (type, listener, context) {

                //temporary for debugging purposes
                if (context === undefined) {
                    $log.debug(new Error('EventManager.detach: context is not specified. Memory leak is possible.').stack);
                }

                if (this._listeners[type] instanceof Array) {
                    var listeners = this._listeners[type];
                    if (listener === undefined) {
                        this._listeners[type] = [];
                    } else {
                        for (var i = 0; i < listeners.length; i++) {
                            if (listeners[i].handler === listener
                                && listeners[i].context === context) {
                                listeners.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            },

            hasListeners: function (type) {
                if (this._listeners[type] instanceof Array) {
                    return this._listeners[type].length > 0;
                } else {
                    return false;
                }
            }
        });

        return EventManager;
    }]);
})(window);