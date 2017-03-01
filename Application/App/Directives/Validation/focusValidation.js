(function (global) {
    'use strict';

    global.realineModule.directive('focusValidation', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: { field: '=' },

            link: function ($scope, el, attrs, ngMod) {
                var innerScope = $scope;

                el.on('focus', function () {
                    ngMod.isFocused = true
                    if (innerScope.field) {;
                        innerScope.field.isFocused = true;
                    }
                    $scope.$apply();
                });
                el.on('blur', function () {
                    ngMod.isFocused = false;
                    if (innerScope.field) {
                        innerScope.field.isFocused = false;
                    }
                    $scope.$apply();
                });
            }
        };
    });
})(window);