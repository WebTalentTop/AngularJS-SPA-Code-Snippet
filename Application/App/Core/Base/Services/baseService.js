(function (global) {
    'use strict';

    global.realineModule.factory('baseService', [
        '$http', '$q', 'authConstants', 'CrossDomainStorage', 'authToken', '$localStorage',
        'customHeaders',
        function ($http, $q, authConstants, CrossDomainStorage, authToken, $localStorage,
            customHeaders) {

            var DEFAULT_VERSION = '1.0.0.0';

            var baseService = Class.extend({
                _domain: '',
                _baseUrl: '',
                _pathSeparator: '/',

                init: function (resource) {
                    this.resource = resource;
                },

                _buildUrl: function (action) {
                    if (!action) {
                        return [this._domain, this._baseUrl, this.resource].join(this._pathSeparator);
                    } else {
                        return [this._domain, this._baseUrl, this.resource, action].join(this._pathSeparator);
                    }
                },

                _sendGetQuery: function (action, data, version) {
                    var options = { method: 'GET', url: this._buildUrl(action), params: data/*, withCredentials: true*/ };

                    if (version === undefined) {
                        version = DEFAULT_VERSION;
                    }

                    options.headers = {};

                    if (version) {
                        options.headers[customHeaders.version] = version;
                    }
                   
                    authToken = $localStorage[authConstants.localStorage];
                    if (authToken) {
                        options.headers[authConstants.header] = authToken;
                    }

                    return $http(options)
                        .success(function (data, status, headers, config) {
                            return data;
                        }).error(function (data, status, headers, config) {
                            return data;
                        });
                },

                _sendPostQuery: function (action, data, version) {
                    var options = { method: 'POST', url: this._buildUrl(action), data: data/*, withCredentials : true*/ };

                    if (version === undefined) {
                        version = DEFAULT_VERSION;
                    }

                    options.headers = {};

                    if (version) {
                        options.headers[customHeaders.version] = version;
                    }

                    authToken = $localStorage[authConstants.localStorage];
                    if (authToken) {
                        options.headers[authConstants.header] = authToken;
                    }

                    return $http(options)
                        .success(function (data, status, headers, config) {
                            return data;
                        }).error(function (data, status, headers, config) {
                            return data;
                        });
                },

                _returnData: function (obj) {
                    var defer = $q.defer();
                    defer.resolve(obj);
                    return defer.promise;
                }
            });

            return baseService;
        }]);
})(window);
