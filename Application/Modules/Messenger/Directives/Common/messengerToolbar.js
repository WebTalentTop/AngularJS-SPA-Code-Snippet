(function (global) {
    'use strict';

    global.realineMessenger.directive('messengerToolbar', [function () {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/MessengerToolbar.html',

            scope: {
                isSideBarCollapsed: '='
            },

            controller: 'MessengerToolbarController',

            link: function ($scope, element, attrs) {
                //$scope.messenger.initContainer();

            }
        };
    }]);

})(window);