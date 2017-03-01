(function (global) {
    'use strict';

    global.realineModule.directive('flashing', ['$interval', function ($interval) {
        return {
            restrict: 'A',
            link: function ($scope, $el, attrs, ctrls) {
                var flashingClass = attrs.flashingClass;
                var flashingInterval = attrs.flashingInterval;
                var intervalHandle;


                function isFlashingEnabled() {
                    return $scope.$eval(attrs.flashing);
                }

                function startFlashing() {
                    $el.addClass(flashingClass);
                    intervalHandle = $interval(function () { $el.toggleClass(flashingClass); }, flashingInterval);
                }

                function stopFlashing() {
                    $el.removeClass(flashingClass);
                    $interval.cancel(intervalHandle);
                }

                $scope.$watch(isFlashingEnabled, function (newValue, oldValue) {
                    if (newValue) {
                        startFlashing();
                    }
                    else {
                        stopFlashing();
                    }
                });

                $scope.$on('$destroy', function () {
                    stopFlashing();
                });
            }
        };
    }]);
})(window);