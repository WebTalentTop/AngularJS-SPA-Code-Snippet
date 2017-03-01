/**
 * Created by Akira Matsui
 */

/************************************************************************************************************/
/************************************* PluginHandler ********************************************************/
/************************************************************************************************************/

/**
 * @class
 * @constructor
 * @param {JanusSignalSession} janusSignalSession
 * @param {string} pluginName
 * @param {string} [handlerId]
 */
function PluginHandler(janusSignalSession, pluginName, handlerId){
    /** @type {string} */
    this.plugin = pluginName;
    /** @type {string} */
    this.handlerId = handlerId;

    /** @type {JanusSignalSession} */
    this.janusSignalSession = janusSignalSession;

    bind2this(this);
}
/**
 * @abstract
 * @function
 * @param {{}} signal
 */
PluginHandler.prototype.phOnSignal = function(signal){};

/**
 * @abstract
 * @function
 */
PluginHandler.prototype.phOnDetached = function(){};

PluginHandler.prototype.getId = function() { return this.handlerId; };
PluginHandler.prototype.getPlugin = function() { return this.plugin; };


//PluginHandler.prototype.getVolume = function() { return this.webRTCSession.getVolume(); };
//PluginHandler.prototype.isAudioMuted = function() { return this.webRTCSession.isMuted(false); };
//PluginHandler.prototype.muteAudio = function() { return this.webRTCSession.mute(false, true); };
//PluginHandler.prototype.unmuteAudio = function() { return this.webRTCSession.mute(false, false); };
//PluginHandler.prototype.isVideoMuted = function() { return this.webRTCSession.isMuted(true); };
//PluginHandler.prototype.muteVideo = function() { return this.webRTCSession.mute(true, true); };
//PluginHandler.prototype.unmuteVideo = function() { return this.webRTCSession.mute(true, false); };
//PluginHandler.prototype.getBitrate = function() { return this.webRTCSession.getBitrate(); };
//PluginHandler.prototype.data = function(callbacks) { this.webRTCSession.sendData(callbacks); };
//PluginHandler.prototype.dtmf = function(callbacks) { this.webRTCSession.sendDtmf(callbacks); };
//PluginHandler.prototype.hangup = function() { this.webRTCSession.cleanupWebrtc(); };
//PluginHandler.prototype.detach = function(callbacks) { this.webRTCSession.onDestroyHandler(callbacks); };

////PluginHandler.prototype.createOffer = function(callbacks) { this.webRTCSession.prepareWebrtc(callbacks); };
////PluginHandler.prototype.createAnswer = function(callbacks) { this.webRTCSession.prepareWebrtc(callbacks); };

/**
 * @description
 *    Attach VideoRoom Plugin
 * @param {EventCallback} [eventCallback]
 */
PluginHandler.prototype.attachPlugin = function(eventCallback) {
    var request = { "janus": "attach", "plugin": this.plugin};

    this.janusSignalSession.sendSignal(request, function(json){this.onPluginAttached(json, eventCallback); return true;}.bind(this));
};
/**
 * @param json
 * @param {EventCallback} [eventCallback]
 * @returns {boolean}
 */
PluginHandler.prototype.onPluginAttached = function(json, eventCallback){
    if (json["janus"] !== "success" || !json.data["id"]) {
        alertMng.alert(this, 'error attaching plugin: ' + json);
        if(eventCallback)
            eventCallback.onEvError('error attaching plugin: ' + json, this);
        return true;
    }
    var handlerId = json.data["id"];
    alertMng.alert("Created pluginHandler: " + handlerId);
    this.handlerId = handlerId;
    this.janusSignalSession.pluginHandlers[this.handlerId] = this;

    if(eventCallback)
        eventCallback.onEvSuccess("Plugin attached (" + this.getPlugin() + ", id=" + this.getId() + ")", this, this);

    return true;
};

/**
 * @param {{}} signalBody
 * @param {function} [responseHandler]
 * @param {string} [sdp]
 * @param {boolean} [trace]
 */
