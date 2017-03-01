(function (global) {
    'use strict';

    global.realineMessenger.factory('MessageModel', [
        'MessengerEnums', 'events', 'messageBus', 'EntityModel', 'EntityCollection', 'AttachmentModel',
    'profileCacheService', '$sanitize', '$filter', '$sce', '$log', '$', 'utils',
    function (MessengerEnums, events, messageBus, EntityModel, EntityCollection, AttachmentModel,
        profileCacheService, $sanitize, $filter, $sce, $log, $, utils) {

        var MessageModel = EntityModel.extend({
            init: function (data) {
                this._super(data);
                this.__ClassName = 'MessageModel';

                if (utils.common.isNullOrUndefined(this.getState())) {
                    this.setState(MessengerEnums.MessageState.Success);
                }

                generateHtmlText.call(this);

                this.Author = profileCacheService.get(this.getAuthorId());
                processByMessageType.call(this);

                this.initReaders();
            },

            getText: function () {
                return this.get(MessengerEnums.PropertyNames.Text);
            },

            setText: function (value) {
                return this.set(MessengerEnums.PropertyNames.Text, value);
            },

            getHtmlText: function () {
                return this.htmlText;
            },

            getIsRead: function () {
                return this.get(MessengerEnums.PropertyNames.IsRead);
            },

            setIsRead: function (value) {
                this.set(MessengerEnums.PropertyNames.IsRead, value);
            },

            getConversationId: function () {
                return this.get(MessengerEnums.PropertyNames.ConversationId);
            },

            getLocalMasterId: function () {
                return this.get(MessengerEnums.PropertyNames.LocalMasterId);
            },

            getAuthorId: function () {
                return this.get(MessengerEnums.PropertyNames.AuthorId);
            },

            getMessageType: function () {
                return this.get(MessengerEnums.PropertyNames.MessageType);
            },

            setMessageType: function (value) {
                return this.set(MessengerEnums.PropertyNames.MessageType, value);
            },

            getState: function () {
                return this.get(MessengerEnums.PropertyNames.State);
            },

            setState: function (value) {
                return this.set(MessengerEnums.PropertyNames.State, value);
            },

            getRequestId: function () {
                return this.get(MessengerEnums.PropertyNames.RequestId);
            },

            getIsDeleted: function () {
                return this.get(MessengerEnums.PropertyNames.IsDeleted);
            },

            setIsDeleted: function (value) {
                return this.set(MessengerEnums.PropertyNames.IsDeleted, value);
            },

            getContent: function () {
                return this.get(MessengerEnums.PropertyNames.Content);
            },

            getConversationNewName: function () {
                return this.data.Content.Name;
            },

            hasRedirectDestinationUser: function () {
                return utils.common.isNullOrUndefined(this.data.Content);
            },

            getRedirectDestinationUserId: function () {
                return this.data.Content;
            },

            getRedirectDestinationUser: function () {
                return this.redirectDestinationUser;
            },

            setCreateDate: function (value) {
                return this.set(MessengerEnums.PropertyNames.CreateDate, value);
            },

            getCreateDate: function () {
                return this.get(MessengerEnums.PropertyNames.CreateDate);
            },

            getAddedParticipants: function () {
                return this.data.Content.Participants;
            },

            getRemovedParticipant: function () {
                return this.data.Content.Participants;
            },

            getChildConversationParticipants: function () {
                if (utils.common.isNullOrUndefined(this.data.Content)
                    || utils.common.isNullOrUndefined(this.data.Content.InitialParticipants)) {
                    return [];
                }

                return this.data.Content.InitialParticipants;
                //TODO: remove when server return correct message
                //return [];
            },

            getParentConversationId: function () {
                return this.data.Content.ConversationId;
                //TODO: remove when server return correct message
                //return 'tmpid';
            },

            getAutoReplied: function () {
                return this.get(MessengerEnums.PropertyNames.AutoReplied);
            },

            hasRedirectedTo: function () {
                return !utils.common.isNullOrEmpty(this.getRedirectedTo());
            },

            getRedirectedTo: function () {
                return this.get(MessengerEnums.PropertyNames.RedirectedTo);
            },

            setRedirectedTo: function (value) {
                this.set(MessengerEnums.PropertyNames.RedirectedTo, value);
            },

            getReadBy: function () {
                return this.get(MessengerEnums.PropertyNames.ReadBy);
            },

            setReadBy: function (value) {
                return this.set(MessengerEnums.PropertyNames.ReadBy, value);
            },

            markReadByUser: function (userId) {
                if (this.Readers.containsById(userId)) {
                    return;
                }

                this.getReadBy().push(userId);
                this.Readers.push(profileCacheService.get(userId));
            },

            getPlainText: function () {
                switch (this.getMessageType()) {
                    case MessengerEnums.MessageType.TextMessage:
                        return buildTextMessageText.call(this);
                    case MessengerEnums.MessageType.AddParticipants:
                        return buildAddParticipantsPlainText.call(this);
                    case MessengerEnums.MessageType.LeaveConversation:
                        return buildLeaveConversationPlainText.call(this);
                    case MessengerEnums.MessageType.RenameConversation:
                        return buildRenameConversationPlainText.call(this);
                    case MessengerEnums.MessageType.Redirect:
                        return buildRedirectPlainText.call(this);
                    case MessengerEnums.MessageType.ParticipantRemoved:
                        return buildRemoveParticipantText.call(this);
                    case MessengerEnums.MessageType.GroupConversationCreated:
                        return buildGroupConversationCreatedText.call(this);
                    default:
                        $log.debug('getPlainText: unknown message type - ' + this.getMessageType());
                }
            },

            isNotificationMessage: function () {
                if (this.getMessageType() === MessengerEnums.MessageType.TextMessag) {
                    return false;
                }
                else {
                    return true;
                }
            },

            //onContactRedirectDestinationUser: function () {
            //    messageBus.fire({
            //        type: events.createConversation,
            //        data: {
            //            participant: this.getRedirectDestinationUserId()
            //        }
            //    });
            //},

            initReaders: function () {
                var ids = this.getReadBy(),
                    users;

                if (!ids) {
                    ids = [];
                    this.setReadBy([]);
                }

                users = ids.map(function (id) {
                    return profileCacheService.get(id);
                });

                this.Readers = new EntityCollection();
                this.Readers.push(users);
            }
        });


        //private methods

        function processByMessageType() {
            //execute action
            switch (this.getMessageType()) {
                case MessengerEnums.MessageType.TextMessage:
                    processTextMessage.call(this);
                    break;
                case MessengerEnums.MessageType.AddParticipants:
                    processParticipantsAdded.call(this);
                    break;
                    //case MessengerEnums.MessageType.LeaveConversation:
                    //    break;
                    //case MessengerEnums.MessageType.RenameConversation:
                    //    break;                
                case MessengerEnums.MessageType.Redirect:
                    processRedirect.call(this);
                    break;
                case MessengerEnums.MessageType.ParticipantRemoved:
                    processParticipantRemoved.call(this);
                case MessengerEnums.MessageType.GroupConversationCreated:
                    processGroupConversationCreated.call(this);
                    //    break;                
                    //    //on text message we do not execute any action, just add it to list
            }

            if (!utils.common.isNullOrEmpty(this.getRedirectedTo())) {
                this.setRedirectedTo(profileCacheService.get(this.getRedirectedTo()));
            }
        }

        function processTextMessage() {
            var attachments = [];
            var i, attachment;
            var content = this.getContent();

            if (utils.common.isNullOrEmpty(content)
                || utils.common.isNullOrEmpty(content.AttachedFiles)) {
                this.AttachedFiles = [];
                return;
            }

            for (i = 0; i < content.AttachedFiles.length; i++) {
                attachment = new AttachmentModel(content.AttachedFiles[i]);
                attachments.push(attachment);
            }

            this.AttachedFiles = attachments;
        }

        function processParticipantsAdded() {
            var participants = this.data.Content.ParticipantsProfileIds;
            participants = participants.filterDuplicates(function (item) { return item; });

            this.data.Content.Participants = participants.map(function (id) {
                return profileCacheService.get(id);
            });
        }

        function processRedirect() {
            var redirectUserId = this.getRedirectDestinationUserId();
            if (redirectUserId) {
                this.redirectDestinationUser = profileCacheService.get(redirectUserId);
            }

            if (utils.common.isNullOrEmpty(this.getText())) {
                this.setText("Sorry, I cannot answer right now.");
                generateHtmlText.call(this);
            }
        }

        function processParticipantRemoved() {
            this.data.Content.Participants = profileCacheService.get(this.data.Content.ParticipantsProfileIds);
        }

        function processGroupConversationCreated() {
            var participants = this.getChildConversationParticipants();
            ////TODO: remove when server return correct message
            //if (!this.data.Content) {
            //    this.data.Content = {};
            //}

            if (utils.common.isNullOrUndefined(this.data.Content)) {
                //can happen only fror invalid message
                this.data.Content = {};
            }

            this.data.Content.InitialParticipants = participants.map(function (id) {
                return profileCacheService.get(id);
            });
        }

        function generateHtmlText() {
            //this.htmlText = escapeHtml($sanitize(this.getText()));
            //Autolinker.prototype.twitter = false;
            this.htmlText = this.getText(); //_.escape(this.getText());
            //this.htmlText = Autolinker.link(this.htmlText);
            this.htmlText = $filter('linky')(this.htmlText, '_blank');
        }

        //function escapeHtml(value) {

        //    if (value === null || value === undefined) {
        //        return value;
        //    }

        //    return value
        //        .replace(/&/g, '&amp;')
        //        .replace(/"/g, '&quot;')
        //        .replace(/'/g, '&#39;')
        //        .replace(/</g, '&lt;')
        //        .replace(/>/g, '&gt;');
        //}


        function buildTextMessageText() {
            if (this.getIsDeleted()) {
                return buildMessageDeletedText.call(this);
            }

            var text = this.getText() === null ? '' : this.getText(),
                i, fileNames;

            if (this.AttachedFiles.length > 0) {
                fileNames = this.AttachedFiles.map(function (file) {
                    return file.getFileName();
                });

                text += ' ';
                text += fileNames.join(', ');
            }

            return text;
        }

        function buildAddParticipantsPlainText() {
            var i;
            var names = this.getAddedParticipants().map(function (p) {
                return p.getName();
            }).join(', ');

            return String.format('{0} added {1} to this conversation',
                this.Author.getName(), names);
        }

        function buildLeaveConversationPlainText() {
            //TODO: take into account contact info lazy loading
            return String.format('{0} left conversation', this.Author.getName());
        }

        function buildRenameConversationPlainText() {
            return String.format('{0} changed topic of conversation to {1}',
                                this.Author.getName(),
                                this.getConversationNewName());
        }

        function buildRedirectPlainText() {
            return this.getHtmlText();
        }

        function buildMessageDeletedText() {
            return "Message has been removed";
        }

        function buildRemoveParticipantText() {
            return String.format('{0} removed {1} from this conversation',
                this.Author.getName(),
                this.getRemovedParticipant().getName());
        }

        function buildGroupConversationCreatedText() {
            var i;
            var names = this.getChildConversationParticipants().map(function (p) {
                return p.getName();
            }).join(', ');

            return String.format('{0} created a group conversation with {1}',
                this.Author.getName(), names);
        }

        return MessageModel;
    }
    ]);

})(window);