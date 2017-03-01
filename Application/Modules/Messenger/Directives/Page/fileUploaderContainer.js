(function (global) {
    'use strict';

    global.realineMessenger.directive('fileUploaderContainer', [function () {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/FileUploaderContainer.html',

            scope: {
                files: '=',
                conversation: '=',
            },

            controller: 'FileUploaderContainerController',

            link: function ($scope, element, attrs) {

            }
        };
    }]);

})(window);