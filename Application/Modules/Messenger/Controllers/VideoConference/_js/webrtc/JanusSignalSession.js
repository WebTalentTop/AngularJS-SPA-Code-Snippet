/**
 * Created by Akira Matsui
 */
'use strict';


/**
 * @class
 * @constructor
 * @param {Transport} [transport]
 */
function JanusSignalSession(transport){

    this.sessionId = null;

    this.connected = false;

    /** @type {Transport} */
    this.transport = transport;

    /** @type {{function({string}, {JanusSignalSession} return {boolean})} } */
    this.transactionHandlers = {};
    /**
     * @description PluginHandlers are the signal/event handlers for the signalling. JanusSignalManager routes signals to them.
     * @type {{id: {PluginHandler}, id: {PluginHandler}}} */
    this.pluginHandlers = {};

    /** @type {SignallingEventsListeners} */
    this.signallingEventsListeners = null;

    /** @type {number}  */
    this.keepaliveTimeoutId = null;
}

JanusSignalSession.sessions = {};

/**
 * @param {EventCallback} [eventCallback]
 */
JanusSignalSession.prototype.createSession = function(eventCallback) {
    var request = { "janus": "create" };

    var tec = new TransportEventsHandler();
    /** @description Standard Signal Processing */
    tec.onTEvMessage = this.handleSignallingEvent.bind(this);
    tec.onTEvInit = function(){
        this.sendSignal(request, function(json){this.handleSessionCreationAnswer(json, eventCallback); return true;}.bind(this));
    }.bind(this);
    tec.onTEvError = function(errMsg, doer){
        eventCallback.onEvError(errMsg, doer); // FIXME: fix/notFix ???? - misconception - oncePerformed eventCallback is added as a permanent Handler and for different events (it is added to signalling event)
    }
    this.transport.initTransport(tec);
};

JanusSignalSession.prototype.closeSession = function() {
    var request = { "janus": "destroy", "transaction": randomString(12) };
    this.sendSignal(request);
    if(this.keepaliveTimeoutId) {
        clearTimeout(this.keepaliveTimeoutId);
    }
};

/**
 * @param {{}} json
 * @param {function} [responseHandler]
 * @param {boolean} [trace]
 */
JanusSignalSession.prototype.sendSignal = function(json, responseHandler, trace) {
    //if(token !== null && token !== undefined)
    //    request["token"] = token;
    //if(apisecret !== null && apisecret !== undefined)
    //    request["apisecret"] = apisecret;
    //if(jsep !== null && jsep !== undefined)
    //    request.jsep = jsep;
    //if(websockets) // TODO: !!!!!!!

    if(this.sessionId)
        json["session_id"] = this.sessionId;

    json['transaction'] = genRandomString(12);
    if(responseHandler)
        this.transactionHandlers[json['transaction']] = responseHandler;
    if(trace !== false)
        alertMng.trace('Sending signal: ' + JSON.stringify(json));
    //alert('Send signal: ' + JSON.stringify(json));

    this.transport.sendMsg(JSON.stringify(json));
};

/**
 * @param {{}} json
 * @param {EventCallback} [eventCallback]
 * @returns {boolean}
 */
JanusSignalSession.prototype.handleSessionCreationAnswer = function(json, eventCallback){
    if (json["janus"] !== "success" || !json.data["id"]) {
        alertMng.alert(this, 'wrong session creation answer: ' + json);
        if(eventCallback)
            eventCallback.onEvError('wrong session creation answer: ' + json, this);
        return true;
    }

    this.connected = true;
    this.sessionId = json.data["id"];
    JanusSignalSession.sessions[this.sessionId] = this;

    this.keepAlive = this.keepAlive.bind(this);
    this.keepaliveTimeoutId = setTimeout(this.keepAlive, 30000);

    if(eventCallback)
        eventCallback.onEvSuccess('', this);

    return true; // do not do the standard signallingEvents processing
};

// Private helper to send keep-alive messages on WebSockets
JanusSignalSession.prototype.keepAlive = function() {
    this.keepaliveTimeoutId = setTimeout(this.keepAlive, 30000);
    var request = { "janus": "keepalive"};
    //this.transport.sendKeepAliveMsg(JSON.stringify(request));
    this.sendSignal(request, null, false);
};

