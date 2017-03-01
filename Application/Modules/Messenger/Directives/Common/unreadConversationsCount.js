(function (global) {
    'use strict';

    global.realineMessenger.directive('unreadConversationsCount', ['$log', '$',
        function ($log, $) {
            return {
                restrict: 'E',

                replace: true,

                scope: {},

                template: '<span class="label label-success" data-ng-if="conversationCount>0">{{conversationCount}}</span>',

                link: function ($scope, element, attrs) {

                },

                controller: ['$scope', 'messageBus', 'events',
                    function ($scope, messageBus, events) {

                        $scope.conversationCount = 0;

                        function conversationCountChanged(event) {
                            $scope.conversationCount = event.count;
                        }

                        messageBus.bind(events.unreadConversationsChanged, conversationCountChanged, this);

                        $scope.$on('$destroy', function () {
                            messageBus.detach(events.unreadConversationsChanged, conversationCountChanged, this);
                        });

                    }]
            };
        }]);

})(window);