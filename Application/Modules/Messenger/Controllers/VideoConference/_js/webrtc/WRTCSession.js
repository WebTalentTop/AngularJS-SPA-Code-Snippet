/**
 * Created by Akira Matsui
 */
//'use strict';

/**
 * @class
 * @constructor
 * @param {AppAgentWebRTC} appAgentWebRTC
 */
function WRTCSession(appAgentWebRTC) {
    /** @type {{started: boolean, myStream: {MediaStream}, streamExternal: boolean, remoteStream: {MediaStream}, mySdp: null, pc: null, dataChannel: null, dtmfSender: null, trickle: boolean, iceDone: boolean, sdpSent: boolean, volume: {value: null, timer: null}, bitrate: {value: null, bsnow: null, bsbefore: null, tsnow: null, tsbefore: null, timer: null}}} */
    this.webrtcStuff = {
        started: false,
        /** @type {MediaStream}  */
        myStream: null,
        streamExternal: false,
        /** @type {MediaStream}  */
        remoteStream: null,
        mySdp: null,
        pc: null,
        dataChannel: null,
        dtmfSender: null,
        trickle: true,
        iceDone: false,
        sdpSent: false,

        volume: {
            value: null,
            timer: null
        },

        bitrate: {
            value: null,
            bsnow: null,
            bsbefore: null,
            tsnow: null,
            tsbefore: null,
            timer: null
        }
    };

    /** @type {AppAgentWebRTC} */
    this.appAgentWebRTC = appAgentWebRTC;

    //bind2this(this);
}

WRTCSession.isAudioSendEnabled = function(media) {
    alertMng.debug("isAudioSendEnabled:", media);
    if(media === undefined || media === null)
        return true;	// Default
    if(media.audio === false)
        return false;	// Generic audio has precedence
    if(media.audioSend === undefined || media.audioSend === null)
        return true;	// Default
    return (media.audioSend === true);
};

WRTCSession.isAudioRecvEnabled = function(media) {
    alertMng.debug("isAudioRecvEnabled:", media);
    if(media === undefined || media === null)
        return true;	// Default
    if(media.audio === false)
        return false;	// Generic audio has precedence
    if(media.audioRecv === undefined || media.audioRecv === null)
        return true;	// Default
    return (media.audioRecv === true);
};

WRTCSession.isVideoSendEnabled = function(media) {
    alertMng.debug("isVideoSendEnabled:", media);
    if(webrtcDetectedBrowser == "edge") {
        alertMng.warn("Edge doesn't support compatible video yet");
        return false;
    }
    if(media === undefined || media === null)
        return true;	// Default
    if(media.video === false)
        return false;	// Generic video has precedence
    if(media.videoSend === undefined || media.videoSend === null)
        return true;	// Default
    return (media.videoSend === true);
};

WRTCSession.isVideoRecvEnabled = function(media) {
    alertMng.debug("isVideoRecvEnabled:", media);
    if(webrtcDetectedBrowser == "edge") {
        alertMng.warn("Edge doesn't support compatible video yet");
        return false;
    }
    if(media === undefined || media === null)
        return true;	// Default
    if(media.video === false)
        return false;	// Generic video has precedence
    if(media.videoRecv === undefined || media.videoRecv === null)
        return true;	// Default
    return (media.videoRecv === true);
};
WRTCSession.isDataEnabled = function(media) {
    alertMng.debug("isDataEnabled:", media);
    if(webrtcDetectedBrowser == "edge") {
        alertMng.warn("Edge doesn't support data channels yet");
        return false;
    }
    if(media === undefined || media === null)
        return false;	// Default
    return (media.data === true);
}
WRTCSession.isTrickleEnabled = function(trickle) {
    alertMng.debug("isTrickleEnabled:", trickle);
    if(trickle === undefined || trickle === null)
        return true;	// Default is true
    return (trickle === true);
};

/**
 * @param {{}} media
 * @param {EventCallback} callbacks
 */
