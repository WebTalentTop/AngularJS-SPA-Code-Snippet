(function (global) {
    'use strict';

    global.realineMessenger.factory('PendingConversationsManager',
        ['EntityCollection', 'CoreEnums', 'MessengerEnums', 'EventManager', 'observable', 'utils',
            function (EntityCollection, CoreEnums, MessengerEnums, EventManager, observable, utils) {

                var CONVERSATION_INITIALIZED = 'conversation initialized';

                var PendingConversationsManager = Class.extend({
                    init: function (conversationsStorage) {
                        this.__ClassName = 'PendingConversationsManager';

                        this.eventManager = new EventManager();

                        this.pendingConversations = new EntityCollection();
                        this.pendingConversations.bindCollectionChanged(this.pendingConversations_CollectionChanged, this);
                    },

                    push: function (conversation) {
                        this.pendingConversations.push(conversation);
                    },

                    remove: function (conversation) {
                        this.pendingConversations.remove(conversation);
                    },

                    clear: function () {
                        this.pendingConversations.clear();
                    },

                    findByRequestId: function (requestId) {
                        var conversation = this.pendingConversations.find(function (item) {
                            return item.getRequestId() === requestId;
                        });

                        return conversation;
                    },

                    pendingConversations_CollectionChanged: function (event) {
                        switch (event.action) {
                            case CoreEnums.CollectionAction.Add:
                                this.onConversations_Added(event);
                                break;
                            case CoreEnums.CollectionAction.Remove:
                                this.onConversations_Removed(event);
                                break;
                            case CoreEnums.CollectionAction.Replace:
                                //implement later
                                break;
                            case CoreEnums.CollectionAction.Reset:
                                this.onConversations_Reset(event);
                                break;
                        }
                    },

                    onConversations_Added: function (event) {
                        observable.bindPropertyChanged(
                            event.newItems,
                            this.Conversation_PropertyChanged,
                            this);
                    },

                    onConversations_Removed: function (event) {
                        observable.unbindPropertyChanged(
                            event.oldItems,
                            this.Conversation_PropertyChanged,
                            this);
                    },

                    onConversations_Reset: function (event) {
                        observable.unbindPropertyChanged(
                            event.oldList,
                            this.Conversation_PropertyChanged,
                            this);
                        observable.bindPropertyChanged(
                            event.newList,
                            this.Conversation_PropertyChanged,
                            this);
                    },

                    Conversation_PropertyChanged: function (event) {
                        if (event.property !== MessengerEnums.PropertyNames.Id) {
                            return;
                        }

                        if (!utils.common.isNullOrEmpty(event.oldValue)) {
                            return;
                        }
                        //conversation created, so remove conversation from pending list
                        //and push this converastion to conversations list
                        this.pendingConversations.remove(event.target);

                        this.fireConversationInitialized(event.target);
                    },

                    bindConversationInitialized: function (listener, context) {
                        this.eventManager.bind(CONVERSATION_INITIALIZED, listener, context);
                    },

                    unbindConversationInitialized: function (listener, context) {
                        this.eventManager.detach(CONVERSATION_INITIALIZED, listener, context);
                    },

                    fireConversationInitialized: function (conversation) {
                        var event = {
                            type: CONVERSATION_INITIALIZED,
                            sender: this,
                            conversation: conversation,
                        }

                        this.eventManager.fire(event);
                    },
                });


                return PendingConversationsManager;
            }
        ]);

})(window);