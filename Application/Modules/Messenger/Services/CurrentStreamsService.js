(function (global) {
    'use strict';

    global.realineMessenger.factory('currentStreamsService', ['messageBus', 'events', 'utils',
    function (messageBus, events, utils) {

        var CurrentStreamsService = Class.extend({
            init: function () {
                this.company = null;
                this.streams = [];
            },

            getCurrentStreams: function () {
                var ar = [];
                Array.prototype.push.apply(ar, this.streams);
                return ar;
            },

            hasStreams: function () {
                return this.streams.length > 0;
            },

            getCurrentCompany: function () {
                return this.company;
            },

            streamsAreaOpened: function (company, streamIds, openMesenger) {
                //company - {Id(Master), Name}
                //streamsIds - []

                if (utils.common.isNullOrEmpty(utils.common.isNullOrUndefined(streamIds) || streamIds.length === 0)) {
                    throw new Error('Number of streams must be more then zero');
                }

                if (!this.isAreaChanged(company, streamIds)) {
                    return;
                }

                this.company = company;

                this.streams.length = 0;
                Array.prototype.push.apply(this.streams, streamIds);

                if (openMesenger) {
                    messageBus.fire({
                        type: events.openMessenger,
                        state: 'maximize',
                    });
                }

                messageBus.fire({
                    type: events.streamsAreaOpened,
                    data: {
                        Company: company,
                        Streams: this.streams
                    }
                });
            },

            streamsAreaClosed: function (streamIds) {

                if (utils.common.isNullOrEmpty(utils.common.isNullOrUndefined(streamIds) || streamIds.length === 0)) {
                    throw new Error('Number of streams must be more then zero');
                }

                messageBus.fire({
                    type: events.streamsAreaClosed,
                    data: {
                        Streams: streamIds
                    }
                });

                this.streams.length = 0;
            },

            createStreamConversation: function (subscriberMasterUserId, stream, companyName) {
                //options={SubscriberMasterUserId, Stream}
                // companyName is optional
                //messanger can takeit from ContextName

                messageBus.fire({
                    type: events.createStreamConversation,
                    data: {
                        SubscriberMasterUserId: subscriberMasterUserId,
                        Stream: stream,
                        CompanyName: companyName,
                    }
                });
            },

            isAreaChanged: function (company, streams) {
                if (this.company === null || this.company.Id !== company.Id) {
                    return true;
                }

                if (this.streams.length === 0) {
                    return true;
                }

                if (this.streams.join() != streams.join()) {
                    return true;
                }
            }
        });

        return new CurrentStreamsService();
    }]);

})(window);