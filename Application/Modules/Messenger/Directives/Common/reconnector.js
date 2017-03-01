(function (global) {
    'use strict';

    global.realineMessenger.directive('reconnector', ['$log', '$',
        function ($log, $) {
            return {
                restrict: 'E',

                replace: true,

                scope: {},

                template: '<div class="reconnector_widget" data-ng-show="isReconnecting || isWaiting">' +
                            '<div class="inner">' +
                            '<span class="reconection_text" data-ng-if="isReconnecting"><i class="font_icon icon-spin3"></i> Connecting...</span>' +
                            '<span class="reconnection_wait" data-ng-if="isWaiting"><i class="font_icon icon-spin3"></i> Reconnecting in {{reconnectInInterval}} sec... ' +
                            '(<a data-ng-click="reconnect()">Do it now</a>)' +
                            '</span>' +
                            '</div>' +
                            '</div>',

                link: function ($scope, element, attrs) {


                },

                controller: ['$scope', '$interval', 'hubConnection', 'CoreEnums',
                    function ($scope, $interval, hubConnection, CoreEnums) {

                        var SECONDARY_RECONNECT_INTERVAL = 3;
                        var TERTIARY_RECONNECT_INTERVAL = 6;

                        var timer = null;

                        //read actual state of hubConnection                       
                        $scope.isReconnecting = hubConnection.getState() === CoreEnums.HubConnectionState.Reconnecting
                            || hubConnection.getState() === CoreEnums.HubConnectionState.Connecting;
                        $scope.isWaiting = false;
                        $scope.reconnectInInterval = 0;
                        $scope.numberOfAttempts = 0;

                        $scope.onMessengerStateChanged = function (event) {

                            $scope.isReconnecting = event.newState === CoreEnums.HubConnectionState.Reconnecting
                            || event.newState === CoreEnums.HubConnectionState.Connecting;

                            switch (event.newState) {
                                case CoreEnums.HubConnectionState.Reconnecting:
                                case CoreEnums.HubConnectionState.Connecting:
                                    this.onReconnecting();
                                    break;
                                case CoreEnums.HubConnectionState.Connected:
                                    this.onConnected();
                                    break;
                            }
                        };

                        $scope.onReconnecting = function () {
                            this.isReconnecting = true;
                            this.isWaiting = false;
                        }

                        $scope.onConnected = function () {
                            this.resetAttempts();
                        },

                        $scope.onDisconnected = function (event) {
                            if (!event.triedToReconnect) {
                                //we disconnected manually (may be user logged out)
                                //so do noit need to reconnect
                                return;
                            }

                            $scope.numberOfAttempts++;

                            if ($scope.numberOfAttempts === 1) {
                                //this is first one, so connect immediatly
                                hubConnection.connect();
                            }
                            else {
                                //this is not first connect, so wait couple seconds before reconnecting
                                //starting timer
                                startTimer();
                            }
                        }

                        $scope.resetAttempts = function () {
                            $scope.numberOfAttempts = 0;
                        };

                        $scope.reconnect = function () {
                            //stop timer in case if user forces reconnect
                            if (timer) {
                                $interval.cancel(timer);
                                timer = null;
                            }
                            hubConnection.connect();
                        };

                        function startTimer() {
                            if ($scope.numberOfAttempts < 3) {
                                $scope.reconnectInInterval = SECONDARY_RECONNECT_INTERVAL;
                            }
                            else {
                                $scope.reconnectInInterval = TERTIARY_RECONNECT_INTERVAL
                            }
                            $scope.isWaiting = true;
                            timer = $interval(waitTimeout, 1000);
                        }

                        function waitTimeout() {
                            //countdown
                            $scope.reconnectInInterval--;

                            if ($scope.reconnectInInterval === 0) {
                                $scope.reconnect();
                            }
                        }

                        hubConnection.bindStateChanged($scope.onMessengerStateChanged.bind($scope));
                        hubConnection.bindDisconnected($scope.onDisconnected.bind($scope));
                    }]
            };
        }]);

})(window);