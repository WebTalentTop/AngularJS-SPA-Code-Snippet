/**
 * Created by Akira Matsui
 */

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @class
 * @extends {PluginHandler}
 * @implements {AppAgentWebRTC}
 * @constructor
 * @param {JanusSignalSession} janusSignalSession
 * @param {VideoRoom} [vRoom]
 * @param {string} [handlerId]
 */
function PluginHandlerVideoRoom(janusSignalSession, vRoom, handlerId){
    PluginHandler.call(this, janusSignalSession, PluginHandlerVideoRoom.PLUGIN_NAME_VIDEOROOM, handlerId);

    /** @description Owning VideoRoom. Can be NULL for the special ManagementPluginHandler ( for example to get a list of available rooms )
     *  @type {VideoRoom} */
    this.vRoom = vRoom;
    /**  @type {number} */
    this.feed = null;

    /** @type {WRTCSession} */
    this.webRTCSession = new WRTCSession(this);
}
PluginHandlerVideoRoom.prototype = Object.create(PluginHandler.prototype);
PluginHandlerVideoRoom.prototype.constructor = PluginHandlerVideoRoom;

PluginHandlerVideoRoom.PLUGIN_NAME_VIDEOROOM =  'janus.plugin.videoroom';

/**
 * @description
 *    Get available Rooms List
 */
PluginHandlerVideoRoom.prototype.getRoomsList = function() {
    var createRequest = { "request": "list" };

    this.sendMsgSignal(createRequest,
        function(answer) {
            //{"janus":"success","session_id":1045300337,"sender":4195168071,"transaction":"mHSl8VXO2gja","plugindata":{"plugin":"janus.plugin.videoroom","data":{"videoroom":"success","list":[{"room":1234,"description":"Demo Room","max_publishers":6,"bitrate":128000,"fir_freq":10,"record":"false","num_participants":0},{"room":2836028788,"description":"Just a new room","max_publishers":1,"bitrate":0,"fir_freq":0,"record":"false","num_participants":1}]}}}
            aCtx().getVideoRoomMng().buildRoomsList(answer.plugindata.data.list);
            return true;
        }.bind(this));
};

PluginHandlerVideoRoom.prototype.getRoomInfo = function() {
    var createRequest = { "request": "list" }; // TODO: not optimal request. It can overload the channel in case there exist many rooms. But i don know at the moment how to obtain the room's details

    this.sendMsgSignal(createRequest,
        function(answer) {
            //{"janus":"success","session_id":411858854,"sender":1802411411,"transaction":"eJ3BFCkjeYca",
            //    "plugindata":{"plugin":"janus.plugin.videoroom",
            //        "data":{"videoroom":"success",
            //            "list":[{"room":1234,"description":"Demo Room","max_publishers":6,"bitrate":128000,"fir_freq":10,"record":"false","num_participants":2}]}}}
            var l = JSIG.getPluginData(answer, 'list');
            for(var i = 0; l && i < l.length; i++){
                if( (l[i]['room'] + '') === (this.vRoom.room + '') ) {
                    this.vRoom.applyRoomInfo(l[i]);
                    break;
                }
            }
            return true;
        }.bind(this));
};

PluginHandlerVideoRoom.prototype.getParticipantsList = function() {
    var createRequest = { "request": "listparticipants", 'room': parseInt(this.vRoom.room + '')};

    this.sendMsgSignal(createRequest,
        function(answer) {
//{"janus":"success","session_id":1752143106,"sender":1162599332,"transaction":"bjeQ6NkeMk2h",
//    "plugindata":{"plugin":"janus.plugin.videoroom",
//        "data":{"videoroom":"participants","room":1234,
//    "participants":[
//    {"id":2303546990,"display":"user_KTCi","publisher":"true"},
//    {"id":2137763134,"display":"user_TLp3","publisher":"false"}]}}}
            this.vRoom.getRoomPanel().querySelector('#participants_amount').textContent = '' + JSIG.getPluginData(answer, 'participants').length;
            return true;
        }.bind(this));
};

/**
 * @description
 *    join VideoRoom as Publisher
 * @param {number} [feedId] Need for ptype = 'listener'
 */
PluginHandlerVideoRoom.prototype.joinRoom = function() {
    //var request = {'request': "join", 'room': parseInt(this.vRoom.room + ''), 'ptype': 'publisher', 'display': aCtx().getJanusMng().myusername};
    var request = {'request': "join", 'room': parseInt(this.vRoom.room + ''), 'ptype': 'publisher', 'id': aCtx().getJanusMng().myuserid, 'display': aCtx().getJanusMng().myusername};
    this.sendMsgSignal(request);
};

