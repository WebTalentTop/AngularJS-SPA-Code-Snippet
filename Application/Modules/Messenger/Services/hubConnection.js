(function (global) {
    'use strict';

    global.realineMessenger.factory('hubConnection', ['$q', '$log', '$', '$rootScope', 'CrossDomainStorage',
        'EventManager', 'CoreEnums', 'utils', 'authConstants', 'Domains', 'signalRUtils',
    function ($q, $log, $, $rootScope, CrossDomainStorage,
        EventManager, CoreEnums, utils, authConstants, Domains, signalRUtils) {
        var STATE_CHANGED_EVENT = 'state_changed',
            DISCONNECTED_EVENT = 'disconnected';

        //we need this variable to determinate whether disconnection occured after reconnection timeout
        //or after connection was gracefully closed
        var tryingToReconnect = false;

        //enable logging for debugging
        $.connection.hub.logging = true;

        //'http://localhost:9085/signalr';
        //'http://54.187.86.186:9085/signalr';        
        $.connection.hub.url = Domains.MessengerServer;

        var HubConnection = Class.extend({
            init: function () {
                this.eventManager = new EventManager();

                this.isConnected = false;
                this.state = CoreEnums.HubConnectionState.Disconnected;

                this.bindHubEvents();
            },

            connect: function () {
                return this.connectInternal();
            },

            connectInternal: function () {
                return initConnectionAuthToken().then(function () {
                    return signalRUtils.callMethod($.connection.hub.start, $.connection.hub).then(function () {
                        this.isConnected = true;
                    }.bind(this), function (error) {
                        return $q.reject(error);
                    });
                }.bind(this), function (error) {
                    return $q.reject(error);
                });
            },

            disconnect: function () {
                $.connection.hub.stop();
            },

            getState: function () {
                return this.state;
            },

            bindHubEvents: function () {
                $.connection.hub.stateChanged(function (event) {
                    var newValue = getMessengerStateByValue(event.newState);
                    var oldValue = getMessengerStateByValue(event.oldState);

                    this.state = newValue;

                    this.fireStateChanged(newValue, oldValue);
                }.bind(this));

                $.connection.hub.reconnecting(function () {
                    tryingToReconnect = true;
                });

                $.connection.hub.reconnected(function () {
                    tryingToReconnect = false;
                });

                $.connection.hub.disconnected(function () {
                    if ($.connection.hub.lastError) {
                        $log.info("Disconnect reason: " + $.connection.hub.lastError.message);
                    }

                    var error = $.connection.hub.lastError ? $.extend({}, $.connection.hub.lastError) : null;
                    this.fireDisconnected(tryingToReconnect, error);
                }.bind(this));

                $.connection.hub.error(function (error) {
                    //if (error && error.search('Long polling request failed')>-1) {
                    //    return;
                    //}
                    $log.debug('Hub connection error: ' + error);
                }.bind(this));
            },

            //
            //events
            //

            bindStateChanged: function (handler, context) {
                this.eventManager.bind(STATE_CHANGED_EVENT, handler, context);
            },

            unbindStateChanged: function (handler, context) {
                this.eventManager.detach(STATE_CHANGED_EVENT, handler, context);
            },

            //Supported states (CoreEnums.HubConnectionState): Connecting, Connected, Reconnecting, or Disconnected
            fireStateChanged: function (newState, oldState) {
                var fired = this.eventManager.fire({
                    type: STATE_CHANGED_EVENT,
                    newState: newState,
                    oldState: oldState
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            bindDisconnected: function (handler, context) {
                this.eventManager.bind(DISCONNECTED_EVENT, handler, context);
            },

            unbindDisconnected: function (handler, context) {
                this.eventManager.detach(DISCONNECTED_EVENT, handler, context);
            },

            fireDisconnected: function (triedToReconnect, lastError) {
                var fired = this.eventManager.fire({
                    type: DISCONNECTED_EVENT,
                    triedToReconnect: triedToReconnect,
                    lastError: lastError
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },
        });


        //
        // utilites
        //

        function initConnectionAuthToken() {
            return CrossDomainStorage.get(authConstants.localStorage).then(function (result) {
                var qs = {};
                qs[authConstants.header] = result.value;
                $.connection.hub.qs = qs;
            });
        }

        function getMessengerStateByValue(value) {
            switch (value) {
                case $.signalR.connectionState.connecting:
                    return CoreEnums.HubConnectionState.Connecting;
                case $.signalR.connectionState.connected:
                    return CoreEnums.HubConnectionState.Connected;
                case $.signalR.connectionState.reconnecting:
                    return CoreEnums.HubConnectionState.Reconnecting;
                case $.signalR.connectionState.disconnected:
                    return CoreEnums.HubConnectionState.Disconnected;
                default:
                    $log.error(String.format('Unknown messenger hub state {0}', value));
            }
        }

        return new HubConnection();
    }
    ]);


})(window);