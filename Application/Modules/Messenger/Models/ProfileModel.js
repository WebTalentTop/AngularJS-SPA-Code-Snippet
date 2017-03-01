(function (global) {
    'use strict';

    global.realineMessenger.factory('ProfileModel', ['MessengerEnums', 'EntityModel', 'utils', '$log',
        function (MessengerEnums, EntityModel, utils, $log) {
            var DATA_LOADED = 'data loaded';

            var ProfileModel = EntityModel.extend({
                init: function (data, isLoaded) {
                    var d = angular.extend({}, data);

                    this._super(d);
                    this.__ClassName = 'ProfileModel';

                    setupName.call(this, data);

                    if (utils.common.isUndefined(isLoaded)) {
                        //by default data is loaded
                        this.isLoaded = true;
                    }
                    else if (this.isLoaded === true) {
                        this.isLoaded = true;
                    }
                },

                getGlobalMasterId: function () {
                    $log.error('ProfileModel->getGlobalMasterId');
                    return this.get(MessengerEnums.PropertyNames.GlobalMasterId);
                },

                setGlobalMasterId: function (value) {
                    $log.error('ProfileModel->setGlobalMasterId');
                    this.set(MessengerEnums.PropertyNames.GlobalMasterId, value);
                },

                getGroupId: function () {
                    return this.get(MessengerEnums.PropertyNames.GroupId);
                },

                setGroupId: function (value) {
                    this.set(MessengerEnums.PropertyNames.GroupId, value);
                },

                getName: function () {
                    return this.get(MessengerEnums.PropertyNames.Name);
                },

                setName: function (value) {
                    this.set(MessengerEnums.PropertyNames.Name, value);
                },

                getTitle: function () {
                    if (this.getMessengerProfileType() === MessengerEnums.MessengerProfileType.Company) {
                        return String.format('{0} ({1})', this.getName(), this.getContextName());
                    } else {
                        return this.getName();
                    }
                },

                getMessengerProfileType: function () {
                    return this.get(MessengerEnums.PropertyNames.MessengerProfileType);
                },

                setMessengerProfileType: function (value) {
                    this.set(MessengerEnums.PropertyNames.MessengerProfileType, value);
                },

                getIsLoggedIn: function () {
                    return this.get(MessengerEnums.PropertyNames.IsLoggedIn);
                },

                setIsLoggedIn: function (value) {
                    this.set(MessengerEnums.PropertyNames.IsLoggedIn, value);
                },

                getAvatarThumbUrl: function () {
                    return this.get(MessengerEnums.PropertyNames.AvatarThumb);
                },

                setAvatarThumbUrl: function (value) {
                    this.set(MessengerEnums.PropertyNames.AvatarThumb, value);
                },

                getAvatarSourceUrl: function () {
                    return this.get(MessengerEnums.PropertyNames.AvatarSourceUrl);
                },

                setAvatarSourceUrl: function (value) {
                    this.set(MessengerEnums.PropertyNames.AvatarSourceUrl, value);
                },
                
                getContextGlobalMasterId: function () {
                    return this.get(MessengerEnums.PropertyNames.ContextGlobalMasterId);
                },

                setContextGlobalMasterId: function (value) {
                    this.set(MessengerEnums.PropertyNames.ContextGlobalMasterId, value);
                },

                getContextName: function () {
                    return this.get(MessengerEnums.PropertyNames.ContextName);
                },

                setContextName: function (value) {
                    this.set(MessengerEnums.PropertyNames.ContextName, value);
                },

                getContextNameText: function () {
                    if (utils.common.isNullOrUndefined(this.getContextName)) {
                        return '';
                    }
                    else {
                        return this.getContextName();
                    }
                },

                setData: function (data) {

                    this.setGroupId(data.GroupId);
                    setupName.call(this, data);
                    this.setMessengerProfileType(data.MessengerProfileType);
                    this.setContextGlobalMasterId(data.ContextGlobalMasterId);
                    this.setContextName(data.ContextName);
                    this.setAvatarThumbUrl(data.AvatarThumb);
                    this.setAvatarSourceUrl(data.AvatarSourceUrl);

                    this.isLoaded = true;

                    this.fireLoaded();
                },

                setUserData: function (data) {
                    this.setName(data.FirstName + ' ' + data.LastName);
                    this.setAvatarThumbUrl(data.AvatarThumb);
                    this.setAvatarSourceUrl(data.AvatarSourceUrl);
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
                if (!utils.common.isNullOrEmpty(data.Name)) {
                    this.setName(data.Name);
                } else if (!utils.common.isNullOrEmpty(data.FullName)) {
                    this.setName(data.FullName);
                }
                else if (!utils.common.isNullOrEmpty(data.FirstName)
                    && !utils.common.isNullOrEmpty(data.LastName)) {
                    this.setName(data.FirstName + ' ' + data.LastName);
                }
                //else{
                //    this.Set
                //}
            }

            return ProfileModel;
        }
    ]);

})(window);