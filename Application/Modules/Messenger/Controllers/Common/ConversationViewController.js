(function (global) {
    'use strict';

    global.realineMessenger.factory('ConversationViewController',
        ['$log', '$timeout', '$q', '$', 'MessageModel', 'MessengerEnums', 'TypingUsersManager',
        'EventScheduler', 'CoreEnums', 'ObservableCollection', 'UniqueEntityCollection',
        'HistoryMessagesProvider', 'BusyIndicator', 'UserActivitySensor', 'businessObjectService',
        'pageNavigationService', 'events', 'utils', '$http', '$uibModal', 'messenger',
        function ($log, $timeout, $q, $, MessageModel, MessengerEnums, TypingUsersManager,
            EventScheduler, CoreEnums, ObservableCollection, UniqueEntityCollection,
            HistoryMessagesProvider, BusyIndicator, UserActivitySensor, businessObjectService,
            pageNavigationService, events, utils, $http, $uibModal, messenger) {

            var READ_TIMER_INTERVAL = 3000,
                TYPING_NOTIFICATION_INTERVAL = 1000;

            var ConversationViewController = Class.extend({
                init: function (scope, messenger, hubConnection, messengerHub, messageBus, profileCacheService, options) {

                    this.__ClassName = 'ConversationViewController';

                    this.scope = scope;
                    this.messenger = messenger;
                    this.hubConnection = hubConnection;
                    this.messengerHub = messengerHub;
                    this.messageBus = messageBus;
                    this.profileCacheService = profileCacheService;
                    this.busyIndicator = new BusyIndicator();
                    this.userActivityMonitor = new UserActivitySensor();
                    this.options = angular.extend({}, options);

                    this.scope.controller = this;
                    this.scope.message = null;

                    this.typingUsersManager = new TypingUsersManager(TYPING_NOTIFICATION_INTERVAL);
                    this.eventScheduler = new EventScheduler(this.notifyMessageTyping.bind(this),
                                                            TYPING_NOTIFICATION_INTERVAL);

                    //stores list of messages for current conversation
                    //it allows to display conversations by pages
                    this.messages = new UniqueEntityCollection();
                    this.unreadMessages = new UniqueEntityCollection();

                    this.readTimers = new ObservableCollection();

                    //will be initialized in onConversationChanged
                    this.historyProvider = null;

                    this.isMenuVisible = false;
                    this.displayNameEditMode = false;
                    this.newDisplayName = null;
                    this.isParticpantPickerVisible = false;
                    this.isFileUploaderVisible = false;
                    this.otherContacts = null;

                    this.files = [];

                    this.bindMessengerEvents();
                    this.bindEvents();

                    this.scope.$on('$destroy', function () {
                        this.onDestroy();
                    }.bind(this));

                    //support for scroll
                    this.scope.loadMoreMessages = this.loadMoreMessages.bind(this);

                    this.scope.$watch('conversation', function (newValue, oldValue) {
                        //$log.debug('Conversation ha been changed.');                    
                        this.onConversationChanged(newValue, oldValue);
                    }.bind(this));

                    this.scope.$watch('isConversationActive', this.onIsConversationActiveChanged.bind(this));
                },

                getMessagesBatchSize: function () {
                    return this.options.messagesBatchSize;
                },

                onConversationChanged: function (newValue, oldValue) {

                    if (oldValue != null) {
                        oldValue.unbindPropertyChanged(this.conversation_PropertyChanged, this);
                        oldValue.Messages.unbindCollectionChanged(this.conversationMessages_CollectionChanged, this);
                        this.historyProvider = null;
                    }

                    this.reset();

                    if (newValue == null) {
                        return;
                    }
                    $log.debug('onConversationChanged');
                    newValue.bindPropertyChanged(this.conversation_PropertyChanged, this);
                    newValue.Messages.bindCollectionChanged(this.conversationMessages_CollectionChanged, this);

                    //init internal collection, 
                    //because we display only messages from internal collection

                    this.historyProvider = new HistoryMessagesProvider({
                        conversationId: this.scope.conversation.getId(),
                        history: this.scope.conversation.Messages,
                        loadedMessages: this.messages,
                        batchSize: this.getMessagesBatchSize()
                    });

                    //we do not have history if conversation has not been not created yet
                    if (!utils.common.isNullOrEmpty(this.scope.conversation.getId())) {
                        this.historyProvider.load();
                    }
                },

                reset: function () {
                    //uninit
                    this.readTimers.forEach(function (item) { $timeout.cancel(item); });
                    this.readTimers.clear();

                    this.messages.clear();
                    this.unreadMessages.clear();
                    this.typingUsersManager.clear();
                    this.historyProvider = null;
                    //reset inifinite scroll
                    this.loadDefer = null;
                    this.busyIndicator.reset();//? may be makes sense to remove
                    this.userActivityMonitor.stop();
                    if (this.readTimer) {
                        $timeout.cancel(this.readTimer);
                        this.readTimer = null;
                    }
                },

                conversation_PropertyChanged: function (event) {
                    if (event.property === MessengerEnums.PropertyNames.Id) {

                    }
                },

                conversationMessages_CollectionChanged: function (event) {
                    //plan
                    //copy new elements to new collection
                    //start timer if there were unread messages
                    switch (event.action) {
                        case CoreEnums.CollectionAction.Add:
                            this.conversationMessages_MessagesAdded(event);
                            break;
                        case CoreEnums.CollectionAction.Remove:
                            this.conversationMessages_MessagesRemoved(event);
                            break;
                        default:
                            $log.debug('conversationMessages: unsupported action. ' + event.action);
                            break;
                    }
                },

                conversationMessages_MessagesAdded: function (event) {
                    //newStartingIndex: startIndex,
                    //newItems: items
                    //copy messages to new  collection

                    if (event.newStartingIndex >= this.messages.length()) {
                        //add to the end
                        this.messages.push(event.newItems);
                    }
                    else {
                        //somebody loads history
                        this.messages.unshift(event.newItems);
                    }
                },

                conversationMessages_MessagesRemoved: function (event) {
                    var i,
                        index = -1;

                    for (i = 0; i < event.oldItems.length; i++) {
                        if (this.messages.containsById(event.oldItems[i].getId())) {
                            index = this.messages.indexOf(event.oldItems[i]);
                            break;
                        }
                    }

                    if (index === -1) {
                        //we have not shown these messages yet
                        return;
                    }

                    this.messages.removeAt(index, event.oldItems.length);
                },

                messages_CollectionChanged: function (event) {
                    //plan
                    //copy new elements to new collection
                    //start timer if there were unread messages
                    switch (event.action) {
                        case CoreEnums.CollectionAction.Add:
                            this.messages_MessagesAdded(event);
                            break;
                        default:
                            //$log.debug('messages: unsupported action. ' + CoreEnums.CollectionAction.Add);
                            break;
                    }
                },

                messages_MessagesAdded: function (event) {
                    var unreadMessages = event.newItems.filter(function (m) { return !m.getIsRead(); });

                    if (unreadMessages.length > 0) {
                        this.unreadMessages.push(unreadMessages);
                    }
                },

                unreadMessages_CollectionChanged: function (event) {
                    switch (event.action) {
                        case CoreEnums.CollectionAction.Add:
                            if (this.scope.isConversationActive) {
                                this.userActivityMonitor.start();
                            }
                            break;
                        case CoreEnums.CollectionAction.Remove:
                            this.userActivityMonitor.stop();
                            break;
                            //case CoreEnums.CollectionAction.Replace:
                            //    //implement later
                            //    break;
                            //case CoreEnums.CollectionAction.Reset:
                            //    //implement later
                            //    break;
                    }
                },

                onIsConversationActiveChanged: function (newValue, oldValue) {
                    if (newValue && this.unreadMessages.length() > 0) {
                        this.userActivityMonitor.start();
                    }
                    else {
                        this.userActivityMonitor.stop();
                    }
                },



                onSendMessage: function () {
                    if (!this.scope.message && this.files.length === 0) {
                        return;
                    }

                    if (!this.isSendButtonEnabled() || this.busyIndicator.isBusy()) {
                        return;
                    }

                    if (!this.scope.conversation.getId()) {
                        //looks like conversation is not created on the server
                        //so, create conversation and send message in one request
                        this.createNewConversation(this.scope.message);
                    }
                    else if (!this.scope.conversation.isJoinedConversation()) {
                        //initiate join conversation
                        this.joinConversation().then(function () {
                            this.sendMessage();
                        }.bind(this));
                    }
                    else {
                        this.sendMessage();
                    }
                },

                sendMessage: function () {
                    this.messenger.getCurrentProfile().then(function (result) {
                        var requestId = utils.common.newGuid();

                        var msg = new MessageModel({
                            Id: requestId,
                            ConversationId: this.scope.conversation.getId(),
                            Text: this.scope.message,
                            MessageType: MessengerEnums.MessageType.TextMessage,
                            State: MessengerEnums.MessageState.Sending,
                            AuthorId: result.getId(),
                            CreateDate: new Date(),
                            IsDeleted: false,
                            IsRead: true,
                            Content: { AttachedFiles: this.prepareAttachments() }
                        });

                        this.scope.message = null;

                        this.scope.conversation.Messages.push(msg);

                        return this.sendMessageInternal(requestId, msg);
                    }.bind(this), function (error) {
                        $log.debug('Failed to load current global user. ' + error);
                    });
                },

                sendMessageInternal: function (requestId, msg) {
                    var d;

                    if (this.hubConnection.getState() !== CoreEnums.HubConnectionState.Connected) {
                        msg.setState(MessengerEnums.MessageState.Error);
                        d = $q.defer();
                        d.reject('No connection');
                        return d.promise;
                    }

                    var request = {
                        ConversationId: this.scope.conversation.getId(),
                        Message: msg.getText(),
                        RequestId: requestId,
                        AttachedFiles: msg.getContent(),
                        ProfileId: msg.getAuthorId()
                    };

                    //this.busyIndicator.begin();

                    return this.messengerHub.sendMessage(request).then(function (result) {
                        msg.setState(MessengerEnums.MessageState.Success);
                    }.bind(this),
                    function (error) {
                        msg.setState(MessengerEnums.MessageState.Error);
                        $log.error('Failed to send message. ' + error);
                    }.bind(this)).finally(function () {
                        //this.busyIndicator.end();
                        this.files.length = 0;
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

                joinConversation: function () {
                    this.busyIndicator.begin();

                    return this.messengerHub.joinConversation(this.scope.conversation.getId()).then(function () {

                    }, function (error) {
                        $log.error('Failed to join conversation: ' + error);
                        $q.reject(error);
                    }.bind(this)).finally(function () {
                        this.busyIndicator.end();
                    }.bind(this));
                },

                createNewConversation: function (messageText, participnats) {

                    this.scope.conversation.setRequestId(utils.common.newGuid());

                    var request = {
                        RequestId: this.scope.conversation.getRequestId(),
                        DisplayName: this.scope.conversation.getDisplayName(),
                        Participants: this.scope.conversation.Participants.map(function (item) {
                            return item.getId();
                        }),
                        BusinessObjecType: this.scope.conversation.getBusinessObjecType(),
                        BusinessObjecId: this.scope.conversation.getBusinessObjecId(),
                        BusinessTransactionId: this.scope.conversation.getBusinessTransactionId(),
                        Message: messageText,
                        Type: this.scope.conversation.getType(),
                    };

                    if (participnats) {
                        //add these participants to request too
                        Array.prototype.push.apply(request.Participants, participnats);
                    }

                    this.busyIndicator.begin();

                    return this.messengerHub.createConversation(request).then(null, function (data) {
                        $log.error('Failed to create conversation: ' + data);
                    }.bind(this)).finally(function () {
                        this.busyIndicator.end();
                    }.bind(this));
                },

                onMessageKeyPress: function (e) {

                    if (e.keyCode == 27) {
                        return false;
                    }

                    if (e.keyCode == 13) {
                        if (!e.ctrlKey) {
                            this.eventScheduler.stop();
                            this.onSendMessage();
                            if (e.preventDefault) e.preventDefault();
                        }
                        else {
                            var val = this.scope.message || ''; // this.scope.message can be null
                            if (typeof e.target.selectionStart == "number" && typeof e.target.selectionEnd == "number") {
                                var start = e.target.selectionStart;
                                this.scope.message = val.slice(0, start) + "\r\n" + val.slice(e.target.selectionEnd);
                                e.target.selectionStart = e.target.selectionEnd = start + 1;
                            } else if (document.selection && document.selection.createRange) {
                                e.target.focus();
                                var range = document.selection.createRange();
                                range.text = "\r\n";
                                range.collapse(false);
                                range.select();
                            }

                            if (this.scope.conversation.getId()
                                && this.scope.conversation.isJoinedConversation()) {
                                this.eventScheduler.start();
                            }
                        }
                        //return false;
                    }
                    else {
                        if (this.scope.conversation.getId()
                            && this.scope.conversation.isJoinedConversation()) {
                            this.eventScheduler.start();
                        }
                    }
                },

                onSendMessageClick: function () {
                    this.eventScheduler.stop();
                    this.onSendMessage();
                },

                loadMoreMessages: function () {

                    if (this.loadDefer || !this.scope.conversation) {
                        //loading in progress or we do not have a conversation
                        return null;
                    }

                    this.isLoading = true;

                    this.loadDefer = $q.defer();
                    var loadPromise = this.loadDefer.promise;

                    this.historyProvider.load().then(function (result) {
                        this.loadDefer.resolve(result);
                        this.loadDefer = null;
                    }.bind(this), function (data) {
                        $log.error('Failed to load messages. ' + data);
                        if (!utils.common.isNullOrEmpty(this.loadDefer)) {
                            this.loadDefer.resolve(0);
                            this.loadDefer = null;
                        }
                    }.bind(this)).finally(function () {
                        this.isLoading = false;
                    }.bind(this));

                    return loadPromise;
                },

                onShowMenu: function () {
                    this.isMenuVisible = true;
                },

                onHideMenu: function () {
                    this.isMenuVisible = false;
                },

                showUserPicker: function () {

                    //var modalDialog = $modal.open({
                    //    templateUrl: '/Application/Modules/Client/Messenger/Html/Popup/AddPeopleToConversation.html',
                    //    controller: 'AddPeopleToConversation',
                    //    windowClass: 'window-modal-md',
                    //    //size: 'lg',
                    //    resolve: {
                    //        dialogOptions: function () {
                    //            return {
                    //                isBusinessObjectConversation: this.scope.conversation.isBusinessObjectConversation(),
                    //                conversationParticipants: this.scope.conversation.Participants.cloneArray(),
                    //            }
                    //        }.bind(this),

                    //    },
                    //});

                    //modalDialog.result.then(function (result) {
                    //    var contacts;
                    //    var i;
                    //    if (result.length === 0) {
                    //        return;
                    //    }

                    //    result = result.filterDuplicates(function (item) {
                    //        return item.getGlobalMasterId()
                    //    });

                    //    for (i = 0; i < result.length; i++) {
                    //        this.profileCacheService.put(result[i]);
                    //    }

                    //    contacts = result.map(function (c) {
                    //        return c.getId();
                    //    });

                    //    this.onPeopleSelected(contacts);
                    //}.bind(this));
                },

                onAddPeople: function () {
                    //var i;
                    //var request = {
                    //    ConversationId: this.scope.conversation.getId(),
                    //    Message: this.scope.message
                    //};

                    //for (i = 1901; i <= 2000; i++) {
                    //    request.Message = i.toString();
                    //    this.messengerHub.sendMessage(request)
                    //}

                    //this.scope.wcount();

                    //if (!this.canAddPeople()) {
                    //    return;
                    //}

                    //this.showUserPicker();
                },

                getParticipantsCount: function () {
                    if (!this.scope.conversation) {
                        return 0;
                    }

                    if (this.scope.conversation.isJoinedConversation()) {
                        return this.scope.conversation.Participants.length() - 1;
                    }
                    else {
                        return this.scope.conversation.Participants.length();
                    }
                },

                onManageParticipants: function () {

                    this.isParticpantPickerVisible = !this.isParticpantPickerVisible;

                    //TODO: find better way to handle resize
                    if (!this.isParticpantPickerVisible) {
                        this.scope.hideParticipantsPanel();                       
                    }
                },

                onPeopleSelected: function (userIds) {

                    if (!userIds || userIds.length === 0) {
                        return;
                    }

                    var request = {
                        ConversationId: this.scope.conversation.getId(),
                        Participants: userIds,
                    };

                    if (this.scope.conversation.isPrivate()) {
                        //we need to create group conversation based on this one                    
                        this.createChildConversation(userIds);
                        return;
                    }

                    this.addPeopleToConversation(request);
                },

                addPeopleToConversation: function (request) {

                    if (!this.isConnected()) {
                        return;
                    }

                    if (!this.scope.conversation.getId()) {

                        if (this.busyIndicator.isBusy()) {
                            //may be we are already creating conversation. just wait
                            return;
                        }

                        //create conversation with specified participants
                        //they will be added to conversation in onParticipantsAdded
                        this.createNewConversation(null, request.Participants);

                        return;
                    }

                    this.messengerHub.addParticipants(request).then(function (result) {
                    }.bind(this), function (data) {
                        $log.error('Failed to add participants to conversation. ' + data);
                    });
                },

                onAddParticipant: function (participant) {
                    var request = {
                        ConversationId: this.scope.conversation.getId(),
                        Participants: [participant.getId()],
                    };

                    return this.messengerHub.addParticipants(request).then(function (result) {
                    }.bind(this), function (data) {
                        $log.error('Failed to add participants to conversation. ' + data);
                        return $q.reject(data);
                    });
                },

                onRemoveParticipant: function (participant) {
                    return this.messengerHub.removeParticipant(
                        this.scope.conversation.getId(),
                        participant.getId()).then(function () {
                            //success
                        }, function (data) {
                            $log.error('Failed to remove participant from conversation. ' + data);
                            return $q.reject(data);
                        });
                },

                onLeaveConversation: function () {

                    if (!this.canLeaveConversation()) {
                        return;
                    }

                    messenger.getCurrentProfile().then(function (profile) {
                        var request = {
                            ConversationId: this.scope.conversation.getId(),
                            ProfileId: profile.getId()
                        };

                        this.messengerHub.leaveConversation(request).then(function () {
                            //
                        }.bind(this), function () {
                            $log.debug('Failed to leave conversation.');
                        });
                    }.bind(this));
                },

                canTagConversation: function () {
                    if (!this.scope.conversation || !this.scope.conversation.getId()) {
                        return false;
                    }

                    return this.isConnected()
                        && this.scope.conversation.isJoinedConversation();
                },

                onTagConversation: function () {
                    var modalDialog = $uibModal.open({
                        templateUrl: '/Application/Modules/Messenger/Html/ConversationTagsDialog.html',
                        controller: 'ConversationTagsDialogController',
                        size: 'smm',
                        backdrop: false,
                        resolve: {
                            conversation: function () {
                                return this.scope.conversation;
                            }.bind(this),
                        },
                    });

                    modalDialog.result.then(function (result) {

                    }.bind(this));
                },

                getCustomTags: function () {
                    return this.scope.conversation.Tags.filter(function (item) {
                        return item.getTagType() === MessengerEnums.TagType.CustomFolder;
                    });
                },

                onRemoveTag: function (tag) {

                    var tagIds = this.scope.conversation.Tags.filter(function (item) {
                        return item !== tag;
                    }).map(function (item) {
                        return item.getId();
                    });

                    this.messengerHub.tagConversation({
                        ConversationId: this.scope.conversation.getId(),
                        FolderIds: tagIds,
                    }).then(function () {

                    }, function (error) {
                        $log.debug('Failed to tagConversation. ' + error);
                    });
                },

                onMuteConversation: function () {
                    if (!this.canMuteConversation()) {
                        return;
                    }

                    messenger.getCurrentProfile().then(function (profile) {
                        this.muteConversationInternal(profile.getId());
                    }.bind(this));
                },

                muteConversationInternal: function (profileId) {
                    if (this.scope.conversation.getIsMuted()) {
                        this.messengerHub.unmuteConversation({
                            ConversationId: this.scope.conversation.getId(),
                        }).then(function () {
                            this.scope.conversation.setIsMuted(false);
                        }.bind(this), function (error) {
                            $log.debug('Failed to mute conversation. ' + error);
                        });
                    }
                    else {
                        this.messengerHub.muteConversation({
                            ConversationId: this.scope.conversation.getId(),
                        }).then(function () {
                            this.scope.conversation.setIsMuted(true);
                        }.bind(this), function (error) {
                            $log.debug('Failed to mute conversation. ' + error);
                        });
                    }
                },

                canLeaveConversation: function () {

                    if (!this.scope.conversation || !this.scope.conversation.getId()) {
                        return false;
                    }

                    return this.isConnected()
                        && !this.scope.conversation.isPrivate()
                        && this.scope.conversation.Participants.length() > 1
                        && this.scope.conversation.isJoinedConversation();
                },

                canAddPeople: function () {
                    if (this.scope.conversation.isBusinessObjectConversation()) {
                        if (utils.common.isNullOrUndefined(this.scope.currentCompany)) {
                            return false;
                        }
                    }

                    return this.scope.conversation.isJoinedConversation() && this.isConnected();
                },

                canRenameConversation: function () {
                    return this.isConnected()
                        && this.scope.conversation.isJoinedConversation();
                },

                canShowParticipants: function () {
                    //if (!utils.common.isNullOrEmpty(this.scope.conversation.getBusinessObjecId())
                    //    && this.scope.conversation.Participants.length() > 1) {
                    //    return true;
                    //}

                    var isLeft = !this.scope.conversation.isJoinedConversation();

                    if (this.scope.conversation.Participants.length() === 1 && !isLeft) {
                        return false;
                    }

                    return !this.scope.conversation.isPrivate()
                       && ((this.scope.conversation.Participants.length() > 1 && !isLeft) ||
                           (this.scope.conversation.Participants.length() > 0 && isLeft))
                },

                canMuteConversation: function () {
                    if (!this.scope.conversation.getId() || !this.scope.conversation.isJoinedConversation()) {
                        return false;
                    }
                    return true;
                },

                canRemoveParticipants: function () {
                    return !this.scope.conversation.isPrivate() &&
                        this.scope.conversation.isJoinedConversation();
                },

                getOtherParticipants: function () {
                    if (!this.scope.conversation) {
                        return [];
                    }
                    return this.scope.conversation.Participants.filter(function (item) {
                        return !this.scope.currentUser.Profiles.containsById(item.getId());
                    }, this);
                },

                isSendButtonEnabled: function () {

                    //if (this.busyIndicator.isBusy()) {
                    //    return false;
                    //}

                    if (utils.common.isNullOrUndefined(this.scope.conversation)) {
                        return false;
                    }

                    var hasParticipants = this.scope.conversation.Participants.length() > 1;
                    if (!hasParticipants) {
                        return false;
                    }

                    if (!this.scope.conversation.isPublic() && !this.scope.conversation.isJoinedConversation()) {
                        return false;
                    }

                    return true;
                },

                isConnected: function () {
                    if (this.hubConnection.getState() !== CoreEnums.HubConnectionState.Connected) {
                        return false;
                    }
                    return true;
                },

                //|| !controller.isConversationCreated()
                isConversationCreated: function () {
                    if (utils.common.isNullOrUndefined(this.scope.conversation)) {
                        return false;
                    }

                    if (utils.common.isNullOrEmpty(this.scope.conversation.getId())) {
                        return false;
                    }

                    return true;
                },

                onUserAction: function () {
                    var messages;

                    if (this.unreadMessages.length() === 0) {
                        return;
                    }

                    messages = this.unreadMessages.cloneArray();

                    this.unreadMessages.clear();

                    this.createReadTimer(messages);
                },

                createReadTimer: function (messages) {
                    var timerPromise = $timeout(function () {
                        var request;

                        this.readTimer = null;

                        if (!this.scope.conversation) {
                            //looks like user has closed window before it marked messsages as read
                            //so do not mark messages as read
                            return;
                        }

                        if (!this.scope.isConversationActive) {
                            this.unreadMessages.push(messages);
                            return;
                        }

                        request = {
                            ConversationId: this.scope.conversation.getId(),
                            MessageIds: messages.map(function (item) { return item.getId(); })
                        };

                        this.messengerHub.markMessagesAsRead(request).then(function () {
                            var i;

                            for (i = 0; i < messages.length; i++) {
                                messages[i].setIsRead(true);
                            }
                        }.bind(this), function (data) {
                            $log.debug('Failed to mark messages as read.');
                            //return unread messages back to list and try again
                            if (this.unreadMessages) {
                                this.unreadMessages.push(messages);
                            }
                        }.bind(this)).finally(function () {
                            this.readTimers.remove(timerPromise);
                        }.bind(this));

                    }.bind(this), READ_TIMER_INTERVAL);

                    this.readTimers.push(timerPromise);
                },

                bindMessengerEvents: function () {
                    this.hubConnection.bindStateChanged(this.onMessengerStateChanged, this);

                    this.messengerHub.bindConversationCreated(this.onConversationCreated, this);
                    this.messengerHub.bindMessageReceived(this.onMessageReceived, this);
                    this.messengerHub.bindNotifyMessageTyping(this.onNotifyMessageTyping, this);
                },

                unbindMessengerEvents: function () {
                    this.hubConnection.unbindStateChanged(this.onMessengerStateChanged, this);

                    this.messengerHub.unbindConversationCreated(this.onConversationCreated, this);
                    this.messengerHub.unbindMessageReceived(this.onMessageReceived, this);
                    this.messengerHub.unbindNotifyMessageTyping(this.onNotifyMessageTyping, this);
                },

                onMessengerStateChanged: function (event) {
                    this.ConnectionState = event.newState;
                },

                onConversationCreated: function (event) {
                    if (!utils.common.isNullOrEmpty(this.scope.conversation.getId())) {
                        return;
                    }

                    if (utils.common.isNullOrEmpty(event.conversation.RequestId)) {
                        return;
                    }

                    if (this.scope.conversation.getRequestId() !== event.conversation.RequestId) {
                        return;
                    }

                    var messages;
                    //TODO: think about moving this line to ConversationManager
                    this.scope.conversation.setId(event.conversation.Id);

                    messages = event.conversation.Messages.map(function (item) {
                        return new MessageModel(item);
                    });

                    if (messages.length > 0) {
                        this.scope.conversation.Messages.push(messages)
                        this.scope.conversation.Messages.last().setIsRead(true);
                    }

                    if (messages.length > 0 &&
                        this.scope.conversation.Messages.last().getMessageType() !== MessengerEnums.MessageType.Redirect) {
                        //rest message input box
                        this.scope.message = null;
                    }
                },

                onMessageReceived: function (event) {
                    /*
                     * TODO: to move code to messages_collection change event
                     */

                    if (!this.scope.conversation ||
                        this.scope.conversation.getId() !== event.message.ConversationId) {
                        //skip it, because we handle it in Messenger controller
                        return;
                    }

                    var participant = null;

                    participant = this.scope.conversation.Participants.findById(event.message.AuthorId);

                    ////TODO: support for getting participant by master id
                    //if (!participant) {
                    //    //find by master id
                    //    participant = this.scope.conversation.Participants.find(function (p) {
                    //        return p.getGlobalMasterId() === event.message.AuthorId;
                    //    });
                    //}

                    if (!participant) {
                        $log.debug(String.format('Unknown participant {0} in conversation {1}.'));
                    }
                    else {
                        this.typingUsersManager.remove(participant);
                    }
                },

                onNotifyMessageTyping: function (event) {
                    if (event.data.ConversationId !== this.scope.conversation.getId()) {
                        //notification for another conversation
                        return;
                    }

                    if (//this.scope.currentUser.getId() === event.data.ParticipantProfileId
                       this.scope.currentUser.Profiles.containsById(event.data.ParticipantProfileId)
                        ) {
                        return;
                    }

                    var participant = this.scope.conversation.Participants.findById(event.data.ParticipantProfileId);

                    //TODO: support for getting participant by master id
                    if (!participant) {
                        //find by master id
                        participant = this.scope.conversation.Participants.find(function (p) {
                            return p.Id() === event.data.ParticipantProfileId;
                        });
                    }

                    if (!participant) {
                        $log.debug(String.format('Unknown participant {0} in conversation {1}.'));
                        return;
                    }

                    this.typingUsersManager.add(participant);
                },

                notifyMessageTyping: function () {
                    this.messengerHub.notifyMessageTyping(this.scope.conversation.getId());
                },

                //
                // createChildConversation - used to create group based on current private conversation
                //
                createChildConversation: function (participants) {

                    var convParticipants = this.scope.conversation.Participants.map(function (p) {
                        return p.getId()
                    });
                    Array.prototype.push.apply(convParticipants, participants);

                    this.messageBus.fire({
                        type: events.createConversation,
                        data: {
                            participants: convParticipants,
                            parentConversation: this.scope.conversation,
                            type: MessengerEnums.ConversationType.Group,
                            messageText: null,
                        }
                    });
                },

                onOpenChildGroupConversation: function (message) {
                    this.messageBus.fire({
                        type: events.openChildConversation,
                        data: {
                            conversationId: message.getParentConversationId(),
                        }
                    });
                },

                //
                // onContactRedirectDestinationUser
                //

                onContactRedirectDestinationUser: function (message) {
                    //find previous message
                    var msgIndex = this.scope.conversation.Messages.indexOf(message);
                    var previousMessge;
                    var previousMessageText = null;
                    var conversation = this.scope.conversation;

                    if (msgIndex > 0) {
                        previousMessge = conversation.Messages.get(msgIndex - 1);
                        if (previousMessge.getMessageType() === MessengerEnums.MessageType.TextMessage) {
                            previousMessageText = previousMessge.getText();
                        }
                    }

                    var newDisplayName = 'Redirected from: ';
                    if (this.scope.conversation.getDisplayName()) {
                        newDisplayName += this.scope.conversation.getDisplayName();
                    }
                    else {
                        newDisplayName += this.scope.currentUser.getName();
                    }

                    this.messageBus.fire({
                        type: events.createConversation,
                        data: {
                            displayName: newDisplayName,
                            participants: [message.getRedirectDestinationUserId()],
                            type: MessengerEnums.ConversationType.Group,
                            messageText: previousMessageText,
                        }
                    });
                },

                //
                // onResendMessage
                //

                onResendMessages: function (messages) {

                    if (messages.length === 0) {
                        //should never happen
                        return;
                    }

                    if (!this.isSendButtonEnabled()) {
                        return;
                    }

                    if (this.scope.conversation.isPublic() &&
                        !this.scope.conversation.isJoinedConversation()) {
                        //initiate join conversation

                        this.joinConversation().then(function () {
                            this.resendMessagesInternal(messages);
                        }.bind(this));
                    }
                    else {
                        this.resendMessagesInternal(messages);
                    }
                },

                resendMessagesInternal: function (messages) {
                    var i;

                    for (i = 0; i < messages.length; i++) {
                        this.resendMessageInternal(messages[i]);
                    }
                },

                resendMessageInternal: function (message) {
                    //if (this.scope.conversation.Messages.last() !== message) {
                    //this message is not last, so remove it from list and add to end
                    this.scope.conversation.Messages.remove(message);

                    message.setState(MessengerEnums.MessageState.Sending);
                    message.setCreateDate(new Date());

                    this.scope.conversation.Messages.push(message);
                    //}
                    //else {
                    //    message.setState(MessengerEnums.MessageState.Sending);
                    //    message.setCreateDate(new Date());
                    //}

                    this.sendMessageInternal(message.getId(), message);
                },

                onDeleteMessages: function (messages) {
                    var msgIds;
                    var i;

                    if (messages.length === 0) {
                        return;
                    }

                    msgIds = messages.map(function (msg) {
                        return msg.getId();
                    });

                    //we allow to remove only not sent messages, so just mark them as removed
                    for (i = 0; i < messages.length; i++) {
                        messages[i].setIsDeleted(true);
                    }

                    //this code was intended to remove messages from server
                    //this.messengerHub.deleteMessages(this.scope.conversation.getId(), msgIds).then(function () {
                    //}.bind(this));
                },

                //
                // conversation renaming
                //

                changeConversationName: function (mame) {
                    if (this.newDisplayName === this.scope.conversation.getTitle()
                        || utils.common.isNullOrEmpty(this.newDisplayName)) {
                        return;
                    }

                    if (!this.scope.conversation.getId()) {
                        //just set new name
                        this.scope.conversation.setDisplayName(this.newDisplayName);
                        return;
                    }

                    //save new name
                    this.messengerHub.renameConversation({
                        ConversationId: this.scope.conversation.getId(),
                        ConversationName: this.newDisplayName
                    }).then(null, function () {
                        $log.error('Failed to rename conversation.');
                    });
                },

                onRenameConversation: function () {
                    if (!this.canRenameConversation()) {
                        //we do not allow to change conversation topic in tet-a-tet chat
                        return;
                    }

                    this.newDisplayName = this.scope.conversation.getTitle();
                    this.displayNameEditMode = true;
                },

                onHeaderClick: function () {
                    this.onRenameConversation();
                },

                onNewDisplayNameChange: function () {
                    if (this.displayNameEditMode) {
                        this.displayNameEditMode = false;

                        this.changeConversationName(this.newDisplayName);
                    }
                },

                onNewDisplayNameKeyPress: function (e) {
                    if (e.keyCode == 27) {
                        this.displayNameEditMode = false;
                        return false;
                    }

                    if (e.keyCode == 13) {
                        this.displayNameEditMode = false;
                        this.changeConversationName(this.newDisplayName);
                    }
                },

                onDisplayNameFocus: function (e) {
                    e.target.setSelectionRange(0, e.target.value.length);
                },

                navigateToBOPage: function () {
                    var page = businessObjectService.getEditPage(
                        this.scope.conversation.getBusinessObjecType());
                    if (utils.common.isNullOrUndefined(page)) {
                        return;
                    }

                    pageNavigationService.changeLocation(page,
                        { id: this.scope.conversation.getBusinessObjecId() });
                },

                bindEvents: function () {
                    this.userActivityMonitor.bind(this.onUserAction, this);

                    this.messages.bindCollectionChanged(this.messages_CollectionChanged, this);
                    this.unreadMessages.bindCollectionChanged(this.unreadMessages_CollectionChanged, this);
                },

                unbindEvents: function () {
                    this.userActivityMonitor.unbind(this.onUserAction, this);

                    if (this.scope.conversation) {
                        this.scope.conversation.unbindPropertyChanged(this.conversation_PropertyChanged, this);
                        this.scope.conversation.Messages.unbindCollectionChanged(this.conversationMessages_CollectionChanged, this);
                    }
                },

                onDestroy: function () {
                    this.unbindMessengerEvents();
                    this.unbindEvents();
                    this.reset();
                }
            });

            return ConversationViewController;
        }
        ]);

})(window);