(function (global) {
    'use strict';

    global.realineMessenger.directive('messengerFolders', [function () {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/MessengerFolders.html',

            scope: {},

            controller: 'MessengerFoldersController',

            link: function ($scope, element, attrs) {


            }
        };
    }]);

})(window);