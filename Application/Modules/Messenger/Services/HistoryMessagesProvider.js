(function (global) {
    'use strict';

    global.realineMessenger.factory('HistoryMessagesProvider', ['messengerHub', 'MessageModel', '$q', '$log', 'utils',
        function (messengerHub, MessageModel, $q, $log, utils) {

            /*
             * HistoryMessagesProvider
             */

            var HistoryMessagesProvider = Class.extend({
                init: function (settings) {
                    /*
                     * {conversationId, history, loadedMessages, batchSize}
                     */
                    this.settings = angular.extend({}, settings);
                },

                load: function () {

                    var historySize;

                    if (this.settings.history.length() === this.settings.loadedMessages.length()) {
                        return this.loadFromServer();
                    }
                    else {
                        historySize = this.settings.history.length() - this.settings.loadedMessages.length();
                        if (historySize >= this.settings.batchSize) {
                            return this.loadFromHistory();
                        }
                        else {
                            //we need to load from server to fullfill batch
                            return this.loadFromHistory().then(function (result) {
                                if (result < this.settings.batchSize) {
                                    return this.loadFromServer(this.settings.batchSize - result).then(function (result2) {
                                        return result + result2;
                                    });
                                }

                                return result;
                            }.bind(this));
                        }
                    }
                },

                loadFromHistory: function () {
                    var source = this.settings.history;
                    var destination = this.settings.loadedMessages;

                    //determinate how many not copied items remainig
                    var waitingItemsCount = source.length() - destination.length();

                    var topCopiedIndex = waitingItemsCount;
                    var startingIndex = waitingItemsCount - this.settings.batchSize;
                    var currentBatchSize = this.settings.batchSize;

                    var sublist;

                    if (startingIndex < 0) {
                        //we have less items then we can copy,
                        //so adjust batch size
                        currentBatchSize = currentBatchSize + startingIndex;
                        startingIndex = 0;
                    }

                    if (destination.length() === 0) {
                        //we are loading first time
                        //so there can be unread messages
                        //we need to display all unread messages, so verify this
                        while (startingIndex > 0 && !source.get(startingIndex - 1).getIsRead()) {
                            startingIndex--;
                            currentBatchSize++;
                        }
                    }

                    sublist = source.sublist(startingIndex, currentBatchSize);

                    destination.unshift(sublist);

                    var deferred = $q.defer();

                    deferred.resolve(sublist.length);

                    return deferred.promise;
                },

                loadFromServer: function (batchSize) {

                    var parameters = {
                        ConversationId: this.settings.conversationId,
                        Skip: this.settings.loadedMessages.length(),
                        Take: utils.common.isNullOrUndefined(batchSize) ? this.settings.batchSize : batchSize
                    };

                    return messengerHub.getConversationMessages(parameters).then(function (result) {
                        var messages = result.map(function (item) {
                            return new MessageModel(item);
                        });

                        if (messages.length > 0) {
                            this.settings.history.unshift(messages);
                        }

                        return messages.length;
                    }.bind(this), function (data) {
                        return $q.reject(data);
                    });
                },
            });

            return HistoryMessagesProvider;
        }
    ]);

})(window);