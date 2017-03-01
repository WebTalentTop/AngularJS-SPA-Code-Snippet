(function (global) {
    'use strict';

    global.app.controller('ConversationMessageGroupController',
    ['$scope', '$log', 'MessengerEnums', 'CoreEnums', 'events', 'utils', 'observable',
    function ($scope, $log, MessengerEnums, CoreEnums, events, utils, observable) {

        var Controller = Class.extend({
            init: function () {
                this.__ClassName = 'ConversationMessageGroupController';

                $scope.msgController = this;

                //for convenience
                this.messages = $scope.messageGroup.list;
                this.changeLastMessage(this.messages.last());

                this.isReadByOthers = false;
                this.hasErrors = true;

                this.initController();

                this.bindEvents();
            },

            bindEvents: function () {
                this.messages.bindCollectionChanged(this.messages_Changed, this);

                $scope.$on('$destroy', function () {
                    this.messages.unbindCollectionChanged(this.messages_Changed, this);
                    if (this.message) {//null should never happend                        
                        this.message.Readers.unbindCollectionChanged(this.Readers_Changed, this);
                        this.message.Author.unbindPropertyChanged(this.Author_PropertyChanged, this);
                    }

                    observable.unbindPropertyChanged(
                                this.messages.list,
                                this.message_PropertyChanged, this);
                }.bind(this));
            },

            initController: function () {
                observable.bindPropertyChanged(
                    this.messages.list,
                    this.message_PropertyChanged,
                    this);
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
                        //all messages has been removed
                        break;
                }
            },

            onMessagesAdded: function (event) {
                if (event.newStartingIndex >= this.messages.length() - 1) {
                    //add to the end
                    //this.addMessagesToBottom(event.newItems);
                }
                else {
                    //somebody loads history
                    //this.addMessagesToTop(event.newItems);
                }

                observable.bindPropertyChanged(
                    event.newItems,
                    this.message_PropertyChanged,
                    this);

                this.changeLastMessage(this.messages.last());

                this.updateUnreadMark();
                this.updateCommonErrorMark();
            },

            onMessagesRemoved: function (event) {
                var msg;

                observable.unbindPropertyChanged(
                    event.oldItems,
                    this.message_PropertyChanged, this);

                msg = event.oldItems.findItem(function (item) {
                    return item === this.message;
                }, this);

                if (msg) {
                    this.message.Readers.unbindCollectionChanged(this.Readers_Changed, this);

                    if (this.messages.length() > 0) {
                        this.changeLastMessage(this.messages.last());
                        this.message.Readers.bindCollectionChanged(this.Readers_Changed, this);
                    }
                }

                this.updateUnreadMark();
                this.updateCommonErrorMark();
            },

            message_PropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.IsRead:
                        this.updateUnreadMark();
                        break;
                    case MessengerEnums.PropertyNames.IsDeleted:
                        if (event.newValue) {
                            $scope.markAsDeleted(event.target);
                        }
                        this.updateCommonErrorMark();
                        break;
                    case MessengerEnums.PropertyNames.State:
                        $scope.setMessageState(event.target, this.message === event.target);
                        this.updateCommonErrorMark();
                        break;
                    case MessengerEnums.PropertyNames.Id:
                        $scope.changeMsgId(event.newValue, event.oldValue);
                        break;
                }
            },

            Author_PropertyChanged: function (event) {
                switch (event.property) {
                    case MessengerEnums.PropertyNames.AvatarThumb:
                        this.updateAvatar();
                        break;
                    case MessengerEnums.PropertyNames.Name:
                        this.updateUserName();
                        break;
                }
            },

            changeLastMessage: function (msg) {
                if (this.message != msg) {
                    if (this.message) {
                        this.message.Readers.unbindCollectionChanged(this.Readers_Changed, this);
                        this.message.Author.unbindPropertyChanged(this.Author_PropertyChanged, this);
                    }

                    this.message = msg;
                    $scope.message = msg;

                    if (!utils.common.isNullOrEmpty(msg)) {
                        this.message.Readers.bindCollectionChanged(this.Readers_Changed, this);
                        this.message.Author.bindPropertyChanged(this.Author_PropertyChanged, this);
                    }

                    this.onLastMessageChanged();
                }
            },

            onLastMessageChanged: function () {
                this.updateReadByOthersMark()

                if ($scope.setMessageState) {//because we call it in constructor
                    $scope.setMessageState(this.message, true);
                }
            },

            updateAvatar: function () {
                $scope.updateAvatar($scope.message.Author.getAvatarThumbUrl());
            },

            updateUserName: function () {
                $scope.updateUserName($scope.message.Author.getName());
            },

            updateUnreadMark: function () {
                var hasUnreadMessages = this.messages.contains(function (msg) { return !msg.getIsRead(); });
                this.setIsReadStatus(!hasUnreadMessages);
            },

            setIsReadStatus: function (value) {
                if (this.isRead === value) {
                    return;
                }

                this.isRead = value;

                //declared in link
                if (angular.isFunction($scope.setIsReadStatus)) {
                    $scope.setIsReadStatus(this.isRead);
                }
            },

            Readers_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onReadersAdded(event);
                        break;
                }
            },

            onReadersAdded: function (event) {
                this.updateReadByOthersMark();
            },

            updateReadByOthersMark: function (event) {
                //if (this.isReadByOthers) {
                //    return;
                //}

                if (this.message.Readers.length() > 0 && this.isOutgoing()) {
                    if ($scope.showReadByOthersMark) {//because we call it in constructor too
                        $scope.showReadByOthersMark(true);
                    }

                    if ($scope.markAsSent) {
                        $scope.markAsSent(this.message, true, false);
                    }

                    this.isReadByOthers = true;
                }
                else {
                    if ($scope.showReadByOthersMark) {
                        $scope.showReadByOthersMark(false);
                    }
                    this.isReadByOthers = false;
                }
            },

            readByOthersClick: function () {
                //show popup here
                var users = this.message.Readers.cloneArray();
                users = _.sortBy(users, function (u) { return u.getName(); });

                $scope.showReadersPanel(users);
            },

            updateCommonErrorMark: function () {
                var hasErrors = this.messages.contains(function (msg) {
                    return msg.getState() === MessengerEnums.MessageState.Error
                        && !msg.getIsDeleted();
                });

                if (this.hasErrors !== hasErrors) {
                    this.hasErrors = hasErrors;
                    $scope.setCommonErrorState(hasErrors);
                }
            },

            updateUI: function () {
                this.updateUnreadMark();
                this.updateReadByOthersMark();

                this.messages.forEach(function (m) {
                    $scope.setMessageState(m, m === this.message);
                }, this);

                this.updateCommonErrorMark();

                this.updateAvatar();
            },

            isOutgoing: function () {
                return $scope.controller.isOutgoingMessage(this.message);
            },

            onResendMessages: function () {
                var messages = this.messages.filter(function (m) {
                    return m.getState() === MessengerEnums.MessageState.Error;
                });

                if (messages.length > 0) {
                    $scope.controller.onResendMessages(messages);
                }
            },

            onDeleteMessages: function () {
                var messages = this.messages.filter(function (m) {
                    return m.getState() === MessengerEnums.MessageState.Error;
                });

                if (messages.length > 0) {
                    $scope.controller.onDeleteMessages(messages);
                }
            },
        });

        return new Controller();
    }
    ]);

})(window);