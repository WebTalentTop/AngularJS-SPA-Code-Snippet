(function (global) {

    'use strict';

    global.realineModule.directive('infiniteUpwardScroll', ['$timeout', '$log', function ($timeout, $log) {
        return {
            restrict: 'A',

            scope: {
                scrollCallback: '&'
            },

            link: function(scope, elem, attr, ctrl) {
                var raw = elem[0];

                var denyLoading = false;
                var lastScrollPosition = elem.scrollTop();

                elem.bind('scroll', function() {

                    if (denyLoading) {
                        //$log.debug('Loading is denied');
                        return;
                    }

                    if (raw.scrollHeight <= raw.clientHeight) {
                        //$log.debug('Does not makes sense to load');
                        return;
                    }

                    //$log.debug('Last scroll position: ' + lastScrollPosition);
                    //$log.debug('New scroll position: ' + elem.scrollTop());

                    if (lastScrollPosition === 0 && elem.scrollTop() === 0) {
                        return;
                    }

                    lastScrollPosition = elem.scrollTop();


                    if (raw.scrollTop === 0) {

                        var sh = raw.scrollHeight;

                        //var promise = scope.$apply(attr.infiniteUpwardScroll);
                        var promise = scope.scrollCallback();

                        if (promise) {

                            promise.then(function(result) {
                                //$log.debug('Promise resolved with result: ' + result);

                                if (!result) {
                                    //there are no new elements
                                    return;
                                }

                                denyLoading = true;

                                $timeout(function() {
                                    //elem.scrollTop(raw.scrollHeight - sh);
                                    elem.animate({ scrollTop: raw.scrollHeight - sh }, 100);

                                    denyLoading = false;
                                }, 0);

                            });
                        }
                    }
                });
            }
        };
    }]);
})(window);