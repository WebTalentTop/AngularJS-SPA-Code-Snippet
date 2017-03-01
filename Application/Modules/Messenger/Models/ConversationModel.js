(function (global) {
    'use strict';

    global.realineMessenger.factory('ConversationModel', ['MessageModel', 'MessengerEnums', 'MessengerConstants',
    'businessObjectService', 'EntityModel', 'UniqueEntityCollection',
    'CoreEnums', 'profileCacheService', 'utils', 'conversationTagService',
    function (MessageModel, MessengerEnums, MessengerConstants, businessObjectService, EntityModel,
        UniqueEntityCollection, CoreEnums, profileCacheService, utils, conversationTagService) {

        var ConversationModel,
            common = utils.common;

        ConversationModel = EntityModel.extend({
            init: function (data, currentUser) {
                this._super(data);

                this.__ClassName = 'ConversationModel';

                delete this.data.ParticipantProfileIds;
                delete this.data.Messages;

                this.currentUser = currentUser;

                setUnreadMessagesCount.call(this, 0);

                this.setLastMessageDate(new Date(0));

                this.initParticipants(data.ParticipantProfileIds);

                this.validateLeftConversation();

                this.initMessages(data.Messages);

                this.initTags(data.FolderIds);

                this.bindPropertyChanged(this.Property_Changed, this);

                rebuildSubtitle.call(this);
            },

            initParticipants: function (participants) {
                //var models = participants.map(function (item) {
                //    return new ParticipantModel(item);
                //});

                if (!participants) {
                    participants = [];
                }

                //get models
                var models = participants.map(function (id) {
                    if (angular.isObject(id)) {
                        return id;
                    } else {
                        return profileCacheService.get(id);
                    }
                });

                //remove duplicates
                models = models.filterDuplicates(function (item) { return item.getId(); });

                this.Participants = new UniqueEntityCollection();
                this.Participants.bindCollectionChanged(this.Participants_Changed, this);
                this.Participants.push(models);

                //if there is no participant force Title rebuild manually
                if (models.length === 0) {
                    rebuildConversationTitle.call(this);
                }
            },

            initMessages: function (messages) {
                if (!messages) {
                    messages = [];
                }

                var models = messages.map(function (item) {
                    return new MessageModel(item);
                });

                this.Messages = new UniqueEntityCollection();

                this.Messages.bindCollectionChanged(this.Messages_Changed, this);

                this.Messages.push(models);
            },

            initTags: function (tagIds) {
                var i, tag;

                if (!tagIds) {
                    tagIds = [];
                }

                this.Tags = new UniqueEntityCollection();

                //we need reference to conversation to be able to monitor tags list
                this.Tags.Conversation = this;

                for (i = 0; i < tagIds.length; i++) {
                    tag = conversationTagService.getTags().findById(tagIds[i]);
                    if (tag === null) {
                        $log.debug(String.format('Tag with id {0} not found.', tagIds[i]));
                        //TODO: consider adding tag caching
                        continue;
                    }

                    this.Tags.push(tag);
                }
            },

            getDisplayName: function () {
                return this.get(MessengerEnums.PropertyNames.DisplayName);
            },

            setDisplayName: function (value) {
                this.set(MessengerEnums.PropertyNames.DisplayName, value);
            },

            getTitle: function () {
                return this.get(MessengerEnums.PropertyNames.Title);
            },

            setTitle: function (value) {
                this.set(MessengerEnums.PropertyNames.Title, value);
            },

            getSubtitle: function () {
                return this.get(MessengerEnums.PropertyNames.Subtitle);
            },

            setSubtitle: function (value) {
                this.set(MessengerEnums.PropertyNames.Subtitle, value);
            },

            hasSubtitle: function () {
                return !utils.common.isNullOrEmpty(this.getSubtitle());
            },

            getUnreadMessagesCount: function () {
                return this.get(MessengerEnums.PropertyNames.UnreadMessagesCount);
            },

            hasUnreadMessages: function () {
                return this.getUnreadMessagesCount() > 0;
            },

            getLastMessageDate: function () {
                return this.get(MessengerEnums.PropertyNames.LastMessageDate);
            },

            setLastMessageDate: function (value) {
                this.set(MessengerEnums.PropertyNames.LastMessageDate, value);
            },

            getLastMessageText: function () {
                return this.get(MessengerEnums.PropertyNames.LastMessageText);
            },

            setLastMessageText: function (value) {
                this.set(MessengerEnums.PropertyNames.LastMessageText, value);
            },

            getRequestId: function () {
                return this.get(MessengerEnums.PropertyNames.RequestId);
            },

            setRequestId: function (value) {
                this.set(MessengerEnums.PropertyNames.RequestId, value);
            },

            isPrivate: function () {
                return this.getType() === MessengerEnums.ConversationType.Private;
            },

            isGroup: function () {
                return this.getType() === MessengerEnums.ConversationType.Group;
            },

            isPublic: function () {
                return this.getType() === MessengerEnums.ConversationType.Public;
            },

            isBusinessObjectConversation: function () {
                if (utils.common.isNullOrUndefined(this.getBusinessObjecType())) {
                    return false;
                }

                return !this.isStream();
            },

            isStream: function () {
                if (this.getBusinessObjecType() === MessengerConstants.StreamObjectType) {
                    return true;
                }
                else {
                    return false;
                }
            },

            getStreamId: function () {
                return this.getBusinessObjecId();
            },

            setStreamId: function (value) {
                this.setBusinessObjecId(value);
            },

            getType: function () {
                return this.get(MessengerEnums.PropertyNames.Type);
            },

            setType: function (value) {
                this.set(MessengerEnums.PropertyNames.Type, value);
            },

            getContact: function () {
                //returns contact for conversation when it is not group
                if (!this.isPrivate()) {
                    return null;
                }

                return this.Participants.find(function (p) {
                    return !this.currentUser.Profiles.containsById(p.getId());
                }, this);
            },

            getAvatarThumbUrl: function () {
                if (this.isPrivate() && this.Participants.length() > 1) {
                    return this.getContact().getAvatarThumbUrl();
                }

                return null;
            },

            isJoinedConversation: function () {
                return this.getIsJoinedConversation();
            },

            getIsJoinedConversation: function () {
                return this.get(MessengerEnums.PropertyNames.IsJoinedConversation);
            },

            setIsJoinedConversation: function (value) {
                this.set(MessengerEnums.PropertyNames.IsJoinedConversation, value);
            },

            getBusinessObjecType: function () {
                return this.get(MessengerEnums.PropertyNames.BusinessObjecType);
            },

            getBusinessObjecId: function () {
                return this.get(MessengerEnums.PropertyNames.BusinessObjecId);
            },

            getBusinessTransactionId: function () {
                return this.get(MessengerEnums.PropertyNames.BusinessTransactionId);
            },

            getIsMuted: function () {
                return this.get(MessengerEnums.PropertyNames.IsMuted);
            },

            setIsMuted: function (value) {
                this.set(MessengerEnums.PropertyNames.IsMuted, value);
            },

            Property_Changed: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.DisplayName:
                        rebuildConversationTitle.call(this);
                        break;
                    case MessengerEnums.PropertyNames.BusinessObjecType:
                        //case MessengerEnums.PropertyNames.BusinessObjecId: - now it does not influence in subtitle
                    case MessengerEnums.PropertyNames.BusinessTransactionId:
                        rebuildSubtitle.call(this);
                        break;
                }
            },

            getParticipants: function (skipCurrentUser) {
                if (!skipCurrentUser) {
                    return this.Participants.cloneArray();
                }

                var participants = this.Participants.filter(function (item) {
                    return !this.currentUser.Profiles.containsById(item.getId());
                }, this);

                return participants;
            },

            Participants_Changed: function (event) {
                rebuildConversationTitle.call(this);

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
                    case CoreEnums.CollectionAction.Reset:
                        //implement later
                        break;
                }

            },

            onParticipantAdded: function (event) {
                this.validateLeftConversation();

                this.bindParticipants(event.newItems);
            },

            onParticipantRemoved: function (event) {
                this.unbindParticipants(event.oldItems);

                this.validateLeftConversation();
            },

            Participant_PropertyChanged: function (event) {
                if (event.property === MessengerEnums.PropertyNames.Name
                    || event.property === MessengerEnums.PropertyNames.ContextName) {
                    rebuildConversationTitle.call(this);
                }
            },

            validateLeftConversation: function () {
                var hasCurrentUser = this.Participants.containsAny(this.currentUser.Profiles.list);

                this.setIsJoinedConversation(hasCurrentUser);
            },

            bindParticipants: function (participants) {
                var i;

                for (i = 0; i < participants.length; i++) {
                    participants[i].bindPropertyChanged(this.Participant_PropertyChanged, this);
                }
            },

            unbindParticipants: function (participants) {
                var i;

                for (i = 0; i < participants.length; i++) {
                    participants[i].unbindPropertyChanged(this.Participant_PropertyChanged, this);
                }
            },

            Messages_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onMessagesAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onMessagesRemoved(event);
                        break;
                    case CoreEnums.CollectionAction.Replace:
                        //implement later
                        break;
                    case CoreEnums.CollectionAction.Reset:
                        //implement later
                        break;
                }
            },

            onMessagesAdded: function (event) {
                var i;
                var message;

                var newUnreadCount = 0;

                for (i = 0; i < event.newItems.length; i++) {
                    message = event.newItems[i];
                    if (!message.getIsRead()) {
                        newUnreadCount++;
                    }

                    message.bindPropertyChanged(this.Message_PropertyChanged, this);
                }

                //update message.LastMessageDate and text
                if (common.isNullOrUndefined(this.getLastMessageDate())
                    || this.getLastMessageDate() < message.getCreateDate()) {
                    this.setLastMessageDate(message.getCreateDate());
                    this.setLastMessageText(message.getPlainText());
                }

                if (newUnreadCount > 0) {
                    addUnreadMessagesCount.call(this, newUnreadCount);
                }
            },

            onMessagesRemoved: function (event) {
                var i;
                var message;
                var oldUnreadCount = 0;

                for (i = 0; i < event.oldItems.length; i++) {
                    message = event.oldItems[i];
                    if (!message.getIsRead()) {
                        oldUnreadCount++;
                    }

                    message.unbindPropertyChanged(this.Message_PropertyChanged, this);
                }

                if (oldUnreadCount > 0) {
                    addUnreadMessagesCount.call(this, -oldUnreadCount);
                }

                if (event.oldStartingIndex > this.Messages.length()) {
                    message = this.Messages.last();
                    //update message.LastMessageDate and text
                    if (message) {
                        this.setLastMessageDate(message.getCreateDate());
                        this.setLastMessageText(message.getPlainText());
                    }
                    else {
                        this.setLastMessageDate(null);
                        this.setLastMessageText(null);
                    }
                }
            },

            Message_PropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.IsRead:
                        if (event.newValue === true) {
                            addUnreadMessagesCount.call(this, -1);
                        }
                        break;
                    case MessengerEnums.PropertyNames.IsDeleted:
                        if (event.newValue === true && this.Messages.last() === event.target) {
                            this.setLastMessageText(event.target.getPlainText());
                        }
                        break;
                    case MessengerEnums.PropertyNames.CreateDate:
                        if (this.Messages.last() === event.target) {
                            this.setLastMessageDate(event.newValue);
                        }
                        break;
                }
            },
        });

        //private methods

        function addUnreadMessagesCount(value) {
            var newValue = this.getUnreadMessagesCount() + value;
            setUnreadMessagesCount.call(this, newValue);
        }

        function setUnreadMessagesCount(value) {
            this.set(MessengerEnums.PropertyNames.UnreadMessagesCount, value);
        }

        function rebuildConversationTitle() {
            var title;

            if (this.data.DisplayName) {

                //we do not need property changed here because angular will render last value
                this.setTitle(this.data.DisplayName);
                return;
            }

            var participants = this.Participants.filter(function (item) {
                return !this.currentUser.Profiles.containsById(item.getId());
            }, this);

            if (participants.length === 1) {
                title = participants[0].getTitle();

                this.setTitle(title);
                return;
            }
            else if (participants.length === 0) {
                this.setTitle('Empty group');
                return;
            }

            this.setTitle(String.format('{0} + {1}', participants[0].data.Name, participants.length - 1));

            //if (participants.length === 2) {
            //    this.setTitle(String.format('{0} and 1 other', participants[0].data.Name));
            //} else {
            //    this.setTitle(String.format('{0} and {1} others', participants[0].data.Name, participants.length - 1));
            //}
        }

        function rebuildSubtitle() {

            var boName = null,
                boUrl;

            if (common.isNullOrUndefined(this.data.BusinessObjecId) ||
                common.isNullOrUndefined(this.data.BusinessObjecType) ||
                common.isNullOrUndefined(this.data.BusinessTransactionId) ||
                this.isStream()) {
                this.setSubtitle('');//bo-bind renders null if we set null here
                return;
            }

            boName = businessObjectService.getName(this.data.BusinessObjecType);
            if (utils.common.isNullOrEmpty(boName)) {
                boName = 'Unknown';
            }

            this.setSubtitle(String.format('{0} - {1}',
                this.getBusinessTransactionId(),
                boName));
        }

        return ConversationModel;
    }
    ]);

})(window);