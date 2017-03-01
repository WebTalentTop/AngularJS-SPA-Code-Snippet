(function (global) {
    'use strict';

    global.realineMessenger.controller('ChatBubbleMessagesController',
    ['EntityCollection', 'ObservableCollection', 'MessengerEnums', 'CoreEnums',
        'conversationProviderService', 'events', 'messageBus', 'utils', '$scope', '$log', '$timeout',
    function (EntityCollection, ObservableCollection, MessengerEnums, CoreEnums,
        conversationProviderService, events, messageBus, utils, $scope, $log, $timeout) {

        var MAX_MESSAGES_COUNT = 3,
            VISIBLE_TIMEOUT = 5000;

        var ChatBubbleMessagesController = Class.extend({
            init: function () {
                $scope.controller = this;
                $scope.messages = new EntityCollection();
                this.timers = new ObservableCollection();
                this.bindEvents();
            },

            onLoggedIn: function () {
                $scope.messages.clear();
            },

            onLoggedOut: function () {
                $scope.messages.clear();
                this.timers.forEach(function (item) { $timeout.cancel(item.timer); })
                this.timers.clear();
            },

            onNewMessageReceived: function (event) {
                if ($scope.messages.length() === MAX_MESSAGES_COUNT) {
                    $scope.messages.shift();
                }

                $scope.messages.push(event.message);
            },

            messages_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onMessagesAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onMessagesRemoved(event);
                        break;
                        //case CoreEnums.CollectionAction.Replace:
                        //    //implement later
                        //    break;
                        //case CoreEnums.CollectionAction.Reset:
                        //    //implement later
                        //    break;
                }
            },

            onMessagesAdded: function (event) {
                var i;

                for (i = 0; i < event.newItems.length; i++) {
                    this.createTimer(event.newItems[i]);
                }
            },

            onMessagesRemoved: function (event) {
                var i;

                for (i = 0; i < event.oldItems.length; i++) {
                    this.deleteTimer(event.oldItems[i]);
                }
            },

            createTimer: function (message) {
                var timerItem = {
                    message: message,
                };

                timerItem.timer = $timeout(function () {
                    $scope.messages.remove(message);
                }, VISIBLE_TIMEOUT);

                this.timers.push(timerItem);
            },

            deleteTimer: function (message) {
                var item = this.timers.find(function (item) {
                    return item.message === message;
                });

                if (item === null) {
                    return;
                }

                $timeout.cancel(item.timer);

                this.timers.remove(item);
            },

            onMessageClose: function (message, $event) {
                $event.stopPropagation();

                $scope.messages.remove(message);
            },

            onMessageClick: function (message) {
                var conversation = conversationProviderService.get(message.getConversationId());

                $scope.messages.remove(message);

                if (conversation === null) {
                    //strange: conversation must be loaded already
                    return;
                }

                messageBus.fire({
                    type: events.conversationOpen,
                    conversation: conversation,
                    messageText: null,
                });
            },

            bindEvents: function () {
                messageBus.bind(events.login, this.onLoggedIn, this);
                messageBus.bind(events.logout, this.onLoggedOut, this);
                messageBus.bind(events.newMessageReceived, this.onNewMessageReceived, this);
                //messageBus.bind(events.conversationOpen, this.onOpenConversation, this);            

                $scope.messages.bindCollectionChanged(this.messages_Changed, this);

                $scope.$on('$destroy', function () {
                    messageBus.detach(events.login, this.onLoggedIn, this);
                    messageBus.detach(events.logout, this.onLoggedOut, this);
                    messageBus.detach(events.newMessageReceived, this.onNewMessageReceived, this);
                    //messageBus.detach(events.conversationOpen, this.onOpenConversation, this);              
                }.bind(this));
            }
        });

        return new ChatBubbleMessagesController();
    }]
);

})(window);