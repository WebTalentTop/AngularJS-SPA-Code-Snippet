(function (global) {
    'use strict';

    global.realineModule.factory('FloatingWindowBase', [

    function () {

        var FloatingWindowBase = Class.extend({
            init: function (scope, wnd) {
                this.scope = scope;
                this.wnd = wnd;
                this.scope.controller = this;

                this.scope.$on('$destroy', function () {
                    this.onDestroy();
                }.bind(this));
            },

            close: function () {
                this.wnd.close();
            },

            onDestroy: function () {

            }
        });

        return FloatingWindowBase;
    }
    ]);


})(window);