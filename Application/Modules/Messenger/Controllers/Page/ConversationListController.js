(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationListController',
    ['ConversationRecord', 'conversationService', 'EntityCollection', 'CoreEnums',
        'conversationProviderService', 'utils', 'messageBus', 'events', 'observable',
        'MessengerEnums', '$scope', '$log',
    function (ConversationRecord, conversationService, EntityCollection, CoreEnums,
        conversationProviderService, utils, messageBus, events, observable,
        MessengerEnums, $scope, $log) {

        var CONVERSATION_BATCH_SIZE = 20;

        var Controller = Class.extend({
            init: function (scope) {
                this.__ClassName = 'ConversationListController';

                this.scope = scope;

                $scope.conversations = new EntityCollection();
                $scope.controller = this;

                this.canLoad = true;
                this.isLoading = false;
                $scope.conversationRecords = new EntityCollection();
                this.activeFolder = null;

                this.bindEvents();

                //var records = $scope.conversations.map(function (item) {
                //    return new ConversationRecord(item);
                //});

                //$scope.conversationRecords.push(records);
            },

            conversations_CollectionChanged: function (event) {
                //if (!utils.common.isNullOrEmpty($scope.searchKeyword)) {
                //    this.buildConversationList();
                //    return;
                //}

                //modify internal list here
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onConversationsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onConversationsRemoved(event);
                        break;
                    case CoreEnums.CollectionAction.Replace:
                        //implement later bacause it is not used
                        break;
                    case CoreEnums.CollectionAction.Move:
                        this.onConversationMoved(event);
                        break;
                    case CoreEnums.CollectionAction.Reset:
                        //implement later bacause it is not used
                        break;
                }
            },

            onConversationsAdded: function (event) {
                var records = event.newItems.map(function (item) {
                    return new ConversationRecord(item);
                });

                observable.bindPropertyChanged(
                    event.newItems,
                    this.Conversation_PropertyChanged,
                    this);

                $scope.conversationRecords.insert(event.newStartingIndex, records);

                observable.bindCollectionChanged(
                   event.newItems.map(function (item) { return item.Tags; }),
                   this.conversationTags_Changed,
                   this);
            },

            onConversationsRemoved: function (event) {
                observable.unbindPropertyChanged(
                    event.oldItems,
                    this.Conversation_PropertyChanged,
                    this);

                $scope.conversationRecords.removeAt(event.oldStartingIndex, event.oldItems.length);

                observable.unbindCollectionChanged(
                   event.oldItems.map(function (item) { return item.Tags; }),
                   this.conversationTags_Changed,
                   this);
            },

            onConversationMoved: function (event) {
                $scope.conversationRecords.move(event.oldIndex, event.newIndex);
            },

            Conversation_PropertyChanged: function (event) {
                var index;

                if (event.property !== MessengerEnums.PropertyNames.LastMessageDate) {
                    return;
                }

                index = this.scope.conversations.indexOf(event.target);
                if (index === 0) {
                    return;
                }

                //move up
                this.scope.conversations.move(index, 0);
            },

            conversationRecords_CollectionChanged: function (event) {
                //modify internal list here
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onConversationRecordsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        //this.onConversationRecordsRemoved(event);
                        break;
                }
            },

            onConversationRecordsAdded: function (event) {

            },

            //onConversationRecordsRemoved: function (event) {

            //},

            conversationTags_Changed: function (event) {
                switch (event.action) {
                    //case CoreEnums.CollectionAction.Add:
                    //    this.onConversationTagsAdded(event);
                    //    break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onConversationTagsRemoved(event);
                        break;
                }
            },

            onConversationTagsRemoved: function (event) {
                if (event.oldItems.indexOf(this.activeFolder) < 0) {
                    return;
                }

                this.scope.conversations.remove(event.sender.Conversation);
            },

            onSearchKeywordChanged: function (newValue, oldValue) {
                if (newValue === oldValue) {
                    return;
                }

                this.buildConversationList();
            },

            buildConversationList: function () {
                var records,
                    conversations;

                if (utils.common.isNullOrEmpty($scope.searchKeyword)) {
                    records = $scope.conversations.map(function (item) {
                        return new ConversationRecord(item);
                    });
                } else {
                    conversations = $scope.conversations.filter(function (item) {
                        return this.searchConversation(item);
                    }.bind(this));

                    records = conversations.map(function (item) {
                        return new ConversationRecord(item);
                    });
                }

                $scope.conversationRecords.clear();
                $scope.conversationRecords.push(records);
            },

            //
            //search support
            //
            searchConversation: function (conversation) {
                //var conversation = conversationRecord.Conversation;

                if (utils.common.isNullOrEmpty($scope.searchKeyword)) {
                    return true;
                }

                var keyword = $scope.searchKeyword.toLowerCase();
                var i;
                var contact;
                var text;

                if (!utils.common.isNullOrEmpty(conversation.getTitle())) {
                    text = conversation.getTitle().toLowerCase();
                    if (text.indexOf(keyword) > -1) {
                        return true;
                    }
                }

                //check participants
                for (i = 0; i < conversation.Participants.length() ; i++) {
                    contact = conversation.Participants.get(i);

                    if (!$scope.currentUser.Profiles.containsById(contact.getId()) &&
                        !utils.common.isNullOrEmpty(contact.getName())) {
                        text = contact.getName().toLowerCase();
                        if (text.indexOf(keyword) > -1) {
                            return true;
                        }
                    }
                }

                return false;
            },

            onConversationOpen: function (conversation) {
                this.scope.onConversationOpen({ conversation: conversation });
            },

            onConversationsScroll: function (scrollTop, scrollHeight) {
                if (scrollTop === scrollHeight) {
                    if (this.isLoading) {
                        return;
                    }

                    this.isLoading = true;

                    this.loadMoreConversations().finally(function () {
                        this.isLoading = false;
                    }.bind(this));
                }
            },

            onActiveFolderChanged: function (event) {
                if (this.activeFolder != event.folder) {
                    this.activeFolder = event.folder;
                    $scope.conversations.clear();
                }

                if (this.activeFolder) {
                    this.loadMoreConversations();
                }
            },

            loadMoreConversations: function () {
                var filter = {
                    Skip: $scope.conversations.length(),
                    Take: CONVERSATION_BATCH_SIZE,
                    GetUnreadOnly: false,
                    MessagesPerConversation: 1,
                    FolderId: this.activeFolder.getId()
                };

                if (this.isLoading) {
                    return;
                }

                this.isLoading = true;

                return conversationProviderService.loadConversations(filter).then(function (result) {
                    $scope.conversations.push(result);
                }, function (error) {
                    $log.debug('Failed to load more conversations.' + error);
                }).finally(function () {
                    this.isLoading = false;
                }.bind(this));
            },

            bindEvents: function () {
                $scope.conversations.bindCollectionChanged(this.conversations_CollectionChanged, this);
                $scope.conversationRecords.bindCollectionChanged(this.conversationRecords_CollectionChanged, this);

                messageBus.bind(events.activeFolderChanged, this.onActiveFolderChanged, this);

                $scope.$watch('searchKeyword', function (newValue, oldValue) {
                    this.onSearchKeywordChanged(newValue, oldValue);
                }.bind(this));

                $scope.$on('$destroy', this.onDestroy.bind(this));
            },

            onDestroy: function () {
                $scope.conversations.unbindCollectionChanged(this.conversations_CollectionChanged, this);
                $scope.conversationRecords.unbindCollectionChanged(this.conversationRecords_CollectionChanged, this);
                messageBus.detach(events.activeFolderChanged, this.onActiveFolderChanged, this);
            }

        });

        return new Controller($scope);
    }]
);

})(window);