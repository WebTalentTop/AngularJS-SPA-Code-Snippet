(function (global) {
    'use strict';

    global.realineMessenger.factory('conversationService',
    ['conversationProviderService', 'PendingConversationsManager', 'UniqueEntityCollection',
        'MessengerEnums', 'CoreEnums', 'observable', 'utils', '$q', '$log',
    function (conversationProviderService, PendingConversationsManager, UniqueEntityCollection,
        MessengerEnums, CoreEnums, observable, utils, $q, $log) {

        var ConversationService = Class.extend({
            init: function () {
                this.__ClassName = 'ConversationService';

                //list will contain conversations loaded as list +
                //conversation for which we received messages
                this.list = new UniqueEntityCollection();

                //pending conversations - convs which have not created on server yet
                //when they will be created they will be moved to 
                this.pendingConversations = new PendingConversationsManager();

                this.pendingConversations.bindConversationInitialized(this.onConversationInitialized, this);

                this.bindEvents();
            },

            getList: function () {
                return this.list;
            },

            getPending: function () {
                return this.pendingConversations;
            },

            clear: function () {
                this.list.clear();
                this.pendingConversations.clear();
            },

            bindEvents: function () {
                this.list.bindCollectionChanged(this.conversations_CollectionChanged, this);
            },

            onConversationInitialized: function (event) {
                conversationProviderService.put(event.conversation)
                //we will add to list later, when message will be received
                this.list.unshift(event.conversation);

            },

            conversations_CollectionChanged: function (event) {
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
                var index;

                if (event.property !== MessengerEnums.PropertyNames.LastMessageDate) {
                    return;
                }

                index = this.list.indexOf(event.target);
                if (index === 0) {
                    return;
                }

                //move up
                this.list.move(index, 0);
            },
        });

        return new ConversationService();
    }]);

})(window);