PluginHandlerVideoRoom.prototype.processIncomingSDP = function (jsep) {
    //alertMng.warn('PluginHandlerVideoRoom.prototype.processIncomingSDP: ?!?!?!');


    //{"janus":"event","session_id":2680868942,"sender":442141690,"transaction":"pP4yYG1nDfxA",
    //    "plugindata":{"plugin":"janus.plugin.videoroom",
    //        "data":{"videoroom":"event","room":2271304937,"configured":"ok"}},
    //    "jsep":{"type":"answer","sdp":"v=0\r\no=- 1450463332318287 1450463332318287 IN IP4 192.168.1.40\r\ns=Just a new room_0\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS janus\r\nm=audio 1 RTP/SAVPF 111\r\nc=IN IP4 192.168.1.40\r\na=mid:audio\r\na=recvonly\r\na=rtcp-mux\r\na=ice-ufrag:2G3n\r\na=ice-pwd:eD79nvnDqt4Q7RNfE0a/Ic\r\na=ice-options:trickle\r\na=fingerprint:sha-256 92:F7:92:3B:E2:F7:C4:07:98:10:B7:35:B2:0F:0E:31:F5:3F:E1:62:BB:73:55:0E:14:CD:68:77:E9:A8:63:32\r\na=setup:active\r\na=connection:new\r\na=rtpmap:111 opus/48000/2\r\na=candidate:1 1 udp 2013266431 192.168.1.40 51180 typ host\r\nm=video 1 RTP/SAVPF 100\r\nc=IN IP4 192.168.1.40\r\na=mid:video\r\na=recvonly\r\na=rtcp-mux\r\na=ice-ufrag:2G3n\r\na=ice-pwd:eD79nvnDqt4Q7RNfE0a/Ic\r\na=ice-options:trickle\r\na=fingerprint:sha-256 92:F7:92:3B:E2:F7:C4:07:98:10:B7:35:B2:0F:0E:31:F5:3F:E1:62:BB:73:55:0E:14:CD:68:77:E9:A8:63:32\r\na=setup:active\r\na=connection:new\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=rtcp-fb:100 goog-remb\r\na=candidate:1 1 udp 2013266431 192.168.1.40 51180 typ host\r\n"}}

        alertMng.debug("PluginHandlerVideoRoom: Handling SDP ...");
        alertMng.debug(JSON.stringify(jsep));
        this.webRTCSession.handleRemoteJsep(jsep);
};

PluginHandlerVideoRoom.prototype.phOnSignal = function (signal) {
    alertMng.debug(" PluginHandlerVideoRoom.phOnSignal ");

    var room = JSIG.getPluginData(signal, "room");
    /** @type {VideoRoom} */
    var vr = aCtx().getVideoRoomMng().activeRooms[room + ''];
    //alert("Room ?: " + JSON.stringify(signal) + ': ' + vr);
    var myid = JSIG.getPluginData(signal, "id");

    var jsep = JSIG.getJsep(signal);
    if ( jsep ) {
        this.processIncomingSDP(jsep);
        this.getRoomInfo();
        return;
    }

    var event = JSIG.getPluginData(signal, "videoroom");
// all the events are processed on ApplicationLevel except someones which affect PluginLevel (like destroying Room or Plugin)
    switch(event){
        case "destroyed":
            // The room has been destroyed
            alertMng.warn("The room has been destroyed!");
            alertMng.error(error, function () {
                //window.location.reload();
            });
            break;
        default :
            vr.processSignal(signal);
            break;
    }
};

/**
 * @override AppAgentWebRTC.aawConsentDialog
 * @param {boolean} on
 */
PluginHandlerVideoRoom.prototype.aawConsentDialog = function (on) {
    //alertMng.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
    //if (on) {
    //    // Darken screen and show hint
    //    $.blockUI({
    //        message: '<div><img src="_img/up_arrow.png"/></div>',
    //        css: {
    //            border: 'none',
    //            padding: '15px',
    //            backgroundColor: 'transparent',
    //            color: '#aaa',
    //            top: '10px',
    //            left: (navigator.mozGetUserMedia ? '-100px' : '300px')
    //        }
    //    });
    //} else {
    //    // Restore screen
    //    $.unblockUI();
    //}
};

