(function (global) {
    'use strict';

    global.realineMessenger.factory('messengerUserService', [
    'baseApiService', 'Domains', function (baseApiService, Domains) {

        var MessengerUserService = baseApiService.extend({
            _domain: Domains.MessengerUser,

            init: function (resource) {
                this._super(resource);
            },

            searchUsers: function (params) {
                return this._sendGetQuery('SearchUsers', params);
            },

            searchFriends: function (params) {
                return this._sendGetQuery('SearchFriends', params);
            },
            
            getCurrentContexts: function () {
                return this._sendGetQuery('GetCurrentContexts');
            },

            getCompanyUsers: function (request) {
                return this._sendGetQuery('GetCompanyUsers', request);
            },
        });

        return new MessengerUserService('User');
    }
    ]);

})(window);