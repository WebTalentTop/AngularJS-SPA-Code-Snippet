(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationDayMessagesContainer', [function () {
        return {
            restrict: 'E',

            replace: true,

            template:
'<div class="messages-day-group">\
    <h4 class="stripe-bg">\
        <span ng-bind="dayGroup.day|friendlyDate"></span>\
        <hr>\
    </h4>\
    <conversation-message-group o-repeat="messageGroup in messageGroups"></conversation-message-group>\
</div>',

            //scope: {
            //    currentUser: '=',
            //    messages: '=',
            //    onCancelFileUpload: '&',
            //    onContactRedirectDestinationUser: '&',
            //    onOpenChildGroupConversation: '&',
            //    onResendMessages: '&',
            //},

            controller: 'ConversationDayMessagesContainerController',

            link: function ($scope, element, attrs) {
                //$scope.messenger.initContainer();

            }
        };
    }]);

})(window);