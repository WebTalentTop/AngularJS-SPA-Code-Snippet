/**
 * Created by Akira Matsui
 */
'use strict';
/**
 * @implements {Transport}
 * @constructor
 * @param {string} serverURL
 */
function WSTransport(serverURL) {
    /** @type {string} */
    this.serverURL = serverURL;

    /** @type {WebSocket} */
    this.ws = null;

    /**
     * @type {TransportEventsHandler}
     * @description
     *  Permanent (until been removed) EventsHandler
     */
    this.transportEventsHandler = null;

}

/**
 * @param {TransportEventsHandler} transportEventsHandler
 */
WSTransport.prototype.initTransport = function(transportEventsHandler) {

    this.transportEventsHandler = transportEventsHandler || new TransportEventsHandler();

    this.ws = new WebSocket(this.serverURL, 'janus-protocol');

    var wsHandlers = {
                'error': function() {
                    this.transportEventsHandler.onTEvError("Error connecting to the Janus WebSockets server: " + this.serverURL, this);
                }.bind(this),

                'open': function() {
                    this.transportEventsHandler.onTEvInit('', this);
                }.bind(this),

                'message': function(event) {
                    this.transportEventsHandler.onTEvMessage(event.data, this);
                }.bind(this),

                'close': function() {
                    this.transportEventsHandler.onTEvClose('', this);
                }.bind(this)
            };

            for(var eventName in wsHandlers) {
                this.ws.addEventListener(eventName, wsHandlers[eventName]);
            }
};

WSTransport.prototype.sendKeepAliveMsg = function(msgStr) {
    this.ws.send(msgStr);
};
/**
 * @param {string} msg
 */
WSTransport.prototype.sendMsg = function(msg) {
    this.ws.send(msg);
};
