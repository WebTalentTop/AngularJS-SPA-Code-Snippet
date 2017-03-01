(function () {
    'use strict';

    var $type = Array,
        $prototype,
        defaultComparer = function (item1, item2) {
            return item1 === item2;
        };

    $type.__typeName = 'Array';
    $type.__class = true;
    $prototype = $type.prototype;

    $prototype.removeAt = function (index) {
        if (index != -1) {
            this.splice(index, 1);
        }
    };

    $prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    };

    $prototype.sortBy = function (p) {
        return this.slice(0).sort(function (a, b) {
            return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
        });
    }

    $prototype.remove = function (from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    $prototype.removeElement = function (element) {
        var index = this.indexOf(element);

        if (index >= 0) {
            this.splice(index, 1);
        }
    };

    $prototype.findItem = Array.prototype.findItem || function (callback, thisArg) {
        var i;

        for (i = 0; i < this.length; i++) {
            if (callback.call(thisArg, this[i], i, this)) {
                return this[i];
            }
        }

        return null;
    };

    $prototype.findIndex = Array.prototype.findIndex || function (callback, thisArg) {
        var i;

        for (i = 0; i < this.length; i++) {
            if (callback.call(thisArg, this[i], i, this)) {
                return i;
            }
        }

        return -1;
    };

    $prototype.findByField = Array.prototype.findByField || function (lookFor, fieldName) {
        return this.findItem(function (item) {
            return item[fieldName] === lookFor;
        });
    };

    $prototype.findIndexByField = Array.prototype.findIndexByField || function (lookFor, fieldName) {
        return this.findIndex(function (item) {
            return item[fieldName] === lookFor;
        });
    };

    $prototype.findById = Array.prototype.findById || function (lookFor) {
        return this.findByField(lookFor, 'Id');
    };

    $prototype.filterDuplicates = Array.prototype.filterDuplicates || function (callback, thisArg) {
        var dict = {},
            newArray = [],
            i,
            key;

        for (i = 0; i < this.length; i++) {
            key = callback.call(thisArg, this[i], i, this);
            if (!dict.hasOwnProperty(key)) {
                dict[key] = key;
                newArray.push(this[i]);
            }
        }

        return newArray;
    };

    // check if an element exists in array using a comparer function
    // comparer : function(currentElement)
    $prototype.inArray = function (element) {
        for (var i = 0; i < this.length; i++) {
            if (element == this[i]) return true;
        }
        return false;
    };

    // adds an element to the array if it does not already exist using a comparer 
    // function
    $prototype.pushIfNotExist = function (element, comparer) {
        if (this.length == 0) {
            this.push(element);
            return;
        }
        defaultComparer = function (a, b) { return a == b; };
        comparer = comparer || defaultComparer;
        var isExist = false;
        for (var i = this.length - 1; i >= 0; i--) {
            if (comparer(element, this[i])) {
                isExist = true;
                break;
            }

        }
        if (!isExist) this.push(element);
    };

    $prototype.unshiftWithoutDuplications = function (element, comparer) {
        comparer = comparer || defaultComparer;

        for (var i = this.length - 1; i >= 0; i--) {
            if (comparer(element, this[i])) this.removeAt(i);
        }

        this.unshift(element);
    };
})();