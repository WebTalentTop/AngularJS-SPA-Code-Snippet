(function (global) {
    'use strict';

    global.realineMessenger.factory('messengerRemoteControlService', [
    'MessengerEnums', 'messageBus', 'events', '$log', 'utils',
    function (MessengerEnums, messageBus, events, $log, utils) {

        var MessengerRemoteControlService = Class.extend({
            init: function () {

            },

            createConversation: function (request) {
                /*
                 * {participants(ids), type, messageText, parentConversation(model)}
                 */

                messageBus.fire({
                    type: events.createConversation,
                    data: request
                });
            },

            openConversation: function (conversation, options) {
                var messageText = null;
                if (options) {
                    messageText = options.messageText;
                }

                messageBus.fire({
                    type: events.conversationOpen,
                    conversation: conversation,
                    messageText: messageText
                });
            },

            createPrivateConversation: function (masterUserId, companyId) {
                //contactId - ProfileId
                //{MasterUserId, CompanyId}

                this.createConversation({
                    participants: [{ MasterUserId: masterUserId, CompanyId: companyId }],
                    messageText: null,
                    type: MessengerEnums.ConversationType.Private,
                });
            },

            createChildGroupConversation: function (request) {
                var r = {
                    type: MessengerEnums.ConversationType.Group,
                    messageText: null,
                };

                angular.extend(r, request);

                this.createConversation(r);
            },

            createBusinessObjectConversation: function (objectType, objectId) {
                messageBus.fire({
                    type: events.createBusinessObjectConversation,
                    data: {
                        businessObjectType: objectType,
                        businessObjectId: objectId
                    }
                });
            },

            createStreamConversation: function (subscriberMasterUserId, stream) {
                //options={SubscriberMasterUserId, Stream}

                messageBus.fire({
                    type: events.createStreamConversation,
                    data: {
                        SubscriberMasterUserId: subscriberMasterUserId,
                        Stream: stream,
                    }
                });
            },

            showStreamsConversations: function (streamIds) {
                messageBus.fire({
                    type: events.showStreamsConversations,
                    data: {
                        Streams: streamIds
                    }
                });
            },

            hideStreamsConverations: function (streamIds) {
                messageBus.fire({
                    type: events.hideStreamsConversations,
                    data: {
                        Streams: streamIds
                    }
                });
            },

            openChildConversation: function (conversationId) {
                messageBus.fire({
                    type: events.openChildConversation,
                    data: {
                        conversationId: conversationId,
                    }
                });
            },

            openMessenger: function () {
                messageBus.fire({
                    type: events.openMessenger,
                });
            },

            setUserStatus: function (newStatus) {
                messageBus.fire({
                    type: events.setUserStatus,
                    data: {
                        status: newStatus,
                    }
                });
            },

            setupUnavailableMessage: function () {
                messageBus.fire({
                    type: events.setupUnavailableMessage,
                });
            },


            closeAllConversationTabs: function () {
                messageBus.fire({
                    type: events.closeAllChatTabs,
                });
            },

            setMuteAllConversations: function (value) {
                messageBus.fire({
                    type: events.setMuteAllConversations,
                    value: value,
                });
            },
        });

        return new MessengerRemoteControlService();
    }
    ]);


})(window);