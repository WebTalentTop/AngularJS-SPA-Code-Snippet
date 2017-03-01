(function (global) {
    'use strict';

    global.app.config([
        'routeConfigProvider', '$locationProvider', 'CrossDomainStorageProvider', 'appConfig',
        function (routeConfigProvider, $locationProvider, CrossDomainStorageProvider, appConfig) {
            routeConfigProvider.configure();

            window.historyItems = [];

            CrossDomainStorageProvider.setOptions({
                url: appConfig.crossDomainHub,
                timeout: 10000,
                frameId: 'cross-storage-frame',
                debug: false
            });
        }
    ]);

    global.app.factory('errorInterceptor', ['$q', 'pageNavigationService', 'toastrService', 'authConstants', 'CrossDomainStorage', 'authToken', '$localStorage',
        function ($q, nav, toastrService, authConstants, CrossDomainStorage, authToken, $localStorage) {
            function handleError(response) {
                var title = String.format('{0}: {1}', response.config.url, response.statusText),
                    message = response.data ?
                        String.format('{0}<br/>{1}', response.data.Message, response.data.MessageDetail) :
                        String.format('{0}: {1}', response.status, response.statusText);

                toastrService.error(message, title);
            }

            return {
                request: function (config) {
                    return config || $q.when(config);
                },
                requestError: function (request) {
                    return $q.reject(request);
                },
                response: function (response) {
                    var headers = response.headers(authConstants.header);

                    if (headers) {
                        var token = headers.split(',');
                        authToken = token[0];
                        CrossDomainStorage.set(authConstants.localStorage, token[0]);
                        $localStorage[authConstants.localStorage] = token[0];
                    }

                    return response || $q.when(response);
                },
                responseError: function (response) {
                    return;
                    if (response.status === 401) {
                        response.data = {
                            status: false,
                            description: 'Authentication required!'
                        };

                        nav.changeLocation(nav.pageLinks.Login, { returnUrl: window.location.href });
                    }

                    handleError(response);

                    return $q.reject(response);
                }
            };
        }
    ]);

    global.app.config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('errorInterceptor');
    }]);
})(window);
