(function (global) {
    'use strict';

    global.realineMessenger.factory('signalRUtils', ['$q', '$log', '$', function ($q, $log, $) {

        return {
            callMethod: function (method, context, args) {

                var deferred = $q.defer();

                try {

                    method.apply(context, args).done(function (data) {
                        deferred.resolve(data);
                    }).fail(function (data) {
                        deferred.reject(data);
                    });
                }
                catch (error) {
                    deferred.reject(error);
                }

                return deferred.promise;
            }
        };
    }
    ]);


})(window);