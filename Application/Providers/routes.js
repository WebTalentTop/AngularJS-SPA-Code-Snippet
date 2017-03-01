(function (global) {
    'use strict';

    global.app.provider('routeConfig', [
        '$routeProvider', function routeConfigProvider($routeProvider) {
            return {
                configure: function () {

                    this.configureCommonPages();

                    $routeProvider
                        .otherwise({ redirectTo: '/' });
                },

                addConfiguration: function (routes) {
                    if (!(routes instanceof Array))
                        return;

                    for (var i = 0; i < routes.length; ++i) {
                        $routeProvider.when(routes[i].Url, {
                            title: routes[i].Title,
                            header: routes[i].Header,
                            keywords: routes[i].Keywords,
                            pageDisplayName: routes[i].pageDisplayName,
                            description: routes[i].Description,
                            templateUrl: routes[i].TemplateUrl
                        });
                    }
                },

                $get: function routeConfigFactory() {
                    return {
                        configure: configure,
                        addConfiguration: addConfiguration
                    };
                },

                configureCommonPages: function () {
                    //$routeProvider
                    //    .when('/messenger', {
                    //        title: "Realine Messenger",
                    //        header: "Realine Messenger",
                    //        keywords: "Realine",
                    //        description: "Realine Messenger",
                    //        pageDisplayName: 'Messenger',
                    //        templateUrl: '/Application/Modules/Messenger/Html/Messenger.html',
                    //        general: true
                    //    });
                }
            };
        }
    ]);
})(window);