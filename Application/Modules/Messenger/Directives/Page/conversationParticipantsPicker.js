(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationParticipantsPicker',
        ['$document', '$timeout', '$log',
    function ($document, $timeout, $log) {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/ConversationParticipantsPicker.html',

            scope: {
                conversation: '=',
                currentUser: '=',                
            },

            controller: 'ConversationParticipantsPickerController',

            link: function ($scope, element, attrs) {
                
            }
        };
    }]);

})(window);