// Publish own stream
PluginHandlerVideoRoom.prototype.publishMyself = function() {
    if(this.localVideoPanel) {
        this.localVideoPanel.querySelector('#unpublishCtrl').disabled = true;
        this.localVideoPanel.querySelector('#unpublishCtrl').onclick = null;
    }

    var media = { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true};	// Publishers are sendOnly
    var cb = new EventCallback();
    cb.onEvSuccess = function(sdp) {
        alertMng.debug("Got publisher SDP!");
        alertMng.debug(sdp);
        var publish = { "request": "configure", "audio": true, "video": true};
        this.sendMsgSignal(publish, null, sdp);
    }.bind(this);
    cb.onEvError = function(error) {
        alertMng.error("WebRTC error:", error);
        if(this.localVideoPanel) {
            //this.localVideoPanel.querySelector('#unpublishCtrl').textContent = 'Publish';
            this.localVideoPanel.querySelector('#unpublishCtrl').title = 'Publish';
            this.localVideoPanel.querySelector('#unpublishCtrl').src = '_img/publish.png';
            this.localVideoPanel.querySelector('#unpublishCtrl').onclick = this.publishMyself;
        }
    }.bind(this);

    this.webRTCSession.prepareOutgoingWebrtc(media, cb);
};

PluginHandlerVideoRoom.prototype.unpublishMyself = function() {
    this.localVideoPanel.querySelector('#unpublishCtrl').disabled = true;
    this.localVideoPanel.querySelector('#unpublishCtrl').onclick = null;
    var unpublish = { "request": "unpublish" };
    this.sendMsgSignal(unpublish);
};
PluginHandlerVideoRoom.prototype.onMyselfUnpublished = function() {
    this.localVideoPanel.querySelector('.videoPausedCover').style.display = 'block';
    this.localVideoPanel.querySelector('.videoPausedCover').onclick = this.publishMyself;

    this.localVideoPanel.querySelector('#unpublishCtrl').disabled = false;
    //this.localVideoPanel.querySelector('#unpublishCtrl').textContent = 'Publish';
    this.localVideoPanel.querySelector('#unpublishCtrl').title = 'Publish';
    this.localVideoPanel.querySelector('#unpublishCtrl').src = '_img/publish.png';
    this.localVideoPanel.querySelector('#unpublishCtrl').onclick = this.publishMyself;
    this.webRTCSession.cleanupWebrtc();
};

PluginHandlerVideoRoom.prototype.muteMe = function () {
    this.webRTCSession.enableMyAudio(false);
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.unMuteMe;
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOn.png';
    this.localVideoPanel.querySelector('#localAudioCtrl').onclick = this.unMuteMe;
    //this.localVideoPanel.querySelector('#localAudioCtrl').textContent = 'Unmute';
    this.localVideoPanel.querySelector('#localAudioCtrl').title = 'Unmute';
    this.localVideoPanel.querySelector('#localAudioCtrl').src = '_img/microphoneOn.png';
};
PluginHandlerVideoRoom.prototype.unMuteMe = function () {
    this.webRTCSession.enableMyAudio(true);
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOff.png';
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.muteMe;
    this.localVideoPanel.querySelector('#localAudioCtrl').onclick = this.muteMe;
    //this.localVideoPanel.querySelector('#localAudioCtrl').textContent = 'Mute';
    this.localVideoPanel.querySelector('#localAudioCtrl').title = 'Mute';
    this.localVideoPanel.querySelector('#localAudioCtrl').src = '_img/microphoneOff.png';
};
PluginHandlerVideoRoom.prototype.concealMyVideo = function () {
    this.webRTCSession.enableMyVideo(false);
    this.localVideoPanel.querySelector('#localVideoCtrl').onclick = this.showMyVideo;
    this.localVideoPanel.querySelector('#localVideoCtrl').src = '_img/videoOn.png';
    //this.localVideoPanel.querySelector('#localVideoCtrl').textContent = 'Show';
    this.localVideoPanel.querySelector('#localVideoCtrl').title = 'Show';

    this.localVideoPanel.querySelector('#videoCtrlBtn').onclick = this.showMyVideo;
    this.localVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOn.png';
};
PluginHandlerVideoRoom.prototype.showMyVideo = function () {
    this.webRTCSession.enableMyVideo(true);
    this.localVideoPanel.querySelector('#localVideoCtrl').onclick = this.concealMyVideo;
    this.localVideoPanel.querySelector('#localVideoCtrl').src = '_img/videoOff.png';
    //this.localVideoPanel.querySelector('#localVideoCtrl').textContent = 'Conceal';
    this.localVideoPanel.querySelector('#localVideoCtrl').title = 'Conceal';

    this.localVideoPanel.querySelector('#videoCtrlBtn').onclick = this.concealMyVideo;
    this.localVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOff.png';
};

