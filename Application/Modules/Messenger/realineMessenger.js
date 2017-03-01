(function (global) {
    'use strict';

    global.realineMessenger = global.angular
        .module('realineMessenger', [
            'realine',
            //'ui.bootstrap',
            'ui.bootstrap.modal',
            'ui.select',
            'angularFileUpload',
            'ngFileUpload'])
        .run([function () { }])
        .config([
            '$routeProvider',
            function ($routeProvider) {
                $routeProvider
                    .when('/', {
                        title: "Realine Messenger",
                        header: "Realine Messenger",
                        keywords: "Realine",
                        description: "Realine Messenger",
                        pageDisplayName: 'Messenger',
                        templateUrl: '/Application/Modules/Messenger/Html/MessengerPage.html',
                        general: true
                    });
            }
        ])
        .run(['pageNavigationService', 'appConfig',
            function (pageNavigationService, appConfig) {
                pageNavigationService.addPageLinks({
                    Login: new PageLink(appConfig.login, true, true),
                    Messenger: new PageLink('/', true)
                });
            }
        ]);

    global.app.extendAppModules(['realineMessenger']);
})(window);
