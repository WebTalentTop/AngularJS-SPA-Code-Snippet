(function (global) {
    'use strict';

    global.realineMessenger.directive('currentUserConnectionState', ['$log', '$',
        function ($log, $) {
            return {
                restrict: 'E',

                replace: true,

                scope: {},

                template: '<i title="{{status}}" class="fa fa-circle user-status" data-ng-class="{online: isOnline(), offline: isOffline(), away:isAway(), busy: isBusy()}"></i>',

                link: function ($scope, element, attrs) {

                },

                controller: ['$scope', 'messageBus', 'events', 'MessengerEnums',
                function ($scope, messageBus, events, MessengerEnums) {

                    $scope.status = MessengerEnums.UserStatuses.Offline;

                    $scope.isOnline = function () {
                        return $scope.status === MessengerEnums.UserStatuses.Online;
                    };

                    $scope.isOffline = function () {
                        return $scope.status === MessengerEnums.UserStatuses.Offline;
                    };

                    $scope.isAway = function () {
                        return $scope.status === MessengerEnums.UserStatuses.Away;
                    };

                    $scope.isBusy = function () {
                        return $scope.status === MessengerEnums.UserStatuses.Busy;
                    }

                    function statusChanged(event) {
                        $scope.status = event.status;
                    }

                    messageBus.bind(events.userStatusChanged, statusChanged, this);

                    $scope.$on('$destroy', function () {
                        messageBus.detach(events.userStatusChanged, statusChanged, this);
                    }.bind(this));
                }]
            };
        }]);
})(window);