/*!
 * ASP.NET SignalR JavaScript Library v2.2.0
 * http://signalr.net/
 *
 * Copyright Microsoft Open Technologies, Inc. All rights reserved.
 * Licensed under the Apache 2.0
 * https://github.com/SignalR/SignalR/blob/master/LICENSE.md
 *
 */

/// <reference path="..\..\SignalR.Client.JS\Scripts\jquery-1.6.4.js" />
/// <reference path="jquery.signalR.js" />
(function ($, window, undefined) {
    /// <param name="$" type="jQuery" />
    "use strict";

    if (typeof ($.signalR) !== "function") {
        throw new Error("SignalR: SignalR is not loaded. Please ensure jquery.signalR-x.js is referenced before ~/signalr/js.");
    }

    var signalR = $.signalR;

    function makeProxyCallback(hub, callback) {
        return function () {
            // Call the client hub method
            callback.apply(hub, $.makeArray(arguments));
        };
    }

    function registerHubProxies(instance, shouldSubscribe) {
        var key, hub, memberKey, memberValue, subscriptionMethod;

        for (key in instance) {
            if (instance.hasOwnProperty(key)) {
                hub = instance[key];

                if (!(hub.hubName)) {
                    // Not a client hub
                    continue;
                }

                if (shouldSubscribe) {
                    // We want to subscribe to the hub events
                    subscriptionMethod = hub.on;
                } else {
                    // We want to unsubscribe from the hub events
                    subscriptionMethod = hub.off;
                }

                // Loop through all members on the hub and find client hub functions to subscribe/unsubscribe
                for (memberKey in hub.client) {
                    if (hub.client.hasOwnProperty(memberKey)) {
                        memberValue = hub.client[memberKey];

                        if (!$.isFunction(memberValue)) {
                            // Not a client hub function
                            continue;
                        }

                        subscriptionMethod.call(hub, memberKey, makeProxyCallback(hub, memberValue));
                    }
                }
            }
        }
    }

    $.hubConnection.prototype.createHubProxies = function () {
        var proxies = {};
        this.starting(function () {
            // Register the hub proxies as subscribed
            // (instance, shouldSubscribe)
            registerHubProxies(proxies, true);

            this._registerSubscribedHubs();
        }).disconnected(function () {
            // Unsubscribe all hub proxies when we "disconnect".  This is to ensure that we do not re-add functional call backs.
            // (instance, shouldSubscribe)
            registerHubProxies(proxies, false);
        });

        proxies['eventFeedHub'] = this.createHubProxy('eventFeedHub');
        proxies['eventFeedHub'].client = {};
        proxies['eventFeedHub'].server = {
            dummy: function () {
                return proxies['eventFeedHub'].invoke.apply(proxies['eventFeedHub'], $.merge(["Dummy"], $.makeArray(arguments)));
            },

            getCurrentContext: function () {
                return proxies['eventFeedHub'].invoke.apply(proxies['eventFeedHub'], $.merge(["GetCurrentContext"], $.makeArray(arguments)));
            }
        };

        proxies['hubBase'] = this.createHubProxy('hubBase');
        proxies['hubBase'].client = {};
        proxies['hubBase'].server = {
            getCurrentContext: function () {
                return proxies['hubBase'].invoke.apply(proxies['hubBase'], $.merge(["GetCurrentContext"], $.makeArray(arguments)));
            }
        };

        proxies['messageHub'] = this.createHubProxy('messageHub');
        proxies['messageHub'].client = {};
        proxies['messageHub'].server = {
            addParticipants: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["AddParticipants"], $.makeArray(arguments)));
            },

            attachBusinessObject: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["AttachBusinessObject"], $.makeArray(arguments)));
            },

            createConversation: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["CreateConversation"], $.makeArray(arguments)));
            },

            deleteMessage: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["DeleteMessage"], $.makeArray(arguments)));
            },

            deleteTag: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["DeleteTag"], $.makeArray(arguments)));
            },

            destroyConversation: function (conversationId) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["DestroyConversation"], $.makeArray(arguments)));
            },

            findPrivateConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["FindPrivateConversation"], $.makeArray(arguments)));
            },

            getConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetConversation"], $.makeArray(arguments)));
            },

            getConversationMessages: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetConversationMessages"], $.makeArray(arguments)));
            },

            getConversations: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetConversations"], $.makeArray(arguments)));
            },

            getCurrentContext: function () {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetCurrentContext"], $.makeArray(arguments)));
            },

            getCurrentUserId: function () {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetCurrentUserId"], $.makeArray(arguments)));
            },

            getObjectConversations: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetObjectConversations"], $.makeArray(arguments)));
            },

            getStreamsConversations: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetStreamsConversations"], $.makeArray(arguments)));
            },

            getTagsList: function () {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetTagsList"], $.makeArray(arguments)));
            },

            getUserStatuses: function (userProfileIds) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["GetUserStatuses"], $.makeArray(arguments)));
            },

            join: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["Join"], $.makeArray(arguments)));
            },

            leaveConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["LeaveConversation"], $.makeArray(arguments)));
            },

            markMessagesAsRead: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["MarkMessagesAsRead"], $.makeArray(arguments)));
            },

            muteConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["MuteConversation"], $.makeArray(arguments)));
            },

            notifyMessageTyping: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["NotifyMessageTyping"], $.makeArray(arguments)));
            },

            removeUser: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["RemoveUser"], $.makeArray(arguments)));
            },

            renameConversation: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["RenameConversation"], $.makeArray(arguments)));
            },

            saveTag: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SaveTag"], $.makeArray(arguments)));
            },

            sendMessage: function (requestModel) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SendMessage"], $.makeArray(arguments)));
            },

            setTemporaryAwayStatus: function (isAway) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SetTemporaryAwayStatus"], $.makeArray(arguments)));
            },

            setUserSettings: function (settings) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SetUserSettings"], $.makeArray(arguments)));
            },

            setUserStatus: function (status) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["SetUserStatus"], $.makeArray(arguments)));
            },

            // kapel
            startVideoChat: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["StartVideoChat"], $.makeArray(arguments)));
            },

            tagConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["TagConversation"], $.makeArray(arguments)));
            },

            unmuteConversation: function (model) {
                return proxies['messageHub'].invoke.apply(proxies['messageHub'], $.merge(["UnmuteConversation"], $.makeArray(arguments)));
            }
        };

        proxies['notificationHub'] = this.createHubProxy('notificationHub');
        proxies['notificationHub'].client = {};
        proxies['notificationHub'].server = {
            dummy: function () {
                return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(["Dummy"], $.makeArray(arguments)));
            },

            getCurrentContext: function () {
                return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(["GetCurrentContext"], $.makeArray(arguments)));
            },

            notifyContactAdded: function (contactLocalMasterlId) {
                return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(["NotifyContactAdded"], $.makeArray(arguments)));
            }
        };

        return proxies;
    };

    signalR.hub = $.hubConnection("/signalr", { useDefaultPath: false });
    $.extend(signalR, signalR.hub.createHubProxies());

}(window.jQuery, window));