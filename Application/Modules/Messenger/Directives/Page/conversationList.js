(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationList', [function () {
        return {
            restrict: 'E',

            replace: true,

            template:
'<div class="table-responsive margin-top1 padding-top1 full-height" infinite-scroll="controller.loadMoreConversations()">\
<table class="table table-hover dataTable chats" style="margin-bottom:0;">\
<tbody>\
<tr conversation-list-item ng-repeat="conversationRecord in conversationRecords.list" conversation-record="conversationRecord" \
            on-conversation-open="controller.onConversationOpen(conversation)"></tr>\
</tbody>\
</table>\
</div>',

            scope: {
                onConversationOpen: '&'
            },

            controller: 'ConversationListController',

            link: function ($scope, element, attrs) {
                //$scope.messenger.initContainer();

            }
        };
    }]);

})(window);