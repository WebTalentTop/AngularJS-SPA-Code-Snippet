(function (global) {
    'use strict';

    global.realineModule.factory('ObservableObject', ['EventManager',
    function (EventManager) {

        var PROPERTY_CHANGED = 'property changed';
        var PROPERTY_CHANGING = 'property changing';

        var ObservableObject = Class.extend({

            init: function () {
                this.eventManager = new EventManager();
            },

            firePropertyChanging: function (name, params) {
                /*
                * @function 
                * @name firePropertyChanging fired just before value will be set to property
                * so subscriber will be able to cancel setting new value
                * or allow only silient setting of newValue
                * @param name {string} property name
                * @params {object} {oldValue, newValue, cancel, silient}
                * - oldValue - old value of property
                * - newValue - new value of property (going to be set)
                * - cancel {bool} OUT - if true then value will not be set and property_changed event will not be fired
                * - silent {bool} OUT - if true then value will be set but property_changed event will not be fired
                */

                var event = {
                    type: PROPERTY_CHANGING,
                    target: this,
                    property: name,
                    cancel: params.cancel,
                    silent: params.silent,
                    oldValue: params.oldValue,
                    newValue: params.newValue
                };

                this.eventManager.fire(event);

                params.cancel = event.cancel;
                params.silent = event.silent;
            },

            bindPropertyChanging: function (handler, context) {
                /*
                * @function
                * @name bindPropertyChanging
                * @param handler {function} function (event{target, type, property}){}
                *   target - event initiator (sender)
                *   type - event type (always 'property changed')
                *   property - name of property
                * @param context {object} will be 'this' in handler
                */
                this.eventManager.bind(PROPERTY_CHANGING, handler, context);
            },

            unbindPropertyChanging: function (handler, context) {
                /*
               * @function
               * @name unbindPropertyChanging
               * @param handler {function} function (event{target, type, property}){}        
               */
                this.eventManager.detach(PROPERTY_CHANGING, handler, context);

            },
            
            firePropertyChanged: function (name, oldValue, newValue) {
                /*
                * @function 
                * @name bindPropertyChanged
                * @param name {string} property name
                * @param oldValue - old value of property
                * @param newValue - newValue of property
                */
                this.eventManager.fire({
                    type: PROPERTY_CHANGED,
                    target: this,
                    property: name,
                    oldValue: oldValue,
                    newValue: newValue
                });
            },

            bindPropertyChanged: function (handler, context) {
                /*
                * @function
                * @name bindPropertyChanged
                * @param handler {function} function (event{target, type, property}){}
                *   target - event initiator (sender)
                *   type - event type (always 'property changed')
                *   property - name of property
                * @param context {object} will be 'this' in handler
                */

                this.eventManager.bind(PROPERTY_CHANGED, handler, context);
            },
            
            unbindPropertyChanged: function (handler, context) {
                /*
                * @function
                * @name unsubscribePropertyChanged
                * @param handler {function} function (event{target, type, property}){}        
                */

                this.eventManager.detach(PROPERTY_CHANGED, handler, context);
            }
        });

        return ObservableObject;
    }]);
})(window);