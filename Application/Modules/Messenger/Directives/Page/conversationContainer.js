(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationContainer', ['$', function ($) {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/ConversationContainer.html',

            scope: {
                currentUser: '=',
                conversation: '=',
                isConversationActive: '=isActive',
            },

            controller: 'ConversationContainerController',

            compile: function () {

                return {
                    post: function ($scope, element, attributes) {
                        //TODO: consider removing initialized
                        $scope.initialized = true;

                        //this function is necessary to smotholy hide participants panel 
                        //and resize box-body
                        $scope.hideParticipantsPanel = function () {
                            $(element).find('.participants').hide();
                        }
                    }
                }
            },

            link: function ($scope, element, attrs) {


            }
        };
    }]);

})(window);