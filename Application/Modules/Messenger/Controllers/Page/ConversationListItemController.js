(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationListItemController',
    ['ConversationItemController', 'MessengerEnums', '$scope',
    function (ConversationItemController, MessengerEnums, $scope) {

        var Controller = ConversationItemController.extend({
            init: function (scope) {
                this._super(scope);

                this.__ClassName = 'ConversationListItemController';

                this.bindEvents();
            },

            initUI: function () {
                this._super();
                this.updateSelection();
            },

            setupScopeConversation: function () {
                this.scope.conversation = this.scope.conversationRecord.Conversation;
            },

            conversatonRecord_onPropertyChanged: function (event) {
                if (event.property !== MessengerEnums.PropertyNames.IsSelected) {
                    return;
                }

                this.updateSelection();
            },

            updateSelection: function () {
                this.scope.setSelection(this.scope.conversationRecord.getIsSelected());
            },

            bindEvents: function () {
                this._super();

                this.scope.conversationRecord.bindPropertyChanged(this.conversatonRecord_onPropertyChanged, this);
            },

            onDestroy: function () {
                this._super();

                this.scope.conversationRecord.unbindPropertyChanged(this.conversatonRecord_onPropertyChanged, this);
            },
        });

        return new Controller($scope);
    }]
);

})(window);