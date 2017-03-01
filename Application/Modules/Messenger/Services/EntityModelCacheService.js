(function (global) {
    'use strict';

    global.realineMessenger.factory('EntityModelCacheService', ['utils', function (utils) {

        //this service stores entity models in a dictionary for later use
        //external code can put user to cache and get from cache        

        var EntityModelCacheService = Class.extend({
            init: function (EntityModelClass) {
                this.dict = {};
                this.EntityModelClass = EntityModelClass;
            },

            put: function (entityModel) {
                /*
                 * adds model to cache
                 */
                var i;

                if (angular.isArray(entityModel)) {

                    for (i = 0; i < entityModel.length; i++) {
                        addOneInternal.call(this, entityModel[i]);
                    }

                } else if (angular.isObject(entityModel)) {
                    return addOneInternal.call(this, entityModel);
                }
            },

            putRaw: function (model) {
                var user = this.dict[model.Id];

                if (user) {
                    return user;
                }

                model = new this.EntityModelClass(model);
                this.put(model);

                return model;
            },

            get: function (id) {
                /*
                 * get - returns entity model from cache. 
                 */
                var entityModel = this.dict[id];

                if (entityModel) {
                    return entityModel;
                }

                return null;
            },

            isCached: function (id) {
                return this.dict.hasOwnProperty(id);
            },

            getAll: function () {
                var list = [];
                for (var id in this.dict) {
                    list.push(this.dict[id]);
                }

                return list;
            },

            clear: function () {
                this.dict = {};
            },

            processAddedEntity: function (entityModel) {

            },

        });

        function addOneInternal(entityModel) {
            var oldEntityModel = this.dict[entityModel.getId()];

            if (!oldEntityModel) {
                this.dict[entityModel.getId()] = entityModel;
                this.processAddedEntity(entityModel);
                return entityModel;
            }
            else {
                if (oldEntityModel !== entityModel) {
                    copyModel(entityModel, oldEntityModel);
                }

                return oldEntityModel;
            }
        }

        function copyModel(source, dest) {
            var property;

            for (var propName in source.data) {
                property = source.data[propName];

                if (!angular.isFunction(property)) {
                    dest.set(propName, source.data[propName]);
                }
            }
        }

        return EntityModelCacheService;
    }
    ]);


})(window);