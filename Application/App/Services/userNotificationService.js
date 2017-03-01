(function (global) {
    'use strict';

    global.realineModule.factory('userNotificationService', [
        '$q', 'baseService', 'Domains',
        function ($q, baseService, Domains) {
            var userNotificationService = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.Auth,

                init: function (resource) {
                    this._super(resource);
                },

                verify: function (code) {
                    return this._sendPostQuery('Verify', { Token: code });
                },

                sendVerificationCode: function () {
                    return this._sendPostQuery('SendVerificationCode', { VerificationType: 1 });
                },

                requestRecovery: function (model) {
                    return this._sendPostQuery('RequestRecovery', model);
                }
            });

            return new userNotificationService("UserNotification");
        }
    ]);
})(window);