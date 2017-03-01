(function(global) {
    'use strict';

    global.realineModule.factory('companyAuthService', [
        '$q', 'baseService', 'Domains',
        function($q, baseService, Domains) {
            var authService = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.CompanyAuth,

                login: function(model) {
                    return this._sendPostQuery('Login', model);
                }
            });

            return new authService("Auth");
        }
    ]);
})(window);