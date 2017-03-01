(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationListItem', [function () {
        return {
            restrict: 'EA',

            replace: true,

            template:
'<tr data-ng-click="controller.onConversationOpen()">\
    <td width="16"><input type="checkbox"/></td>\
    <td width="16"><a class="btn btn-box-tool" data-ng-click="controller.onStarConversation($event)"><i class="star-js fa fa-star-o"></i></a></td>\
    <td width="25%" class="overflow"><a class="participants"></a></td>\
    <td align="center" width="16"><span class="unread_messages"></span></td>\
    <td width="55%" class="overflow text-muted"><a class="title"></a> - <span class="text-muted msg_text"></span></td>\
    <td align="right" class="time"></td>\
</tr>',

            scope: {
                conversationRecord: '=',
                onConversationOpen: '&',
            },

            controller: 'ConversationListItemController',

            link: function ($scope, element, attrs) {
                //$scope.$watch('conversation', function (value) {
                //    $log.debug('Conversation ha been changed.');
                //});

                $scope.setSelection = function (isSelected) {
                    if (isSelected) {
                        element.addClass('active');
                    }
                    else {
                        element.removeClass('active');
                    }
                };

                $scope.setTitle = function (value) {
                    element.find('.title').text(value);
                };

                $scope.setParticipants = function (value) {
                    element.find('.participants').text(value);
                };

                $scope.setTime = function (value) {
                    element.find('.time').text(value);
                };

                $scope.setLastMessageText = function (value) {
                    element.find('.msg_text').text(value);
                };

                $scope.setUnreadMessagesCount = function (value) {
                    var node = element.find(".unread_messages");
                    if (value === 0) {
                        node.hide();
                        element.removeClass('text-bold');
                    }
                    else {
                        node.text('(' + value + ')');
                        node.show();
                        element.addClass('text-bold');
                    }
                };

                $scope.starConversation = function (value) {
                    if (value) {
                        element.find('star-js').removeClass('fa-star-o');
                        element.find('star-js').addClass('fa-star');
                    }
                    else {
                        element.find('star-js').removeClass('fa-star');
                        element.find('star-js').addClass('fa-star-o');
                    }
                },

                $scope.controller.initUI();
            }
        };
    }]);

})(window);