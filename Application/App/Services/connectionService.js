(function(global) {
    'use strict';

    global.realineModule.factory('connectionService', [
        '$q', 'baseService', 'Domains',
        function($q, baseService, Domains) {
            var service = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.SocialSearch,

                init: function(resource) {
                    this._super(resource);
                },

                searchRequests: function(searchParams) {
                    return this._sendPostQuery('SearchRequests', searchParams);
                }
            });

            return new service("Search");
        }
    ]);
})(window);
