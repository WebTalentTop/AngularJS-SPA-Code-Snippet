(function (global) {
    'use strict';

    global.realineMessenger.directive('messengerPageTitle', ['$log', '$',
        function ($log, $) {
            return {
                restrict: 'A',

                scope: {},

                link: function ($scope, element, attrs) {

                    $scope.setTitle = function (text) {
                        element.text(text);
                    };

                    $scope.controller.readConversationsData();
                },

                controller: ['conversationService', 'CoreEnums', 'MessengerEnums', 'observable',
                    '$scope', '$rootScope', '$interval', '$window', '$',
                    function (conversationService, CoreEnums, MessengerEnums, observable,
                        $scope, $rootScope, $interval, $window) {

                        var stages = {
                            Default: 0,
                            ConversationsCount: 1, 
                            OneConversation: 2,
                        };

                        var Controller = Class.extend({
                            init: function () {
                                $scope.controller = this;

                                this.unreadConversationsCount = 0;
                                this.unreadConversation = null;
                                this.lastMessageDate = null;//, new Date(2000, 1, 1);

                                this.isWindowsActive = !isDocumentHidden();

                                this.timer = null;

                                this.currentStage = stages.Default;

                                this.conversations = conversationService.getList();

                                this.bindEvents();
                            },

                            pageTitleChanged: function (newValue, oldValue) {
                                this.updatePageTitle();
                            },

                            initLastMessageDate: function () {
                                var conversation;

                                if (this.lastMessageDate !== null) {
                                    return;
                                }

                                //this is first deactivation, so remember latest date

                                conversation = this.conversations.find(function (c) {
                                    return c.hasUnreadMessages();
                                });

                                if (conversations === null) {
                                    this.lastMessageDate = new Date(2000, 1, 1);
                                }
                                else {
                                    this.lastMessageDate = conversation.getLastMessageDate();
                                }
                            },

                            readConversationsData: function (deactivating) {
                                var conversations = this.conversations.filter(function (c) {
                                    return c.hasUnreadMessages();
                                });

                                this.unreadConversationsCount = conversations.length;
                                if (conversations.length > 0) {
                                    this.unreadConversation = conversations[0];
                                }
                                else {
                                    this.unreadConversation = null;
                                }

                                this.updatePageTitle();

                                if (deactivating === true) {
                                    if (this.unreadConversation) {
                                        //remember newest message date
                                        this.lastMessageDate = this.unreadConversation.getLastMessageDate();
                                    }
                                    else {
                                        this.lastMessageDate = new Date(2000, 1, 1);
                                    }
                                }

                                if (this.unreadConversationsCount > 0
                                        && !this.isWindowsActive
                                        && this.unreadConversation.getLastMessageDate() > this.lastMessageDate) {
                                    this.startTimer();
                                }
                                else {
                                    this.stopTimer();
                                }
                            },

                            updatePageTitle: function () {
                                var newTitle;

                                if (this.isWindowsActive) {
                                    newTitle = $rootScope.title;
                                }
                                else {
                                    switch (this.currentStage) {
                                        case stages.Default:
                                            newTitle = $rootScope.title;
                                            break;
                                        case stages.ConversationsCount:
                                            newTitle = String.format('({0}) {1}',
                                                                    this.unreadConversationsCount,
                                                                    $rootScope.title);
                                            break;
                                        case stages.OneConversation:
                                            newTitle = String.format('{0} - {1}',
                                                                    this.unreadConversation.getTitle(),
                                                                    this.unreadConversation.getUnreadMessagesCount());
                                            break;
                                    }
                                }

                                $scope.setTitle(newTitle);
                            },

                            startTimer: function () {
                                if (this.timer !== null) {
                                    //timer is already running
                                    return;
                                }

                                this.timerIteration();

                                //use setInterval because angular do not update tab name when it is on background
                                this.timer = setInterval(this.timerIteration.bind(this), 1000);
                            },

                            timerIteration: function () {
                                switch (this.currentStage) {
                                    case stages.Default:
                                        this.currentStage = stages.ConversationsCount;
                                        break;
                                    case stages.ConversationsCount:
                                        this.currentStage = stages.OneConversation;
                                        break;
                                    case stages.OneConversation:
                                        this.currentStage = stages.ConversationsCount;
                                        break;
                                }

                                this.updatePageTitle();
                            },

                            stopTimer: function () {
                                if (this.timer === null) {
                                    return;
                                }

                                clearInterval(this.timer);
                                this.timer = null;

                                this.currentStage = stages.Default;

                                this.updatePageTitle();
                            },

                            onWindowActivated: function () {
                                this.isWindowsActive = true;
                                this.stopTimer();
                            },

                            onWindowDeactivated: function () {
                                this.isWindowsActive = false;
                                this.readConversationsData(true);
                            },

                            conversations_CollectionChanged: function (event) {
                                switch (event.action) {
                                    case CoreEnums.CollectionAction.Add:
                                        this.onConversations_Added(event);
                                        break;
                                    case CoreEnums.CollectionAction.Remove:
                                        this.onConversations_Removed(event);
                                        break;
                                        //case CoreEnums.CollectionAction.Reset:
                                        //    this.onConversations_Reset(event);
                                        //    break;
                                }
                            },

                            onConversations_Added: function (event) {
                                var conversations = event.newItems.filter(function (c) {
                                    return c.hasUnreadMessages();
                                });

                                observable.bindPropertyChanged(
                                    event.newItems,
                                    this.Conversation_PropertyChanged,
                                    this);

                                if (conversations.length > 0) {
                                    this.readConversationsData();
                                }
                            },

                            onConversations_Removed: function (event) {
                                var conversations = event.oldItems.filter(function (c) {
                                    return c.hasUnreadMessages();
                                });

                                observable.unbindPropertyChanged(
                                    event.oldItems,
                                    this.Conversation_PropertyChanged,
                                    this);

                                if (conversations.length > 0) {
                                    this.readConversationsData();
                                }
                            },

                            Conversation_PropertyChanged: function (event) {
                                if (event.property === MessengerEnums.PropertyNames.UnreadMessagesCount) {
                                    this.readConversationsData();
                                }
                            },

                            bindEvents: function () {
                                this.conversations.bindCollectionChanged(this.conversations_CollectionChanged, this);
                                observable.bindPropertyChanged(this.conversations, this.Conversation_PropertyChanged, this);

                                this.unregisterTitleWatcher = $rootScope.$watch('title', this.pageTitleChanged.bind(this));

                                $scope.$on('$destroy', this.onDestroy.bind(this));

                                //we do not need to unbind because this directive will live forever
                                $($window).blur(this.onWindowDeactivated.bind(this));
                                $($window).focus(this.onWindowActivated.bind(this));
                            },

                            onDestroy: function () {
                                this.conversations.unbindCollectionChanged(this.conversations_CollectionChanged, this);

                                observable.unbindPropertyChanged(this.conversations, this.Conversation_PropertyChanged, this);

                                this.unregisterTitleWatcher();

                                this.stopTimer();
                            },
                        });

                        function getHiddenProp() {
                            var prefixes = ['webkit', 'moz', 'ms', 'o'];

                            // if 'hidden' is natively supported just return it
                            if ('hidden' in document) return 'hidden';

                            // otherwise loop over all the known prefixes until we find one
                            for (var i = 0; i < prefixes.length; i++) {
                                if ((prefixes[i] + 'Hidden') in document)
                                    return prefixes[i] + 'Hidden';
                            }

                            // otherwise it's not supported
                            return null;
                        }

                        function isDocumentHidden() {
                            var prop = getHiddenProp();
                            if (!prop) {
                                //assume it is visible
                                return true;
                            }

                            return document[prop];
                        }

                        return new Controller();
                    }]
            };
        }]);

})(window);