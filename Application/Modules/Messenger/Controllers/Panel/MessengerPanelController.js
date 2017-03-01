(function (global) {
    'use strict';

    global.realineMessenger.controller('MessengerPanelController',
    ['$scope', '$log', '$window', '$', '$uibModal', '$q', 'messenger', 'hubConnection', 'messengerHub', 'notificationHub', 'UserModel', '$rootScope',
    'MessageModel', 'ConversationModel', 'TagModel', 'ObservableCollection', 'EntityCollection', 'UniqueEntityCollection', 'MessengerEnums', 'MessengerConstants',
    'messengerUserService', 'events', 'messageBus', 'contactsCacheService', 'profileCacheService', 'currentCompanyService', 'CoreEnums',
    'utils', 'observable', 'conversationService', 'conversationProviderService', 'businessObjectService', 'currentStreamsService', 'messengerSettingsService',
    'floatingWindowBuilder', 'errorMessageProvider', 'conversationTagService',
    function ($scope, $log, $window, $, $uibModal, $q, messenger, hubConnection, messengerHub, notificationHub, UserModel, $rootScope,
                MessageModel, ConversationModel, TagModel, ObservableCollection, EntityCollection, UniqueEntityCollection, MessengerEnums, MessengerConstants,
                messengerUserService, events, messageBus, contactsCacheService, profileCacheService, currentCompanyService, CoreEnums,
                utils, observable, conversationService, conversationProviderService, businessObjectService, currentStreamsService, messengerSettingsService,
                floatingWindowBuilder, errorMessageProvider, conversationTagService) {

        var RECENT_CONVERSATIONS_COUNT = 10,
            CONVERSATION_BATCH_SIZE = 20,
            MESSAGES_PER_CONVERSATION = 1,
            USER_BATCH_SIZE = 100,
            USER_STATUS_BATCH_SIZE = 100,
            USER_INACTIVITY_PERIOD = 5, //5 minutes

            Controller,
            common = utils.common;

        Controller = Class.extend({
            init: function ($scope) {
                this.scope = $scope;
                this.scope.controller = this;

                $scope.messenger = this;
                //this.isMinimized = messengerSettingsService.getIsPanelMinimized();

                this.user = null;

                this.currentCompanyId = null;

                this.userSettings = { Settings: {} };

                this.currentUserStatus = MessengerEnums.UserStatuses.Offline;
                //used to set some new status when user is offline
                this.newUserStatus = null;

                $scope.friends = messenger.getFriends();
                $scope.colleagues = messenger.getColleagues();
                $scope.conversations = conversationService.getList();

                this.pendingConversations = conversationService.getPending();
                this.openedConversations = new EntityCollection();
                this.conversationOpenedOnPage = null;

                $scope.recentConversations = [];

                //ids for conversation creation requests
                this.requestCorrelationIds = {};

                //contains ids of contacts for whome user tries to open convbersation (loading or creating on server)
                this.privateConversationRequests = {};


                //handled in directive
                $scope.businessConversations = new UniqueEntityCollection();
                $scope.streamConversations = new UniqueEntityCollection();

                this.isInitialized = false;

                this.wasConnected = false;
                this.bindMessengerEvents();
                this.bindEvents();
            },

            initContainer: function () {

                messenger.getCurrentUser().then(function (result) {

                    this.user = result;

                    //TODO: check where it is used
                    $scope.currentUser = this.user;

                    //reset company because current user changed
                    this.currentCompanyId = null;

                    conversationProviderService.setUser(this.user);

                    hubConnection.connect().then(function () {
                        this.wasConnected = true;

                        this.loadFriends().then(function (result) {
                            $scope.friends.push(result);
                            return this.loadColleagues();
                        }.bind(this)).then(function (result) {
                            //$scope.colleagues.clear();
                            $scope.colleagues.push(result);
                        }.bind(this)).then(function () {
                            //messenger initialized
                            this.updateContactsStatuses();
                            this.isInitialized = true;
                        }.bind(this));

                    }.bind(this), function (error) {
                        //error
                        $log.debug('Failed to connect to messenger server. ' + error);
                    }.bind(this));

                }.bind(this));
            },

            deinitContainer: function () {
                hubConnection.disconnect();
                this.wasConnected = false;
                $scope.currentUser = null;
                this.user = null;
                this.newUserStatus = null;
                contactsCacheService.clear();
                profileCacheService.clear();
                $scope.businessConversations.clear();
                $scope.streamConversations.clear();
                this.openedConversations.clear();
                conversationService.clear();
                conversationProviderService.clear();
                conversationTagService.clear();
                this.requestCorrelationIds = {};
                this.privateConversationRequests = {};
                this.wasConnected = false;
                messenger.logout();
            },

            onLoggedIn: function () {
                this.deinitContainer();
                this.initContainer();
            },

            onLoggedOut: function () {
                this.deinitContainer();
            },

            isIntermediateConectionState: function () {
                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected
                    && this.ConnectionState !== CoreEnums.HubConnectionState.Disconnected) {
                    return true;
                }
                else {
                    return false;
                }
            },

            //--conversation management
            onConversationClick: function (conversation) {
                if (!this.isInitialized) {
                    return;
                }
                this.openConversation(conversation);
            },

            openConversation: function (conversation, options) {

                var messageText = null;
                if (options) {
                    messageText = options.messageText;
                }

                messageBus.fire({
                    type: events.conversationOpen,
                    conversation: conversation,
                    messageText: messageText
                });
            },

            openMessage: function (message) {
                var conversation = conversationProviderService.get(message.getConversationId())

                if (this.user.Profiles.containsById(message.getAuthorId())) {
                    //we do not show own messages
                    return;
                }

                if (message.isNotificationMessage()) {
                    //we do not show notification messages
                    return;
                }

                if (this.isConversationOpened(conversation)) {
                    //we do not show message if that conversation is opened
                    return;
                }

                //check for muting
                if (this.userSettings.Settings.Mute || conversation.getIsMuted()) {
                    return;
                }

                messageBus.fire({
                    type: events.newMessageReceived,
                    message: message,
                });
            },

            addConversation: function (conversation, toTop) {
                //add it to cache in case if it is new just received conversation
                conversationProviderService.put(conversation);

                if (conversation.Messages.length() === 0) {
                    //do not show conversations without messages in recent conversations list
                    return;
                }

                if (toTop) {
                    $scope.conversations.unshift(conversation);
                }
                else {
                    $scope.conversations.push(conversation);
                }
            },

            isConversationOpened: function (conversation) {
                if (!utils.common.isNullOrUndefined(this.conversationOpenedOnPage) &&
                    this.conversationOpenedOnPage === conversation) {
                    return true;
                }

                if (this.openedConversations.indexOf(conversation) > -1) {
                    return true;
                }

                return false;
            },

            conversationCount: function () {
                return $scope.conversations.count();
            },

            onContactClick: function (contact) {
                //user wants to chat with this contact - actualy profile
                //verify whether we have conversation with this user

                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected
                    || !this.isInitialized) {
                    //do not allow to chat if there is no connection
                    return;
                }

                this.openPrivateConversation(contact);
            },

            onCreateConversationClick: function () {

                if (this.createConversationWndPromise) {
                    return;
                }

                this.createConversationWndPromise = floatingWindowBuilder.open({
                    controller: 'CreateConversationDialogController',
                    templateUrl: '/Application/Modules/Messenger/Html/CreateConversationDialog.html',
                    params: { createConversationCallback: this.createGroupConversation2.bind(this) },
                }).then(function (wnd) {
                    //cleanup when windows is closed
                    wnd.closed.then(function () {
                        this.createConversationWndPromise = null;
                    }.bind(this));
                }.bind(this), function (error) {
                    $log.debug('Failed to open CreateConversationDialog');
                });
            },

            openPrivateConversation: function (contact, options) {

                if (this.privateConversationRequests.hasOwnProperty(contact.getId())) {
                    //we already asking server for conversation, just wait response
                    return;
                }

                this.privateConversationRequests[contact.getId()] = {};

                //try to find on server
                this.findPrivateConversation(contact.getId()).then(function (result) {
                    if (!utils.common.isNullOrUndefined(result)) {
                        this.openConversation(result, options);
                        return result;
                    }
                    else {
                        //create new conversation                        
                        return this.createPrivateConverstion(contact.getId(), options);
                    }
                }.bind(this), function (error) {
                    $log.error('Failed to find conversation on server. ' + error);
                    return $q.reject(error);
                }).then(function (result) {
                    //created
                }, function (error) {
                    $log.error('Failed to create conversation on server. ' + error);
                }).finally(function () {
                    delete this.privateConversationRequests[contact.getId()];
                }.bind(this));
            },

            //findPrivateConversationLocaly: function (contactId) {
            //    var conversation = $scope.conversations.find(function (item) {
            //        if (!item.isPrivate()) {
            //            return false;
            //        }

            //        if (item.Participants.get(0).getId() === contactId ||
            //            item.Participants.get(1).getId() === contactId) {
            //            return true;
            //        }

            //        return false;
            //    });

            //    return conversation;
            //},

            findPrivateConversation: function (contactId) {
                var searchRequest = {
                    OtherUserId: contactId,
                    GetUnreadOnly: false,
                    MessagesPerConversation: MESSAGES_PER_CONVERSATION
                };

                return conversationProviderService.loadPrivateConversation(searchRequest);
            },

            createPrivateConverstion: function (contactId, options) {
                messenger.getCurrentProfile().then(function (result) {
                    this.createPrivateConverstionInternal(contactId, options, result);
                }.bind(this), function (error) {
                    $log.debug('Failed to get current global user. ' + error);
                });
            },

            createPrivateConverstionInternal: function (contactId, options, currentProfile) {
                var requestId = utils.common.newGuid();

                //remember messageText. We will use text message in onConversationCreated
                this.requestCorrelationIds[requestId] = options;
                var participants = [contactId, currentProfile.getId()];

                var request = {
                    RequestId: requestId,
                    DisplayName: null,
                    Participants: participants,
                    Type: MessengerEnums.ConversationType.Private,
                    Message: null
                };

                return messengerHub.createConversation(request).catch(function (error) {
                    delete this.requestCorrelationIds[requestId];
                    return $q.reject(error);
                }.bind(this)).finally(function () {
                    //delete this.requestCorrelationIds[requestId];
                }.bind(this));
            },

            createGroupConversation: function (options) {
                var requestId = utils.common.newGuid();

                //remember messageText. We will use text message in onConversationCreated
                this.requestCorrelationIds[requestId] = {};

                var request = {
                    RequestId: requestId,
                    DisplayName: null,
                    Participants: options.participants,
                    Type: MessengerEnums.ConversationType.Group,
                    ParentConversationId: options.parentConversationId ? options.parentConversationId : null,
                    Message: null
                };

                return messengerHub.createConversation(request).finally(function () {
                    delete this.requestCorrelationIds[requestId];
                }.bind(this));
            },

            // 2 was added to eliminate duplication, remove it after refactoring
            createGroupConversation2: function (request) {

                request.RequestId = utils.common.newGuid();
                this.requestCorrelationIds[request.RequestId] = {};

                return messengerHub.createConversation(request).finally(function () {
                    //delete this.requestCorrelationIds[request.RequestId];
                }.bind(this));
            },

            loadConversations: function () {
                // at first we load all unread conversations
                // then load max(unread_conv, CONVERSATION_BATCH_SIZE) all conversations
                // we check whether all unread conversations are included in list
                //so we load minimum CONVERSATION_BATCH_SIZE, and maximum until last unread will be loaded               

                return this.loadUnreadConversationsOnly().then(function (result) {
                    //load all conversations
                    return this.loadRegularConversations(result);
                }.bind(this));
            },

            loadRegularConversations: function (unreadConversations) {
                var filter = {
                    Skip: 0,
                    Take: Math.max(CONVERSATION_BATCH_SIZE, unreadConversations.length),
                    GetUnreadOnly: false,
                    MessagesPerConversation: MESSAGES_PER_CONVERSATION
                };

                var deferred = $q.defer();

                this.loadRegularConversationsInternal(filter, unreadConversations, deferred);

                return deferred.promise;
            },

            loadRegularConversationsInternal: function (filter, unreadConversations, deferred) {
                conversationProviderService.loadConversations(filter).then(function (result) {
                    $scope.conversations.push(result);

                    if (unreadConversations.length === 0) {
                        deferred.resolve($scope.conversations.length());
                        return;
                    }

                    //if we have downloaded all unread then stop
                    if ($scope.conversations.containsById(
                        unreadConversations[unreadConversations.length - 1].getId())) {
                        deferred.resolve($scope.conversations.length());
                        return;
                    }

                    //download remaining
                    filter.Take = CONVERSATION_BATCH_SIZE;
                    filter.Skip = $scope.conversations.length();
                    this.loadRegularConversationsInternal(filter, unreadConversations, deferred);

                }.bind(this), function (error) {
                    $log.error('Failed to get list of regular conversations. ' + error);
                    deferred.reject(error);
                });
            },

            loadUnreadConversationsOnly: function () {
                var filter = {
                    Skip: 0,
                    Take: CONVERSATION_BATCH_SIZE,
                    GetUnreadOnly: true,
                    MessagesPerConversation: MESSAGES_PER_CONVERSATION
                };

                var deferred = $q.defer(),
                    conversations = [];

                this.loadConversationsInternal(filter, conversations, deferred);

                return deferred.promise;
            },

            loadConversationsInternal: function (filter, conversations, deferred) {
                conversationProviderService.loadConversations(filter).then(function (result) {
                    Array.prototype.push.apply(conversations, result);

                    //check whether we have downloaded all conversations
                    if (result.length === filter.Take) {
                        //download remaining
                        filter.Skip = conversations.length;
                        this.loadConversationsInternal(filter, conversations, deferred);
                    }
                    else {
                        deferred.resolve(conversations);
                    }
                }.bind(this), function (error) {
                    $log.error('Failed to get list of unread conversations. ' + error);
                    deferred.reject(error);
                });
            },

            //loading missed conversations and messages should be moved to separate class
            loadUnreadConversations: function () {
                var filter = {
                    Skip: 0,
                    Count: CONVERSATION_BATCH_SIZE,
                    GetUnreadOnly: true,
                    MessagesPerConversation: MESSAGES_PER_CONVERSATION
                };
                var newConversations = [];
                this.loadUnreadConversationsInternal(filter, newConversations);
            },

            loadUnreadConversationsInternal: function (filter, newConversations) {
                messengerHub.getConversations(filter).then(function (result) {

                    //add/update conversations to list and display in UI
                    var i;
                    var conversation;
                    for (i = 0; i < result.Conversations.length; i++) {

                        conversation = conversationProviderService.get(result.Conversations[i].Id);

                        if (conversation) {
                            this.updateConversation(conversation, result.Conversations[i]);
                        }
                        else {
                            conversation = new ConversationModel(result.Conversations[i], this.user);
                            this.addConversation(conversation, true);
                        }
                    }

                    if (result.Conversations.length > 0) {
                        Array.prototype.push.apply(newConversations, result.Conversations);
                    }

                    //check whether we have downloaded all conversations
                    if (result.Conversations.length === filter.Take) {
                        //download remaining
                        filter.Skip = newConversations.length;
                        this.loadUnreadConversationsInternal(filter, newConversations);
                    }
                }.bind(this), function (data) {
                    $log.error('Failed to get list of conversations. ' + data);
                });
            },

            updateConversation: function (oldConversation, conversation) {

                var newMessages,
                    lastMessage;

                //find participants which were added while we were disconnected
                var newParticipants = conversation.ParticipantProfileIds.filter(function (id) {
                    return oldConversation.Participants.findById(id) === null;
                });

                if (newParticipants.length > 0) {
                    //convert ids to ProfileModel
                    newParticipants = newParticipants.map(function (id) {
                        return profileCacheService.get(id);
                    });

                    oldConversation.Participants.push(newParticipants);
                }

                oldConversation.setDisplayName(conversation.DisplayName);

                //add new messages if any
                if (conversation.Messages.length === 0) {
                    //there are no messages to add
                    return;
                }

                if (oldConversation.Messages.length() === 0) {
                    newMessages = conversation.Messages;
                }
                else {
                    lastMessage = oldConversation.Messages.get(oldConversation.Messages.length() - 1);
                    newMessages = conversation.Messages.filter(function (item) {
                        return item.CreateDate > lastMessage.getCreateDate() ||
                            (item.CreateDate === lastMessage.getCreateDate() &&
                             item.Id !== lastMessage.getId());
                    });
                }

                if (newMessages.length > 0) {
                    newMessages = newMessages.map(function (item) {
                        return new MessageModel(item);
                    });
                    oldConversation.Messages.push(newMessages);
                }
            },

            loadFriends: function () {
                var deferred = $q.defer();
                var users = [];

                var filter = {
                    Skip: 0,
                    Take: 200,
                    //OrderBy: 'LastName, FirstName',                   
                    //SortExpression: MessengerEnums.OrderDirection.Asc,
                };

                this.loadFriendsInternal(filter, deferred, users);

                return deferred.promise;
            },

            loadFriendsInternal: function (filter, deferred, users) {
                //TODO: uncomment when server fixed
                //messengerUserService.searchFriends(filter).then(function (result) {
                messengerUserService.searchUsers(filter).then(function (result) {

                    if (!result.data.Status) {
                        $log.error('Failed to load friends. ' + errorMessageProvider.getApiErrorMessage(result.data));
                        deferred.reject(result);
                        return;
                    }

                    var userModels = result.data.Model.List.map(function (item) {
                        return contactsCacheService.putRaw(item);
                    });

                    if (userModels.length > 0) {
                        Array.prototype.push.apply(users, userModels);
                        //this.getUserStatuses(userModels);
                    }

                    if (users.length < result.data.Model.RowCount) {
                        filter.Skip = users.length;
                        this.loadFriendsInternal(filter, deferred, users);
                    }
                    else {
                        users = _.sortBy(users, function (item) {
                            return item.getName();
                        });

                        deferred.resolve(users);
                    }

                }.bind(this), function (result) {
                    deferred.reject(result);
                });
            },

            loadColleagues: function () {
                var d;

                this.currentCompanyId = currentCompanyService.getCurrentCompanyId();
                if (this.currentCompanyId === undefined) {
                    this.currentCompanyId = null;
                }

                if (utils.common.isNullOrUndefined(this.currentCompanyId)) {
                    d = $q.defer();
                    d.resolve([]);
                    return d.promise;
                }
                else {
                    return this.loadColleaguesByCompany(this.currentCompanyId);
                }

                //return currentCompanyService.getCurrentCompany().then(function (company) {
                //    if (utils.common.isNullOrUndefined(company)) {
                //        this.currentCompanyId = null;

                //        var d = $q.defer();
                //        d.resolve([]);
                //        return d.promise;
                //    }
                //    else {
                //        this.currentCompanyId = company.GlobalId;
                //    }

                //    return this.loadColleaguesByCompany(company);
                //}.bind(this),
                //function (error) {
                //    return $q.reject(error);
                //});
            },

            loadColleaguesByCompany: function (companyId) {
                var deferred = $q.defer();
                var loadedUsers = [];

                this.currentCompanyId = companyId;

                var filter = {
                    Skip: 0,
                    Count: 100,
                    CompanyGlobalId: companyId,
                    //SortExpression: 'Friend.FirstName'
                };

                this.loadColleaguesInternal(filter, deferred, loadedUsers);

                return deferred.promise;
            },

            loadColleaguesInternal: function (filter, deferred, users) {

                //////TODO: do not forget to comment
                //var d = $q.defer();
                //d.resolve(true);
                //return d.promise;

                messengerUserService.getCompanyUsers(filter).then(function (result) {

                    if (!result.data.Status) {
                        $log.error('Failed to load company users. ' +
                            errorMessageProvider.getApiErrorMessage(result.data.Message));
                        deferred.reject(result);
                        return;
                    }

                    var userModels = result.data.Model.List.map(function (item) {
                        return contactsCacheService.putRaw(item);
                    });

                    if (userModels.length > 0) {
                        Array.prototype.push.apply(users, userModels);
                    }

                    if (users.length < result.data.Model.RowCount) {
                        filter.Skip = users.length;
                        this.loadColleaguesInternal(filter, deferred, users);
                    }
                    else {
                        //remove current user
                        var curUser = users.findItem(function (u) {
                            return u.getId() === this.user.getId();
                        }, this);
                        if (curUser !== null) {
                            users.removeElement(curUser);
                        }

                        users = _.sortBy(users, function (item) {
                            return item.getName();
                        });

                        deferred.resolve(users);
                    }

                }.bind(this), function (result) {
                    deferred.reject(result);
                });
            },

            getUserStatuses: function (users) {
                var ids = users.map(function (item) { return item.getId(); });

                messengerHub.getUserStatuses(ids).then(function (result) {
                    var id;
                    var user;
                    for (id in result) {
                        user = users.findItem(function (item) { return item.getId() === id; });
                        user.setStatus(result[id]);
                    }
                }.bind(this), function (data) {
                    $log.error('Failed to get users statuses.' + data);
                });
            },

            updateContactsStatuses: function () {
                var contacts = this.getAllContacts(),
                    batch,
                    processedCount = 0,
                    lastIndex;

                while (processedCount < contacts.length) {
                    lastIndex = Math.min(processedCount + USER_STATUS_BATCH_SIZE, contacts.length);
                    batch = contacts.slice(processedCount, lastIndex);
                    //TODO: uncomment after GlobalIndex fix
                    //this.getUserStatuses(batch);

                    processedCount += USER_STATUS_BATCH_SIZE;
                }
            },

            updateContacts: function () {
                return this.loadFriends().then(function (result) {

                    this.updateUserList(result, $scope.friends);
                    return this.loadColleagues();
                }.bind(this), function (error) {

                    $log.debug('Failed to load friends. ' + error);
                    return $q.reject(error);
                }).then(function (result) {

                    this.updateUserList(result, $scope.colleagues);
                }.bind(this), function (error) {

                    $log.debug('Failed to load colleagues. ' + error);
                    return $q.reject(error);
                });
            },

            updateUserList: function (newList, oldList) {
                //newList - array, oldList - collection

                var i,
                    newContacts,
                    removedContacts;

                newContacts = newList.filter(function (u) {
                    return !oldList.containsById(u.getId());
                });

                removedContacts = oldList.filter(function (u) {
                    return newList.findItem(function (c) { return c.getId() === u.getId(); }) === null;
                });

                for (i = 0; i < removedContacts.length; i++) {
                    oldList.removeById(removedContacts.getId());
                }

                for (i = 0; i < newContacts.length; i++) {
                    oldList.insertSorted(newContacts[i], function (item) { return item.getName(); });
                }
            },

            getAllContacts: function () {
                var list = $scope.friends.list.concat($scope.colleagues.list);

                return list.filterDuplicates(function (item) { return item.getId(); });
            },

            getUnreadConversationsCount: function () {
                var unreadConversations = $scope.conversations.filter(function (conv) {
                    return conv.hasUnreadMessages();
                });

                return unreadConversations.length;
            },

            loadConversation: function (conversationId, open) {
                var request = {
                    ConversationId: conversationId,
                    GetUnreadOnly: false,
                    MessagesPerConversation: MESSAGES_PER_CONVERSATION,
                };

                return conversationProviderService.loadConversation(request).then(null, function (error) {
                    $log.error(String.format('Failed to load converation {0}. Error: {1}',
                                            conversationId, error));
                    return $q.reject(error);
                });
            },

            //
            // message bus even handlers
            //

            onCreateBusinessObjectConversation: function (event) {
                messenger.getCurrentProfile().then(function (result) {
                    this.onCreateBusinessObjectConversationInternal(event, result);
                }.bind(this), function (error) {
                    $log.debug('Failed to load current global user. ' + error);
                });
            },

            onCreateBusinessObjectConversationInternal: function (event, currentProfile) {
                //user wants to chat with this contact
                //verify whether we have conversation with this user

                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
                    //do not allow to chat if there is no connection
                    return;
                }

                if (common.isNullOrUndefined(event.data.businessObjectType)
                    || common.isNullOrUndefined(event.data.businessObjectId)
                    || common.isNullOrUndefined(event.data.businessTransactionId)) {
                    throw new Error('Invalid CreateBusinessObjectConversation request.');
                }

                var conversation = conversation = new ConversationModel({
                    Id: null,
                    DisplayName: null,
                    Participants: [currentProfile.getId()],
                    Messages: [],
                    BusinessObjecType: event.data.businessObjectType,
                    BusinessObjecId: event.data.businessObjectId,
                    BusinessTransactionId: event.data.businessTransactionId,
                    Type: MessengerEnums.ConversationType.Public,

                }, this.user);

                this.pendingConversations.push(conversation);

                this.openConversation(conversation);
            },

            onCreateCustomConversation: function (event) {
                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
                    //do not allow to create if there is no connection
                    return;
                }

                var messageText = event.data.messageText,
                    options;

                if (event.data.type === MessengerEnums.ConversationType.Private) {
                    getProfileModel(event.data.participants[0]).then(function (result) {
                        this.openPrivateConversation(result, { messageText: messageText });
                    }.bind(this));
                }
                else {
                    options = {
                        displayName: event.data.displayName,
                        participants: event.data.participants,
                        parentConversationId: event.data.parentConversation ? event.data.parentConversation.getId() : null,
                    };

                    this.createGroupConversation(options);
                }
            },

            onCreateStreamConversation: function (event) {
                //we need to load particiants, get company name

                getProfileForSubscriber(event.data.SubscriberMasterUserId, event.data.Stream.CompanyId).then(function (result) {
                    this.createStreamConversation(result, event.data.Stream, event.data.CompanyName);
                }.bind(this), function (error) {
                    $log.debug(String.format('Failed to load subscriber global user (master:{0}, company:{1}). {2}'),
                        error, event.data.SubscriberMasterUserId, event.data.Stream.CompanyId);
                });
            },

            createStreamConversation: function (subscriber, stream, companyName) {
                messenger.getCurrentProfile().then(function (result) {
                    this.createStreamConversationInternal(subscriber, stream, companyName, result);
                }.bind(this), function (error) {
                    $log.debug('Failed to load current global user. ' + error);
                });
            },

            createStreamConversationInternal: function (subscriber, stream, companyName, currentProfile) {

                var conversationTitle = String.format('{0} ({1})',
                                                    stream.Name,
                                                    companyName ? companyName : subscriber.getContextName())

                var conversation = new ConversationModel({
                    DisplayName: conversationTitle,
                    Participants: [subscriber, currentProfile],
                    Type: MessengerEnums.ConversationType.Group,
                    BusinessObjecType: MessengerConstants.StreamObjectType,
                    BusinessObjecId: stream.GlobalId,
                }, this.user);

                this.pendingConversations.push(conversation);

                this.openConversation(conversation);
            },

            onOpenChildConversation: function (event) {
                //user wants to open group conversation
                //group conversation cann be not in list if it is old
                //so check in cache
                var conversation = conversationProviderService.get(event.data.conversationId);

                if (conversation) {
                    this.openConversation(conversation);
                    return;
                }

                //looks like it is old conversation try to find it on server
                this.loadConversation(event.data.conversationId).then(function (result) {
                    if (utils.common.isNullOrUndefined(result)) {
                        return;
                    }

                    this.addConversation(result);
                    this.openConversation(result);
                }.bind(this));
            },

            onConversationOpenedOnPage: function (event) {
                this.conversationOpenedOnPage = event.data.conversation;
            },

            onConversationOpen: function (event) {
                this.openedConversations.push(event.conversation);
            },

            onCloseConversation: function (event) {
                if (utils.common.isNullOrEmpty(event.conversation.getId())) {
                    this.pendingConversations.remove(event.conversation)
                }

                this.openedConversations.remove(event.conversation);
            },

            onOpenMessenger: function (event) {
                if (utils.common.isNullOrUndefined(event.state)) {
                    return;
                }

                switch (event.state) {
                    case MessengerEnums.MessengerPanelOpenAction.Minimize:
                        this.minimize();
                        break;
                    case MessengerEnums.MessengerPanelOpenAction.Maximize:
                        this.maximize();
                        break;
                }
            },

            onCurrentCompanyChanged: function (event, company) {
                var deferred = $q.defer();
                var companyId = company === null ? null : company.Id;

                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
                    //do not allow to load, because we cannot get statuses until
                    //connection will be established
                    return;
                }

                if (this.currentCompanyId === companyId) {
                    //company did not change
                    return;
                }

                this.currentCompanyId = companyId;

                if (companyId === null) {
                    messenger.logoutCompany();
                }
                else {
                    messenger.changeCompany(companyId);
                }

                $log.debug('Company changed: ' + JSON.stringify(company));
                $scope.colleagues.clear();

                //reconnect because we need to send new company token
                hubConnection.disconnect();
                hubConnection.connect().then(function () {
                    //this.loadColleaguesByCompany(company, deferred).then(function(result){
                    //$scope.colleagues.push(result);
                    //}.bind(this));
                }.bind(this));
            },

            onCurrentUserAvatarChanged: function (event) {
                var imgData = event.data.ResizedImages.findByField("micro", "Size");
                var url;

                if (imgData) {
                    url = imgData.Url;
                }

                messenger.getCurrentUser().then(function (result) {
                    result.setAvatarThumbUrl(url);
                    result.Profiles.forEach(function (gu) { gu.setAvatarThumbUrl(url); });
                });
            },

            onSetupUnavailableMessage: function () {
                this.setupAwayStatusSettings();
            },

            onSetUserStatus: function (event) {
                switch (event.data.status) {
                    case MessengerEnums.UserStatuses.Online:
                        this.setOnlineStatus();
                        break;
                    case MessengerEnums.UserStatuses.Offline:
                        this.setOfflineStatus();
                        break;
                    case MessengerEnums.UserStatuses.Away:
                        this.setAwayStatus();
                        break;
                    case MessengerEnums.UserStatuses.Busy:
                        this.setBusyStatus();
                        break;
                }
            },
            //
            //messenger events handlers
            //

            bindMessengerEvents: function () {
                hubConnection.bindStateChanged(this.onMessengerStateChanged, this);

                messengerHub.bindConversationCreated(this.onConversationCreated, this);
                messengerHub.bindMessageReceived(this.onMessageReceived, this);
                messengerHub.bindUserStatusChanged(this.onUserStatusChanged, this);
                messengerHub.bindLoadUserSettings(this.onLoadUserSettings, this);
                messengerHub.bindMessageRead(this.onMessageRead, this);
                messengerHub.bindMessagesDeleted(this.onMessagesDeleted, this);
                messengerHub.bindConversationMuted(this.onConversationMuted, this);
                messengerHub.bindConversationUnmuted(this.onConversationUnmuted, this);
                messengerHub.bindStartVideoChat(this.onStartVideoChat, this); // kapel

                notificationHub.bindNotifyContactAdded(this.onContactAdded, this);
                notificationHub.bindContactRemoved(this.onContactRemoved, this);
                notificationHub.bindUserInfoChanged(this.onUserInfoChanged, this);
                notificationHub.bindCompanyInfoChanged(this.onCompanyInfoChanged, this);
                notificationHub.bindCompanyUserAdded(this.onCompanyUserAdded, this);

                $scope.$on('$destroy', function () {
                    hubConnection.unbindStateChanged(this.onMessengerStateChanged, this);

                    messengerHub.unbindConversationCreated(this.onConversationCreated, this);
                    messengerHub.unbindMessageReceived(this.onMessageReceived, this);
                    messengerHub.unbindUserStatusChanged(this.onUserStatusChanged, this);
                    messengerHub.unbindLoadUserSettings(this.onLoadUserSettings, this);
                    messengerHub.unbindMessageRead(this.onMessageRead, this);
                    messengerHub.unbindMessagesDeleted(this.onMessagesDeleted, this);
                    messengerHub.unbindConversationMuted(this.onConversationMuted, this);
                    messengerHub.unbindConversationUnmuted(this.onConversationUnmuted, this);

                    notificationHub.unbindNotifyContactAdded(this.onContactAdded, this);
                    notificationHub.unbindContactRemoved(this.onContactRemoved, this);
                    notificationHub.unbindUserInfoChanged(this.onUserInfoChanged, this);
                    notificationHub.unbindCompanyInfoChanged(this.onCompanyInfoChanged, this);
                    notificationHub.unbindCompanyUserAdded(this.onCompanyUserAdded, this);
                }.bind(this));
            },

            onMessengerStateChanged: function (event) {
                this.ConnectionState = event.newState;

                if (event.newState === CoreEnums.HubConnectionState.Connected) {
                    this.onConnected();
                }

                if (event.newState === CoreEnums.HubConnectionState.Disconnected) {
                    this.currentUserStatus = MessengerEnums.UserStatuses.Offline;
                }
            },

            onConnected: function () {
                if (this.wasConnected) {
                    this.updateContacts().then(function () {
                        this.updateContactsStatuses();
                    }.bind(this));
                    this.loadUnreadConversations();
                }
            },

            onConversationCreated: function (event) {
                var messages,
                    i,
                    conversation = conversationProviderService.get(event.conversation.Id);
                if (conversation === null) {

                    if (!utils.common.isNullOrEmpty(event.conversation.RequestId)) {
                        conversation = this.pendingConversations.findByRequestId(event.conversation.RequestId);

                        if (conversation) {
                            //we are creating conversation, so let chat window assign id
                            return;
                        }
                    }

                    //somebody has created conversation

                    conversation = new ConversationModel(event.conversation, this.user);
                    this.addConversation(conversation, true);
                }

                //if not muted or we are creating this conversation
                if (this.userSettings.Settings.Mute) {
                    return;
                }

                if (this.requestCorrelationIds.hasOwnProperty(conversation.getRequestId())) {
                    this.openConversation(conversation,
                        this.requestCorrelationIds[conversation.getRequestId()]);
                    delete this.requestCorrelationIds[conversation.getRequestId()];
                    return;
                }

                //this is not our conversation,so show messages
                messages = conversation.Messages.filter(function (msg) {
                    return !this.user.Profiles.containsById(msg.getAuthorId()) && !msg.isNotificationMessage()
                }, this);

                for (i = 0; i < messages.length; i++) {
                    this.openMessage(messages[i]);
                }
            },

            // kapel
            onStartVideoChat: function (message) {
                var conversation = conversationProviderService.get(message.videoChat.ConversationId);
                if(conversation.videoRoomCtrl && conversation.videoRoomCtrl.videoRoom && conversation.videoRoomCtrl.videoRoom.room === parseInt(message.videoChat.VideoRoomId)){
                    // me is an initiator, do noting
                    return;
                }

                FloatDivMng.pathPrefix = FloatDivMng.pathPrefixFull;

                var callerName = message.videoChat.Subject; // FixMe: hack... ask for changing of the signal format ( add an info about the sender )

                confirmIncomingRing(callerName + ' calling', function(ev) {
                    this.openConversation(conversation);
                    aCtx().getVideoRoomMng().connectServerAndJoinVideoRoom(null, message.videoChat.VideoRoomId);
                }.bind(this));
            },

            onMessageReceived: function (event) {
                var conversation,
                    message,
                    existingMessage;

                this.processNewReceivedMessage(event);

                conversation = conversationProviderService.get(event.message.ConversationId);

                if (!conversation) {
                    //$log.error(String.format('MessageReceived: conversation with id={0} not found.', event.message.ConversationId));

                    this.loadConversation(event.message.ConversationId).then(function (result) {
                        var msg;
                        if (utils.common.isNullOrUndefined(result)) {
                            return;
                        }

                        msg = result.Messages.findById(event.message.Id);
                        if (msg === null) {
                            //do not remember why onConversationCreated did not fired by server
                            //instead we receive message.
                            //and load conversation without that message
                            //so add it manually to fix situation
                            msg = new MessageModel(event.message);
                            result.Messages.push(msg);
                        }

                        this.addConversation(result, true);

                        if (msg !== null) {
                            this.openMessage(msg);
                        }
                    }.bind(this));
                    return;
                }

                message = new MessageModel(event.message);

                if (!utils.common.isNullOrUndefined(message.getRequestId())
                    && conversation.Messages.containsById(message.getRequestId())) {
                    //if this is our message request then just update create date and text
                    existingMessage = conversation.Messages.findById(message.getRequestId());
                    existingMessage.setId(message.getId());
                    existingMessage.setState(MessengerEnums.MessageState.Success);
                    existingMessage.setCreateDate(message.getCreateDate());
                }
                else {
                    //if this is a stream and adding participants check whether participants already added
                    //if so then do not show this message
                    if (!(conversation.isStream()
                        && message.getMessageType() === MessengerEnums.MessageType.AddParticipants
                        && conversation.Participants.containsAll(message.getAddedParticipants()))) {
                        conversation.Messages.push(message);
                    }
                }

                if (!$scope.conversations.containsById(event.message.ConversationId)) {
                    //for created private conversations
                    $scope.conversations.unshift(conversation);
                }

                //if (!utils.common.isNullOrUndefined(this.conversationOpenedOnPage)
                //        && this.conversationOpenedOnPage.getId() === conversation.getId()) {
                //    //do not open conversation because it is opened on page
                //    return;
                //}

                //if (!this.userSettings.Settings.Mute && !conversation.getIsMuted()) {
                //    this.openMessage(message);
                //}

                this.openMessage(message);
            },

            processNewReceivedMessage: function (event) {
                //execute action
                switch (event.message.MessageType) {
                    case MessengerEnums.MessageType.AddParticipants:
                        this.onParticipantsAdded(event);
                        break;
                    case MessengerEnums.MessageType.LeaveConversation:
                        this.onLeaveConversation(event);
                        break;
                    case MessengerEnums.MessageType.ParticipantJoined:
                        this.onJoinConversation(event);
                        break;
                    case MessengerEnums.MessageType.RenameConversation:
                        this.onConversationRenamed(event);
                        break;
                    case MessengerEnums.MessageType.Attachment:
                        break;
                    case MessengerEnums.MessageType.ParticipantRemoved:
                        this.onParticipantsRemoved(event);
                        break;
                        //on text message we do not excute any action, just add it to list
                }
            },

            onMessageRead: function (event) {
                //ReadMessages[], ConversationId, ReadBy
                var conversation = conversationProviderService.get(event.data.ConversationId),
                    msg,
                    i;

                if (!conversation) {
                    return;
                }

                for (i = 0; i < event.data.ReadMessagesLocalMasterIds.length; i++) {
                    msg = conversation.Messages.findReverse(function (item) {
                        return event.data.ReadMessagesLocalMasterIds[i];
                    });
                    if (msg != null) {
                        msg.markReadByUser(event.data.ReadBy);
                    }
                }
            },

            onMessagesDeleted: function (event) {
                var conversation = conversationProviderService.get(event.data.ConversationId),
                    message,
                    i;

                if (conversation === null) {
                    return;
                }

                for (i = 0; i < event.data.MessageIds.length; i++) {
                    message = conversation.Messages.findById(event.data.MessageIds[i]);
                    if (message) {
                        message.setIsDeleted(true);
                    }
                }
            },

            onParticipantsAdded: function (event) {
                var conversation = conversationProviderService.get(event.message.ConversationId),
                    withoutDuplicates,
                    newParticipants;

                if (!conversation) {
                    //may be not loaded
                    $log.debug('Conversation for participants is not found.');
                    return;
                }

                //verify for duplicated
                withoutDuplicates = event.message.Content.ParticipantsProfileIds.filter(function (item) {
                    return !conversation.Participants.contains(function (p) {
                        return p.getId() === item;
                    });
                });

                newParticipants = withoutDuplicates.map(function (id) {
                    return profileCacheService.get(id);
                });

                conversation.Participants.push(newParticipants);
            },

            onParticipantsRemoved: function (event) {
                var conversation = conversationProviderService.get(event.message.ConversationId);
                var profileIds;

                if (!conversation) {
                    //may be not loaded
                    $log.debug('Conversation for participant is not found.');
                    return;
                }

                profileIds = event.message.Content.ParticipantsProfileIds

                for (var i = 0; i < profileIds.length; i++) {
                    conversation.Participants.removeById(profileIds[i]);
                }
            },

            onLeaveConversation: function (event) {
                var conversation = conversationProviderService.get(event.message.ConversationId),
                    participant;

                if (!conversation) {
                    $log.error('Conversation for leaving is not found.');
                    return;
                }

                profileCacheService.getp(event.message.AuthorId).then(function (result) {
                    this.removeFromConversationByIndexId(conversation, result.getGroupId());
                }.bind(this), function (error) {
                    $log.debug('Failed to load global user leaving conversation.');
                });

                //participant = conversation.Participants.findById(event.message.AuthorId);

                //remove user from conversation                
                //conversation.Participants.remove(participant);
            },

            onConversationMuted: function (event) {
                var conversation = conversationProviderService.get(event.data);
                if (conversation != null) {
                    conversation.setIsMuted(true);
                }
            },

            onConversationUnmuted: function (event) {
                var conversation = conversationProviderService.get(event.data);
                if (conversation != null) {
                    conversation.setIsMuted(false);
                }
            },

            removeFromConversationByIndexId: function (conversation, profileGroupId) {
                var participant = conversation.Participants.find(function (p) {
                    return p.getGroupId() === profileGroupId;
                }, this);

                if (participant === null) {
                    //looks like user is not in conversation
                    return;
                }

                conversation.Participants.remove(participant);
            },

            onJoinConversation: function (event) {
                var conversation = $scope.businessConversations.findById(event.message.ConversationId),
                    participant;

                if (!conversation) {
                    conversation = conversationProviderService.get(event.message.ConversationId);
                }

                if (!conversation) {
                    $log.error('Conversation for join is not found.');
                    return;
                }

                participant = profileCacheService.get(event.message.AuthorId);
                conversation.Participants.push(participant);
            },

            onConversationRenamed: function (event) {
                var conversation = conversationProviderService.get(event.message.ConversationId);

                if (!conversation) {
                    $log.error('Conversation for renaming is not found.');
                    return;
                }

                conversation.setDisplayName(event.message.Content.Name);
            },

            onUserStatusChanged: function (event) {
                //find user and assign status
                var user;

                if (event.data.UserId === this.user.getId()) {
                    //change status
                    if (event.data.Status !== MessengerEnums.UserStatuses.Offline) {
                        this.currentUserStatus = event.data.Status;
                    }
                    return;
                }

                user = $scope.colleagues.findById(event.data.UserId);

                if (user) {
                    user.setStatus(event.data.Status);
                    return;
                }

                user = $scope.friends.findById(event.data.UserId);

                if (user) {
                    user.setStatus(event.data.Status);
                }
            },

            //TODO: ask Nick about ids and fields naming
            onContactAdded: function (event) {
                var contactIndexId = event.data.SenderGlobalMasterId === this.user.getId() ?
                    event.data.ContactGlobalIndexId : event.data.SenderGlobalIndexId;

                if (contactIndexId === this.user.getId()) {
                    $log.debug('User just tried to add himself to contacts.');
                    return;
                }

                if ($scope.friends.containsById(contactIndexId)) {
                    return;
                }

                contactsCacheService.getp(contactIndexId).then(function (result) {
                    this.addContactInternal(result)
                }.bind(this), function (error) {
                    $log.debug('Failed to load contact by index id.');
                });
            },

            onContactRemoved: function (event) {
                var contactIndexId = event.data.SenderGlobalIndexId === this.user.getId() ?
                    event.data.ContactGlobalIndexId : event.data.SenderGlobalIndexId;

                if (contactIndexId === this.user.getId()) {
                    $log.debug('User just tried to remove himself from contacts.');
                    return;
                }

                if (!$scope.friends.containsById(contactIndexId)) {
                    return;
                }

                $scope.friends.removeById(contactIndexId);
            },

            addContactInternal: function (contact) {
                //find contact position in list and insert

                $scope.friends.insertSorted(contact, function (c) { return c.getName(); });

                this.getUserStatuses([contact]);
            },

            onUserInfoChanged: function (event) {
                var profiles;

                //apply to master user
                if (contactsCacheService.isCached(event.data.GroupId)) {
                    contactsCacheService.get(event.data.GroupId).setData(event.data);
                }

                profiles = profileCacheService.getAll().filter(function (gu) {
                    return gu.getGroupId() === event.data.GroupId;
                });

                _.forEach(profiles, function (gu) {
                    gu.setUserData(event.data);
                });
            },

            onCompanyInfoChanged: function (event) {
                var profiles = profileCacheService.getAll().filter(function (gu) {
                    return gu.getContextGlobalMasterId() === event.data.ContextGlobalMasterId;
                });

                _.forEach(profiles, function (gu) {
                    gu.setContextName(event.data.ContextName);
                });
            },

            onCompanyUserAdded: function (event) {
                var profile = profileCacheService.putRaw(event.data),
                    msaterUser;

                if (contactsCacheService.isCached(profile.getGroupId())) {
                    msaterUser = contactsCacheService.get(event.data.GroupId);

                    msaterUser.Profiles.insertSorted(profile, function (c) { return c.getName(); });
                }

                if (currentCompanyService.getCurrentCompanyId() === event.data.ContextGlobalMasterId) {
                    //we loged in this company
                    //so add new user to Co-Workers list

                    contactsCacheService.getp(profile.getGroupId()).then(function (result) {
                        $scope.colleagues.insertSorted(result, function (c) { return c.getName(); });
                    });
                }
            },

            onLoadUserSettings: function (event) {

                //$log.debug('UserSettings: ' + JSON.stringify(event.data));

                this.userSettings.SettingStatus = event.data.Value.SettingStatus;
                this.userSettings.Settings = angular.extend({}, event.data.Value);

                //this.currentUserStatus = this.userSettings.CurrentStatus;
                this.currentUserStatus = event.data.Value.SettingStatus;

                ////temporary, untill server will be fixed
                if (this.currentUserStatus === MessengerEnums.UserStatuses.Offline) {
                    this.currentUserStatus = MessengerEnums.UserStatuses.Online;
                }

                //remove useless fields
                delete this.userSettings.Settings.CurrentStatus;
                delete this.userSettings.Settings.SettingStatus;
                delete this.userSettings.Settings.UserId;

                if (!common.isNullOrUndefined(this.newUserStatus) &&
                    this.newUserStatus != this.currentUserStatus) {

                    this.saveUserStatusOnServer(this.newUserStatus).then(function () {
                        this.newUserStatus = null;
                    }.bind(this));
                }

                if (common.isNullOrUndefined(this.userSettings.Settings.InactivityTimeout)) {
                    this.userSettings.Settings.InactivityTimeout = USER_INACTIVITY_PERIOD;
                }

                this.fireMuteAllChanged(this.userSettings.Settings.Mute);

                this.createIdleTimer();

                //we do not send offline to server (at least right now)
                //if (this.isOffline()) {
                //    hubConnection.disconnect();
                //}
            },

            getUserStatusName: function () {
                return getUserStatusName(this.currentUserStatus);
            },

            isUnknown: function () {
                return this.currentUserStatus === MessengerEnums.UserStatuses.Unknown;
            },

            isOffline: function () {
                return this.currentUserStatus === MessengerEnums.UserStatuses.Offline;
            },

            isOnline: function () {
                return this.currentUserStatus === MessengerEnums.UserStatuses.Online;
            },

            isAway: function () {
                return this.currentUserStatus === MessengerEnums.UserStatuses.Away;
            },

            isBusy: function () {
                return this.currentUserStatus === MessengerEnums.UserStatuses.Busy;
            },

            saveUserStatusOnServer: function (newValue) {
                /*
                 * @function - saves user status on server
                 * @param newValue - enum value
                 */

                return messengerHub.setUserStatus(newValue).then(function () {

                    this.currentUserStatus = newValue;
                    this.userSettings.SettingStatus = newValue;

                }.bind(this), function (result) {
                    $log.error('Failed to change user status. ' + result);
                    return $q.reject(result);
                }.bind(this));
            },

            setUserConnectedStatus: function (status) {
                //called when user explicitly wants to change status to Online/Away/Busy             

                if (this.isIntermediateConectionState()) {
                    //we are trying to connect, so user should wait
                    return false;
                }

                //if we disconnected then conned

                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
                    hubConnection.connect();

                    this.newUserStatus = status;
                }
                else {
                    this.saveUserStatusOnServer(status);
                }
            },

            setOnlineStatus: function () {
                //called when user explicitly wants to change status to Online          
                this.setUserConnectedStatus(MessengerEnums.UserStatuses.Online);
            },

            setOfflineStatus: function () {
                //called when user explicitly wants to change status to Offline

                //simply disconnect
                if (this.ConnectionState !== CoreEnums.HubConnectionState.Disconnected) {
                    hubConnection.disconnect();
                }

                this.currentUserStatus = MessengerEnums.UserStatuses.Offline;

                //we do not store offline status on server            
                //this.saveUserStatusOnServer(MessengerEnums.UserStatuses.Offline);

            },

            setAwayStatus: function () {
                // called when user explicitly wants to change status to Away             
                this.setUserConnectedStatus(MessengerEnums.UserStatuses.Away);
            },

            ////temporary commented out
            //setTemporaryStatus: function (newValue) {
            //    //sets user status without saving on server
            //    if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
            //        //if we are not connected tehn it does not makes sense to 
            //        return false;
            //    }

            //    if (this.currentUserStatus === newValue) {
            //        return;
            //    }

            //    return messengerHub.setUserStatus(newValue).then(function () {
            //        this.currentUserStatus = newValue;
            //    }.bind(this), function (result) {
            //        $log.error('Failed to change user status. ' + result);
            //        return $q.reject(result);
            //    }.bind(this));
            //},

            setAwayTemporary: function (isAway) {
                //this.setTemporaryStatus(MessengerEnums.UserStatuses.Away);

                //sets user status without saving on server
                if (this.ConnectionState !== CoreEnums.HubConnectionState.Connected) {
                    //if we are not connected tehn it does not makes sense to 
                    return false;
                }

                //almost hack
                if (isAway && this.currentUserStatus === MessengerEnums.UserStatuses.Away) {
                    return;
                }
                else if (!isAway && this.currentUserStatus === MessengerEnums.UserStatuses.Online) {
                    return;
                }

                return messengerHub.setTemporaryAwayStatus(isAway).then(function () {
                    if (isAway) {
                        this.currentUserStatus = MessengerEnums.UserStatuses.Away;
                    }
                    else {
                        this.currentUserStatus = MessengerEnums.UserStatuses.Online;
                    }
                }.bind(this), function (result) {
                    $log.error('Failed to change user status. ' + result);
                    return $q.reject(result);
                }.bind(this));
            },

            setBusyStatus: function () {
                // called when user explicitly wants to change status to Away             
                this.setUserConnectedStatus(MessengerEnums.UserStatuses.Busy);
            },

            createIdleTimer: function () {
                //we may call this method sevral times(when settings changed)
                $.idleTimer('destroy');

                if (this.userSettings.Settings.InactivityTimeout > 0) {
                    $.idleTimer(this.userSettings.Settings.InactivityTimeout * 1000 * 60);
                }
            },

            setupAwayStatusSettings: function () {

                if (this.isOffline()) {
                    return;
                }

                var modalDialog = $uibModal.open({
                    templateUrl: '/Application/Modules/Messenger/Html/SetupAwayStatusDialog.html',
                    controller: 'SetupAwayStatusDialogController',
                    size: 'smm',
                    backdrop: false,
                    resolve: {
                        settings: function () {
                            return angular.extend({}, this.userSettings.Settings);
                        }.bind(this),
                        contacts: function () {
                            return this.getAllContacts();
                        }.bind(this)
                    },
                });

                modalDialog.result.then(function (result) {
                    var oldTimeout = this.userSettings.Settings.InactivityTimeout;

                    angular.extend(this.userSettings.Settings, result);

                    if (oldTimeout !== result.InactivityTimeout) {
                        this.createIdleTimer();
                    }

                }.bind(this));
            },

            bindEvents: function () {
                messageBus.bind(events.login, this.onLoggedIn, this);
                messageBus.bind(events.logout, this.onLoggedOut, this);
                messageBus.bind(events.conversationClosed, this.onCloseConversation, this);
                messageBus.bind(events.createBusinessObjectConversation, this.onCreateBusinessObjectConversation, this);
                messageBus.bind(events.createConversation, this.onCreateCustomConversation, this);
                messageBus.bind(events.createStreamConversation, this.onCreateStreamConversation, this);
                messageBus.bind(events.openChildConversation, this.onOpenChildConversation, this);
                messageBus.bind(events.conversationOpenedOnPage, this.onConversationOpenedOnPage, this);
                messageBus.bind(events.conversationOpen, this.onConversationOpen, this);
                messageBus.bind(events.openMessenger, this.onOpenMessenger, this);
                messageBus.bind(events.currentUserAvatarChanged, this.onCurrentUserAvatarChanged, this);
                messageBus.bind(events.setUserStatus, this.onSetUserStatus, this);
                messageBus.bind(events.setupUnavailableMessage, this.onSetupUnavailableMessage, this);
                messageBus.bind(events.setMuteAllConversations, this.onSetMuteAllConversations, this);

                $scope.conversations.bindCollectionChanged(this.conversations_CollectionChanged, this);

                this.unregisterGetUnreadConversationsCountWatch = $scope.$watch(this.getUnreadConversationsCount.bind(this), function (newValue) {
                    messageBus.fire({
                        type: events.unreadConversationsChanged,
                        count: newValue
                    });
                });

                this.unregisterUserStatusWatch = $scope.$watch(function () { return this.currentUserStatus; }.bind(this),
                    function (newValue) {
                        messageBus.fire({
                            type: events.userStatusChanged,
                            status: newValue
                        });
                    });

                this.unregisterSearchKeywordWatch = $scope.$watch(function () { return $scope.searchKeyword; }.bind(this),
                   function () {
                       this.buildRecentConversationsList();
                   }.bind(this));

                this.unregisterIdleIdleTimer = function () {
                    if (this.currentUserStatus === MessengerEnums.UserStatuses.Online) {
                        this.setAwayTemporary(true);
                    }
                }.bind(this);

                this.unregisterActiveIdleTimer = function () {
                    if (this.currentUserStatus === MessengerEnums.UserStatuses.Away
                        && this.userSettings.SettingStatus === MessengerEnums.UserStatuses.Online) {
                        this.setAwayTemporary(false);
                    }
                }.bind(this);

                $(document).on("idle.idleTimer", this.unregisterIdleIdleTimer);
                $(document).on("active.idleTimer", this.unregisterActiveIdleTimer);

                this.unregisterOnCurrentCompanyChanged = $scope.$on(
                    events.currentCompanyChanged,
                    this.onCurrentCompanyChanged.bind(this));

                $scope.$on('$destroy', this.onDestroy.bind(this));
            },

            onDestroy: function () {
                messageBus.detach(events.conversationClosed, this.onCloseConversation, this);
                messageBus.detach(events.login, this.onLoggedIn, this);
                messageBus.detach(events.logout, this.onLoggedOut, this);
                messageBus.detach(events.createBusinessObjectConversation, this.onCreateBusinessObjectConversation, this);
                messageBus.detach(events.createConversation, this.onCreateCustomConversation, this);
                messageBus.detach(events.createStreamConversation, this.onCreateStreamConversation, this);
                messageBus.detach(events.openChildConversation, this.onOpenChildConversation, this);
                messageBus.detach(events.conversationOpenedOnPage, this.onConversationOpenedOnPage, this);
                messageBus.detach(events.conversationOpen, this.onConversationOpen, this);
                messageBus.detach(events.openMessenger, this.onOpenMessenger, this);
                messageBus.detach(events.currentUserAvatarChanged, this.onCurrentUserAvatarChanged, this);
                messageBus.detach(events.setMuteAllConversations, this.onSetMuteAllConversations, this);

                this.unregisterGetUnreadConversationsCountWatch();
                this.unregisterUserStatusWatch();
                this.unregisterSearchKeywordWatch();
                this.unregisterOnCurrentCompanyChanged();

                $(document).off("idle.idleTimer", this.unregisterIdleIdleTimer);
                $(document).off("active.idleTimer", this.unregisterActiveIdleTimer);

                $scope.conversations.unbindCollectionChanged(this.conversations_CollectionChanged, this);
                this.pendingConversations.clear();
            },

            fireMuteAllChanged: function (value) {
                messageBus.fire({
                    type: events.muteAllConversationsChanged,
                    value: value,
                });
            },

            onSetMuteAllConversations: function (event) {

                var settings = angular.extend({}, this.userSettings.Settings);

                //settings.Mute = !settings.Mute;
                settings.Mute = event.value;

                //save settings
                messengerHub.setUserSettings(settings).then(function () {
                    this.userSettings.Settings.Mute = settings.Mute;
                    this.fireMuteAllChanged(settings.Mute);
                }.bind(this), function (error) {
                    $log.error('Failed to save mute settings. ' + error);
                });
            },

            onCreateGroupConversation: function () {
                messenger.getCurrentProfile().then(function (result) {
                    this.createGroupConversationInternal(result);
                }.bind(this), function (error) {
                    $log.error('Failed to load current global user info. ' + error);
                });
            },

            createGroupConversationInternal: function (currentProfile) {
                //we need to create conversation and add it to list
                var conversation = new ConversationModel({
                    Id: null,
                    DisplayName: null,
                    Participants: [currentProfile.getId()],
                    Messages: [],
                    Type: MessengerEnums.ConversationType.Group,
                }, this.user);

                this.pendingConversations.push(conversation);

                this.openConversation(conversation);
            },

            buildRecentConversationsList: function () {
                var list;

                if (common.isNullOrEmpty($scope.searchKeyword)) {
                    list = $scope.conversations.slice(0, RECENT_CONVERSATIONS_COUNT);
                }
                else {
                    list = $scope.conversations.filter(function (item) {
                        return this.searchConversation(item);
                    }.bind(this)).slice(0, RECENT_CONVERSATIONS_COUNT);
                }

                $scope.recentConversations = list;
            },

            //
            //search support
            //
            searchConversation: function (conversation) {
                if (common.isNullOrEmpty($scope.searchKeyword)) {
                    return true;
                }

                var keyword = $scope.searchKeyword.toLowerCase();
                var i;
                var contact;
                var text;

                if (!common.isNullOrEmpty(conversation.getTitle())) {
                    text = conversation.getTitle().toLowerCase();
                    if (text.indexOf(keyword) > -1) {
                        return true;
                    }
                }

                //check participants
                for (i = 0; i < conversation.Participants.length() ; i++) {
                    contact = conversation.Participants.get(i);

                    if (!this.user.Profiles.containsById(contact.getId()) &&
                        !common.isNullOrEmpty(contact.getName())) {
                        text = contact.getName().toLowerCase();
                        if (text.indexOf(keyword) > -1) {
                            return true;
                        }
                    }
                }

                return false;
            },

            contactSearch: function (contact) {
                if (common.isNullOrEmpty($scope.searchKeyword)) {
                    return true;
                }

                var name = contact.getName();
                var keyword = $scope.searchKeyword.toLowerCase();
                if (common.isNullOrEmpty(name)) {
                    return false;
                }

                name = name.toLowerCase();

                return name.indexOf(keyword) > -1;
            },

            //
            // conversation filtering and sorting support
            //
            conversations_CollectionChanged: function (event) {

                if (common.isNullOrEmpty($scope.searchKeyword)
                    || (utils.common.isDefined(event.newStartingIndex) && event.newStartingIndex < RECENT_CONVERSATIONS_COUNT)
                    || (utils.common.isDefined(event.oldStartingIndex) && event.oldStartingIndex < RECENT_CONVERSATIONS_COUNT)) {

                    this.buildRecentConversationsList();
                }

                if (event.action === CoreEnums.CollectionAction.Add && event.newStartingIndex === 0) {
                    //
                    this.processNewBoConversations(event.newItems);
                    this.processNewStreamConversations(event.newItems);
                }
            },

            processNewBoConversations: function (list) {
                var currentObject = businessObjectService.getCurrentObject();
                var boConvs,
                    i;

                if (currentObject === null) {
                    return;
                }

                boConvs = list.filter(function (conv) {
                    return (conv.getBusinessObjecId() === currentObject.id);
                });

                $scope.businessConversations.unshift(boConvs);
            },

            processNewStreamConversations: function (list) {
                var currentStreams,
                    convs;

                if (!currentStreamsService.hasStreams()) {
                    return;
                }

                currentStreams = currentStreamsService.getCurrentStreams();

                convs = list.filter(function (conv) {
                    return currentStreams.indexOf(conv.getBusinessObjecId()) > -1;
                });

                $scope.streamConversations.unshift(convs);
            },
        });

        $scope.conversationOrderFunction = function (item) {
            return item.getLastMessageDate();
        };

        function getUserStatusName(value) {
            switch (value) {
                case MessengerEnums.UserStatuses.Offline: return 'Offline';
                case MessengerEnums.UserStatuses.Online: return 'Online';
                case MessengerEnums.UserStatuses.Away: return 'Away';
                case MessengerEnums.UserStatuses.Busy: return 'Busy';
            }
        }

        function getProfileModel(value) {
            var defer;

            if (!angular.isObject(value)) {
                return profileCacheService.getp(value);
            }

            if (value.__ClassName === "ProfileModel") {
                defer = $q.defer();
                defer.resolve(value);
                return defer.promise;
            }

            //looks like we have global index user id + company id (messengerRemoteControl)
            defer = $q.defer();

            //TODO: .MasterUserId was changed to GlobalIndexUserId
            contactsCacheService.getp(value.GlobalIndexUserId).then(function (result) {
                //find global user
                var profile;

                if (utils.common.isNullOrUndefined(value.CompanyId)) {
                    profile = result.Profiles.find(function (gu) {
                        return gu.getMessengerProfileType() === MessengerEnums.MessengerProfileType.User;
                    });
                }
                else {
                    profile = result.Profiles.find(function (gu) {
                        return gu.getContextGlobalMasterId() === value.CompanyId;
                    });
                }

                if (utils.common.isNullOrUndefined(profile)) {
                    defer.reject('Not found');
                }
                else {
                    defer.resolve(profile);
                }
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;

            //when this happens
            //userModel = new ProfileModel(value);
            //return profileCacheService.put(userModel);
        }

        function getProfileForSubscriber(globalIndexUserId, companyId) {
            var defer = $q.defer();

            contactsCacheService.getp(globalIndexUserId).then(function (result) {
                //find global user
                var profile = result.Profiles.find(function (gu) {
                    return gu.getContextGlobalMasterId() === companyId;
                });

                if (utils.common.isNullOrUndefined(profile)) {
                    defer.reject('Not found');
                }
                else {
                    defer.resolve(profile);
                }
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        }

        return new Controller($scope);
    }
    ]);

})(window);