/**
 * @description
 *  Standard Signal Processing
 *  This will also trigger plugin callbacks, if set
 * @param signalMsg
 */
JanusSignalSession.prototype.handleSignallingEvent = function(signalMsg) {
    var json = JSON.parse(signalMsg);

    if(json["janus"] !== 'ack')
        alertMng.alert('got: '+ JSON.stringify(json));

    // process Signal/Event with onceHandler
    var transaction = json['transaction'];
    if(transaction && this.transactionHandlers[transaction]) {
        var rv = this.transactionHandlers[transaction](json, this);
        delete this.transactionHandlers[transaction]; // unregister 'onceTransactionHandler'
        if(rv === true)
            return; // do not do the standard signallingEvents processing
    }

    // process Signal/Event with globalHandler -> [with invoking specific PluginHandler] -> [with invoking specific ApplicationLayerHandler]
    switch(json["janus"]){
        case "keepalive": // Nothing happened
            return;
        case "ack": // Just an ack, we can probably ignore
            return;
        case "error":
            // Oops, something wrong happened
            alertMng.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
            var transaction = json["transaction"];
            if (transaction !== null && transaction !== undefined) {
                var reportSuccess = this.transactionHandlers[transaction];
                if (reportSuccess !== null && reportSuccess !== undefined) {
                    reportSuccess(json);
                }
                delete this.transactionHandlers[transaction];
            }
            return;

        case "hangup":
            // A plugin asked the core to hangup a PeerConnection on one of our handles
            var sender = json["sender"];
            if (sender === undefined || sender === null) {
                alertMng.warn("Missing sender...");
                return;
            }
            var pluginHandler = this.pluginHandlers[sender];
            if ( ! pluginHandler ) {
                alertMng.warn("This handle is not attached to this session");
                return;
            }
            //pluginHandler.hangup(); // kapel
            return;
        case "detached":
            // A plugin asked the core to detach one of our handles
            var sender = json["sender"];
            if (sender === undefined || sender === null) {
                alertMng.warn("Missing sender...");
                return;
            }
            var pluginHandler = this.pluginHandlers[sender];
            if ( ! pluginHandler ) {
                alertMng.warn("This handle is not attached to this session");
                return;
            }
            pluginHandler.phOnDetached();
            delete this.pluginHandlers[sender];
            return;
        case "event":
            var sender = json["sender"];
            if (sender === undefined || sender === null) {
                alertMng.warn("Missing sender...");
                return;
            }
            var plugindata = json["plugindata"];
            if (plugindata === undefined || plugindata === null) {
                alertMng.warn("Missing plugindata...");
                return;
            }
            alertMng.debug("  -- Event is coming from " + sender + " (" + plugindata["plugin"] + ")");
            var data = plugindata["data"];

            var pluginHandler = this.pluginHandlers[sender];
            if ( ! pluginHandler ) {
                alertMng.warn("This handle is not attached to this session");
                return;
            }
            // process with invoking specific PluginHanlers
            pluginHandler.phOnSignal(json);//data);
            return;
        //case "success":
        //    return;
        //case "webrtcup":
        //    // The PeerConnection with the gateway is up! FIXME Should we notify this?
        //    return;
        default:
            alertMng.warn('Unknown message "' + json['janus'] + '"');
            return;
    }
};

/**
 * @class
 * @constructor
 */
function SignallingEventsListeners() {
    /**
     * @param {JanusSignalSession} signallingSession
     * @param {string} errMsg
     */
    this.onSEvError = function(signallingSession, errMsg){alertMng.alert('Session error: sessionid=' + signallingSession.sessionId + ', Message: ' + errMsg)};
    /**
     * @param {JanusSignalSession} signallingSession
     */
    this.onSEvSuccess = function(signallingSession){};
    /**
     * @param {JanusSignalSession} signallingSession
     * @param {string} msg
     */
    this.onSEvMessage = function(signallingSession, msg){};
    /**
     * @param {JanusSignalSession} signallingSession
     */
    this.onSEvClose = function(signallingSession){};
}
