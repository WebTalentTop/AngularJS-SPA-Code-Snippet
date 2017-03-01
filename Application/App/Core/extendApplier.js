(function (global) {
    'use strict';

    var extendApplier = global.Realine.extendApplier || {};

    global.Realine.extendApplier = extendApplier;

    extendApplier.applyFn = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        var controller = args[0];
        var params = args.slice(1);

        global.jQuery.extend(this, controller.prototype);

        this.init.apply(this, params);
    };

    extendApplier.applyObj = function () {
        var args = Array.prototype.slice.call(arguments, 0),
            controller = args[0];

        global.jQuery.extend(this, controller);
    };
})(window);