/**
 * @override AppAgentWebRTC.aawOnLocalStream
 * @param {MediaStream} stream
 */
PluginHandlerVideoRoom.prototype.aawOnLocalStream = function (stream) {
    alertMng.debug(" ::: Got a local stream :::");
    ///** @type {Array.<MediaStreamTrack>} */
    //var videoTracks = stream.getVideoTracks();
    ///**  @tpe {MediaTrackCapabilities} */
    //var mediaTrackCapabilities = videoTracks[0].getCapabilities();
    ///**  @tpe {MediaTrackConstraints} */
    //var mediaTrackConstraints = videoTracks[0].getConstraints();
    ///**  @tpe {MediaTrackSettings} */
    //var mediaTrackSettings = videoTracks[0].getSettings();

    /** @type {Element} */
    this.roomPanel = aCtx().getVideoRoomMng().switchToRoom(this.vRoom); // WHEN WE ARE WORKING WITH PUBLISHING PLUGINHUNDLER WE ALWAYS SWITCH TO THE ROOM
    //this.roomPanel = this.vRoom.getRoomPanel();

    //////////////// create/init local video panel ////////////////
    var vpId = 'local_video_panel_' + this.handlerId;
    /** @type {Element} */
    this.localVideoPanel = this.roomPanel.querySelector('#' + vpId);
    if( ! this.localVideoPanel ) {
        this.localVideoPanel = FloatDivMng.showFD(this.roomPanel, vpId, 'videoRoomTemplates.html', '#local_video_panel_template', 'localVideoFloatPanel', '_img/floatDiv/floatDiv.png', aCtx().getJanusMng().myusername, null, true, false);
        this.localVideoPanel.FDD.aspectRatio = aCtx().getVideoRoomMng().getAspectRatio();
        this.localVideoPanel.style.height = this.localVideoPanel.clientHeight + 'px';
        this.localVideoPanel.style.width = ((this.localVideoPanel.clientHeight - (
                this.localVideoPanel.querySelector('.videoCtrlPanel').clientHeight +
                this.localVideoPanel.querySelector('.fd_header').clientHeight +
                this.localVideoPanel.querySelector('.fd_footer').clientHeight
                    )
                ) * aCtx().getVideoRoomMng().getAspectRatio()
            ) + 'px';
        //this.localVideoPanel.style.top = (this.roomPanel.offsetTop + 2) + 'px';
        //this.localVideoPanel.style.left = (this.roomPanel.offsetLeft + this.roomPanel.clientWidth - this.localVideoPanel.scrollWidth - 2) + 'px';
        this.localVideoPanel.querySelector('.fd_header').title = 'HandleID: ' + this.handlerId;

        //this.localVideoPanel = document.querySelector('#local_video_panel_template').cloneNode(true);
        //this.localVideoPanel.id = vpId;
        //this.roomPanel.appendChild(this.localVideoPanel);
        //this.localVideoPanel.classList.remove('hidden');
    }
    this.localVideoPanel.querySelector('.videoPausedCover').style.display = 'none';
    //this.localVideoPanel.querySelector('.publisherName').textContent = aCtx().getJanusMng().myusername;

    this.localVideoPanel.querySelector('#localAudioCtrl').onclick = this.muteMe;
    this.localVideoPanel.querySelector('#localAudioCtrl').src = '_img/microphoneOff.png';
    this.localVideoPanel.querySelector('#localAudioCtrl').title = 'Mute';
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.muteMe;
    this.localVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOff.png';

    this.localVideoPanel.querySelector('#localVideoCtrl').onclick = this.concealMyVideo;
    this.localVideoPanel.querySelector('#localVideoCtrl').src = '_img/videoOff.png';
    this.localVideoPanel.querySelector('#localVideoCtrl').title = 'Conceal';
    this.localVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOff.png';
    this.localVideoPanel.querySelector('#videoCtrlBtn').onclick = this.concealMyVideo;

    //this.localVideoPanel.querySelector('#unpublishCtrl').textContent = 'Unpublish';
    this.localVideoPanel.querySelector('#unpublishCtrl').title = 'Unpublish';
    this.localVideoPanel.querySelector('#unpublishCtrl').disabled = false;
    this.localVideoPanel.querySelector('#unpublishCtrl').src = '_img/unpublish.png';
    this.localVideoPanel.querySelector('#unpublishCtrl').onclick = this.unpublishMyself;
    this.localVideoPanel.querySelector('#unpublishCtrlBtn').disabled = false;
    this.localVideoPanel.querySelector('#unpublishCtrlBtn').src = '_img/unpublish.png';
    this.localVideoPanel.querySelector('#unpublishCtrlBtn').onclick = this.unpublishMyself;

    var myVideoElm = this.localVideoPanel.querySelector('.localvideo');
    attachMediaStream(myVideoElm, stream);
    var mv = this.roomPanel.querySelector('.mainvideo');
    if( ! mv.src ) // reattach myself to mainvideo in automate mode only if there is no any other video attached
        reattachMediaStream(this.roomPanel.querySelector('.mainvideo'), myVideoElm);

    //this.getRoomsList();
    this.getRoomInfo();

    /** @type {Array.<MediaStreamTrack>} */
    var videoTracks = stream.getVideoTracks();
    if ( ! videoTracks || videoTracks.length === 0) {
        // No webcam
        myVideoElm.classList.add('hidden');
        this.localVideoPanel.innerHTML +=
            '<div class="no-video-container">' +
            '<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
            '<span class="no-video-text" style="font-size: 16px;">No webcam available</span>' +
            '</div>';
    }
};

