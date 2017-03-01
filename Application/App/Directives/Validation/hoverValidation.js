(function (global) {
    'use strict';

    global.realineModule.directive('hoverValidation', function () {
        return {
            restrict: 'A',
            scope: { field:'=' },

            link: function ($scope, el, attrs, ngMod) {
                var innerScope = $scope;

                el.on('mouseleave', function () {
                    if (innerScope.field) {
                        innerScope.field.isHovered = false;
                    }
                    innerScope.$apply();
                });
                el.on('mouseenter', function () {
                    if (innerScope.field) {
                        innerScope.field.isHovered = true;
                    }
                    innerScope.$apply();
                });
            }
        };
    });
})(window);