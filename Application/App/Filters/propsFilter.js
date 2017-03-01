(function (global) {
    'use strict';

    global.realineModule.filter('propsFilter', ['utils', function (utils) {
        return function (items, props) {
            var out = [],
                prop,
                text,
                value,
                common = utils.common;

            if (global.angular.isArray(items)) {
                items.forEach(function (item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        prop = keys[i];
                        text = props[prop].toLowerCase();

                        value = global.angular.isFunction(item[prop]) ? item[prop]() : item[prop];

                        if (common.isNullOrEmpty(text) ||
                            (!common.isNullOrEmpty(value) && value.toString().toLowerCase().indexOf(text) !== -1)) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    }]);
})(window);