/**
 * @override AppAgentWebRTC.aawOnRemoteStream
 * @param stream
 */
PluginHandlerVideoRoom.prototype.aawOnRemoteStream = function (stream) {
    // The publisher stream is sendonly, we don't expect anything here
};

/**
 * @param {EventCallback} [callbacks]
 * @param [syncRequest]
 */
PluginHandlerVideoRoom.prototype.destroyHandler = function(callbacks, syncRequest) {
    this.webRTCSession.cleanupWebrtc();
    PluginHandler.prototype.destroyHandler.call(this, callbacks, syncRequest);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @class
 * @extends {PluginHandlerVideoRoom}
 * @constructor
 * @param {JanusSignalSession} janusSignalSession
 * @param {VideoRoom} [vRoom]
 * @param [handlerId]
 */
function PluginHandlerVideoRoomFeed(janusSignalSession, vRoom, handlerId){
    PluginHandlerVideoRoom.call(this, janusSignalSession, vRoom, handlerId);

    /**  @type {number} */
    this.feed = null;
    /** @type {string} */
    this.rfdisplay = null;// displayName;
}
PluginHandlerVideoRoomFeed.prototype = Object.create(PluginHandlerVideoRoom.prototype);
PluginHandlerVideoRoomFeed.prototype.constructor = PluginHandlerVideoRoomFeed;

/**
 * @description
 *    subscribe to remote feed in VideoRoom (join VideoRoom's remote feed)
 * @param {number} feedId Need for ptype = 'listener'
 */
PluginHandlerVideoRoomFeed.prototype.joinRoom = function(feedId) {
    this.feed = feedId;
    //var register = {'request': "join", 'room': parseInt(this.vRoom.room + ''), 'ptype': 'listener', 'feed': this.feed};
    var register = {'request': "join", 'room': parseInt(this.vRoom.room + ''), 'ptype': 'listener', 'id': aCtx().getJanusMng().myuserid, 'display': aCtx().getJanusMng().myusername, 'feed': this.feed};
    this.sendMsgSignal(register);
};

PluginHandlerVideoRoomFeed.prototype.processIncomingSDP = function (jsep) {
    alertMng.debug("PluginHandlerVideoRoomFeed: Handling SDP ...");
    alertMng.debug(jsep);
    var media = {audioSend: false, videoSend: false};	// We want recvonly audio/video

    var ecb = new EventCallback();
    ecb.onEvSuccess  = function(jsep) {
        alertMng.debug("Got SDP!");
        alertMng.debug(jsep);
        var body = { "request": "start", 'room': parseInt(this.vRoom.room + '')};
        this.sendMsgSignal(body, null, jsep);
    }.bind(this);
    ecb.onEvError = function(error) {
        alertMng.error("WebRTC error:", error);
        alertMng.alert("WebRTC error... " + JSON.stringify(error));
    };

    this.webRTCSession.streamsGotten(jsep, media, ecb);
};

PluginHandlerVideoRoomFeed.prototype.muteRemoteAudio = function () {
    this.remoteVideoPanel.querySelector('.remotevideo').muted = true;
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').onclick = this.unmuteRemoteAudio;
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').src = '_img/microphoneOn.png';
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').title = 'Unmute';
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.unmuteRemoteAudio;
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOn.png';
};
PluginHandlerVideoRoomFeed.prototype.unmuteRemoteAudio = function () {
    this.remoteVideoPanel.querySelector('.remotevideo').muted = false;
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').onclick = this.muteRemoteAudio;
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').src = '_img/microphoneOff.png';
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').title = 'Mute';
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.muteRemoteAudio;
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOff.png';
};
PluginHandlerVideoRoomFeed.prototype.pauseRemoteVideo = function () {
    this.remoteVideoPanel.querySelector('.remotevideo').pause();
    //this.remoteVideoPanel.querySelector('.videoPausedCover').style.display = 'block';

    //this.remoteVideoPanel.querySelector('.videoPausedCover').onclick = this.showRemoteVideo;
    //this.remoteVideoPanel.querySelector('.remotevideo').onclick = this.showRemoteVideo;

    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').onclick = this.showRemoteVideo;
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').src = '_img/videoOn.png';
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').title = 'Renew';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOn.png';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').onclick = this.showRemoteVideo;

};
PluginHandlerVideoRoomFeed.prototype.showRemoteVideo = function () {
    this.remoteVideoPanel.querySelector('.remotevideo').play();
    this.remoteVideoPanel.querySelector('.videoPausedCover').style.display = 'none';

    //this.remoteVideoPanel.querySelector('.remotevideo').onclick = this.pauseRemoteVideo;

    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').onclick = this.pauseRemoteVideo;
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').src = '_img/videoOff.png';
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').title = 'Pause';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOff.png';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').onclick = this.pauseRemoteVideo;

};
/**
 * @override AppAgentWebRTC.aawOnRemoteStream
 * @param stream
 */
PluginHandlerVideoRoomFeed.prototype.aawOnRemoteStream = function (stream) {
    alertMng.debug(" ::: Got a local stream :::");
    aCtx().getNotificationMng().notifyEvent('New Remote feed. ' +
        'Remote: ' + (this.rfdisplay || this.feed) + '; ' + '\n' +
        'Room: ' + this.vRoom.description, this);

    /** @type {Element} */
    this.roomPanel = this.vRoom.getRoomPanel();

    //////////////// create remote video panel ////////////////
    /** @type {Element} */
    //this.remoteVideoPanel = document.querySelector('#remote_video_panel_template').cloneNode(true);
    this.remoteVideoPanel = loadHtmlPage('videoRoomTemplates.html', '#remote_video_panel_template');
    this.remoteVideoPanel = this.vRoom.videoRoomUI.wnd.document.adoptNode(this.remoteVideoPanel);
    this.remoteVideoPanel.id = 'remote_video_panel_' + this.feed;
    this.remoteVideoPanel.querySelector('#remoteFeed').textContent = this.rfdisplay || this.feed;

    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').onclick = this.muteRemoteAudio;
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').src = '_img/microphoneOff.png';
    this.remoteVideoPanel.querySelector('#remoteAudioCtrl').title = 'Mute';
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').onclick = this.muteRemoteAudio;
    this.remoteVideoPanel.querySelector('#microphoneCtrlBtn').src = '_img/microphoneOff.png';

    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').onclick = this.pauseRemoteVideo;
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').src = '_img/videoOff.png';
    this.remoteVideoPanel.querySelector('#remoteVideoCtrl').title = 'Pause';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').src = '_img/videoOff.png';
    this.remoteVideoPanel.querySelector('#videoCtrlBtn').onclick = this.pauseRemoteVideo;
    /** @type {Element} */
    var vl = this.roomPanel.querySelector('.video_line');
    var cwa = getChildsWidthAmount(vl);
    if(vl.childElementCount > 0 && vl.clientWidth < cwa + cwa/vl.childElementCount)
        vl.style.width = (cwa + cwa/vl.childElementCount) + 'px';
    vl.appendChild(this.remoteVideoPanel);
    this.remoteVideoPanel.scrollIntoView();
    this.remoteVideoPanel.classList.remove('hidden');

    var remoteVideoElm = this.remoteVideoPanel.querySelector('.remotevideo');
    attachMediaStream(remoteVideoElm, stream);
    remoteVideoElm.muted = false;
    //remoteVideoElm.onclick = this.pauseRemoteVideo;
    reattachMediaStream(this.roomPanel.querySelector('.mainvideo'), remoteVideoElm);
};
