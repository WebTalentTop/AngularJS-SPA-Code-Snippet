(function (global) {
    'use strict';

    global.realineModule.directive('focusMe', ['$timeout', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(attrs.focusMe, function (value) {
                    if (value) {
                        $timeout(function() {
                            element[0].focus();
                        }, 100);
                    }
                });
            }
        };
    }]);
})(window);