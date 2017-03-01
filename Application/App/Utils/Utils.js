(function (global) {
    'use strict';

    global.realineModule.factory('utils', function () {
        return {
            onlyNumbers: /^[0-9]+$/,

            getAsUriParameters: function (data) {
                var url = '';
                for (var prop in data) {
                    url += encodeURIComponent(prop) + '=' +
                        encodeURIComponent(data[prop]) + '&';
                }
                return url.substring(0, url.length - 1);
            },

            compareObjects: function () {
                var i, l, leftChain, rightChain;

                function compare2Objects(x, y) {
                    var p;

                    // remember that NaN === NaN returns false
                    // and isNaN(undefined) returns true
                    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
                        return true;
                    }

                    // Compare primitives and functions.     
                    // Check if both arguments link to the same object.
                    // Especially useful on step when comparing prototypes
                    if (x === y) {
                        return true;
                    }

                    // Works in case when functions are created in constructor.
                    // Comparing dates is a common scenario. Another built-ins?
                    // We can even handle functions passed across iframes
                    if ((typeof x === 'function' && typeof y === 'function') ||
                    (x instanceof Date && y instanceof Date) ||
                    (x instanceof RegExp && y instanceof RegExp) ||
                    (x instanceof String && y instanceof String) ||
                    (x instanceof Number && y instanceof Number)) {
                        return x.toString() === y.toString();
                    }

                    // At last checking prototypes as good a we can
                    if (!(x instanceof Object && y instanceof Object)) {
                        return false;
                    }

                    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
                        return false;
                    }

                    if (x.constructor !== y.constructor) {
                        return false;
                    }

                    if (x.prototype !== y.prototype) {
                        return false;
                    }

                    // check for infinitive linking loops
                    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
                        return false;
                    }

                    // Quick checking of one object beeing a subset of another.
                    // todo: cache the structure of arguments[0] for performance
                    for (p in y) {
                        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                            return false;
                        } else if (typeof y[p] !== typeof x[p]) {
                            return false;
                        }
                    }

                    for (p in x) {
                        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                            return false;
                        } else if (typeof y[p] !== typeof x[p]) {
                            return false;
                        }

                        switch (typeof (x[p])) {
                            case 'object':
                            case 'function':

                                leftChain.push(x);
                                rightChain.push(y);

                                if (!compare2Objects(x[p], y[p])) {
                                    return false;
                                }

                                leftChain.pop();
                                rightChain.pop();
                                break;

                            default:
                                if (x[p] !== y[p]) {
                                    return false;
                                }
                                break;
                        }
                    }

                    return true;
                }

                if (arguments.length < 1) {
                    throw new Error("Need two or more arguments to compare");
                }

                for (i = 1, l = arguments.length; i < l; i++) {

                    leftChain = []; //todo: this can be cached
                    rightChain = [];

                    if (!compare2Objects(arguments[0], arguments[i])) {
                        return false;
                    }
                }

                return true;
            },

            dummy: function () { },

            convertStringToBoolean: function (value) {
                if (value === "true" || value === "True") {
                    return true;
                }

                return false;
            },

            addDays: function (date, days) {
                var result = new Date(date);
                result.setDate(date.getDate() + days);
                return result;
            },

            common: {
                isUndefined: function (value) {
                    return value === undefined;
                },

                isNullOrUndefined: function (value) {
                    return value === undefined || value === null;
                },

                isDefined: function (value) {
                    return !this.isUndefined(value);
                },

                isNullOrEmpty: function (value) {
                    return value === null || value === undefined || value === "";
                },

                isTrue: function (value) {
                    return value !== null && value !== undefined && value === true;
                },

                combinePath: function (path1, path2) {

                    if (isNullOrEmpty(path1)) {
                        return path2;
                    }

                    if (isNullOrEmpty(path1)) {
                        return path1;
                    }

                    if (!path1.endsWith('/')) {
                        path1 += '/';
                    }

                    if (path2.startsWith('/')) {
                        path2 = path2.slice(1);
                    }

                    return path1 + path2;
                },

                newGuid: function () {
                    var s4 = function () {
                        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    };
                    return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
                },

                random: function (min, max) {
                    min = min || 0;
                    max = max || 999999999999999;

                    return Math.floor(Math.random() * (max - min + 1)) + min;
                },

                isEmpty: function (obj) {
                    if (this.isNullOrEmpty(obj)) {
                        return true;
                    }

                    var tempObj = angular.copy(obj);
                    delete tempObj.$$hashKey;

                    return Object.keys(tempObj).length === 0;
                },

                zoomToTolerance: function (zoom) {
                    if (zoom === 0) {
                        return 0.0001;
                    }

                    return 0.0001 / (4.76 * zoom);
                }
            },

            saveEventObject: function (e) {
                global.event = global.event || e;
            },

            debounce: function (func, wait, scope, immediate) {
                var timeout;
                return function () {
                    var context = this,
                        callNow,
                        later,
                        args = arguments;

                    later = function () {
                        timeout = null;
                        if (!immediate) func.apply(context, args);

                        scope && scope.$applyAsync();
                    };

                    callNow = immediate && !timeout;

                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);

                    if (callNow) func.apply(context, args);
                };
            }
        };
    });

    function isNullOrEmpty (value) {
        return value === null || value === undefined || value === "";
    }

})(window);