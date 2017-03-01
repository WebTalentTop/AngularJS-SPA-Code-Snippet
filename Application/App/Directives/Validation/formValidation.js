(function (global) {
    'use strict';

    global.realineModule.directive('formValidation', function () {
        return {
            restrict: 'A',
            require: 'ngModel',

            link: function ($scope, el, attrs, ngModel) {
                var submited = angular.isString(attrs.submited) ? $scope.$eval(attrs.submited) : attrs.submited;
                var field = angular.isString(attrs.field) ? $scope.$eval(attrs.field) : attrs.field;

                var raiseValidation;

                if (attrs.raiseValidation !== undefined) {
                    raiseValidation = angular.isString(attrs.raiseValidation) ? $scope.$eval(attrs.raiseValidation) : attrs.raiseValidation;
                }

                $scope.$watch(function () {
                    return ngModel.$$parentForm.$submitted;
                }, function (newValue, oldValue) {
                    submited = newValue;

                    if (raiseValidation === true) {
                        ngModel.startEntering = false;
                        ngModel.$$parentForm.$submitted = false;
                    }
                    checkValidationStatus();
                }.bind(this));

                $scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (newValue, oldValue) {
                    fillOutStates(el, ngModel);
                }.bind(this));

                var checkValidationStatus = function () {
                    if (raiseValidation === true) {
                        ngModel.showValidation = (ngModel.isFocused && ngModel.startEntering);
                    } else {
                        ngModel.showValidation = (ngModel.isFocused && ngModel.startEntering) || submited;
                    }

                    $scope.safeApply();
                };

                var fillOutStates = function(el, _model){
                    var valid = !_model.$invalid;
                    var empty = !_model.$dirty;

                    var element = angular.element(el);
                    if(valid) {
                        element.addClass('has-success');
                        element.removeClass('has-error');
                    } else if(!valid && (_model.$$parentForm && _model.$$parentForm.$submitted)) {
                        element.addClass('has-error');
                        element.removeClass('has-success');
                    }

                    if(empty) {
                        element.addClass('is-empty');
                    } else {
                        element.removeClass('is-empty');
                    }

                    if(_model.isFocused ) {
                        element.addClass('has-focus');
                    } else {
                        element.removeClass('has-focus');
                    }
                };

                el.on('focus', function () {
                    ngModel.isFocused = true;
                    if (field) {
                        field.isFocused = true;
                    }

                    checkValidationStatus();
                    fillOutStates(el, ngModel);
                });
                el.on('blur', function () {
                    ngModel.isFocused = false;
                    if (field) {
                        field.isFocused = false;
                    }

                    checkValidationStatus();
                    fillOutStates(el, ngModel);
                });
                el.on('input', function () {
                    ngModel.startEntering = ngModel.startEntering || true;

                    checkValidationStatus();
                });
            }
        };
    });
})(window);