(function (global) {
    'use strict';

    global.realineMessenger.directive('chatBubbleMessages', [function () {
    return {
        restrict: 'E',

        replace: true,

        templateUrl: '/Application/Modules/Messenger/Html/Common/ChatBubbleMessages.html',

        scope: {},

        controller: 'ChatBubbleMessagesController',

        link: function ($scope, element, attrs) {


        }
    };
}]);

})(window);