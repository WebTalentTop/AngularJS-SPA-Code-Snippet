(function (global) {
    'use strict';

    global.realineModule.directive('oBind', ['$filter', 'utils', function ($filter, utils) {
        return {
            priority: 1,
            restrict: 'A',

            link: function ($scope, element, attrs, ctrls) {
                //variable.property|filter:param_for_filter
                var bindingPattern = /([_$0-9a-z]+)\.([_$0-9a-z]+)(\|([_$0-9a-z]+)(:(.*))?)?/i;

                var Controller = Class.extend({
                    init: function (scope, binding) {
                        this.scope = scope;
                        this.bindingString = binding;

                        if (!this.parseBinding()) {
                            throw new Error('oBind: Binding must be in format: variable.property|filter:param_for_filter');
                        }

                        this.prepareBinding();

                        this.bindEvents();

                        this.evalBinding();
                    },

                    parseBinding: function () {
                        var lineIndex,
                            path,
                            pathParts;

                        if (!bindingPattern.test(this.bindingString)) {
                            return false;
                        }

                        lineIndex = this.bindingString.indexOf('|');
                        if (lineIndex === -1) {
                            path = this.bindingString;
                        }
                        else {
                            path = this.bindingString.substring(0, lineIndex);
                        }

                        pathParts = path.split('.');

                        this.binding = {
                            variable: pathParts[0],
                            property: pathParts[1]
                        };

                        if (lineIndex === -1) {
                            return true;
                        }

                        return this.parseFilter(this.bindingString.substring(lineIndex + 1));
                    },

                    parseFilter: function (filterExpression) {
                        var semicolonIndex = filterExpression.indexOf(':'),
                            paramsString,
                            params;

                        if (semicolonIndex === -1) {
                            this.binding.filterName = filterExpression;
                            return true;
                        }
                        else {
                            this.binding.filterName = filterExpression.substring(0, semicolonIndex);
                        }

                        paramsString = filterExpression.substring(semicolonIndex + 1);

                        this.binding.filterParams = [paramsString];

                        return true;
                    },

                    prepareBinding: function () {
                        this.object = this.scope.$eval(this.binding.variable);

                        if (!utils.common.isNullOrUndefined(this.binding.filterName)) {
                            this.binding.filter = $filter(this.binding.filterName);
                        }
                    },

                    evalBinding: function () {
                        var value = this.object.get(this.binding.property),
                            filterParams = [],
                            i;

                        if (utils.common.isNullOrUndefined(this.binding.filter)) {
                            this.scope.setText(value);
                            return;
                        }

                        for (i = 0; i < this.binding.filterParams.length; i++) {
                            filterParams.push(this.scope.$eval(this.binding.filterParams[i]));
                        }

                        filterParams.unshift(value);

                        value = this.binding.filter.apply(this, filterParams);

                        this.scope.setText(value);
                    },

                    objectPropertyChanged: function (event) {
                        if (event.property !== this.binding.property) {
                            return;
                        }

                        this.evalBinding();
                    },

                    bindEvents: function () {
                        this.object.bindPropertyChanged(this.objectPropertyChanged, this);

                        this.scope.$on('$destroy', this.onDestroy.bind(this));
                    },

                    onDestroy: function () {
                        this.object.unbindPropertyChanged(this.objectPropertyChanged, this);
                    }
                });

                $scope.setText = function (text) {
                    element.text(text);
                };

                $scope.controller = new Controller($scope, attrs.oBind);
            }
        };
    }]);
})(window);