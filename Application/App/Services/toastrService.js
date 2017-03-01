(function (global) {
    'use strict';

    global.realineModule.factory('toastrService', [function () {

        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-top-right",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "500",
            "timeOut": "3500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        var toAstrService = Class.extend({
            success: function (message, title) {
                toastr.success(message, title);
            },

            info: function (message, title) {
                toastr.info(message, title);
            },

            warning: function (message, title) {
                toastr.info(message, title);
            },

            error: function (message, title, forceShow) {
                if (!window.IsRelease || forceShow) {
                    toastr.error(message, title);
                }
            }
        });

        return new toAstrService();
    }]);
})(window);