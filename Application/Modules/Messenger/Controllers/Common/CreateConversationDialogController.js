(function (global) {
    'use strict';

    global.realineMessenger.controller('CreateConversationDialogController',
    ['messengerUserService', 'messenger', 'MessengerEnums', 'CoreEnums', 'BusyIndicator',
        'UserModel', 'messageBus', 'utils', 'FloatingWindowBase', 'wnd', 'errorMessageProvider',
        'hubConnection', 'createConversationCallback', '$scope', '$log',
    function (messengerUserService, messenger, MessengerEnums, CoreEnums, BusyIndicator,
        UserModel, messageBus, utils, FloatingWindowBase, wnd, errorMessageProvider,
        hubConnection, createConversationCallback, $scope, $log) {

        var Controller = FloatingWindowBase.extend({
            init: function (scope, wnd) {
                this._super(scope, wnd);

                this.isMinimized = false;

                this.isCcLineVisible = false;

                this.participants = {};
                this.scope.selectedUsers = { selected: [] };
                this.currentContextGlobalMasterId = null;

                this.messageText = null;
                this.conversationName = null;
                this.errorMessage = null;
                this.isFileUploaderVisible = false;
                this.files = [];

                this.busyIndicator = new BusyIndicator();

                this.bindEvents();

                this.loadData();
            },

            bindEvents: function () {

            },

            onCloseClick: function () {
                this.close();
            },

            onMinimizeClick: function () {
                this.isMinimized = !this.isMinimized;
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

                    if (this.participants.hasOwnProperty(user.getId())) {
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

                this.participants[model.getGroupId()] = true;

                this.adjustUsersList();
            },

            onUserRemoved: function (item, model) {
                delete this.participants[model.getGroupId()];

                this.adjustUsersList();
            },

            getSelectedUsers: function () {
                return this.scope.selectedUsers.selected;
            },

            loadData: function () {

                //$scope.updating = true;

                $scope.updating = false;

                this.adjustUsersList();
            },

            //
            //end participants pickup
            //

            onMessageKeyPress: function (e) {

                if (e.keyCode == 27) {
                    return false;
                }

                if (e.keyCode == 13) {
                    if (!e.ctrlKey) {
                        this.onSendMessage();
                        if (e.preventDefault) e.preventDefault();
                    }
                    else {
                        var val = this.controller.message || ''; // this.scope.message can be null
                        if (typeof e.target.selectionStart == "number" && typeof e.target.selectionEnd == "number") {
                            var start = e.target.selectionStart;
                            this.controller.message = val.slice(0, start) + "\r\n" + val.slice(e.target.selectionEnd);
                            e.target.selectionStart = e.target.selectionEnd = start + 1;
                        } else if (document.selection && document.selection.createRange) {
                            e.target.focus();
                            var range = document.selection.createRange();
                            range.text = "\r\n";
                            range.collapse(false);
                            range.select();
                        }
                    }
                }
            },

            canCreateConversation: function () {

                if (this.busyIndicator.isBusy()) {
                    return false;
                }

                if (!this.isConnected()) {
                    return false;
                }

                var hasParticipants = this.getSelectedUsers().length > 0;
                if (!hasParticipants) {
                    return false;
                }

                return true;
            },

            isConnected: function () {
                if (hubConnection.getState() !== CoreEnums.HubConnectionState.Connected) {
                    return false;
                }
                return true;
            },

            onSendMessageClick: function () {
                this.onSendMessage();
            },

            onSendMessage: function () {
                if (!this.messageText) {
                    return;
                }

                if (!this.canCreateConversation()) {
                    return;
                }

                this.createNewConversation();
            },

            createNewConversation: function () {

                this.busyIndicator.begin();

                return messenger.getCurrentProfile().then(function (result) {
                    return this.createNewConversationInternal(result)
                }.bind(this), function (error) {
                    $log.debug('Failed to get global user during conversation creation.');
                }).finally(function () {
                    this.busyIndicator.end();
                }.bind(this));
            },

            createNewConversationInternal: function (profile) {
                var request = {
                    RequestId: utils.common.newGuid(),
                    DisplayName: this.conversationName,
                    ParticipantProfilesId: this.getSelectedUsers().map(function (item) {
                        return item.getId();
                    }),
                    //BusinessObjecType: this.scope.conversation.getBusinessObjecType(),
                    //BusinessObjecId: this.scope.conversation.getBusinessObjecId(),
                    //BusinessTransactionId: this.scope.conversation.getBusinessTransactionId(),

                    Type: MessengerEnums.ConversationType.Group,
                    Message: {
                        Message: this.messageText,
                        AttachedFiles: {
                            AttachedFiles: this.prepareAttachments()
                        },
                        ProfileId: profile.getId(),
                    },
                    ProfileId: profile.getId(),
                };

                this.errorMessage = null;

                return createConversationCallback(request).then(function () {
                    this.close();
                }.bind(this), function (data) {
                    this.errorMessage = data;
                    $log.error('Failed to create conversation: ' + data);
                }.bind(this));
            },

            prepareAttachments: function () {
                var attachments = [];
                var i, model, file;

                for (i = 0; i < this.files.length; i++) {
                    file = this.files[i];

                    if (!file.result) {
                        continue;
                    }

                    model = {
                        FileName: file.name,
                    };

                    if (!file.isImage) {
                        model.FileType = MessengerEnums.FileType.Document;
                    }
                    else {
                        model.FileType = MessengerEnums.FileType.Image;
                    }

                    model.FileData = JSON.stringify(file.result)

                    attachments.push(model);
                }

                return attachments;
            },
        });

        return new Controller($scope, wnd);
    }]
);

})(window);