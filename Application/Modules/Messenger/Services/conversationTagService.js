(function (global) {
    'use strict';

    global.realineMessenger.factory('conversationTagService', [
        'UniqueEntityCollection', 'messengerHub', 'TagModel', '$q',
        function (UniqueEntityCollection, messengerHub, TagModel, $q) {

            var tags = new UniqueEntityCollection();

            var Service = Class.extend({

                init: function () {

                },

                getTags: function () {
                    return tags;
                },

                findByType: function (tagType) {
                    return tags.find(function (item) {
                        return item.getTagType() === tagType;
                    });
                },

                clear: function () {
                    tags.clear();
                },

                loadTags: function () {
                    return messengerHub.getTagsList().then(function (result) {
                        var i;
                        var newTag, oldTag;
                        var newItems = [];

                        //find new tags
                        for (i = 0; i < result.Folders.length; i++) {
                            oldTag = tags.findById(result.Folders[i].Id);
                            newTag = new TagModel(result.Folders[i]);

                            if (!oldTag) {
                                newItems.push(newTag);
                            }
                            else {
                                oldTag.setDisplayName(newTag.getDisplayName());
                                oldTag.setUnreadConversationsCount(newTag.getUnreadConversationsCount());
                            }
                        }

                        tags.push(newItems);

                        //find removed tags
                        for (i = 0; i < tags.length() ; i++) {
                            oldTag = tags.get(i);

                            if (!result.Folders.findById(oldTag.getId())) {
                                tags.remove(oldTag);
                            }
                        }

                        return result;
                    }.bind(this),
                    function (error) {
                        $log.debug('Failed to load tags. ' + error);
                        return $q.reject(error);
                    });
                },
            });

            return new Service();
        }
    ]);
})(window);