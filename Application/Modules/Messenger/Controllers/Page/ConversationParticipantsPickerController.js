(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationParticipantsPickerController',
    ['messengerUserService', 'messenger', 'messengerHub', 'MessengerEnums', 'CoreEnums', 'BusyIndicator',
        'UserModel', 'utils', 'errorMessageProvider', 'hubConnection', '$scope', '$log', '$timeout', '$q',
    function (messengerUserService, messenger, messengerHub, MessengerEnums, CoreEnums, BusyIndicator,
        UserModel, utils, errorMessageProvider, hubConnection, $scope, $log, $timeout, $q) {

        var Controller = Class.extend({
            init: function (scope) {
                this.scope = scope;
                this.scope.controller = this;

                this.currentContextGlobalMasterId = null;

                this.busyIndicator = new BusyIndicator();

                this.scope.selectedUsers = { selected: this.scope.conversation.getParticipants(true) };
                this.participants = {};
                this.participants[this.scope.currentUser.getId()] = true;

                this.registerParticipant(this.scope.selectedUsers.selected);

                this.bindEvents();

                this.loadData();
            },

            bindEvents: function () {
                this.scope.$on('$destroy', function () {
                    this.onDestroy();
                }.bind(this));

                this.scope.conversation.Participants.bindCollectionChanged(this.Participants_Changed, this);
            },

            onDestroy: function () {
                this.scope.conversation.Participants.unbindCollectionChanged(this.Participants_Changed, this);
            },
          
            Participants_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onParticipantAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onParticipantRemoved(event);
                        break;
                    case CoreEnums.CollectionAction.Replace:
                        //implement later
                        break;
                }

            },

            onParticipantAdded: function (event) {
                var i;
                var indexOf;
                var user;

                for (i = 0; i < event.newItems.length; i++) {
                    user = event.newItems[i];

                    indexOf = this.scope.selectedUsers.selected.findIndex(function (u) {
                        return u.getId() === user.getId();
                    }, this);

                    if (indexOf < 0) {
                        this.scope.selectedUsers.selected.push(user);
                        this.registerParticipant(user);
                    }
                }
            },

            onParticipantRemoved: function (event) {
                var i;
                var indexOf;
                var user;

                for (i = 0; i < event.oldItems.length; i++) {
                    user = event.oldItems[i];

                    indexOf = this.scope.selectedUsers.selected.findIndex(function (u) {
                        return u.getId() === user.getId();
                    }, this);

                    if (indexOf > -1) {
                        this.scope.selectedUsers.selected.splice(indexOf, 1);
                        this.unregisterParticipant(user);
                    }
                }
            },

            registerParticipant: function (p) {
                if (!angular.isArray(p)) {
                    this.participants[p.getGroupId()] = true;
                }
                else {
                    for (var i = 0; i < p.length; i++) {
                        this.participants[p[i].getGroupId()] = true;
                    }
                }
            },

            unregisterParticipant: function (p) {
                if (!angular.isArray(p)) {
                    delete this.participants[p.getGroupId()];
                }
                else {
                    for (var i = 0; i < p.length; i++) {
                        delete this.participants[p[i].getGroupId()];
                    }
                }
            },

            isRegisteredUser: function (user) {
                return this.participants.hasOwnProperty(user.getId());
            },

            isRegisteredProfile: function (profile) {
                return this.participants.hasOwnProperty(profile.getGroupId());
            },

            //
            // participants pick up
            //

            buildContactList: function (users) {
                var i,
                    j,
                    user,
                    profiles,
                    list = [];

                for (i = 0; i < users.length; i++) {
                    user = users[i];

                    if (this.isRegisteredUser(user)) {
                        continue;
                    }

                    profiles = this.findAllowedProfiles(user);

                    Array.prototype.push.apply(list, profiles);
                }

                return list;
            },

            findAllowedProfiles: function (masterUser) {
                var list,
                    currentGlobal;

                //for pilot any user can be added to conversation
                if (this.currentContextGlobalMasterId === null) {
                    return masterUser.Profiles.cloneArray();
                }

                if (masterUser.Profiles.length() === 1) {
                    //only private, so add it
                    return [masterUser.Profiles.get(0)];
                }

                currentGlobal = masterUser.Profiles.find(function (gu) {
                    return gu.getContextGlobalMasterId() === this.currentContextGlobalMasterId;
                }, this);

                if (currentGlobal !== null) {
                    //add user from current company
                    return [currentGlobal];
                }

                list = masterUser.Profiles.filter(function (gu) {
                    return gu.getMessengerProfileType() === MessengerEnums.MessengerProfileType.Company;
                }, this);

                return list;
            },

            buildUserList: function () {
                return [];
            },

            adjustUsersList: function () {
                $scope.users = this.buildUserList();
            },

            refreshUsers: function (keyword) {

                var filter = {
                    Skip: 0,
                    Count: 20,
                    SearchString: keyword,
                    //SortExpression: 'Friend.FirstName'
                };

                messengerUserService.searchUsers(filter).then(function (result) {
                    if (!result.data.Status) {
                        $log.error('Failed to load users. ' + errorMessageProvider.getApiErrorMessage(result.data));
                        return;
                    }

                    var userModels = result.data.Model.List.map(function (item) {
                        return new UserModel(item);
                    });

                    $scope.users = this.buildContactList(userModels);
                }.bind(this), function (error) {
                    $log.error('Failed to load users by keyword.' + error);
                });
            },

            onUserSelected: function (item, model) {
                $scope.users = [];

                this.adjustUsersList();

                this.busyIndicator.begin();

                this.onAddParticipant(model).then(function () {
                    this.registerParticipant(model);                    
                }.bind(this), function (error) {
                    //failed to remove participant, so remove him from control                    
                    var indexOf = this.scope.selectedUsers.selected.findIndex(function (u) {
                        return u.getId() === model.getId();
                    }, this);

                    if (indexOf > -1) {
                        this.scope.selectedUsers.selected.splice(indexOf, 1);
                    }
                }.bind(this)).finally(function () {
                    this.busyIndicator.end();
                }.bind(this));
            },

            onUserRemoved: function (item, model) {

                this.adjustUsersList();

                this.busyIndicator.begin();

                this.onRemoveParticipant(model).then(function () {
                    this.unregisterParticipant(model);                    
                }.bind(this), function () {
                    //restore user in control
                    this.scope.selectedUsers.selected.push(model);
                }.bind(this)).finally(function () {
                    this.busyIndicator.end();
                }.bind(this));
            },

            onAddParticipant: function (participant) {
                var request = {
                    ConversationId: this.scope.conversation.getId(),
                    ParticipantsProfileIds: [participant.getId()],
                };

                return messengerHub.addParticipants(request).then(function (result) {
                }.bind(this), function (data) {
                    $log.error('Failed to add participants to conversation. ' + data);
                    return $q.reject(data);
                });
            },

            onRemoveParticipant: function (participant) {
                return messengerHub.removeParticipant(
                    this.scope.conversation.getId(),
                    participant.getId()).then(function () {
                        //success
                    }, function (data) {
                        $log.error('Failed to remove participant from conversation. ' + data);
                        return $q.reject(data);
                    });
            },

            getSelectedUsers: function () {
                return this.scope.selectedUsers.selected;
            },

            canManageUsers: function () {

                if (!this.scope.conversation) {
                    return false;
                }

                if (this.busyIndicator.isBusy()) {
                    return false;
                }

                return this.isConnected() && this.scope.conversation.isJoinedConversation();
            },

            isConnected: function () {
                if (hubConnection.getState() !== CoreEnums.HubConnectionState.Connected) {
                    return false;
                }
                return true;
            },

            loadData: function () {

                //$scope.updating = true;

                $scope.updating = false;

                this.adjustUsersList();
            },

            //
            //end participants pickup
            //


        });

        return new Controller($scope);
    }]
);

})(window);