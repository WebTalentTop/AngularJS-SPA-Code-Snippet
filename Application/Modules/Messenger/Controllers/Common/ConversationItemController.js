(function (global) {
    'use strict';

    global.realineMessenger.factory('ConversationItemController',
    ['messengerHub', 'TagModel', 'conversationTagService', 'MessengerEnums', 'CoreEnums',
        'observable', 'utils', '$log', '$filter',
    function (messengerHub, TagModel, conversationTagService, MessengerEnums, CoreEnums,
        observable, utils, $log, $filter) {

        var Controller = Class.extend({
            init: function (scope) {
                this.__ClassName = 'ConversationItemController';

                this.scope = scope;

                this.scope.controller = this;

                this.setupScopeConversation();

                this.setupParticipant();
            },

            initUI: function () {
                this.updateStar();
                this.updateTitle();
                this.updateParticipants();
                this.updateLastMessageDate();
                this.updateLastMessageText();
                this.updateAvatar();
                this.updateUnreadMessagesCount();
            },

            setupScopeConversation: function () {
                //assume we have it because we use repeat
            },

            conversaton_onPropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.Title:
                        this.updateTitle();
                        break;
                    case MessengerEnums.PropertyNames.LastMessageDate:
                        this.updateLastMessageDate();
                        break;
                    case MessengerEnums.PropertyNames.LastMessageText:
                        this.updateLastMessageText();
                        break;
                    case MessengerEnums.PropertyNames.UnreadMessagesCount:
                        this.updateUnreadMessagesCount();
                        break;
                }
            },

            onParticipantPropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.AvatarThumb:
                        this.updateAvatar();
                        break;
                }
            },

            updateStar: function () {
                var starredTag = this.scope.conversation.Tags.find(function (item) {
                    return item.getTagType() === MessengerEnums.TagType.Starred;
                });

                this.scope.starConversation(!utils.common.isNullOrUndefined(starredTag));
            },

            updateSelection: function () {
                this.scope.setSelection(this.scope.conversationRecord.getIsSelected());
            },

            updateTitle: function () {
                this.scope.setTitle(this.scope.conversation.getTitle());
            },

            updateParticipants: function () {
                var value = '';
                var participants = this.scope.conversation.getParticipants(true);
                var i;

                participants = _.sortBy(participants, function (p) { return p.getName(); })

                for (i = 0; i < participants.length; i++) {
                    if (value.length > 0) {
                        value += ', ';
                    }

                    if (!utils.common.isNullOrEmpty(participants[i].getName())) {
                        value += participants[i].getName();
                    }
                }

                this.scope.setParticipants(value);
            },

            updateLastMessageDate: function () {
                var date = this.scope.conversation.getLastMessageDate();

                this.scope.setTime(this.dateFilter()(date, 'longDateOnly'));
            },

            updateLastMessageText: function () {
                var msg = this.scope.conversation.getLastMessageText();

                if (utils.common.isNullOrUndefined(msg)) {
                    msg = '';
                }

                this.scope.setLastMessageText(msg);
            },

            updateAvatar: function () {
                //var url = this.getConversationAvatarUrl();
                //this.scope.setAvatar(url);
            },

            updateUnreadMessagesCount: function () {
                this.scope.setUnreadMessagesCount(this.scope.conversation.getUnreadMessagesCount());
            },

            getConversationAvatarUrl: function () {
                var url = this.scope.conversation.getAvatarThumbUrl();

                if (!utils.common.isNullOrEmpty(url)) {
                    return url;
                }

                if (this.scope.conversation.isPrivate()) {
                    return '/Images/no_profile_photo.png';
                }
                else {
                    return '/images/blank_group.png';
                }
            },

            setupParticipant: function () {
                var p;
                var status;

                if (!this.scope.conversation.isPrivate()) {
                    this.unsubscribeParticipant();
                    return;
                }

                p = this.scope.conversation.Participants.find(function (item) {
                    return !this.scope.conversation.currentUser.Profiles.containsById(item.getId());
                }, this);

                if (p !== this.participant) {
                    this.unsubscribeParticipant();
                    this.participant = p;
                    this.scope.participant = p;
                    if (!utils.common.isNullOrUndefined(this.participant)) {
                        this.participant.bindPropertyChanged(this.onParticipantPropertyChanged, this);
                    }
                }
            },

            unsubscribeParticipant: function () {
                if (utils.common.isNullOrUndefined(this.participant)) {
                    return;
                }

                this.participant.unbindPropertyChanged(this.onParticipantPropertyChanged, this);
                this.participant = null;
            },

            bindEvents: function () {
                this.scope.conversation.bindPropertyChanged(this.conversaton_onPropertyChanged, this);

                this.scope.conversation.Participants.bindCollectionChanged(this.onParticipantsCollectionChanged, this);

                this.scope.conversation.Tags.bindCollectionChanged(this.onConversationTags_Changed, this);


                observable.bindPropertyChanged(
                            this.scope.conversation.Participants.list,
                            this.Participant_PropertyChanged,
                            this);

                this.scope.$on('$destroy', function () {
                    this.onDestroy();
                }.bind(this));
            },

            onDestroy: function () {
                this.scope.conversation.unbindPropertyChanged(this.conversaton_onPropertyChanged, this);
                this.scope.conversation.Participants.unbindCollectionChanged(this.onParticipantsCollectionChanged, this);
                this.scope.conversation.Tags.unbindCollectionChanged(this.onConversationTags_Changed, this);
                this.unsubscribeParticipant();

                observable.unbindPropertyChanged(
                            this.scope.conversation.Participants.list,
                            this.Participant_PropertyChanged,
                            this);
            },

            onParticipantsCollectionChanged: function (event) {
                this.updateAvatar();
                this.setupParticipant();
                this.updateParticipants();

                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onParticipantAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onParticipantRemoved(event);

                        break;
                }
            },

            onParticipantAdded: function (event) {
                observable.bindPropertyChanged(
                            event.newItems,
                            this.Participant_PropertyChanged,
                            this);
            },

            onParticipantRemoved: function (event) {
                observable.unbindPropertyChanged(
                            event.oldItems,
                            this.Participant_PropertyChanged,
                            this);
            },

            Participant_PropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.Name:
                        this.updateParticipants();
                        break;
                }
            },

            dateFilter: function () {
                if (!this.dateFilterInstance) {
                    this.dateFilterInstance = $filter('timeago');
                }

                return this.dateFilterInstance
            },

            onConversationOpen: function () {
                this.scope.onConversationOpen({ conversation: this.scope.conversation });
            },

            onConversationTags_Changed: function (event) {
                this.updateStar();
            },

            onStarConversation: function (event) {
                event.stopPropagation();

                if (this.updating) {
                    return;
                }

                var starredTag = conversationTagService.findByType(MessengerEnums.TagType.Starred);

                var tagIds;

                if (this.scope.conversation.Tags.containsById(starredTag)) {
                    //unstar
                    tagIds = this.scope.conversation.Tags.filter(function (item) {
                        return item.getId() !== starredTag.getId();
                    }).map(function (item) {
                        return item.getId();
                    });
                }
                else {
                    //star
                    tagIds = this.scope.conversation.Tags.map(function (item) {
                        return item.getId();
                    });

                    tagIds.push(starredTag.getId());
                }

                this.updating = true;

                messengerHub.tagConversation({
                    ConversationId: this.scope.conversation.getId(),
                    FolderIds: tagIds,
                }).then(function () {

                }, function (error) {
                    $log.debug('Failed to tagConversation. ' + error);
                }).finally(function () {
                    this.updating = false;
                }.bind(this));
            },
        });

        return Controller;
    }]
);

})(window);