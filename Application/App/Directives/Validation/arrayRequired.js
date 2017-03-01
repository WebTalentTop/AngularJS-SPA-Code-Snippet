(function (global) {
    'use strict';

    global.realineModule.directive('arrayRequired', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                var input = elem[0].querySelector('input');
                ngModel.showValidation = false;

                var focused = false;

                input.onfocus = function () {
                    focused = true;
                    ngModel.showValidation = false;
                    scope.safeApply();
                };

                input.onblur = function () {
                    focused = false;
                    scope.safeApply();
                };

                input.onmouseenter = function () {
                    ngModel.showValidation = !focused;
                    scope.$apply();
                };

                input.onmouseleave = function () {
                    ngModel.showValidation = false;
                    scope.$apply();
                };

                ngModel.$validators.arrayRequired = function(modelValue, viewValue) {
                    return (modelValue !== undefined && modelValue !== null && modelValue.length > 0 ? true : false);
                }.bind(this);
            }
        };
    });
})(window);