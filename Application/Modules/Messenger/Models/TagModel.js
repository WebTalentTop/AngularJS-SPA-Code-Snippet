(function (global) {
    'use strict';

    global.realineMessenger.factory('TagModel', ['MessengerEnums', 'EntityModel', 'utils', '$log',
    function (MessengerEnums, EntityModel, utils, $log) {

        var Model = EntityModel.extend({
            init: function (data) {
                this._super(data);
                this.__ClassName = 'TagModel';
            },

            getDisplayName: function () {
                return this.get(MessengerEnums.PropertyNames.DisplayName);
            },

            setDisplayName: function (value) {
                this.set(MessengerEnums.PropertyNames.DisplayName, value);
            },

            getTagType: function () {
                return this.get(MessengerEnums.PropertyNames.TagType);
            },

            setTagType: function (value) {
                this.set(MessengerEnums.PropertyNames.TagType, value);
            },

            getUnreadConversationsCount: function () {
                return this.get(MessengerEnums.PropertyNames.UnreadConversationsCount);
            },

            setUnreadConversationsCount: function (value) {
                this.set(MessengerEnums.PropertyNames.UnreadConversationsCount, value);
            },

            incUnreadConversationsCount: function () {
                this.setUnreadConversationsCount(this.getUnreadConversationsCount() + 1);
            },

            decUnreadConversationsCount: function () {
                if (this.getUnreadConversationsCount() === 0) {
                    $log.debug(String.format('Invalid decrease operation for tag "{0}"',
                                            this.getDisplayName()));
                    return;
                }

                this.setUnreadConversationsCount(this.getUnreadConversationsCount() - 1);
            }
        });

        return Model;
    }
    ]);

})(window);