/**
 * Created by Akira Matsui
 */
'use strict';

window.onunload = function(){
    aCtx().getJanusMng().disconnectJanusServer();
};
var JanusMng = {};

//JanusMng.serverURL = 'ws://' + 'xcomplatform.dev' + ':8188';
//JanusMng.serverURL = 'wss://' + 'xcomplatform.dev' + ':8189';

//JanusMng.serverURL = 'ws://' + '192.168.1.40' + ':8188';
//JanusMng.serverURL = 'wss://' + '192.168.1.40' + ':8189';
//JanusMng.serverURL = "ws://" + '52.88.140.45' + ":8188";
//JanusMng.serverURL = "wss://" + '52.88.140.45' + ":8189";
//JanusMng.serverURL = "wss://" + '52.88.140.45' + ":8189";
JanusMng.serverURL = "wss://" + 'webrtc.realine.net' + ":8189";

JanusMng.myusername = 'user_' + genRandomString(4);
JanusMng.myuserid = genRandomID(3);
JanusMng.iceServers = [{"url": "stun:stun.l.google.com:19302"}];
JanusMng.ipv6Support = false;

/** @type {WSTransport} */
JanusMng.wsTransport = null;
/** @type {JanusSignalSession} */
JanusMng.janusSignalSession = null;
/**
 * @description Stub for the scaling and optimization
 * @returns {JanusSignalSession|*}
 */
JanusMng.getOptimalSignalSession = function(){
    return JanusMng.janusSignalSession;
};

/**
 * @description
 * 	Creating Janus session - In fact - just start Signalling Session
 * @param {EventCallback} [eventCallback]
 */
JanusMng.connectJanusServer = function(eventCallback){
    /** @type {WSTransport} */
    JanusMng.wsTransport = new WSTransport(JanusMng.serverURL);
    JanusMng.janusSignalSession = new JanusSignalSession(JanusMng.wsTransport);
    JanusMng.janusSignalSession.createSession(eventCallback);
};

JanusMng.disconnectJanusServer = function(){
    aCtx().getVideoRoomMng().exitAllRooms();
    aCtx().getVideoRoomMng().videoRoomMngPluginHandler.destroyHandler();
    JanusMng.janusSignalSession.closeSession();
    JanusMng.wsTransport.ws.close(0, 'bye');
};
