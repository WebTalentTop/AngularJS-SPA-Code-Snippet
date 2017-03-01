(function (global) {
    'use strict';

    global.realineMessenger.factory('messengerHub', ['$q', '$log', '$', '$rootScope', 'HubBase', 'MessengerEnums',
    'utils', 'Domains', 'signalRUtils',
    function ($q, $log, $, $rootScope, HubBase, MessengerEnums,
        utils, Domains, signalRUtils) {
        var MESSAGE_RECEIVED_EVENT = 'message_received',
            CONVERSATION_CREATED_EVENT = 'conversation_created',
            PARTICIPANTS_ADDED_EVENT = 'participants_added',
            USER_TYPING_EVENT = 'user_typing_message',
            LEAVE_CONVERSATION_EVENT = 'leave conversation',
            USER_STATUS_CHANGED_EVENT = 'user status changed',
            ON_LOAD_SETTINGS_EVENT = 'load settings',
            MESSAGE_READ_EVENT = 'message read',
            MESSAGES_DELETED = 'messages deleted',
            TAG_SAVED_EVENT = 'tag saved',
            TAG_DELETED_EVENT = 'tag deleted',
            CONVERSATION_TAGGED = 'conversation tagged',
            CONVERSATION_MUTED = 'conversation muted',
            CONVERSATION_UNMUTED = 'conversation unmuted',
            START_VIDEOCHAT = 'start videochat'; // kapel

        var MessengerHub = HubBase.extend({
            init: function () {
                this._super($.connection.messageHub);
            },

            getConversations: function (request) {
                /*
                 * @method loadConversations
                 * @param - {ConversationId, GetUnreadOnly, MessagesPerConversation}
                 * @returns - {promise}
                 */
                return signalRUtils.callMethod(
                    this.hub.server.getConversations,
                    this.hub, [request]).then(function (result) {
                        result.Conversations = preprocessConversations.call(this, result.Conversations);
                        return result;
                    }.bind(this));
            },

            getConversation: function (params) {
                /*
                 * {
                 *  ConversationId: conversationId,
                 *  GetUnreadOnly: false,
                 *  MessagesPerConversation:
                 * }
                 */
                return signalRUtils.callMethod(
                    this.hub.server.getConversation,
                    this.hub, [params]).then(function (result) {
                        if (!result) {
                            return null;
                        }
                        else {
                            return preprocessConversation.call(this, result);
                        }
                    }.bind(this));
            },

            getObjectConversations: function (businessObjectId) {
                var request = {
                    BusinessObjectId: businessObjectId
                };

                return signalRUtils.callMethod(
                    this.hub.server.getObjectConversations,
                    this.hub, [request]).then(function (result) {
                        result.Conversations = preprocessConversations.call(this, result.Conversations);
                        return result;
                    }.bind(this));
            },

            getStreamsConversations: function (streamIds) {
                var request = {
                    StreamId: streamIds
                };

                return signalRUtils.callMethod(this.hub.server.getStreamsConversations,
                    this.hub, [request]).then(function (result) {
                        result.Conversations = preprocessConversations.call(this, result.Conversations);
                        return result;
                    }.bind(this));
            },

            findPrivateConversation: function (request) {
                return signalRUtils.callMethod(
                    this.hub.server.findPrivateConversation,
                    this.hub, [request]).then(function (result) {
                        if (!result) {
                            return null;
                        }
                        else {
                            return preprocessConversation.call(this, result);
                        }
                    }.bind(this));
            },

            getConversationMessages: function (params) {
                /*
                 * @param - params {ConversationId, StartDate, EndDate, Skip, Count}
                 * @returns - {promise}
                 */
                return signalRUtils.callMethod(
                    this.hub.server.getConversationMessages,
                    this.hub,
                    [params]).then(function (result) {
                        return preprocessMessages.call(this, result.reverse());
                    }.bind(this));
            },

            createConversation: function (request) {
                /*
                * @param - request - {DisplayName, Participants[ids], Message, RequestId, Type}
                */

                var r = angular.extend({}, request);

                r.Type = getConversationTypeValue(r.Type);

                return signalRUtils.callMethod(
                    this.hub.server.createConversation,
                    this.hub,
                    [r]);
            },

            destroyConversation: function (conversationId) {
                return signalRUtils.callMethod(
                    this.hub.server.destroyConversation,
                    this.hub,
                    [conversationId]);
            },

            deleteMessages: function (conversationId, messagesIds) {
                var request = {
                    ConversationId: conversationId,
                    MessageIds: messagesIds
                };

                return signalRUtils.callMethod(
                    this.hub.server.deleteMessage,
                    this.hub,
                    [request]);
            },

            addParticipants: function (request) {
                /*
                 * @param - request - {ConversationId, Participants[ids]}
                 * @returns Participant[]
                 */
                return signalRUtils.callMethod(this.hub.server.addParticipants, this.hub, [request]);
            },

            removeParticipant: function (conversationId, userId) {
                var request = {
                    ConversationId: conversationId,
                    ProfileId: userId
                }
                return signalRUtils.callMethod(this.hub.server.removeUser, this.hub, [request]);
            },

            /*
             * @param - request - {ConversationId, Message}
             * @returns - {message}
             */
            sendMessage: function (request) {
                return signalRUtils.callMethod(
                    this.hub.server.sendMessage,
                    this.hub,
                    [request]);
            },

            notifyMessageTyping: function (conversationId) {
                return signalRUtils.callMethod(
                    this.hub.server.notifyMessageTyping,
                    this.hub,
                    [{ ConversationId: conversationId, TypingTimeout: 1000 }]);
            },

            leaveConversation: function (request) {
                return signalRUtils.callMethod(
                    this.hub.server.leaveConversation,
                    this.hub,
                    [request]);
            },

            joinConversation: function (conversationId) {
                return signalRUtils.callMethod(
                   this.hub.server.join,
                   this.hub,
                   [{ ConversationId: conversationId }]);
            },

            getUserStatuses: function (userIds) {
                return signalRUtils.callMethod(
                    this.hub.server.getUserStatuses,
                    this.hub,
                    [userIds]).then(function (result) {
                        return preprocessUserStatuses(result);
                    }.bind(this));
            },

            setUserStatus: function (status) {

                var value = getServerUserStatus(status);

                return signalRUtils.callMethod(
                   this.hub.server.setUserStatus,
                   this.hub,
                   [value]);
            },

            setTemporaryAwayStatus: function (isAway) {
                return signalRUtils.callMethod(
                   this.hub.server.setUserStatus,
                   this.hub,
                   [isAway]);
            },

            setUserSettings: function (request) {
                /*
                 * @param {AutoreplyMessage, RedirectUserId, InactivityTimeout}
                 */

                return signalRUtils.callMethod(
                   this.hub.server.setUserSettings,
                   this.hub,
                   [request]);
            },

            saveTag: function (request) {
                /*
                 * @param tag
                 */

                return signalRUtils.callMethod(
                   this.hub.server.saveTag,
                   this.hub,
                   [request]);
            },

            deleteTag: function (request) {
                /*
                 * @param tag
                 */

                return signalRUtils.callMethod(
                   this.hub.server.deleteTag,
                   this.hub,
                   [request]);
            },

            // kapel
            startVideoChat: function (request) {
                return signalRUtils.callMethod(
                 this.hub.server.startVideoChat,
                 this.hub,
                 [request]);
            },

            tagConversation: function (request) {
                return signalRUtils.callMethod(
                 this.hub.server.tagConversation,
                 this.hub,
                 [request]);
            },

            /*
             * @param - request - {ConversationId, MessageIds[]}
             * @returns - void
             */
            markMessagesAsRead: function (request) {
                return signalRUtils.callMethod(this.hub.server.markMessagesAsRead, this.hub, [request]);
            },

            renameConversation: function (request) {
                //@param - {ConversationId, ConversationName}
                return signalRUtils.callMethod(this.hub.server.renameConversation, this.hub, [request]);
            },

            getTagsList: function () {
                return signalRUtils.callMethod(this.hub.server.getTagsList, this.hub, []);
            },

            muteConversation: function (request) {
                return signalRUtils.callMethod(this.hub.server.muteConversation, this.hub, [request]);
            },

            unmuteConversation: function (request) {
                return signalRUtils.callMethod(this.hub.server.unmuteConversation, this.hub, [request]);
            },

            bindHubEvents: function () {
                this.hub.client.onCreateConversation = function (conversation) {
                    preprocessConversation.call(this, conversation);
                    this.fireConversationCreated(conversation);
                }.bind(this);

                this.hub.client.onSendMessage = function (message) {
                    var msg = preprocessMessage.call(this, message);

                    if (message.MessageType === MessengerEnums.MessageType.Redirect) {
                        msg = convertRedirectMessage(message);
                    }

                    this.fireMessageReceived(msg);
                }.bind(this);

                this.hub.client.onNotifyMessageTyping = function (data) {
                    this.fireNotifyMessageTyping(data);
                }.bind(this);

                this.hub.client.onUserStatusChanged = function (data) {
                    data.Status = getUserStatus(data.Status);
                    this.fireUserStatusChanged(data);
                }.bind(this);

                this.hub.client.onLoad = function (data) {
                    data.Value.SettingStatus = getUserStatus(data.Value.SettingStatus);
                    data.Value.CurrentStatus = getUserStatus(data.Value.CurrentStatus);
                    this.fireLoadUserSettings(data);
                }.bind(this);

                this.hub.client.onMessageRead = function (data) {
                    this.fireMessageRead(data);
                }.bind(this);

                this.hub.client.onMessageDeleted = function (data) {
                    if (!utils.common.isNullOrUndefined(data.MessageId)) {
                        data.MessageIds = data.MessageId;
                    }

                    this.fireMessagesDeleted(data);
                }.bind(this);

                this.hub.client.onTagSaved = function (data) {
                    this.fireTagSaved(data);
                }.bind(this);

                this.hub.client.onTagDeleted = function (data) {
                    this.fireTagDeleted(data);
                }.bind(this);

                this.hub.client.onConversationMuted = function (data) {
                    this.fireConversationMuted(data);
                }.bind(this);

                this.hub.client.onConversationUnmuted = function (data) {
                    this.fireConversationUnmuted(data);
                }.bind(this);

                this.hub.client.onConversationTagged = function (data) {
                    this.fireConversationTagged(data);
                }.bind(this);

                // kapel
                this.hub.client.onVideoChatStarted = function (data) {
                    this.fireStartVideoChat(data);
                }.bind(this);

                //remove it when mistake is fixed on backend
                this.hub.client.onConversationTaged = function (data) {
                    this.fireConversationTagged(data);
                }.bind(this);
            },

            //

            bindConversationCreated: function (handler, context) {
                this.eventManager.bind(CONVERSATION_CREATED_EVENT, handler, context);
            },

            unbindConversationCreated: function (handler, context) {
                this.eventManager.detach(CONVERSATION_CREATED_EVENT, handler, context);
            },

            fireConversationCreated: function (conversation) {
                var fired = this.eventManager.fire({
                    type: CONVERSATION_CREATED_EVENT,
                    conversation: conversation
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindMessageReceived: function (handler, context) {
                this.eventManager.bind(MESSAGE_RECEIVED_EVENT, handler, context);
            },

            unbindMessageReceived: function (handler, context) {
                this.eventManager.detach(MESSAGE_RECEIVED_EVENT, handler, context);
            },

            fireMessageReceived: function (message) {
                var fired = this.eventManager.fire({
                    type: MESSAGE_RECEIVED_EVENT,
                    message: message
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //            

            bindNotifyMessageTyping: function (handler, context) {
                this.eventManager.bind(USER_TYPING_EVENT, handler, context);
            },

            unbindNotifyMessageTyping: function (handler, context) {
                this.eventManager.detach(USER_TYPING_EVENT, handler, context);
            },

            fireNotifyMessageTyping: function (data) {
                var fired = this.eventManager.fire({
                    type: USER_TYPING_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //            

            bindUserStatusChanged: function (handler, context) {
                this.eventManager.bind(USER_STATUS_CHANGED_EVENT, handler, context);
            },

            unbindUserStatusChanged: function (handler, context) {
                this.eventManager.detach(USER_STATUS_CHANGED_EVENT, handler, context);
            },

            fireUserStatusChanged: function (data) {
                var fired = this.eventManager.fire({
                    type: USER_STATUS_CHANGED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //ON_LOAD
            bindLoadUserSettings: function (handler, context) {
                this.eventManager.bind(ON_LOAD_SETTINGS_EVENT, handler, context);
            },

            unbindLoadUserSettings: function (handler, context) {
                this.eventManager.detach(ON_LOAD_SETTINGS_EVENT, handler, context);
            },

            fireLoadUserSettings: function (data) {

                var fired = this.eventManager.fire({
                    type: ON_LOAD_SETTINGS_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //MESSAGE_READ_EVENT
            bindMessageRead: function (handler, context) {
                this.eventManager.bind(MESSAGE_READ_EVENT, handler, context);
            },

            unbindMessageRead: function (handler, context) {
                this.eventManager.detach(MESSAGE_READ_EVENT, handler, context);
            },

            fireMessageRead: function (data) {
                /*
                 * @param {ReadMessages[], ConversationId, ReadBy}
                 */
                var fired = this.eventManager.fire({
                    type: MESSAGE_READ_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //MESSAGES_DELETED
            bindMessagesDeleted: function (handler, context) {
                this.eventManager.bind(MESSAGES_DELETED, handler, context);
            },

            unbindMessagesDeleted: function (handler, context) {
                this.eventManager.detach(MESSAGES_DELETED, handler, context);
            },

            fireMessagesDeleted: function (data) {
                /*
                 * @param {ReadMessages[], ConversationId, ReadBy}
                 */
                var fired = this.eventManager.fire({
                    type: MESSAGES_DELETED,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //TAG_SAVED_EVENT
            bindTagSaved: function (handler, context) {
                this.eventManager.bind(TAG_SAVED_EVENT, handler, context);
            },

            unbindTagSaved: function (handler, context) {
                this.eventManager.detach(TAG_SAVED_EVENT, handler, context);
            },

            fireTagSaved: function (data) {
                var fired = this.eventManager.fire({
                    type: TAG_SAVED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //TAG_DELETED_EVENT
            bindTagDeleted: function (handler, context) {
                this.eventManager.bind(TAG_DELETED_EVENT, handler, context);
            },

            unbindTagDeleted: function (handler, context) {
                this.eventManager.detach(TAG_DELETED_EVENT, handler, context);
            },

            fireTagDeleted: function (data) {
                var fired = this.eventManager.fire({
                    type: TAG_DELETED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //CONVERSATION_TAGGED
            bindConversationTagged: function (handler, context) {
                this.eventManager.bind(CONVERSATION_TAGGED, handler, context);
            },

            unbindConversationTagged: function (handler, context) {
                this.eventManager.detach(CONVERSATION_TAGGED, handler, context);
            },

            fireConversationTagged: function (data) {
                var fired = this.eventManager.fire({
                    type: CONVERSATION_TAGGED,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //CONVERSATION_MUTED
            //CONVERSATION_UNMUTED
            bindConversationMuted: function (handler, context) {
                this.eventManager.bind(CONVERSATION_MUTED, handler, context);
            },

            unbindConversationMuted: function (handler, context) {
                this.eventManager.detach(CONVERSATION_MUTED, handler, context);
            },

            fireConversationMuted: function (data) {
                var fired = this.eventManager.fire({
                    type: CONVERSATION_MUTED,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //CONVERSATION_UNMUTED
            bindConversationUnmuted: function (handler, context) {
                this.eventManager.bind(CONVERSATION_UNMUTED, handler, context);
            },

            unbindConversationUnmuted: function (handler, context) {
                this.eventManager.detach(CONVERSATION_UNMUTED, handler, context);
            },

            fireConversationUnmuted: function (data) {
                var fired = this.eventManager.fire({
                    type: CONVERSATION_UNMUTED,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            // kapel
            bindStartVideoChat: function (handler, context) {
                this.eventManager.bind(START_VIDEOCHAT, handler, context);
            },
            unbindStartVideoChat: function (handler, context) {
                this.eventManager.detach(START_VIDEOCHAT, handler, context);
            },
            fireStartVideoChat: function (videoChat) {
                var fired = this.eventManager.fire({
                    type: START_VIDEOCHAT,
                    videoChat: videoChat
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

        });

        //
        //private methods
        //
        function preprocessMessage(message) {
            message.CreateDate = new Date(message.CreateDate);
            message.MessageType = getMessageType(message.MessageType);

            return message;
        }

        function preprocessMessages(messages) {
            var i;

            var newList = [];
            var message;
            var redirectMessage;

            for (i = 0; i < messages.length; i++) {
                message = preprocessMessage.call(this, messages[i]);
                if (message.MessageType != MessengerEnums.MessageType.Redirect) {
                    newList.push(message);
                }
                else {
                    redirectMessage = convertRedirectMessage(message);
                    newList.push(redirectMessage);
                }
            }

            return newList;
        }

        function preprocessConversation(conversation) {

            conversation.Type = getConversationType(conversation.Type);

            if (!conversation.Messages) {
                return conversation;
            }

            conversation.Messages.reverse();

            conversation.Messages = preprocessMessages.call(this, conversation.Messages);

            return conversation;
        }

        function preprocessConversations(conversations) {
            var i;

            for (i = 0; i < conversations.length; i++) {
                preprocessConversation.call(this, conversations[i]);
            }

            return conversations;
        }

        function preprocessUserStatuses(dict) {
            var id;
            for (id in dict) {
                dict[id] = getUserStatus(dict[id]);
            }

            return dict;
        }

        function convertRedirectMessage(message) {
            //we need to create two messages here

            //var textMessage = {
            //    Id: utils.common.newGuid(),
            //    ConversationId: message.ConversationId,
            //    IsRead: true,
            //    Text: message.Text,
            //    AuthorId: message.AuthorId,
            //    CreateDate: message.CreateDate,
            //    MessageType: MessengerEnums.MessageType.TextMessage,
            //};

            var redirectMessage = {
                Id: message.Id,
                ConversationId: message.ConversationId,
                IsRead: message.IsRead,
                Text: message.Content.AwayMessage,
                AuthorId: message.Content.RecipientUserId,
                CreateDate: message.CreateDate,
                MessageType: MessengerEnums.MessageType.Redirect,
                Content: message.Content.RedirectUserId,
                OriginalMessage: message.Text,
            };

            return redirectMessage;
        }

        //
        // utilites
        //

        function getUserStatus(value) {
            switch (value) {
                case 0: return MessengerEnums.UserStatuses.Offline;
                case 1: return MessengerEnums.UserStatuses.Online;
                case 2: return MessengerEnums.UserStatuses.Away;
                case 3: return MessengerEnums.UserStatuses.Busy;
                default:
                    $log.error(String.format('Unknown server user status {0}', value));
                    return MessengerEnums.UserStatuses.Unknown;
            }
        }

        function getServerUserStatus(value) {
            switch (value) {
                case MessengerEnums.UserStatuses.Offline: return 0;
                case MessengerEnums.UserStatuses.Online: return 1;
                case MessengerEnums.UserStatuses.Away: return 2;
                case MessengerEnums.UserStatuses.Busy: return 3;
                default: $log.error(String.format('Unknown user status {0}', value));
            }
        }

        function getMessageType(value) {
            switch (value) {
                case 0: return MessengerEnums.MessageType.AddParticipants;
                case 1: return MessengerEnums.MessageType.LeaveConversation;
                case 2: return MessengerEnums.MessageType.RenameConversation;
                case 3: return MessengerEnums.MessageType.TextMessage;
                case 4: return MessengerEnums.MessageType.Attachment;
                case 6: return MessengerEnums.MessageType.Redirect;
                case 9: return MessengerEnums.MessageType.ParticipantRemoved;
                case 10: return MessengerEnums.MessageType.GroupConversationCreated;
                case 11: return MessengerEnums.MessageType.ParticipantJoined;
                default:
                    $log.error(String.format('Unknown MessageType: {0}', value));
                    return MessengerEnums.MessageType.TextMessage;
            }
        }

        function getFileType(value) {
            switch (value) {
                case 0:
                    return MessengerEnums.FileType.Document;
                case 1:
                    return MessengerEnums.FileType.Image;
                default:
                    $log.error(String.format('Unknown FileType: {0}', value));
                    return MessengerEnums.FileType.Document;
            }
        }

        function getFileTypeValue(value) {
            switch (value) {
                case MessengerEnums.FileType.Document: return 0;
                case MessengerEnums.FileType.Image: return 1;
                default:
                    $log.error(String.format('Unknown FileType enum value: {0}', value));
                    return 0;
            }
        }

        function getConversationType(value) {
            switch (value) {
                case 0: return MessengerEnums.ConversationType.Private;
                case 1: return MessengerEnums.ConversationType.Group;
                case 2: return MessengerEnums.ConversationType.Public;
                default:
                    $log.error(String.format('Unknown ConversationType value: {0}', value));
                    return MessengerEnums.ConversationType.Group;
            }
        }

        function getConversationTypeValue(value) {
            switch (value) {
                case MessengerEnums.ConversationType.Private:
                    return 0;
                case MessengerEnums.ConversationType.Group:
                    return 1;
                case MessengerEnums.ConversationType.Public:
                    return 2;
                default:
                    $log.error(String.format('Unknown ConversationType enum value: {0}', value));
                    return 1;
            }
        }

        return new MessengerHub();
    }
    ]);


})(window);