WRTCSession.prototype.prepareOutgoingWebrtc = function(media, callbacks) {
    this.appAgentWebRTC.aawConsentDialog(true);
    var width = 0;
    var height = 0, maxHeight = 0;
    if (media.video === 'lowres') {
        // Small resolution, 4:3
        height = 240;
        maxHeight = 240;
        width = 320;
    } else if (media.video === 'lowres-16:9') {
        // Small resolution, 16:9
        height = 180;
        maxHeight = 180;
        width = 320;
    } else if (media.video === 'hires' || media.video === 'hires-16:9') {
        // High resolution is only 16:9
        height = 720;
        maxHeight = 720;
        width = 1280;
    } else if (media.video === 'stdres') {
        // Normal resolution, 4:3
        height = 480;
        maxHeight = 480;
        width = 640;
    } else if (media.video === 'stdres-16:9') {
        // Normal resolution, 16:9
        height = 360;
        maxHeight = 360;
        width = 640;
    } else {
        alertMng.log("Default video setting (" + media.video + ") is stdres 4:3");
        height = 480;
        maxHeight = 480;
        width = 640;
    }
    alertMng.log("Adding media constraint " + media.video);

    var videoSupport = null;
    if (navigator.mozGetUserMedia) {
        // http://stackoverflow.com/questions/28282385/webrtc-firefox-constraints/28911694#28911694
        // https://github.com/meetecho/janus-gateway/pull/246
        videoSupport = {
            'height': {'ideal': height},
            'width': {'ideal': width}
        }
    } else {
        videoSupport = {
            'mandatory': {
                'maxHeight': maxHeight,
                'minHeight': height,
                'maxWidth': width,
                'minWidth': width
            },
            'optional': []
        };
    }
    alertMng.debug(videoSupport);

    MediaStreamTrack.getSources(function(sources) {
        var audioExist = sources.some(function(source) {
                return source.kind === 'audio';
            }),
            videoExist = sources.some(function(source) {
                return source.kind === 'video';
            });

        // FIXME Should we really give up, or just assume recvonly for both?
        if(!audioExist && !videoExist) {
            this.appAgentWebRTC.aawConsentDialog(false);
            callbacks.onEvError('No capture device found');
            return false;
        }

        // TODO: do it in standard way....
        var nv = this.appAgentWebRTC.vRoom.videoRoomUI.wnd.navigator;
        nv.getUserMedia = nv.getUserMedia || nv.webkitGetUserMedia || nv.mozGetUserMedia || nv.msGetUserMedia;
        this.appAgentWebRTC.vRoom.videoRoomUI.wnd.navigator.getUserMedia(
            {audio: audioExist && WRTCSession.isAudioSendEnabled(media), video: videoExist ? videoSupport : false},
            function(stream) { this.appAgentWebRTC.aawConsentDialog(false); this.streamsGotten(null, media, callbacks, stream); }.bind(this),
            function(error) { this.appAgentWebRTC.aawConsentDialog(false); callbacks.onEvError(error); }.bind(this));
    }.bind(this));
};

