(function(global) {
    'use strict';

    global.realineModule.factory('authService', [
        '$q', 'baseService', 'cookieService', 'authConstants', 'Domains',
        function($q, baseService, cookieService, authConstants, Domains) {
            var authService = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.Auth,

                init: function(resource) {
                    this._super(resource);
                },

                login: function(model) {
                    return this._sendPostQuery('Login', model);
                },

                getCurrentUser: function () {
                    return this._sendGetQuery('GetCurrent');
                },

                sendCode: function() {
                    return this._sendPostQuery('SendCode');
                },

                verify: function(code) {
                    return this._sendPostQuery('Verify', { Token: code });
                },

                signUp: function(model) {
                    return this._sendPostQuery('Register', model);
                },

                SetCompany: function(companyId) {
                    return this._sendPostQuery('SetCompany', { Id: companyId });
                },

                sendVerificationCode: function(phone) {
                    return this._sendPostQuery('SendVerificationCode', { VerificationType: 1, Phone: phone });
                },

                logOut: function() {
                    return this._sendPostQuery('Logout');
                },

                companyLogOut: function(id) {
                    return this._sendPostQuery('CompanyLogOut', { Id: id });
                },

                getSecurityQuestions: function() {
                    return this._sendGetQuery('GetSecurityQuestions');
                },

                saveSecurityAnswers: function(answer1, answer2) {
                    return this._sendPostQuery('SaveSecurityAnswers', { AnswerItems: [answer1, answer2] });
                },

                getSecurityAnswers: function () {
                    return this._sendGetQuery('GetSecurityAnswers');
                },

                changePassword: function(model) {
                    return this._sendPostQuery('ChangePassword', model);
                },

                getAdditionalData: function() {
                    return this._sendGetQuery('GetAdditionalData');
                },

                saveContactInformation: function (model) {
                    return this._sendPostQuery('SaveInfo', model);
                },

                connectWithCode: function (model) {
                    var result = {};
                    result.data = {};
                    result.data.Status = true;

                    return this._returnData( result );

                    //return this._sendPostQuery('connectWithCode', model);
                }
            });

            return new authService("Auth");
        }
    ]);
})(window);