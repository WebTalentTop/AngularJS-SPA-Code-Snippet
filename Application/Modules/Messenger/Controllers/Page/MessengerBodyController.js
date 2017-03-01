(function (global) {
    'use strict';

    global.realineMessenger.controller('MessengerBodyController', [
        '$scope', '$q',
        function ($scope, $q) {

            var controller = Class.extend({

                init: function ($scope) {
                    this._super($scope);
                },

                load: function () {
                    this._super();


                },

            });

        }
    ]);
})(window);