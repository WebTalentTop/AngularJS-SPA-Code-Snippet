(function (global) {
    'use strict';

    global.realineMessenger.controller('MessengerToolbarController',
    ['$scope', '$log', '$window', '$', '$q', '$rootScope',
    'MessengerEnums', 'MessengerConstants', 'events', 'messageBus', 'CoreEnums',
    'utils', 'uiSettingsService', 'messengerRemoteControlService',
    function ($scope, $log, $window, $, $q, $rootScope,
    MessengerEnums, MessengerConstants, events, messageBus, CoreEnums,
    utils, uiSettingsService, messengerRemoteControlService) {

        var MessengerToolbarController;

        MessengerToolbarController = Class.extend({
            init: function ($scope) {
                this.scope = $scope;
                this.scope.controller = this;
                this.isInitialized = false;

                this.isStatusMenuVisible = false;

                this.setUserStatus(MessengerEnums.UserStatuses.Offline);

                this.isMuteAllConversations = false;

                //this.bindMessengerEvents();
                this.bindEvents();
            },

            initContainer: function () {


            },

            deinitContainer: function () {

            },

            // begin status menu
            showStatusMenu: function () {
                this.isStatusMenuVisible = true;
            },

            hideStatusMenu: function () {
                this.isStatusMenuVisible = false;
            },

            onUserStatusChanged: function (event) {
                this.setUserStatus(event.status);
            },

            setUserStatus: function (status) {
                this.userStatus = status;
                this.userStatusStyle = getCssClassByStatus(status);
                this.userStatusTitle = getStatusTitle(status);
            },

            setUserStatusRemote: function (status) {
                messengerRemoteControlService.setUserStatus(status);
                this.hideStatusMenu();
            },

            setOnline: function () {
                this.setUserStatusRemote(MessengerEnums.UserStatuses.Online);
            },

            setOffline: function () {
                this.setUserStatusRemote(MessengerEnums.UserStatuses.Offline);
            },

            setAway: function () {
                this.setUserStatusRemote(MessengerEnums.UserStatuses.Away);
            },

            setBusy: function () {
                this.setUserStatusRemote(MessengerEnums.UserStatuses.Busy);
            },

            setupUnavailableMessage: function () {
                messengerRemoteControlService.setupUnavailableMessage();
            },

            isConnected: function () {
                return this.userStatus !== MessengerEnums.UserStatuses.Offline;
            },
            // end status menu

            showActionsMenu: function () {
                this.isActionsMenuVisible = true;
            },

            hideActionsMenu: function () {
                this.isActionsMenuVisible = false;
            },

            closeAllConversationTabs: function () {
                messengerRemoteControlService.closeAllConversationTabs();
            },

            setMuteAll: function () {
                messengerRemoteControlService.setMuteAllConversations(!this.isMuteAllConversations);
            },

            canMuteAll: function () {
                return this.isConnected();
            },

            onMuteAllConversationsChanged: function (event) {
                this.isMuteAllConversations = event.value;
            },

            bindEvents: function () {
                messageBus.bind(events.userStatusChanged, this.onUserStatusChanged, this);
                messageBus.bind(events.muteAllConversationsChanged, this.onMuteAllConversationsChanged, this);

                this.scope.$on('$destroy', function () {
                    messageBus.detach(events.userStatusChanged, this.onUserStatusChanged, this);
                    messageBus.detach(events.muteAllConversationsChanged, this.onMuteAllConversationsChanged, this);
                }.bind(this));
            },
        });

        function getCssClassByStatus(status) {
            switch (status) {
                case MessengerEnums.UserStatuses.Unknown:
                    return 'unknown';
                case MessengerEnums.UserStatuses.Online:
                    return 'online';
                case MessengerEnums.UserStatuses.Offline:
                    return 'offline';
                case MessengerEnums.UserStatuses.Away:
                    return 'away';
                case MessengerEnums.UserStatuses.Busy:
                    return 'busy';
            }
        }

        function getStatusTitle(status) {
            switch (status) {
                case MessengerEnums.UserStatuses.Unknown:
                    return 'Unknown';
                case MessengerEnums.UserStatuses.Online:
                    return 'Online';
                case MessengerEnums.UserStatuses.Offline:
                    return 'Offline';
                case MessengerEnums.UserStatuses.Away:
                    return 'Away';
                case MessengerEnums.UserStatuses.Busy:
                    return 'Busy';
            }
        }

        return new MessengerToolbarController($scope);
    }
    ]);

})(window);