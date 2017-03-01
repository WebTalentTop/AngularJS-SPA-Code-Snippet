(function(global) {
    'use strict';

    global.realineModule.factory('userService', [
        '$q', 'baseService', 'Domains',
        function($q, baseService, Domains) {
            var currentUser = { fullName: "Test user" };
            var companies = undefined;

            var userService = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.Auth,

                init: function(resource) {
                    this._super(resource);
                },

                list: function (searchParams) {
                    return this._sendPostQuery('List', searchParams);
                },

                counts: function () {
                    return this._sendGetQuery('Counts');
                },

                getCurrentUser: function() {
                    //if (!currentUser) {
                    //    return this._sendGetQuery('GetCurrent').then(function (result) {
                    //        if (result.data) {
                    //            currentUser = result.data.model;
                    //        }

                    //        return { User: currentUser, Companies: companies };
                    //    }.bind(this));
                    //}

                    return this._returnData({ User: currentUser, Companies: companies });
                },

                /*
                 * @param id not required
                 */
                getProfile: function(id) {
                    //if (!currentUser && !id) {
                    //    return this._sendGetQuery('GetProfile').then(function (result) {
                    //        if (result.data && result.data.model) {
                    //            companies = result.data.model.companies;
                    //            currentUser = result.data.model;
                    //            delete currentUser.companies;
                    //        }

                    //        return { User: currentUser, Companies: companies };
                    //    }.bind(this));
                    //} else if(id) {
                    //    return this._sendGetQuery('GetProfile', { id: id });
                    //}

                    return this._returnData({ User: currentUser, Companies: companies });
                },

                saveSecurityQuestions: function(question1, question2) {
                    return this._sendPostQuery('SaveSecurityQuestions', { model: [question1, question2] });
                },


                loadSecurityQuestions: function () {
                    return this._sendGetQuery('LoadSecurityQuestions');
                },
            });

            return new userService("User");
        }
    ]);
})(window);