WRTCSession.prototype.streamsGotten = function(sdp, media, callbacks, stream) {
    var config = this.webrtcStuff;
    alertMng.debug("streamsGotten:", stream);
    config.myStream = stream;
    var pc_config = {"iceServers": aCtx().getJanusMng().iceServers};
    //~ var pc_constraints = {'mandatory': {'MozDontOfferDataChannel':true}};
    var pc_constraints = {
        "optional": [{"DtlsSrtpKeyAgreement": true}]
    };
    if(aCtx().getJanusMng().ipv6Support === true) {
        // FIXME This is only supported in Chrome right now
        // For support in Firefox track this: https://bugzilla.mozilla.org/show_bug.cgi?id=797262
        pc_constraints.optional.push({"googIPv6":true});
    }
    alertMng.log("Creating PeerConnection");
    alertMng.debug(pc_constraints);
    config.pc = new RTCPeerConnection(pc_config, pc_constraints);
    alertMng.debug(config.pc);
    if(config.pc.getStats) {	// FIXME
        config.volume.value = 0;
        config.bitrate.value = "0 kbits/sec";
    }
    alertMng.log("Preparing local SDP and gathering candidates (trickle=" + config.trickle + ")");
    config.pc.onicecandidate = function(event) {
        if (event.candidate === null ||
            (webrtcDetectedBrowser === 'edge' && event.candidate.candidate.indexOf('endOfCandidates') > 0)) {
            alertMng.log("End of candidates.");
            config.iceDone = true;
            if(config.trickle === true) {
                // Notify end of candidates
                this.sendTrickleCandidate({"completed": true});
            } else {
                // No trickle, time to send the complete SDP (including all candidates)
                this.sendSDP(callbacks);
            }
        } else {
            // JSON.stringify doesn't work on some WebRTC objects anymore
            // See https://code.google.com/p/chromium/issues/detail?id=467366
            var candidate = {
                "candidate": event.candidate.candidate,
                "sdpMid": event.candidate.sdpMid,
                "sdpMLineIndex": event.candidate.sdpMLineIndex
            };
            if(config.trickle === true) {
                // Send candidate
                this.sendTrickleCandidate(candidate);
            }
        }
    }.bind(this);
    if(stream) {
        alertMng.log('Adding local stream');
        config.pc.addStream(stream);
        this.appAgentWebRTC.aawOnLocalStream(stream);
    }
    config.pc.onaddstream = function(remoteStream) {
        alertMng.log("Handling Remote Stream");
        alertMng.debug(remoteStream);
        config.remoteStream = remoteStream;
        this.appAgentWebRTC.aawOnRemoteStream(remoteStream.stream);
    }.bind(this);
    // Any data channel to create?
    if(WRTCSession.isDataEnabled(media)) {
        alertMng.log("Creating data channel");
        var onDataChannelMessage = function(event) {
            alertMng.log('Received message on data channel: ' + event.data);
            this.appAgentWebRTC.aawOnData(event.data);	// FIXME
        }
        var onDataChannelStateChange = function() {
            var dcState = config.dataChannel !== null ? config.dataChannel.readyState : "null";
            alertMng.log('State change on data channel: ' + dcState);
            if(dcState === 'open') {
                this.appAgentWebRTC.aawOnDataopen();	// FIXME
            }
        }
        var onDataChannelError = function(error) {
            alertMng.error('Got error on data channel:', error);
            // TODO
        }
        // Until we implement the proxying of open requests within the JanusWebRTCGate core, we open a channel ourselves whatever the case
        config.dataChannel = config.pc.createDataChannel("JanusDataChannel", {ordered:false});	// FIXME Add options (ordered, maxRetransmits, etc.)
        config.dataChannel.onmessage = onDataChannelMessage;
        config.dataChannel.onopen = onDataChannelStateChange;
        config.dataChannel.onclose = onDataChannelStateChange;
        config.dataChannel.onerror = onDataChannelError;
    }
    // Create offer/answer now
    if( ! sdp ) {
        this.createWebRTCOffer(media, callbacks);
    } else {
        config.pc.setRemoteDescription(
            new RTCSessionDescription(sdp),
            function() {
                alertMng.log("Remote description accepted!");
                this.createWebRTCAnswer(media, callbacks);
            }.bind(this), callbacks.error);
    }
};

WRTCSession.prototype.sendTrickleCandidate = function(candidate) {
    var request = { "janus": "trickle", "candidate": candidate };
    //alertMng.trace("Sending trickle candidate: ");
    this.appAgentWebRTC.sendPlainSignal(request, null, false);
};

// TODO: doesn't look like sending anything.....
WRTCSession.prototype.sendSDP = function(callbacks) {
    callbacks = callbacks || {};
    callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : noOp;
    callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : noOp;
    var config = this.webrtcStuff;
    alertMng.log("Sending offer/answer SDP...");
    if(config.mySdp === null || config.mySdp === undefined) {
        alertMng.warn("Local SDP instance is invalid, not sending anything...");
        return;
    }
    config.mySdp = config.pc.localDescription;
    if(config.sdpSent) {
        alertMng.log("Offer/Answer SDP already sent, not sending it again");
        return;
    }
    alertMng.debug(callbacks);
    config.sdpSent = true;
    callbacks.success(config.mySdp);
};

/**
 * @param {{}} media
 * @param {EventCallback} callbacks
 */
