(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationMessagesContainer', [function () {
        return {
            restrict: 'E',

            replace: true,

            template:
'<div class="conversation-messages-container full-height">\
<conversation-day-messages-container o-repeat="dayGroup in controller.messageDayGroups"></conversation-day-messages-container>\
</div>',

            scope: {
                currentUser: '=',
                messages: '=',                
                onContactRedirectDestinationUser: '&',
                onOpenChildGroupConversation: '&',
                onResendMessages: '&',
                onDeleteMessages: '&',
            },

            controller: 'ConversationMessagesContainerController',

            link: function ($scope, element, attrs) {
                //$scope.messenger.initContainer();

            }
        };
    }]);

})(window);