(function (global) {
    'use strict';

    global.realineModule.factory('baseApiService', ['baseService',
    function(baseService) {

        var baseApiService = baseService.extend({
            _baseUrl: 'api',

            init: function (resource) {
                this._super(resource);
            },

            Save: function (model) {
                return this._sendPostQuery('Save', model);
            },

            Patch: function (model) {
                return this._sendPostQuery('Patch', model);
            },

            List: function (search) {
                return this._sendPostQuery('List', search);
            },

            Get: function (id) {
                return this._sendGetQuery('Get', { id: id });
            },

            Delete: function (id) {
                return this._sendPostQuery('Delete', { id: id });
            },

            DeleteList: function (ids) {
                return this._sendPostQuery('DeleteList', ids);
            }
        });

        return baseApiService;
    }]);
})(window);