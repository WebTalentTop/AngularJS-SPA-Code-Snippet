(function (global) {
    'use strict';

    global.app.run([
    '$rootScope', '$window', 'errorConstants', 'toastrService', 'pageNavigationService', '$localStorage', 'CrossDomainStorage', 'authConstants', 'authToken',
        function ($rootScope, $window, errorConstants, toastrService, nav, $localStorage, CrossDomainStorage, authConstants, authToken) {

            $window.onerror = function (msg, url, line, col, eObj) {
                toastrService.error(String.format('{0} \n at {1} (l:{2}, c:{3})', msg, url, line, col),
                    errorConstants.clientErrorTitle);

                return false;
            };

            $rootScope.$on('$routeChangeStart', function (event, current, previous) {
                if (current.$$route) {
                    window.historyItems.push(current);

                    $rootScope.title = current.$$route.title;
                    $rootScope.keywords = current.$$route.keywords;
                    $rootScope.description = current.$$route.description;
                    $rootScope.pageDisplayName = current.$$route.pageDisplayName;
                    $rootScope.general = current.$$route.general;
                }

                $rootScope.mainMenuItems = [];
            });

            authToken = $localStorage[authConstants.localStorage] || '';

            CrossDomainStorage.connect().then(function () {
                CrossDomainStorage.get(authConstants.localStorage).then(function (response) {
                    authToken = response.value;
                    $localStorage[authConstants.localStorage] = response.value;
                });
            });
        }
    ]);
})(window);
