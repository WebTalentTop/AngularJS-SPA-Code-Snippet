(function (global) {
    'use strict';

    global.realineModule.factory('BaseController', [
        '$routeParams', 'backService', 'toastrService', 'utils', 'pageNavigationService', 'authConstants', 'CrossDomainStorage', 'authToken', '$localStorage', '$q', '$timeout',
        function ($routeParams, backService, toastrService, utils, pageNavigationService, authConstants, CrossDomainStorage, authToken, $localStorage, $q, $timeout) {

            var common = utils.common;

            var controller = Class.extend({

                init: function ($scope) {
                    this.scope = $scope;
                    this.common = common;
                    this.pageLinks = pageNavigationService.pageLinks;

                    this.scope.$on('$destroy', function () {
                        this.onDestroy();
                    }.bind(this));

                    $scope.$on('$viewContentLoaded', function () {
                        this.onLoaded();
                    }.bind(this));
                },

                initPageLoad: function() {
                    this.checkAuth().then(function () {
                        this.load();
                    }.bind(this));
                },

                load: function () {
                },

                back: function () {
                    backService.back();
                },

                onDestroy: function () {

                },

                onLoaded: function() {
                    this.loaded = true;
                },

                wait: function (dfd, msg, indicationOff) {
                    !indicationOff && this.scope.enableLoadingIndicator(dfd);

                    msg && dfd.then(function () {
                        toastrService.success(msg);
                    });
                },

                checkAuth: function() {
                    var dfd = $q.defer();

                    CrossDomainStorage.get(authConstants.localStorage).then(function (response) {
                        if(!response.value){
                            pageNavigationService.changeLocation(pageNavigationService.pageLinks.Login, { returnUrl: window.location.href });
                            return;
                        }

                        authToken = response.value;
                        $localStorage[authConstants.localStorage] = response.value;
                        
                        dfd.resolve('succeed');                        
                    });

                    return dfd.promise;
                }
            });

            return controller;
        }
    ]);
})(window);