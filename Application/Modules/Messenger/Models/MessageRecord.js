(function (global) {
    'use strict';

    global.realineMessenger.factory('MessageRecord', ['EntityModel', 'MessengerEnums',
    function (EntityModel, MessengerEnums) {

        var MessageRecord = EntityModel.extend({
            init: function (msg) {
                this._super({
                    AuthorVisible: true
                });
                this.__ClassName = 'MessageRecord';

                this.Message = msg;
            },

            getId: function () {
                return this.Message.getId();
            },

            setId: function (value) {
                this.Message.setId(value);
            },

            getAuthorVisible: function () {
                return this.get(MessengerEnums.PropertyNames.AuthorVisible);
            },

            setAuthorVisible: function (value) {
                this.set(MessengerEnums.PropertyNames.AuthorVisible, value);
            },

            getIsSelected: function () {
                return this.get(MessengerEnums.PropertyNames.IsSelected);
            },

            setIsSelected: function (value) {
                this.set(MessengerEnums.PropertyNames.IsSelected, value);
            }
        });

        return MessageRecord;
    }
    ]);

})(window);