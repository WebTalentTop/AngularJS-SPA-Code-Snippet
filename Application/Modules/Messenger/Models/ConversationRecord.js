(function (global) {
    'use strict';

    global.realineMessenger.factory('ConversationRecord', ['MessengerEnums', 'EntityModel', 'utils',
    function (MessengerEnums, EntityModel, utils) {

        var ConversationRecord = EntityModel.extend({
            init: function (conversation) {
                this._super({ IsSelected: false });

                this.__ClassName = 'ConversationRecord';

                this.Conversation = conversation;
            },

            getId:function(){
                return this.Conversation.getId();
            },

            setId:function(value){
                this.Conversation.setId(value);
            },

            getIsSelected: function () {
                return this.get(MessengerEnums.PropertyNames.IsSelected);
            },

            setIsSelected: function (value) {
                this.set(MessengerEnums.PropertyNames.IsSelected, value);
            }
        });

        return ConversationRecord;
    }
]);

})(window);