WRTCSession.prototype.createWebRTCOffer = function(media, callbacks) {
    var config = this.webrtcStuff;
    alertMng.log("Creating offer (iceDone=" + config.iceDone + ")");
    // https://code.google.com/p/webrtc/issues/detail?id=3508
    var mediaConstraints = null;
    if(webrtcDetectedBrowser == "firefox" || webrtcDetectedBrowser == "edge") {
        mediaConstraints = {
            'offerToReceiveAudio':WRTCSession.isAudioRecvEnabled(media),
            'offerToReceiveVideo':WRTCSession.isVideoRecvEnabled(media)
        };
    } else {
        mediaConstraints = {
            'mandatory': {
                'OfferToReceiveAudio':WRTCSession.isAudioRecvEnabled(media),
                'OfferToReceiveVideo':WRTCSession.isVideoRecvEnabled(media)
            }
        };
    }
    alertMng.debug(mediaConstraints);
    config.pc.createOffer(
        function(offer) {
            alertMng.debug(offer);
            if(config.mySdp === null || config.mySdp === undefined) {
                alertMng.log("Setting local description");
                config.mySdp = offer.sdp;
                config.pc.setLocalDescription(offer);
            }
            if(!config.iceDone && !config.trickle) {
                // Don't do anything until we have all candidates
                alertMng.log("Waiting for all candidates...");
                return;
            }
            if(config.sdpSent) {
                alertMng.log("Offer already sent, not sending it again");
                return;
            }
            alertMng.log("Offer ready");
            config.sdpSent = true;
            // JSON.stringify doesn't work on some WebRTC objects anymore
            // See https://code.google.com/p/chromium/issues/detail?id=467366
            var jsep = {
                "type": offer.type,
                "sdp": offer.sdp
            };
            callbacks.onEvSuccess(jsep);
        },
        callbacks.onEvError,
        mediaConstraints
    );
};

/**
 * @param {{}} media
 * @param {EventCallback} callbacks
 */
WRTCSession.prototype.createWebRTCAnswer = function(media, callbacks) {
    callbacks = callbacks || new EventCallback();

    var config = this.webrtcStuff;
    alertMng.log("Creating answer (iceDone=" + config.iceDone + ")");
    var mediaConstraints = null;
    if(webrtcDetectedBrowser == "firefox" || webrtcDetectedBrowser == "edge") {
        mediaConstraints = {
            'offerToReceiveAudio':WRTCSession.isAudioRecvEnabled(media),
            'offerToReceiveVideo':WRTCSession.isVideoRecvEnabled(media)
        };
    } else {
        mediaConstraints = {
            'mandatory': {
                'OfferToReceiveAudio':WRTCSession.isAudioRecvEnabled(media),
                'OfferToReceiveVideo':WRTCSession.isVideoRecvEnabled(media)
            }
        };
    }
    alertMng.debug(mediaConstraints);
    config.pc.createAnswer(
        function(answer) {
            alertMng.debug(answer);
            if(config.mySdp === null || config.mySdp === undefined) {
                alertMng.log("Setting local description");
                config.mySdp = answer.sdp;
                config.pc.setLocalDescription(answer);
            }
            if(!config.iceDone && !config.trickle) {
                // Don't do anything until we have all candidates
                alertMng.log("Waiting for all candidates...");
                return;
            }
            if(config.sdpSent) {	// FIXME badly
                alertMng.log("Answer already sent, not sending it again");
                return;
            }
            config.sdpSent = true;
            // JSON.stringify doesn't work on some WebRTC objects anymore
            // See https://code.google.com/p/chromium/issues/detail?id=467366
            var jsep = {
                "type": answer.type,
                "sdp": answer.sdp
            };
            callbacks.onEvSuccess(jsep);
        }, callbacks.onEvError, mediaConstraints);
};
/**
 * @param {string} sdp
 * @param {EventCallback} cb
 */
