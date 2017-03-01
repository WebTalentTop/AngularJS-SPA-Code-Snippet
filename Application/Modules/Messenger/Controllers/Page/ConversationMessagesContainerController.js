(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationMessagesContainerController',
    ['ObservableCollection', 'UniqueEntityCollection', 'EntityCollection', 'MessengerEnums',
        'MessageRecord', 'CoreEnums', 'utils', 'observable', '$scope', '$log', '$filter',
    function (ObservableCollection, UniqueEntityCollection, EntityCollection, MessengerEnums,
        MessageRecord, CoreEnums, utils, observable, $scope, $log, $filter) {

        var dateFilter = $filter('date');
        var dateComarableFormat = 'yyyyMMdd';

        var Controller = Class.extend({
            init: function () {
                this.__ClassName = 'ConversationMessagesContainerController';

                $scope.controller = this;

                //create isolated scope in future

                //original messages
                this.messages = $scope.messages;

                this.messageDayGroups = new ObservableCollection();
                $scope.messageDayGroups = this.messageDayGroups;

                this.addMessagesToBottom(this.messages.list);

                this.bindEvents();
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
                ////convert MessageModel to MessageRecord
                //var records = event.newItems.map(function (msg) {
                //    return new MessageRecord(msg);
                //});

                //this.messageRecords.insert(event.newStartingIndex, records);

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

                //this.messageRecords.removeAt(event.oldStartingIndex, event.oldItems.length);

                var i,
                    message,
                    day,
                    group;

                if (this.messages.length() === 0) {
                    //we are cleaning list, so simply remove all groups
                    this.messageDayGroups.clear();
                }
                else {
                    //remove from groups by one
                    for (i = 0; i < event.oldItems.length; i++) {
                        message = event.oldItems[i];

                        //remove message records in groups

                        day = resetTime(message.getCreateDate());

                        group = this.messageDayGroups.find(function (g) {
                            return g.day.valueOf() == day.valueOf();
                        });

                        if (group === null) {
                            $log.debug('day group for message was not found.');
                            continue;
                        }

                        if (group.messages.length() === 1) {
                            this.messageDayGroups.remove(group);
                        }
                        else {
                            group.messages.remove(message);
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
                    lastGroup = this.messageDayGroups.last();

                if (lastGroup !== null) {
                    lastOldMessage = lastGroup.messages.last();
                    //try to add messages to last group
                    for (i = 0; i < newMessages.length; i++) {
                        newMessage = newMessages[i];

                        if (isGroupableMessages(lastOldMessage, newMessage)) {
                            lastGroup.messages.push(newMessage);
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
                this.messageDayGroups.push(groups);
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
                    firstGroup = this.messageDayGroups.first();

                if (firstGroup !== null) {
                    firstOldMessage = firstGroup.messages.first();
                    for (i = newMessages.length - 1; i > -1; i--) {
                        newMessage = newMessages[i];

                        if (isGroupableMessages(firstOldMessage, newMessage)) {
                            firstGroup.messages.unshift(newMessage);
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
                this.messageDayGroups.unshift(groups);
            },

            onContactRedirectDestinationUser: function (message) {
                $scope.onContactRedirectDestinationUser({ message: message });
            },

            isOutgoingMessage: function (message) {
                return $scope.currentUser.Profiles.containsById(message.getAuthorId());
            },

            onResendMessages: function (messages) {
                $scope.onResendMessages({ messages: messages });
            },

            onDeleteMessages: function (messages) {
                $scope.onDeleteMessages({ messages: messages });
            }
        });

        function isGroupableMessages(message1, message2) {
            //TODO: rewrite method for grouping by day
            var message1Day,
                message2Day;

            //verify time
            message1Day = dateFilter(message1.getCreateDate(), dateComarableFormat);
            message2Day = dateFilter(message2.getCreateDate(), dateComarableFormat);

            if (message1Day !== message2Day) {
                return false;
            }

            return true;
        }

        function createGrpoup(message) {
            //var day = new Date(message.getCreateDate().getTime());
            var group = {
                day: resetTime(message.getCreateDate()),
                messages: new EntityCollection(),
            };

            //day.setHours(0, 0, 0, 0);

            //group.day = day;

            group.messages.push(message);

            return group;
        }

        function resetTime(date) {
            var day = new Date(date.getTime());
            day.setHours(0, 0, 0, 0);

            return day;
        }

        function buildGroups(messages) {

            var i,
                groups = [],
                group,
                nextMessage;

            group = createGrpoup(messages[0]);
            groups.push(group);

            for (i = 1; i < messages.length; i++) {
                nextMessage = messages[i];

                if (isGroupableMessages(group.messages.last(), nextMessage)) {
                    group.messages.push(nextMessage);
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