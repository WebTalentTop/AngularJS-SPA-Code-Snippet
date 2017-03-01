(function (global) {
    'use strict';

    global.realineMessenger.factory('contactsCacheService', [
    '$q', '$log', 'profileCacheService', 'EntityModelCacheService', 'UserModel',
    'messengerUserService', 'utils',
    function ($q, $log, profileCacheService, EntityModelCacheService, UserModel,
        messengerUserService, utils) {

        //this service stores users (contacts) in a dictionary for later use
        //external code can put user to cache and get from cache
        //if user is absent then service will return reference empty object and request data from server. 
        //retruned object will be filled later

        var ContactsCacheService = EntityModelCacheService.extend({
            init: function () {
                this._super(UserModel);
                this.defers = {};
            },

            get: function (id) {
                /*
                 * get - returns user from cache. If absent then empty object will be returned
                 * object will be filled in later
                 */
                var user = this.dict[id];

                if (user) {
                    return user;
                }

                //add to dictionary
                user = new UserModel({ GlobaIndexId: id }, false);
                this.dict[id] = user;
                this.defers[id] = $q.defer();

                //get user by id
                (function (u, cache) {
                    var request = { ProfileGroupIds: [u.getId()] };

                    messengerUserService.searchUsers(request).then(function (result) {
                        var userData;

                        if (!result.data.Status) {
                            $log.debug('Failed to get users by ids. ' + result.Message);
                            cache.defers[u.getId()].reject(false);
                            return;
                        }

                        if (utils.common.isNullOrUndefined(result.data.Model.List) || result.data.Model.List.length === 0) {
                            $log.debug(String.format('Not found user by id {0}', u.getId()));
                            cache.defers[u.getId()].reject('Not found');
                            return;
                        }

                        //fill in object
                        var responseModel = result.data.Model.List[0];

                        u.setData(responseModel);

                        cache.processAddedEntity(u);
                    }, function (error) {
                        //error
                        $log.debug('Failed to get user by id.' + error);
                        cache.defers[u.getId()].reject(error);
                    });

                })(user, this);

                return user;
            },

            getp: function (id) {
                this.get(id);

                return this.defers[id].promise;
            },

            clear: function () {
                this._super();
                this.defers = {};
            },

            processAddedEntity: function (entityModel) {
                var deferred;

                entityModel.Profiles.forEach(function (profile) {
                    profileCacheService.put(profile);
                });

                deferred = this.defers[entityModel.getId()];

                if (utils.common.isUndefined(deferred)) {
                    deferred = $q.defer();
                    this.defers[entityModel.getId()] = deferred;
                }

                deferred.resolve(entityModel);
            },
        });

        return new ContactsCacheService();
    }
    ]);


})(window);