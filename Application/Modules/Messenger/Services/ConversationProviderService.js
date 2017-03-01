(function (global) {
    'use strict';

    global.realineMessenger.factory('conversationProviderService',
    ['messengerHub', 'PendingConversationsManager', 'UniqueEntityCollection', 'EntityDictionary',
        'ConversationModel', 'utils', 'EventManager', 'MessengerEnums', 'CoreEnums', '$q', '$log',
    function (messengerHub, PendingConversationsManager, UniqueEntityCollection, EntityDictionary,
        ConversationModel, utils, EventManager, MessengerEnums, CoreEnums, $q, $log) {

        var CHANGED_EVENT = 'conversation cache changed';

        var ConversationProviderService = Class.extend({
            init: function () {
                this.__ClassName = 'ConversationProviderService';

                this.user = null;

                //cache contains all ever loaded conversations
                //except convs with business objects in which curret user does not participate
                this.cache = new EntityDictionary();
                this.eventManager = new EventManager();

                this.cache.bindDictionaryChanged(this.onCacheChanged, this);
            },

            setUser: function (user) {
                if (!utils.common.isNullOrUndefined(this.user) && this.user !== user) {
                    //reset because we have new user
                    this.clear();
                }

                this.user = user;
            },

            put: function (conversation) {
                if (this.cache.contains(conversation)) {
                    return;
                }

                this.cache.add(conversation);
            },

            get: function (conversationId) {
                return this.cache.get(conversationId);
            },

            clear: function () {
                this.cache.clear();
            },

            loadConversations: function (filter) {
                return messengerHub.getConversations(filter).then(function (result) {
                    var list = processLoadedConversations.call(this, result.Conversations);
                    return list;
                }.bind(this));
            },

            loadConversation: function (request) {//request options
                var deferred;

                if (this.cache.containsId(request.ConversationId)) {
                    deferred = $q.defer();
                    deferred.resolve(this.cache.get(request.ConversationId));
                    return deferred.promise;
                }

                return messengerHub.getConversation(request).then(function (result) {
                    if (utils.common.isNullOrUndefined(result)) {
                        return null;
                    }
                    return processLoadedConversation.call(this, result);
                }.bind(this));
            },

            loadPrivateConversation: function (request) {
                /*
                 *  {
                 *   OtherUserId:,
                     GetUnreadOnly: false,
                     MessagesPerConversation
                    }
                 */

                var deferred,
                    conversation;

                conversation = this.findPrivateConversationLocaly(request.OtherUserId);

                if (!utils.common.isNullOrUndefined(conversation)) {
                    deferred = $q.defer();
                    deferred.resolve(conversation);
                    return deferred.promise;
                }

                return messengerHub.findPrivateConversation(request).then(function (result) {
                    if (utils.common.isNullOrUndefined(result)) {
                        return null;
                    }

                    return processLoadedConversation.call(this, result);
                }.bind(this));
            },

            findPrivateConversationLocaly: function (contactId) {
                var i,
                    conversation,
                    list = this.cache.list();

                for (i = 0; i < list.length; i++) {
                    conversation = list[i];
                    if (!conversation.isPrivate()) {
                        continue;
                    }

                    if (conversation.Participants.length() === 1) {
                        //should never happen
                        continue;
                    }

                    if (conversation.Participants.get(0).getId() === contactId ||
                        conversation.Participants.get(1).getId() === contactId) {
                        return conversation;
                    }

                    continue;
                }

                return null;
            },

            loadObjectConversations: function (objectId) {
                return messengerHub.getObjectConversations(objectId).then(function (result) {
                    return processObjectConversations.call(this, result.Conversations);
                }.bind(this));
            },

            loadStreamsConversations: function (streamIds) {
                return messengerHub.getStreamsConversations(streamIds).then(function (result) {
                    return processStreamConversations.call(this, result.Conversations);
                }.bind(this));
            },

            onCacheChanged: function (event) {
                switch (event.action) {
                    case CoreEnums.DictionaryAction.Add:
                        this.fireAdd(event.items);
                        break;
                    case CoreEnums.DictionaryAction.Remove:
                        this.fireRemove(event.items);
                        break;
                }
            },

            bindCacheChanged: function (listener, context) {
                this.eventManager.bind(CHANGED_EVENT, listener, context);
            },

            unbindCacheChanged: function (listener, context) {
                this.eventManager.detach(CHANGED_EVENT, listener, context);
            },

            fireAdd: function (items) {
                var event = {
                    action: MessengerEnums.CacheAction.Add,
                    items: items
                };

                this.fireCollectionChanged(event);
            },

            fireRemove: function (items) {
                var event = {
                    action: MessengerEnums.CacheAction.Remove,
                    items: items
                };

                this.fireCollectionChanged(event)
            },

            fireCollectionChanged: function (event) {
                event.type = CHANGED_EVENT;
                event.sender = this;

                this.eventManager.fire(event);
            },
        });

        function processLoadedConversations(list) {
            var i,
                conversation,
                models = [];

            for (i = 0; i < list.length; i++) {
                conversation = processLoadedConversation.call(this, list[i]);

                //do not return conversations without messages
                //if (conversation.Messages.length() > 0) {
                models.push(conversation);
                //}
            }

            return models;
        }

        function processLoadedConversation(conv) {
            var conversation;

            if (this.cache.containsId(conv.Id)) {
                return this.cache.get(conv.Id);
            }
            else {
                conversation = new ConversationModel(conv, this.user);
                this.cache.add(conversation);
                return conversation;
            }
        }

        function processObjectConversations(list) {
            var i,
                modes = [];

            for (i = 0; i < list.length; i++) {
                modes.push(processObjectConversation.call(this, list[i]));
            }

            return modes;
        }

        function processObjectConversation(conv) {

            var conversation;

            if (this.cache.containsId(conv.Id)) {
                return this.cache.get(conv.Id);
            }
            else {
                conversation = new ConversationModel(conv, this.user);

                //if we do not participate in business object conversation then do not cache it
                if (this.user.Profiles.containsAnyId(conv.Participants)) {
                    this.cache.add(conversation);
                }

                return conversation;
            }
        }

        function processStreamConversations(list) {
            var i,
                modes = [];

            for (i = 0; i < list.length; i++) {
                modes.push(processObjectConversation.call(this, list[i]));
            }

            return modes;
        }

        function processStreamConversation(conv) {

            var conversation;

            if (this.cache.containsId(conv.Id)) {
                return this.cache.get(conv.Id);
            }
            else {
                conversation = new ConversationModel(conv, this.user);

                this.cache.add(conversation);

                return conversation;
            }
        }

        return new ConversationProviderService();
    }]);

})(window);