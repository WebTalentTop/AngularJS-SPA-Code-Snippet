(function (global) {
    'use strict';

    global.realineModule.factory('observable', ['utils',
    function (utils) {
        /*
         * contains helpers for observable classes
         */

        var observable = {
            bindPropertyChanged: function (list, handler, thisArg) {
                var i;
                var obj;

                if (!utils.common.isNullOrUndefined(list.list) && global.angular.isArray(list.list)) {
                    //support for observable collection
                    list = list.list;
                }

                for (i = 0; i < list.length; i++) {
                    obj = list[i];
                    obj.bindPropertyChanged(handler, thisArg);
                }
            },

            unbindPropertyChanged: function (list, handler, thisArg) {
                var i;
                var obj;

                if (!utils.common.isNullOrUndefined(list.list) && global.angular.isArray(list.list)) {
                    //support for observable collection
                    list = list.list;
                }

                for (i = 0; i < list.length; i++) {
                    obj = list[i];
                    obj.unbindPropertyChanged(handler, thisArg);
                }
            },

            bindCollectionChanged: function (list, handler, thisArg) {
                var i;
                var obj;

                if (!utils.common.isNullOrUndefined(list.list) && global.angular.isArray(list.list)) {
                    //support for observable collection
                    list = list.list;
                }

                for (i = 0; i < list.length; i++) {
                    obj = list[i];
                    obj.bindCollectionChanged(handler, thisArg);
                }
            },

            unbindCollectionChanged: function (list, handler, thisArg) {
                var i;
                var obj;

                if (!utils.common.isNullOrUndefined(list.list) && global.angular.isArray(list.list)) {
                    //support for observable collection
                    list = list.list;
                }

                for (i = 0; i < list.length; i++) {
                    obj = list[i];
                    obj.unbindCollectionChanged(handler, thisArg);
                }
            },
        };

        return observable;
    }]);
})(window);