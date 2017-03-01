(function (global) {
    'use strict';

    global.realineMessenger.factory('profileCacheService', [
    '$q', '$log', 'EntityModelCacheService', 'ProfileModel', 'messengerUserService', 'utils',
    function ($q, $log, EntityModelCacheService, ProfileModel, messengerUserService, utils) {

        //this service stores global users in a dictionary for later use
        //external code can put global user to cache and get from cache
        //if user is absent then service will return reference empty object and request data from server. 
        //retruned object will be filled later

        var profileCacheService = EntityModelCacheService.extend({
            init: function () {
                this._super(ProfileModel);
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
                user = new ProfileModel({ Id: id }, false);
                this.dict[id] = user;
                this.defers[id] = $q.defer();

                //get user by id
                (function (u, cache) {
                    var request = { Ids: [u.getId()] };

                    messengerUserService.searchUsers(request).then(function (result) {
                        var userData;

                        if (!result.data.Status) {
                            $log.debug('Failed to get global users by ids. ' + result.Message);
                            cache.defers[u.getId()].reject(false);
                            return;
                        }

                        if (utils.common.isNullOrUndefined(result.data.Model.List) || result.data.Model.List.length === 0) {
                            $log.debug(String.format('Not found global user by id {0}', u.getId()));
                            cache.defers[u.getId()].reject('Not found');
                            return;
                        }

                        //fill in object
                        var responseModel = result.data.Model.List[0];
                        var profile = responseModel.Profiles.findById(u.getId());
                        if (profile == null) {
                            $log.debug('Profile was not found by Id=' + u.getId());
                            return;
                        }

                        u.setData(profile);

                        cache.processAddedEntity(u);
                    }, function (result) {
                        //error
                        $log.debug('Failed to get user by id.' + u.getId());
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

                deferred = this.defers[entityModel.getId()];

                if (utils.common.isUndefined(deferred)) {
                    deferred = $q.defer();
                    this.defers[entityModel.getId()] = deferred;
                }

                deferred.resolve(entityModel);
            },
        });

        return new profileCacheService();
    }
    ]);


})(window);