PluginHandler.prototype.sendMsgSignal = function(signalBody, responseHandler, sdp, trace) {
    var request = { "janus": "message", "body": signalBody, handle_id: this.handlerId};
    if(sdp)
        request.jsep = sdp;
    this.janusSignalSession.sendSignal(request, responseHandler, trace);
};
/**
 * @param {{}} request
 * @param {function} [responseHandler]
 * @param {boolean} [trace]
 */
PluginHandler.prototype.sendPlainSignal = function(request, responseHandler, trace) {
    request["handle_id"] = this.handlerId;
    this.janusSignalSession.sendSignal(request, responseHandler, trace);
};
// Private method to destroy a plugin handle
/**
 * @param {EventCallback} [callbacks]
 * @param [syncRequest]
 */
PluginHandler.prototype.destroyHandler = function(callbacks, syncRequest) {
    syncRequest = (syncRequest === true);
    alertMng.log("Destroying handle " + this.handlerId + " (sync=" + syncRequest + ")");
    callbacks = callbacks || new EventCallback();

    var request = {"janus": "detach", "transaction": genRandomString(12)};
    this.sendPlainSignal(request);
    delete this.janusSignalSession.pluginHandlers[this.handlerId];
    callbacks.onEvSuccess('PluginHandler destroyed');
};


/**
 * @description
 * "{"janus":"success","session_id":3743772465,"sender":2802597783,"transaction":"SzwCf00EJlBO",
 *      "plugindata":{"plugin":"janus.plugin.videoroom",
 *          "data":{"videoroom":"created","room":2200241359}
 *      }
 *  }"
 * @constructor
 */
function JSIG(){};
/**
 * @param {{}} signal
 * @returns {string|null}
 */
JSIG.getPluginName = function(signal){
    try{ return signal.plugindata.plugin; }
    catch(e) {return null;}
};
/**
 * @param {{}} signal
 * @param {string} subfield
 * @returns {string|null}
 */
JSIG.getPluginData = function(signal, subfield){
    try{ return signal.plugindata.data[subfield]; }
    catch(e) {return null;}
};
/**
 * @description
 *   //{"janus":"event","session_id":2680868942,"sender":442141690,"transaction":"pP4yYG1nDfxA",
 *   //    "plugindata":{"plugin":"janus.plugin.videoroom",
 *   //        "data":{"videoroom":"event","room":2271304937,"configured":"ok"}},
 *   //    "jsep":{"type":"answer","sdp":"v=0\r\no=- 1450463332318287 1450463332318287 IN IP4 192.168.1.40\r\ns=Just a new room_0\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS janus\r\nm=audio 1 RTP/SAVPF 111\r\nc=IN IP4 192.168.1.40\r\na=mid:audio\r\na=recvonly\r\na=rtcp-mux\r\na=ice-ufrag:2G3n\r\na=ice-pwd:eD79nvnDqt4Q7RNfE0a/Ic\r\na=ice-options:trickle\r\na=fingerprint:sha-256 92:F7:92:3B:E2:F7:C4:07:98:10:B7:35:B2:0F:0E:31:F5:3F:E1:62:BB:73:55:0E:14:CD:68:77:E9:A8:63:32\r\na=setup:active\r\na=connection:new\r\na=rtpmap:111 opus/48000/2\r\na=candidate:1 1 udp 2013266431 192.168.1.40 51180 typ host\r\nm=video 1 RTP/SAVPF 100\r\nc=IN IP4 192.168.1.40\r\na=mid:video\r\na=recvonly\r\na=rtcp-mux\r\na=ice-ufrag:2G3n\r\na=ice-pwd:eD79nvnDqt4Q7RNfE0a/Ic\r\na=ice-options:trickle\r\na=fingerprint:sha-256 92:F7:92:3B:E2:F7:C4:07:98:10:B7:35:B2:0F:0E:31:F5:3F:E1:62:BB:73:55:0E:14:CD:68:77:E9:A8:63:32\r\na=setup:active\r\na=connection:new\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=rtcp-fb:100 goog-remb\r\na=candidate:1 1 udp 2013266431 192.168.1.40 51180 typ host\r\n"}}
 *
 * @param {{}} signal
 * @returns {string|null}
 */
JSIG.getJsep = function(signal){
    try{ return signal.jsep; }
    catch(e) {return null;}
};
