(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationDayMessagesContainerController',
    ['MessageRecord', 'ObservableCollection', 'UniqueEntityCollection',
        'MessengerEnums', 'CoreEnums', 'utils', '$scope', '$log', '$filter',
    function (MessageRecord, ObservableCollection, UniqueEntityCollection,
        MessengerEnums, CoreEnums, utils, $scope, $log, $filter) {

        var dateFilter = $filter('date');
        var dateComarableFormat = 'yyyyMMdd HHmm';

        var Controller = Class.extend({
            init: function () {
                this.__ClassName = 'ConversationDayMessagesContainerController';
                //scope is not isolated
                //conversationMessages - isolated
                //  conversationDayMessages - not isolated
                //      this directive
                $scope.dayGroupController = this;

                //create isolated scope in future   

                this.messages = $scope.dayGroup.messages;//now they are records

                this.messageGroups = new ObservableCollection();
                $scope.messageGroups = this.messageGroups;

                this.bindEvents();

                this.addMessagesToBottom(this.messages.list);
            },

            bindEvents: function () {
                this.messages.bindCollectionChanged(this.messages_Changed, this);

                $scope.$on('$destroy', function () {
                    this.messages.unbindCollectionChanged(this.messages_Changed, this);
                }.bind(this));
            },

            messages_Changed: function (event) {
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
                if (event.newStartingIndex >= this.messages.length() - 1) {
                    //add to the end
                    this.addMessagesToBottom(event.newItems);
                }
                else {
                    //somebody loads history
                    this.addMessagesToTop(event.newItems);
                }
            },

            onMessagesRemoved: function (event) {
                var i, j,
                    message,
                    group;

                if (this.messages.length() === 0) {
                    this.messageGroups.clear();
                }
                else {
                    //remove by one
                    for (i = 0; i < event.oldItems.length; i++) {
                        message = event.oldItems[i];
                        group = this.findGroupByMessage(message);
                        if (group) {
                            if (group.list.length() === 1) {
                                this.messageGroups.remove(group);
                            }
                            else {
                                group.list.remove(message);
                            }
                        }
                    }
                }
            },

            addMessagesToBottom: function (newMessages) {
                //1. verify whether we can add some top messages (from newMessages) to last message
                //      if we can then add it 
                //2. take rest messages and build groups
                //3. add to list

                var newMessage,
                    groups,
                    i,
                    lastOldMessage,
                    lastGroup = this.messageGroups.last();

                if (lastGroup !== null) {
                    lastOldMessage = lastGroup.list.last();
                    //try to add messages to last group
                    for (i = 0; i < newMessages.length; i++) {
                        newMessage = newMessages[i];

                        if (isGroupableMessages(lastOldMessage, newMessage)) {
                            lastGroup.list.push(newMessage);
                        }
                        else {
                            break;
                        }
                    }

                    if (i < newMessages.length) {
                        newMessages = newMessages.slice(i);
                    }
                    else {
                        newMessages = []
                    }
                }

                //now we need to create groups
                if (newMessages.length == 0) {
                    return;
                }

                groups = buildGroups(newMessages);
                this.messageGroups.push(groups);
            },

            addMessagesToTop: function (newMessages) {
                //1. verify whtether we can add some bottom messages (from newMessages) to top message
                //      if we can then add it
                //2. take rest new messages and build grops
                //3. add to list

                var newMessage,
                    groups,
                    i,
                    firstOldMessage,
                    firstGroup = this.messageGroups.first();

                if (firstGroup !== null) {
                    firstOldMessage = firstGroup.list.first();
                    for (i = newMessages.length - 1; i > -1; i--) {
                        newMessage = newMessages[i];

                        if (isGroupableMessages(firstOldMessage, newMessage)) {
                            firstGroup.list.unshift(newMessage);
                        }
                        else {
                            break;
                        }
                    }

                    if (i > -1) {
                        newMessages = newMessages.slice(0, i + 1);
                    }
                    else {
                        newMessages = []
                    }
                }

                //now we need to create groups
                if (newMessages.length == 0) {
                    return;
                }

                groups = buildGroups(newMessages);
                this.messageGroups.unshift(groups);
            },

            findGroupByMessage: function (message) {
                var i;

                for (i = 0; i < this.messageGroups.length() ; i++) {
                    if (this.messageGroups.get(i).list.containsById(message.getId())) {
                        return this.messageGroups.get(i);
                    }
                }

                return null;
            },
        });

        function isGroupableMessages(message1, message2) {

            var message1Time,
                message2Time;

            if (message1.getMessageType() !== MessengerEnums.MessageType.TextMessage) {
                return false;
            }

            if (message2.getMessageType() !== MessengerEnums.MessageType.TextMessage) {
                return false;
            }

            if (message1.getAuthorId() !== message2.getAuthorId()) {
                return false;
            }

            //verify time
            message1Time = dateFilter(message1.getCreateDate(), dateComarableFormat);
            message2Time = dateFilter(message2.getCreateDate(), dateComarableFormat);

            if (message1Time !== message2Time) {
                return false;
            }

            return true;
        }

        function createGrpoup(message) {
            var group = { list: new UniqueEntityCollection() };
            group.list.push(message);

            return group;
        }

        function buildGroups(messages) {

            var i,
                groups = [],
                group,
                previousMessage,
                nextMessage;

            group = createGrpoup(messages[0]);
            groups.push(group);

            for (i = 1; i < messages.length; i++) {
                nextMessage = messages[i];

                if (isGroupableMessages(group.list.last(), nextMessage)) {
                    group.list.push(nextMessage);
                }
                else {
                    group = createGrpoup(nextMessage);
                    groups.push(group);
                }
            }

            return groups;
        }

        return new Controller();
    }]
);

})(window);