(function (global) {
    'use strict';

    global.realineMessenger.factory('UserModel', ['MessengerEnums', 'EntityModel', 'UniqueEntityCollection', 'ProfileModel',
    'utils',
    function (MessengerEnums, EntityModel, UniqueEntityCollection, ProfileModel,
        utils) {
        var DATA_LOADED = 'data loaded',
            UserModel,
            common = utils.common;

        UserModel = EntityModel.extend({
            init: function (data, isLoaded) {
                var d = angular.extend({}, data);

                d.Id = d.GroupId;
                delete d.GroupId;

                this._super(d);
                this.__ClassName = 'UserModel';

                setupName.call(this, data);

                if (utils.common.isNullOrUndefined(this.getStatus())) {
                    this.setStatus(MessengerEnums.UserStatuses.Unknown);
                }

                delete this.data.Profiles;

                this.Profiles = new UniqueEntityCollection();

                processProfiles.call(this, data.Profiles);

                if (common.isUndefined(isLoaded)) {
                    //by default data is loaded
                    this.isLoaded = true;
                } else if (this.isLoaded === true) {
                    this.isLoaded = true;
                }
            },

            getName: function () {
                return this.get(MessengerEnums.PropertyNames.Name);
            },

            setName: function (value) {
                this.set(MessengerEnums.PropertyNames.Name, value);
            },

            getFullName: function () {
                return this.get(MessengerEnums.PropertyNames.FullName);
            },

            setFullName: function (value) {
                this.set(MessengerEnums.PropertyNames.FullName, value);
            },

            getFirstName: function () {
                return this.get(MessengerEnums.PropertyNames.FirstName);
            },

            setFirstName: function (value) {
                this.set(MessengerEnums.PropertyNames.FirstName, value);
            },

            getLastName: function () {
                return this.get(MessengerEnums.PropertyNames.LastName);
            },

            setLastName: function (value) {
                this.set(MessengerEnums.PropertyNames.LastName, value);
            },

            getAvatarThumbUrl: function () {
                return this.get(MessengerEnums.PropertyNames.AvatarThumb);
            },

            setAvatarThumbUrl: function (value) {
                this.set(MessengerEnums.PropertyNames.AvatarThumb, value);
            },

            getStatus: function () {
                return this.get(MessengerEnums.PropertyNames.Status);
            },

            setStatus: function (value) {
                this.set(MessengerEnums.PropertyNames.Status, value);
            },

            isUnknown: function () {
                return this.getStatus() === MessengerEnums.UserStatuses.Unknown;
            },

            isOnline: function () {
                return this.getStatus() === MessengerEnums.UserStatuses.Online;
            },

            isOffline: function () {
                return this.getStatus() === MessengerEnums.UserStatuses.Offline;
            },

            isAway: function () {
                return this.getStatus() === MessengerEnums.UserStatuses.Away;
            },

            isBusy: function () {
                return this.getStatus() === MessengerEnums.UserStatuses.Busy;
            },

            getStausName: function () {
                return this.getStatus().toLowerCase();
            },

            setData: function (data) {
                setupName.call(this, data);

                this.setAvatarThumbUrl(data.AvatarThumb);

                processProfiles.call(this, data.Profiles);

                if (!this.isLoaded) {
                    this.isLoaded = true;
                    this.fireLoaded();
                }
            },

            bindLoaded: function (listener, context) {
                this.eventManager.bind(DATA_LOADED, listener, context);
            },

            unbindLoaded: function (listener, context) {
                this.eventManager.detach(DATA_LOADED, listener, context);
            },

            fireLoaded: function () {
                var event = {
                    type: DATA_LOADED,
                    sender: this
                };

                this.eventManager.fire(event);
            },
        });

        function setupName(data) {
            if (!common.isNullOrEmpty(data.Name)) {
                this.setName(data.Name);
            } else if (!common.isNullOrEmpty(data.FullName)) {
                this.setName(data.FullName);
            }
            else {
                this.setName(data.FirstName + ' ' + data.LastName);
            }
        }

        function processProfiles(profiles) {
            var i,
                profileModel,
                list = [];

            if (utils.common.isNullOrUndefined(profiles)) {
                return;
            }

            for (i = 0; i < profiles.length; i++) {
                profileModel = new ProfileModel(profiles[i]);
                list.push(profileModel);
            }

            this.Profiles.push(list);
        }

        return UserModel;
    }
    ]);

})(window);