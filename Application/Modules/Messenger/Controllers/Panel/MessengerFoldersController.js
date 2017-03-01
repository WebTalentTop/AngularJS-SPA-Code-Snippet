(function (global) {
    'use strict';

    global.realineMessenger.controller('MessengerFoldersController',
    ['messengerHub', 'hubConnection', 'messageBus', 'TagModel',
        'UniqueEntityCollection', 'MessengerEnums', 'CoreEnums', 'utils', 'events', 'observable',
        'conversationTagService', 'conversationProviderService', '$scope', '$log', '$uibModal',
        '$timeout',
    function (messengerHub, hubConnection, messageBus, TagModel,
        UniqueEntityCollection, MessengerEnums, CoreEnums, utils, events, observable,
        conversationTagService, conversationProviderService, $scope, $log, $uibModal,
        $timeout) {

        var COUNTERS_UPDATE_DELAY = 500;

        var Controller = Class.extend({
            init: function (scope) {
                this.__ClassName = 'MessengerFoldersController';

                this.scope = scope;
                this.scope.controller = this;

                this.inboxFolder = null;
                this.starredFolder = null;
                this.draftFolder = null;
                this.archiveFolder = null;

                this.activeFolder = null;
                this.scope.foldersTreeExpanded = true;
                this.tags = conversationTagService.getTags();

                this.customFolders = [];

                this.countersUpdateTimer = null;

                this.bindEvents();

                if (this.isConnected()) {
                    this.loadTags();
                }
            },

            isActiveFolder: function (tag) {
                return this.activeFolder === tag;
            },

            onFolder_Click: function (newValue) {
                this.activeFolder = newValue;
            },

            loadTags: function () {
                return conversationTagService.loadTags();
                //return messengerHub.getTagsList().then(function (result) {
                //    var i;
                //    var newTag, oldTag;
                //    var newItems = [];

                //    //find new tags
                //    for (i = 0; i < result.Folders.length; i++) {
                //        oldTag = this.tags.findById(result.Folders[i].Id);
                //        newTag = new TagModel(result.Folders[i]);

                //        if (!oldTag) {
                //            newItems.push(newTag);
                //        }
                //        else {
                //            oldTag.setDisplayName(newTag.getDisplayName());
                //            oldTag.setUnreadConversationsCount(newTag.getUnreadConversationsCount());
                //        }
                //    }

                //    this.tags.push(newItems);

                //    //find removed tags
                //    for (i = 0; i < this.tags.length() ; i++) {
                //        oldTag = this.tags.get(i);

                //        if (!result.Folders.findById(oldTag.getId())) {
                //            this.tags.remove(oldTag);
                //        }
                //    }
                //}.bind(this),
                //function (error) {
                //    $log.debug('Failed to load tags. ' + error);
                //});
            },

            bindEvents: function () {
                this.tags.bindCollectionChanged(this.tags_Changed, this);
                hubConnection.bindStateChanged(this.onConnectionStateChanged, this);
                messengerHub.bindTagSaved(this.onTagSaved, this);
                messengerHub.bindTagDeleted(this.onTagDeleted, this);
                messengerHub.bindConversationTagged(this.onConversationTagged, this);
                conversationProviderService.bindCacheChanged(this.onConversationCacheChanged, this);

                this.scope.$watch('controller.activeFolder', this.onActiveFolderChanged);

                this.scope.$on('$destroy', this.onDestroy.bind(this));
            },

            onDestroy: function () {
                if (this.countersUpdateTimer !== null) {
                    $timeout.cancel(this.countersUpdateTimer);
                }
                this.tags.unbindCollectionChanged(this.tags_Changed, this);
                hubConnection.unbindStateChanged(this.onConnectionStateChanged, this);
                messengerHub.unbindTagSaved(this.onTagSaved, this);
                messengerHub.unbindTagDeleted(this.onTagDeleted, this);
                messengerHub.unbindConversationTagged(this.onConversationTagged, this);
                conversationProviderService.unbindCacheChanged(this.onConversationCacheChanged, this);
            },

            onActiveFolderChanged: function (newValue) {
                messageBus.fire({
                    type: events.activeFolderChanged,
                    folder: newValue,
                });
            },

            tags_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onTagsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onTagsRemoved(event);
                        break;
                }
            },

            onTagsAdded: function (event) {
                if (!this.inboxFolder) {
                    this.inboxFolder = this.findInboxFolder();

                    if (!this.activeFolder) {
                        this.activeFolder = this.inboxFolder;
                    }
                }

                if (!this.starredFolder) {
                    this.starredFolder = this.findStarredFolder();
                }

                if (!this.draftFolder) {
                    this.draftFolder = this.findDraftFolder();
                }

                if (!this.archiveFolder) {
                    this.archiveFolder = this.findArchiveFolder();
                }

                this.customFolders = this.findCustomFolders();
            },

            onTagsRemoved: function (event) {
                if (this.inboxFolder) {
                    this.inboxFolder = this.findInboxFolder();
                }

                if (this.starredFolder) {
                    this.starredFolder = this.findStarredFolder();
                }

                if (this.draftFolder) {
                    this.draftFolder = this.findDraftFolder();
                }

                if (this.archiveFolder) {
                    this.archiveFolder = this.findArchiveFolder();
                }

                if (this.activeFolder) {
                    if (!this.tags.containsById(this.activeFolder.getId())) {
                        this.activeFolder = this.inboxFolder;
                    }
                }

                this.customFolders = this.findCustomFolders();
            },

            onConnectionStateChanged: function (event) {
                if (event.newState === CoreEnums.HubConnectionState.Connected) {
                    //if (!this.wasConnected) {
                    //    this.wasConnected = true;
                    //    return;
                    //}

                    //update tags list                        
                    this.loadTags();
                }
            },

            onTagSaved: function (event) {
                var newTag, oldTag;

                oldTag = this.tags.findById(event.data.Id);
                newTag = new TagModel(event.data);

                if (!oldTag) {
                    this.tags.push(newTag);
                }
                else {
                    oldTag.setDisplayName(newTag.getDisplayName());
                    oldTag.setUnreadConversationsCount(newTag.getUnreadConversationsCount());
                }
            },

            onTagDeleted: function (event) {
                this.tags.removeById(event.data.FolderId);
            },

            onConversationTagged: function (data) {
                var conversation = conversationProviderService.get(data.data.ConversationId);
                if (conversation) {
                    //we have a conversation, so adjust tags list
                    var newTagIds = data.data.FolderIds.filter(function (item) {
                        return !conversation.Tags.containsById(item);
                    }, this);

                    var removedTags = conversation.Tags.filter(function (item) {
                        return data.data.FolderIds.indexOf(item.getId()) < 0;
                    }, this);

                    var i, tag, newTags = [];

                    //map ids to modes
                    for (i = 0; i < newTagIds.length; i++) {
                        tag = this.tags.findById(newTagIds[i]);
                        if (tag === null) {
                            //TODO: add async loading
                            $log.debug('Tag not found ' + newTagIds[i]);
                            continue;
                        }

                        newTags.push(tag);
                    }

                    //apply changes to converation
                    for (i = 0; i < removedTags.length; i++) {
                        conversation.Tags.remove(removedTags[i]);
                    }

                    for (i = 0; i < newTags.length; i++) {
                        conversation.Tags.push(newTags[i]);
                    }

                    //update counters
                    if (conversation.hasUnreadMessages()) {
                        for (i = 0; i < removedTags.length; i++) {
                            removedTags[i].decUnreadConversationsCount();
                        }
                        for (i = 0; i < newTags.length; i++) {
                            newTags[i].incUnreadConversationsCount();
                        }
                    }
                }
                else {
                    //we do not know details, so simply update tags info
                    this.loadTags();
                }
            },

            onCreateTag_Click: function () {
                var modalDialog = $uibModal.open({
                    templateUrl: '/Application/Modules/Messenger/Html/TagEditDialog.html',
                    controller: 'TagEditDialogController',
                    size: 'smm',
                    backdrop: false,
                    resolve: {
                        entity: null,
                    },
                });
            },

            onEditTag_Click: function (tag) {
                var modalDialog = $uibModal.open({
                    templateUrl: '/Application/Modules/Messenger/Html/TagEditDialog.html',
                    controller: 'TagEditDialogController',
                    size: 'smm',
                    backdrop: false,
                    resolve: {
                        entity: tag,
                    },
                });
            },

            onDeleteTag_Click: function (tag) {
                var modalDialog = $uibModal.open({
                    templateUrl: '/Application/Modules/Messenger/Html/TagDeleteDialog.html',
                    controller: 'TagDeleteDialogController',
                    size: 'smm',
                    backdrop: false,
                    resolve: {
                        entity: tag,
                    },
                });
            },

            isConnected: function () {
                if (hubConnection.getState() !== CoreEnums.HubConnectionState.Connected) {
                    return false;
                }
                return true;
            },

            findPredefinedFolder: function (type) {
                return this.tags.find(function (item) {
                    return item.getTagType() === type;
                }, this);
            },

            findInboxFolder: function () {
                return this.findPredefinedFolder(MessengerEnums.TagType.Inbox);
            },

            findStarredFolder: function () {
                return null;//return this.findPredefinedFolder(TagType.Inbox);
            },

            findDraftFolder: function () {
                return this.findPredefinedFolder(MessengerEnums.TagType.Draft);
            },

            findArchiveFolder: function () {
                return this.findPredefinedFolder(MessengerEnums.TagType.Archive);
            },

            findCustomFolders: function () {
                var folders = this.tags.filter(function (item) {
                    return item.getTagType() === MessengerEnums.TagType.CustomFolder;
                }, this);

                folders.sort(function (a, b) {
                    if (a.getDisplayName() < b.getDisplayName()) {
                        return -1;
                    }
                    else if (a.getDisplayName() > b.getDisplayName()) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });

                return folders;
            },

            onConversationCacheChanged: function (event) {
                switch (event.action) {
                    case MessengerEnums.CacheAction.Add:
                        this.onConversationCache_Added(event)
                        break;
                    case MessengerEnums.CacheAction.Remove:
                        this.onConversationCache_Removed(event);
                        break;
                }
            },

            onConversationCache_Added: function (event) {
                observable.bindPropertyChanged(
                    event.items,
                    this.Conversation_PropertyChanged,
                    this);
                var unread = event.items.findItem(function (item) {
                    return item.hasUnreadMessages();
                }, this);
                if (unread !== null) {
                    this.updateCounters();
                }
            },

            onConversationCache_Removed: function (event) {
                observable.unbindPropertyChanged(
                    event.items,
                    this.Conversation_PropertyChanged,
                    this);
            },

            Conversation_PropertyChanged: function (event) {
                if (event.property !== MessengerEnums.PropertyNames.UnreadMessagesCount) {
                    return;
                }

                if (event.oldValue === 0 && event.newValue > 0) {
                    //increase counters
                    event.target.Tags.forEach(function (tag) {
                        tag.incUnreadConversationsCount();
                    });
                }
                else if (event.oldValue > 0 && event.newValue === 0) {
                    //increase counters
                    event.target.Tags.forEach(function (tag) {
                        tag.decUnreadConversationsCount();
                    });
                }
            },

            updateCounters: function () {
                if (this.countersUpdateTimer !== null) {
                    $timeout.cancel(this.countersUpdateTimer);
                }

                this.countersUpdateTimer = $timeout(function () {
                    this.loadTags();
                }.bind(this), COUNTERS_UPDATE_DELAY);
            },
        });

        return new Controller($scope);
    }]
);

})(window);