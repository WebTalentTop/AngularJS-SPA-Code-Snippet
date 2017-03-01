(function (global) {
    'use strict';

    global.realineModule.directive('ngHtmlCompile', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                scope.$watch(attrs.ngHtmlCompile, function(newValue, oldValue) {
                    element.html(newValue);
                    $compile(element.contents())(scope);
                });
            }
        };
    }]);
})(window);