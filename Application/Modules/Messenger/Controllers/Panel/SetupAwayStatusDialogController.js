(function (global) {
    'use strict';

    global.app.controller('SetupAwayStatusDialogController', [
    'settings', 'contacts', 'BasePopupController', 'profileCacheService', 'messengerHub',
    'MessengerEnums', '$scope', '$log', '$q', '$uibModalInstance', '$', 'utils',
    function (settings, contacts, BasePopupController, profileCacheService, messengerHub,
        MessengerEnums, $scope, $log, $q, $uibModalInstance, $, utils) {

        var Controller = BasePopupController.extend({
            init: function (scope) {
                var selectedUser;

                this._super(scope, $uibModalInstance);

                $scope.c = this;

                this.$scope.settings = settings;

                $scope.contacts = this.buildContactList(contacts);

                this.$scope.user = {};

                if (!utils.common.isNullOrEmpty(this.$scope.settings.RedirectProfileId)) {
                    this.$scope.user.selected = profileCacheService.get(this.$scope.settings.RedirectProfileId);

                    selectedUser = $scope.contacts.findItem(function (user) {
                        return user.getId() === this.$scope.settings.RedirectProfileId;
                    }, this);

                    if (utils.common.isNullOrUndefined(selectedUser)) {
                        $scope.contacts.push(this.$scope.user.selected);
                    }
                }
                else {
                    this.$scope.user.selected = null;
                }

                $scope.contacts = _.sortBy($scope.contacts, function (item) {
                    return item.getTitle();
                });
            },

            buildContactList: function (users) {
                var i,
                    j,
                    user,
                    list = [];

                for (i = 0; i < users.length; i++) {
                    user = users[i];
                    for (j = 0; j < user.Profiles.length() ; j++) {
                        list.push(user.Profiles.get(j));
                    }
                }

                return list;
            },

            loadData: function () {

            },

            onUserSelected: function (newUser) {
                //backward binding does not work for some reason, so we use event
                //this.$scope.user.selected = newUser;
            },

            apply: function () {
                if (!utils.common.isNullOrUndefined(this.$scope.user.selected)) {
                    this.$scope.settings.RedirectProfileId = this.$scope.user.selected.getId();
                }
                else {
                    this.$scope.settings.RedirectProfileId = null;
                }

                messengerHub.setUserSettings(this.$scope.settings).then(function () {
                    $uibModalInstance.close(this.$scope.settings);
                }.bind(this), function (result) {
                    $log.error('Failed to save chat settings. ' + result);
                });

            },
        });


        return new Controller($scope);
    }
    ]);

})(window);