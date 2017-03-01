(function (global) {
    'use strict';

    global.realineMessenger.controller('MessengerPageController', [
        '$scope', '$q', '$log', '$timeout', 'BaseController', 'extendApplier', 'messenger',
        'ObservableCollection', 'EntityCollection', 'MessengerEnums', 'CoreEnums', 'events',
        'messageBus', 'utils',
        function ($scope, $q, $log, $timeout, BaseController, extendApplier, messenger,
            ObservableCollection, EntityCollection, MessengerEnums, CoreEnums, events,
            messageBus, utils) {

            var controller = BaseController.extend({

                init: function (scope) {
                    this._super(scope);

                    this.currentUser = null;

                    this.isMuteAllConversations = false;

                    this.tabs = new ObservableCollection();

                    this.bindEvents();
                    this.messagesTab = { isMessagesTab: true };
                    this.tabs.push(this.messagesTab);
                },

                load: function () {
                    this._super();

                    messenger.getCurrentUser().then(function (result) {
                        this.currentUser = result;
                    }.bind(this));
                },

                bindEvents: function () {
                    this.tabs.bindCollectionChanged(this.Tabs_Changed, this);
                    messageBus.bind(events.conversationOpen, this.onRemoteConversationOpen, this);
                    messageBus.bind(events.closeAllChatTabs, this.onCloseAllChatTabs, this);
                    messageBus.bind(events.muteAllConversationsChanged, this.onMuteAllConversationsChanged, this);
                    messageBus.bind(events.activeFolderChanged, this.onActiveFolderChanged, this);
                },

                onDestroy: function () {
                    messageBus.detach(events.conversationOpen, this.onRemoveConversationOpen, this);
                    messageBus.detach(events.closeAllChatTabs, this.onCloseAllChatTabs, this);
                    messageBus.detach(events.muteAllConversationsChanged, this.onMuteAllConversationsChanged, this);
                    messageBus.detach(events.activeFolderChanged, this.onActiveFolderChanged, this);
                },

                isActiveTab: function (tab) {
                    return tab === this.activeTab;
                },

                setActiveTab: function (tab) {
                    this.activeTab = tab;
                },

                onTabClick: function (tab) {
                    if (this.isActiveTab(tab)) {
                        return;
                    }

                    this.setActiveTab(tab);
                },

                onTabCloseClick: function (tab, event) {
                    var tabIndex = this.tabs.findIndex(function (item) {
                        return item === tab;
                    }, this);

                    if (tabIndex < 0) {
                        $log.debug('Tab was not found for closing.');
                        return;
                    }

                    this.tabs.removeAt(tabIndex);

                    event.preventDefault();
                },

                Tabs_Changed: function (event) {
                    switch (event.action) {
                        case CoreEnums.CollectionAction.Add:
                            this.onTabAdded(event);
                            break;
                        case CoreEnums.CollectionAction.Remove:
                            this.onTabsRemoved(event);
                            break;
                        case CoreEnums.CollectionAction.Move:
                            //not applicable yet
                            break;
                    }
                },

                onTabAdded: function (event) {
                    if (event.newItems.length === this.tabs.length()) {
                        this.setActiveTab(event.newItems[0]);
                    }
                },

                onTabsRemoved: function (event) {
                    var activeTabIndex = event.oldItems.findIndex(function (item) {
                        return this.isActiveTab(item);
                    }, this);

                    if (activeTabIndex < 0) {
                        return;
                    }

                    activeTabIndex += event.oldStartingIndex;

                    if (activeTabIndex >= this.tabs.length()) {
                        if (this.tabs.length() === 0) {
                            activeTabIndex = null;
                        }
                        else {
                            activeTabIndex = this.tabs.length() - 1;
                        }
                    }

                    if (activeTabIndex === null) {
                        this.setActiveTab(null);
                    }
                    else {
                        this.setActiveTab(this.tabs.get(activeTabIndex));
                    }
                },

                onConversationOpen: function (conversation) {
                    var conversationTab = this.tabs.find(function (tab) {
                        return tab.conversation && tab.conversation.getId() === conversation.getId();
                    }, this);

                    if (conversationTab === null) {
                        conversationTab = { conversation: conversation };
                        this.tabs.push(conversationTab);
                    }

                    if (conversationTab !== null) {
                        this.setActiveTab(conversationTab);
                        return;
                    }
                },

                onRemoteConversationOpen: function (event) {
                    this.onConversationOpen(event.conversation);
                },

                onCloseAllChatTabs: function (event) {
                    if (this.tabs.length() > 1) {
                        this.tabs.removeAt(1, this.tabs.length() - 1);
                    }
                },

                onMuteAllConversationsChanged: function (event) {
                    this.isMuteAllConversations = event.value;
                },

                mustFlashTab: function (tab) {
                    return tab.conversation.hasUnreadMessages()
                        && !this.isMuteAllConversations
                        && !tab.conversation.getIsMuted()
                        && !this.isActiveTab(tab);
                },

                onActiveFolderChanged: function (event) {
                    this.setActiveTab(this.messagesTab);
                },
            });

            extendApplier.applyFn.bind(this, controller, $scope)();
        }
    ]);
})(window);