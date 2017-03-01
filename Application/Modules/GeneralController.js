(function (global) {
    'use strict';

    global.realineModule.controller('GeneralController', [
        '$rootScope', '$scope', 'BaseController', 'pageNavigationService', 'authService', 'extendApplier', 'events', 'messageBus', 'companyAuthService',
        'cookieService', 'authConstants', '$location', '$q', 'contextMasterDirectoryService', 'connectionService', 'appConfig',
        'uiSettingsService',
        function ($rootScope, $scope, BaseController, pageNavigationService, authService, extendApplier, events, messageBus, companyAuthService,
            cookieService, authConstants, $location, $q, contextMasterDirectoryService, connectionService, appConfig,
            uiSettingsService) {

            var controller = BaseController.extend({
                soon: function () { alert("will be implemented soon"); },

                IsShowFeedback: false,
                isShowCompaniesList: false,


                init: function ($scope) {
                    this._super($scope);

                    this.isProfileMenuVisible = false;

                    this.scope.constructor.prototype.safeApply = function (fn) {
                        var phase = this.$root.$$phase;
                        if (phase == "$apply" || phase == "$digest") {
                            if (fn && (typeof (fn) === "function")) {
                                fn();
                            }
                        } else {
                            this.$apply(fn);
                        }
                    };

                    this.scope.enableLoadingIndicator = function (dfd) {
                        if (dfd) {
                            $scope.loadingPromise = dfd;
                        }
                    };

                    this.scope.generalLoad = this.load.bind(this);
                    this.scope.generalLogout = this.logout.bind(this);
                    $rootScope.currentUser = this.currentUser;
                    $rootScope.appConfig = appConfig;

                    this.currentTab = $location.$$path === "/" ? '/general' : $location.$$path;

                    this.scope.isSideBarCollapsed = !!uiSettingsService.getIsSideBarCollapsed();

                    this.scope.$watch(this.scope.isSideBarCollapsed, function (newValue) {
                        uiSettingsService.setIsSideBarCollapsed($scope.isSideBarCollapsed);
                    });
                },

                currentUser: {
                    logged: false,
                    showChildActions: false,
                    user: undefined,
                    profile: undefined
                },

                currentCompany: undefined,
                Companies: undefined,

                load: function () {
                    var dfds = [];

                    dfds.push(this.loadCompanies());

                    dfds.push(authService.getCurrentUser().then(function (result) {
                        this.currentUser.logged = true;
                        this.currentUser.user = result.data.Model;
                        this.currentUser.user.FullName = this.currentUser.user.FirstName + " " + this.currentUser.user.LastName;
                    }.bind(this)));

                    this.wait($q.all(dfds));
                },

                loadCompanies: function () {
                    //TODO: figure out how to load companies. This code does not work because of 404
                    //var dfds = [];

                    //dfds.push(connectionService.searchRequests({
                    //    SearchAsCurrentUser: true,
                    //    SocialType: { Value: 1 },
                    //    Status: { Value: 2 }
                    //}).then(function (response) {
                    //    if (!response) {
                    //        //TODO: temporary fix
                    //        this.socialCompanies = [];
                    //        return;
                    //    }
                    //    this.socialCompanies = response.data.Model.List;
                    //}.bind(this)));

                    //dfds.push(contextMasterDirectoryService.getUserCompanies().then(function (response) {
                    //    this.Companies = response.data.Model;
                    //}.bind(this)));

                    //return $q.all(dfds).then(function () {
                    //    $scope.companiesDicto = {};

                    //    this.Companies.forEach(function (outer) {
                    //        this.socialCompanies.forEach(function (inner) {
                    //            if (outer.GlobalIndexIdOfContext === inner.SocialGlobalIndexId) {
                    //                $scope.companiesDicto[outer.GlobalIndexIdOfContext] = {
                    //                    contextMaster: outer,
                    //                    social: inner
                    //                };
                    //            }
                    //        });
                    //    }.bind(this));
                    //}.bind(this));
                },

                SelectCompany: function () {
                    var company = this.preselectedCompany;

                    this.Companies = this.Companies || { List: [] };

                    for (var i = 0; i < this.Companies.length; i++) {
                        this.Companies[i].IsCurrent = false;
                    }

                    var dfd = companyAuthService.login({
                        Login: company.ConnectionLogin,
                        Password: this.companyPassword
                    }).then(function (response) {
                        if (response.data.Errors.length > 0) {
                            return;
                        }

                        this.currentCompany = $scope.companiesDicto[company.GlobalIndexIdOfContext].social;

                        $scope.$broadcast(events.currentCompanyChanged, company);

                        this.preselectedCompany = null;
                        this.companyPassword = null;
                        this.isShowCompaniesList = false;
                    }.bind(this));

                    $scope.enableLoadingIndicator(dfd);
                },

                logout: function () {
                    this.currentUser.logged = false;
                    this.currentUser.user = undefined;
                    this.currentUser.profile = undefined;
                    this.currentCompany = undefined;

                    authService.logOut();
                    messageBus.fire(events.logout);
                    pageNavigationService.changeLocation(pageNavigationService.pageLinks.Login);
                    cookieService.removeCookie(authConstants.cookie);
                    this.IsShowFeedback = false;
                    this.isProfileMenuVisible = false;
                },

                getUrl: function (urlName) {
                    return pageNavigationService.pageLinks[urlName].Url;
                },

                redirectToAbout: function () {
                    this.isProfileMenuVisible = false;
                },
            });

            extendApplier.applyFn.bind(this, controller, $scope)();
        }
    ]);
})(window);
