(function (global) {
    'use strict';

    global.realineMessenger.directive('messengerPanel', [function () {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/MessengerPanel.html',

            scope: {},

            controller: 'MessengerPanelController',

            link: function ($scope, element, attrs) {
                $scope.messenger.initContainer();

            }
        };
    }]);

})(window);