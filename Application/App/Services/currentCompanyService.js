(function (global) {
    'use strict';

    global.realineModule.service('currentCompanyService', ['contextMasterDirectoryService', '$q', 'cookieService', 'authService', 'authConstants',
        function (contextMasterDirectoryService, $q, cookieService, authService, authConstants) {
            this.currentCompany = null;
            this.companies = null;

            this.getCurrentCompanyId = function () {
                return null;//cookieService.cookie(authConstants.currentCompanyCookie);
            },

            this.getCurrentCompany = function () {
                if (this.currentCompany != null) {
                    var d = $q.defer();
                    d.resolve(this.currentCompany);
                    return d.promise;
                } else {
                    return contextMasterDirectoryService.getUserCompanies().then(function (response) {
                        var i;
                        var company;
                        var context;

                        for (i = 0; i < response.data.Model.length; i++) {
                            company = response.data.Model[i];

                            if (company.IsLogged) {
                                this.currentCompany = {
                                    GlobalIndexId: company.GlobalIndexIdOfContext,
                                    Name: company.Name,
                                }

                                break;
                            }
                        }

                        var d = $q.defer();
                        d.resolve(this.currentCompany);
                        return d.promise;

                    }.bind(this));
                }
            };
        }
    ]);
})(window);
