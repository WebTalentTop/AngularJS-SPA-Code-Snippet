(function(global) {
    'use strict';

    global.realineModule.factory('contextMasterDirectoryService', [
        '$q', 'baseService', 'Domains',
        function($q, baseService, Domains) {
            var service = baseService.extend({
                _baseUrl: 'api',
                _domain: Domains.Context,

                getUserCompanies: function() {
                    //return this._returnData({
                    //    data: {
                    //        Model: [
                    //            {
                    //                "ContextId": "590e2af1-613c-491b-a904-04b0fdca21ea",
                    //                "ContextName": "comapny 1",
                    //                "AuthAddress": "sample string 3",
                    //                "Id": "fb23fddc-2b99-4f28-bc5a-e14a3c6ea3a2"
                    //            },
                    //            {
                    //                "ContextId": "590e2af1-613c-491b-a904-04b0fdca21ea",
                    //                "ContextName": "comapny 2",
                    //                "AuthAddress": "sample string 3",
                    //                "Id": "fb23fddc-2b99-4f28-bc5a-e14a3c6ea3a2"
                    //            }
                    //        ]
                    //    }
                    //});

                    return this._sendGetQuery('GetUserCompanies');
                },

                markContextIsActive: function(model) {
                    return this._sendPostQuery('MarkContextIsActive', model);
                },

                disconnectUser: function (model) {
                    return this._sendPostQuery('DisconnectUser', model);
                }
            });

            return new service("Context");
        }
    ]);
})(window);
