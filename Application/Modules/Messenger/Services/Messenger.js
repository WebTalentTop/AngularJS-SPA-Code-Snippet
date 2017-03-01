(function (global) {
    'use strict';

    global.realineMessenger.factory('messenger', [
    'MessengerEnums', 'messengerUserService', 'authService', 'currentCompanyService',
    'contactsCacheService', 'profileCacheService', 'UniqueEntityCollection',
    'utils', '$q', '$log',
    function (MessengerEnums, messengerUserService, authService, currentCompanyService,
        contactsCacheService, profileCacheService, UniqueEntityCollection,
        utils, $q, $log) {

        var Messenger = Class.extend({
            init: function () {
                this.currentUserPromise = null;
                this.currentUser = null;
                this.currentProfilePromise = null;
                this.currentProfile = null;

                this.friends = new UniqueEntityCollection();
                this.colleagues = new UniqueEntityCollection();                
            },

            getFriends: function () {
                return this.friends;
            },

            getColleagues: function () {
                return this.colleagues;
            },

            getCurrentUser: function () {
                var deferred;

                if (this.currentUserPromise !== null) {
                    return this.currentUserPromise;
                }

                if (this.currentUser) {
                    deferred = $q.defer();
                    deferred.resolve(this.currentUser);
                    return deferred.promise;
                }

                deferred = $q.defer();
                //TODO: check what id is returned by Auth service
                messengerUserService.getCurrentContexts().then(function (result) {
                    if (!result.data.Status) {
                        $log.error('Failed to load company users. ' +
                            errorMessageProvider.getApiErrorMessage(result.data));
                        deferred.reject(result);
                        return;
                    }
                    //we need messenger model for user, so get it
                    var model = contactsCacheService.putRaw(result.data.Model);
                    return contactsCacheService.getp(model.getId());
                }).then(function (result) {
                    //ensure that we were not logged out while waited for response
                    if (this.currentUserPromise !== null) {
                        this.currentUser = result;
                    }
                    deferred.resolve(result);
                }.bind(this), function (error) {
                    //$log.debug('Failed to get current user info. ' + error);
                    deferred.reject(error);
                }).finally(function () {
                    this.currentUserPromise = null;
                });

                this.currentUserPromise = deferred.promise;
                return this.currentUserPromise;
            },

            getCurrentProfile: function () {
                //we need current global user when we create new conversation
                var deferred;

                if (this.currentProfilePromise) {
                    return this.currentProfilePromise;
                }

                if (this.currentProfile) {
                    deferred = $q.defer();
                    deferred.resolve(this.currentProfile);
                    return deferred.promise;
                }

                deferred = $q.defer();

                this.getCurrentUser().then(function (profileGroup) {

                    this.currentProfile = this.currentUser.Profiles.find(function (profile) {
                        return profile.getIsLoggedIn();
                    });

                    deferred.resolve(this.currentProfile);

                }.bind(this), function (error) {
                    deferred.reject(error);
                }).finally(function () {
                    this.currentProfilePromise = null;
                }.bind(this));

                this.currentProfilePromise = deferred.promise;

                return this.currentProfilePromise;
            },

            changeCompany: function (companyId) {
                if (this.currentUser === null) {
                    //does not makes sense to change company because we are not logged in
                    return;
                }

                this.loadNewProfile(companyId);
            },

            logoutCompany: function () {
                if (this.currentUser === null) {
                    //does not mekes sense to change company because we are not logged in
                    return;
                }

                this.currentProfile = this.currentUser.Profiles.find(function (profile) {
                    return profile.getMessengerProfileType() === MessengerEnums.MessengerProfileType.User;
                });

                this.currentUser.Profiles.forEach(function (profile) { profile.setIsLoggedIn(false); });

                this.currentProfile.setIsLoggedIn(true);
            },

            logout: function () {
                this.currentUserPromise = null;
                this.currentUser = null;
                this.currentProfilePromise = null;
                this.currentProfile = null;

                this.friends.clear();
                this.colleagues.clear();
            },

            loadNewProfile: function (contextId) {
                var deferred = $q.defer();

                this.currentProfilePromise = deferred.promise;

                messengerUserService.getCurrentContexts().then(function (result) {
                    var profile, profileModel;
                    var profileGroup;

                    if (!result.data.Status) {
                        $log.error('Failed to load company users. ' +
                            errorMessageProvider.getApiErrorMessage(result.data));
                        deferred.reject(result);
                        return;
                    }

                    profileGroup = result.data;

                    profile = profileGroup.Profiles.findItem(function (item) {
                        return item.IsLoggedIn;
                    });

                    if (this.currentUser.Profiles.containsById(profile.Id)) {
                        profile = this.currentUser.Profiles.find(function (p) {
                            return p.getId() === profile.Id;
                        }, this);

                        this.currentUser.Profiles.forEach(function (profile) { profile.setIsLoggedIn(false); });
                        this.currentProfile = profile;
                        this.currentProfile.setIsLoggedIn(true);
                    }
                    else {
                        if (profile) {
                            profile = profileCacheService.putRaw(profile);
                        }

                        this.currentUser.Profiles.push(profile);
                        this.currentProfile = profile;
                    }

                    deferred.resolve(this.currentProfile);

                }.bind(this), function (error) {
                    deferred.reject(error);
                });
            },
        });

        return new Messenger();
    }
    ]);


})(window);