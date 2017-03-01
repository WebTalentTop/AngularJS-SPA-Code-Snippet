'use strict';

(function (global) {
    global.realineModule.directive("autoFullHeight", ['$window', '$', '$log', '$timeout', 'messageBus',
        function ($window, $, $log, $timeout, messageBus) {
            return {
                restrict: 'A',
                scope: {
                    fullHeightTrigger: '=',
                    resizeEventName: '@'
                },
                link: function ($scope, $element, $attributes) {
                    var w = global.angular.element($window);

                    var siblings = $element.siblings();
                    var parent = $element.parent();

                    var eventName = $scope.resizeEventName;

                    function onWindowResize() {

                        var siblingsHeight = 0;
                        var parentHeight = parent.height();

                        siblings.each(function (index, el) {
                            siblingsHeight += $(el).outerHeight(true);
                        });

                        $element.outerHeight(parentHeight - siblingsHeight);

                        $log.debug('onWindowResize');
                    }

                    w.on("resize", onWindowResize);

                    if (eventName) {
                        messageBus.bind(eventName, onEvent, this);                        
                    }

                    function onEvent(event) {
                        onWindowResize();
                    }

                    $element.on('$destroy', function () {
                        w.off("resize", onWindowResize);
                        if (eventName) {
                            messageBus.detach(eventName, onEvent, this);
                        }
                    }.bind(this));

                    $scope.$watch('fullHeightTrigger', function (value) {
                        $log.debug('fullHeightTrigger');
                        if (value) {
                            onWindowResize();
                        }
                    });

                    $timeout(onWindowResize, 0);
                }
            };
        }]);
})(window);