WRTCSession.prototype.handleRemoteJsep = function(sdp, cb) {
    cb = cb || new EventCallback();
    var config = this.webrtcStuff;
    if( sdp ) {
        if(config.pc === null) {
            alertMng.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
            cb.onEvError("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
            return;
        }
        config.pc.setRemoteDescription(
            new RTCSessionDescription(sdp),
            function() {
                alertMng.log("Remote description accepted!");
                cb.onEvSuccess("Remote description accepted!");
            }, cb.onEvError);
    } else {
        cb.onEvError("Invalid JSEP");
    }
};

WRTCSession.prototype.cleanupWebrtc = function() {
    alertMng.log("Cleaning WebRTC stuff");
    var config = this.webrtcStuff;
    if(config !== null && config !== undefined) {
        // Cleanup
        config.remoteStream = null;
        if(config.volume.timer)
            clearInterval(config.volume.timer);
        config.volume.value = null;
        if(config.bitrate.timer)
            clearInterval(config.bitrate.timer);
        config.bitrate.timer = null;
        config.bitrate.bsnow = null;
        config.bitrate.bsbefore = null;
        config.bitrate.tsnow = null;
        config.bitrate.tsbefore = null;
        config.bitrate.value = null;
        try {
            // Try a MediaStream.stop() first
            if(!config.streamExternal && config.myStream !== null && config.myStream !== undefined) {
                alertMng.log("Stopping local stream");
                config.myStream.stop();
            }
        } catch(e) {
            // Do nothing if this fails
        }
        try {
            // Try a MediaStreamTrack.stop() for each track as well
            if(!config.streamExternal && config.myStream !== null && config.myStream !== undefined) {
                alertMng.log("Stopping local stream tracks");
                var tracks = config.myStream.getTracks();
                for(var i in tracks) {
                    var mst = tracks[i];
                    alertMng.log(mst);
                    if(mst !== null && mst !== undefined)
                        mst.stop();
                }
            }
        } catch(e) {
            // Do nothing if this fails
        }
        config.streamExternal = false;
        config.myStream = null;
        // Close PeerConnection
        try {
            config.pc.close();
        } catch(e) {
            // Do nothing
        }
        config.pc = null;
        config.mySdp = null;
        config.iceDone = false;
        config.sdpSent = false;
        config.dataChannel = null;
        config.dtmfSender = null;
    }
};

/**
 * @param {boolean} [onOff=true]
 * @returns {boolean}
 */
WRTCSession.prototype.enableMyAudio = function(onOff) {
    if( ! this.webrtcStuff.pc || ! this.webrtcStuff.myStream) {
        alertMng.warn("Invalid local MediaStream");
        return false;
    }
    if ( ! this.webrtcStuff.myStream.getAudioTracks() || this.webrtcStuff.myStream.getAudioTracks().length === 0) {
        alertMng.warn("No audio track");
        return false;
    }
    this.webrtcStuff.myStream.getAudioTracks()[0].enabled = (onOff !== false);
    return true;
};
/**
 * @param {boolean} [onOff=true]
 * @returns {boolean}
 */
WRTCSession.prototype.enableMyVideo = function(onOff) {
    if( ! this.webrtcStuff.pc || ! this.webrtcStuff.myStream) {
        alertMng.warn("Invalid local MediaStream");
        return false;
    }
    if ( ! this.webrtcStuff.myStream.getVideoTracks() || this.webrtcStuff.myStream.getVideoTracks().length === 0) {
        alertMng.warn("No video track");
        return false;
    }
    this.webrtcStuff.myStream.getVideoTracks()[0].enabled = (onOff !== false);
    return true;
};


/**
 * @interface
 * @description
 *  Can be treated as session's UI as well
 */
function AppAgentWebRTC() {
    /** @type {PluginHandler} */
    this.publisherPluginHandler = null;

    /** @type {function({boolean}, {PluginHandler} return {boolean})} */
    this.aawConsentDialog = function(){throw new Error('abstract function is being invoked')};
    this.aawOnLocalStream = function(){throw new Error('abstract function is being invoked')};
    this.aawOnRemoteStream = function(){throw new Error('abstract function is being invoked')};
    this.aawOnData = function(){throw new Error('abstract function is being invoked')};
    this.aawOnDataopen = function(){throw new Error('abstract function is being invoked')};
}
