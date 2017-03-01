(function (global) {
    'use strict';

    global.app.controller('ConversationTagsDialogController', [
    'conversation', 'BasePopupController', 'conversationTagService', 'messengerHub',
    'MessengerEnums', 'CoreEnums', '$scope', '$log', '$q', '$uibModalInstance', '$', 'utils',
    function (conversation, BasePopupController, conversationTagService, messengerHub,
        MessengerEnums, CoreEnums, $scope, $log, $q, $uibModalInstance, $, utils) {

        var Controller = BasePopupController.extend({
            init: function (scope) {
                this._super(scope, $uibModalInstance);

                this.conversation = conversation;

                this.tags = conversationTagService.getTags().filter(function (item) {
                    return item.getTagType() === MessengerEnums.TagType.CustomFolder
                });

                this.conversationTags = {
                    selected: this.conversation.Tags.filter(function (item) {
                        return item.getTagType() === MessengerEnums.TagType.CustomFolder
                    })
                };

                conversationTagService.getTags().bindCollectionChanged(this.tags_Changed, this);
            },

            apply: function () {
                var newTags = this.conversationTags.selected.filter(function (item) {
                    return !this.conversation.Tags.containsById(item.getId());
                }, this);

                var removedTags = this.conversation.Tags.filter(function (item) {
                    return item.getTagType() === MessengerEnums.TagType.CustomFolder
                        && this.conversationTags.selected.indexOf(item) < 0;
                }, this);

                var tagIds = this.conversationTags.selected.map(function (item) { return item.getId(); });

                var i;

                var predefinedTagIds = this.conversation.Tags.filter(function (item) {
                    return item.getTagType() !== MessengerEnums.TagType.CustomFolder;
                }).map(function (item) {
                    return item.getId();
                });

                Array.prototype.push.apply(tagIds, predefinedTagIds);

                if (newTags.length === 0 && removedTags.length === 0) {
                    $uibModalInstance.close();
                    return;
                }

                this.updating = true;

                messengerHub.tagConversation({
                    ConversationId: this.conversation.getId(),
                    FolderIds: tagIds,
                }).then(function () {
                    $uibModalInstance.close();
                }, function (error) {
                    $log.debug('Failed to tagConversation. ' + error);
                }).finally(function () {
                    this.updating = false;
                }.bind(this));
            },

            createTag: function () {

                if (!this.$scope.tag.$valid) {
                    return;
                }

                this.entity = {
                    DisplayName: this.newTagName,
                    FolderType: MessengerEnums.TagType.CustomFolder,
                };

                this.updating = true;

                messengerHub.saveTag(this.entity).then(function () {
                    this.newTagName = null;
                }.bind(this), function (result) {
                    $log.error('Failed to save folder.' + result);
                }).finally(function () {
                    this.entity = null;
                    this.updating = false;
                }.bind(this));

            },

            tags_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onTagsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onTagsRemoved(event);
                        break;
                }
            },

            onTagsAdded: function (event) {
                var currentTag;

                Array.prototype.push.apply(this.tags, event.newItems);

                if (this.entity) {
                    currentTag = event.newItems.findItem(function (item) {
                        return item.getDisplayName() === this.entity.DisplayName;
                    }, this);

                    if (currentTag !== null) {
                        this.conversationTags.selected.push(currentTag);
                    }
                }
            },

            onTagsRemoved: function (event) {
                $.each(function (index, item) {
                    this.tags.removeElement(item);
                    this.conversationTags.selected.removeElement(item);
                }.bind(this));
            },

            onDestroy: function () {
                conversationTagService.getTags().unbindCollectionChanged(this.tags_Changed, this);
            },
        });

        return new Controller($scope);
    }
    ]);

})(window);