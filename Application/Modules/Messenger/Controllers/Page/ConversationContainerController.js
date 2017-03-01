(function (global) {
    'use strict';

    global.realineMessenger.controller('ConversationContainerController',
   ['$scope', '$log', '$q', 
    'ConversationViewController', 'hubConnection', 'messengerHub', 'profileCacheService',    
    'messenger', 'messageBus', 
    function ($scope, $log, $q,
        ConversationViewController, hubConnection, messengerHub, profileCacheService,        
        messenger, messageBus) {

        var MESSAGES_BATCH_SIZE = 50,
            options = { messagesBatchSize: MESSAGES_BATCH_SIZE };

        var ConversationContainerController = ConversationViewController.extend({
            init: function () {
                this._super($scope, messenger, hubConnection, messengerHub, messageBus, profileCacheService, options);

                this.__ClassName = 'ConversationContainerController';
                
            },

            
        });

        return new ConversationContainerController();
    }]
);

})(window);