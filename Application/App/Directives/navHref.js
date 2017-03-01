(function (global) {
    'use strict';

    global.realineModule.directive('navHref', ['pageNavigationService', 'utils',
        function (pageNavigationService, utils) {
            return {
                restrict: 'A',

                link: function (scope, element, attrs) {
                    var pageName = attrs.navHref;

                    if (utils.common.isNullOrEmpty(pageName)) {
                        return;
                    }

                    element.click(function (event) {
                        var idExpr = attrs.navId,
                            qs = {},
                            id = scope.$eval(idExpr);

                        if (!utils.common.isNullOrEmpty(id)) {
                            qs.Id = id;
                        }

                        pageNavigationService.changeLocation(pageName, qs);

                        //event.stopPropagation();
                    });
                }
            };
        }]);
})(window);