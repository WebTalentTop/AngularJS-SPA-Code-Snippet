(function (global) {
    'use strict';

    global.realineModule.factory('errorMessageProvider', [
    function () {

        var service = {
            getApiErrorMessage: function (data) {
                var i;
                var message = '';
                var errorInfo;

                if (data.Status) {
                    throw new Error('Request is not failed.');
                }

                for (var i = 0; i < data.Errors.length; i++) {
                    if (i > 0) {
                        message += ' ';
                    }
                    errorInfo = data.Errors[i];
                    message += data.Errors[i].ErrorMessage;
                }

                return message;
            },
        };

        return service;
    }
    ]);


})(window);