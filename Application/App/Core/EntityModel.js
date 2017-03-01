(function (global) {
    'use strict';

    global.realineModule.factory('EntityModel', ['ObservableObject',
        function (ObservableObject) {

            var PROPERTY_CHANGED_EVENT = 'property changed';

            var EntityModel = ObservableObject.extend({

                init: function (data) {
                    this._super();

                    this.__ClassName = 'EntityModel';

                    if (!data) {
                        data = {};
                    }

                    this.data = {};

                    global.angular.extend(this.data, data);
                },

                getId: function () {
                    return this.data.Id;
                },

                setId: function (value) {
                    this.set('Id', value);
                },

                // Setter
                set: function (name, value, silent) {

                    var oldValue = this.get(name);
                    var changingEvent;

                    if (!compareValues(value, oldValue)) {

                        changingEvent = {
                            oldValue: oldValue,
                            newValue: value,
                            cancel: false,
                            silent: false
                        };

                        this.firePropertyChanging(name, changingEvent);

                        if (changingEvent.cancel) {
                            return;
                        }

                        this.data[name] = value;

                        if (silent || changingEvent.silent) {
                            return this; // do not fire events
                        }

                        this.firePropertyChanged(name, oldValue, value);
                    }
                },

                // Getter
                get: function (arg) {
                    // Full model getter
                    if (arg === undefined) {
                        return this.data;
                    }
                    // Attribute getter
                    if (typeof arg === 'string') {
                        return this.data[arg];
                    }
                    throw 'Unknown argument for getter.';
                },
            });


            function compareValues(v1, v2) {
                /*
                * @func compareValues
                * was writen because different date objects are not equal even if they represent same date
                */

                if (typeof v1 !== typeof v2) {
                    return false;
                }

                if (v1 instanceof Date && v2 instanceof Date) {
                    return v1.valueOf() === v2.valueOf();
                }
                else {
                    return v1 === v2;
                }
            }

            return EntityModel;
        }
    ]);
})(window);