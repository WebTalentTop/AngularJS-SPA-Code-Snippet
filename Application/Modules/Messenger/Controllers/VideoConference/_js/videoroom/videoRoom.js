/**
 * Created by Akira Matsui
 */
'use strict';

/**
 * @typedef {{room: number, description: string, max_publishers: number, bitrate: number, fir_freq: number, record: boolean, num_participants: number}} VideoRoomInfo
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @class
 *
 * @description
 *  "room":1234,"description":"Demo Room","max_publishers":6,"bitrate":128000,"fir_freq":10,"record":"false","num_participants":0
 *
 * @constructor
 * @param {number} [roomId]
 */
function VideoRoom(roomId){
    /** @type {number} */
    this.room = roomId; // 1234
    /** @type {string} */
    this.description = null; // "Just a Room"
    /** @type {number} */
    this.max_publishers = null; // 6
    /** @type {number} */
    this.bitrate = null; // 128000
    /** @type {number} */
    this.fir_freq = null; // 10
    /** @type {boolean} */
    this.record = null; // false
    /** @type {number} */
    this.num_participants = null; // 0

    /** @description publisher/management PluginHandler - the main for the whole VideoRoom
     * @type {PluginHandlerVideoRoom} */
    this.publisherPluginHandler = null;

    /** @type {{Id: {PluginHandlerVideoRoomFeed}, Id: {PluginHandlerVideoRoomFeed}, Id: {PluginHandlerVideoRoomFeed}}} */
    this.remoteFeedsPluginHandlers = {};
    /** @type {Array.<function(VideoRoom, string)>} */
    this.vrLifeCycleListeners = [];

    /** @type {VideoRoomUI} */
    this.videoRoomUI = new VideoRoomUI();
}
/**
 * @param {VideoRoomInfo} roomInfo
 * @returns {VideoRoom}
 */
VideoRoom.construct = function(roomInfo){
    var vr = new VideoRoom();
    vr.setRoomInfo(roomInfo);
    return vr;
};
/**
 * @param {VideoRoomInfo} roomInfo
 */
VideoRoom.prototype.setRoomInfo = function(roomInfo){
    this.room = roomInfo.room; //1234
    this.description = roomInfo.description; // "Demo Room"
    this.max_publishers = roomInfo.max_publishers; // 6
    this.bitrate = roomInfo.bitrate; // 128000
    this.fir_freq = roomInfo.fir_freq; // 10
    this.record = roomInfo.record; // false
    this.num_participants = roomInfo.num_participants; // 0
};
/**
 * @param {VideoRoomInfo} roomInfo
 */
VideoRoom.prototype.applyRoomInfo = function(roomInfo){
    this.setRoomInfo(roomInfo);

    this.getRoomPanel().querySelector('#participants_amount').textContent = '' + this.num_participants;
};

/**
 * @param {function(VideoRoom, string)} roomInfo
 */
VideoRoom.prototype.addLifeCycleListener = function(vrLifeCycleListener){
    if( ! vrLifeCycleListener)
        return;

    this.vrLifeCycleListeners.push(vrLifeCycleListener);

    vrLifeCycleListener(this, 'listener added');
};
/**
 * @description
 *    Create new Video Room
 */
VideoRoom.prototype.attachPluginAndCreateThisNewVideoRoomOnServer = function() {
    this.publisherPluginHandler = new PluginHandlerVideoRoom(aCtx().getJanusMng().getOptimalSignalSession(), this);

    var ecb = new EventCallback();
    ecb.onEvSuccess = function(msg, janusSignalSession, pluginHandler){
        // The plugin has been attached, create a room
        this.createThisRoomOnServer();
    }.bind(this);

    this.publisherPluginHandler.attachPlugin(ecb);
};

VideoRoom.prototype.createThisRoomOnServer = function() {

    //description = Demo Room
    //secret = adminpwd
    //publishers = 6
    //bitrate = 128000
    //fir_freq = 10
    //record = false
    //rec_dir = /tmp/janus-videoroom

    var createRequest = {
        "request": "create",
        "description": this.description,
        "bitrate": 0,
        "record": this.record,
        "rec_dir": aCtx().getVideoRoomMng().RECORDING_DIR + this.publisherPluginHandler.handlerId,
        "publishers": this.max_publishers
    };
    this.publisherPluginHandler.sendMsgSignal(createRequest, this.ehOnNewVideoRoomCreated.bind(this));
};
/**
 * @param signal
 * @description
 * "{"janus":"success","session_id":3743772465,"sender":2802597783,"transaction":"SzwCf00EJlBO",
 *      "plugindata":{"plugin":"janus.plugin.videoroom",
 *          "data":{"videoroom":"created","room":2200241359}
 *      }
 *  }"
 */
VideoRoom.prototype.ehOnNewVideoRoomCreated = function(signal) {
    var event = JSIG.getPluginData(signal, "videoroom");
    alertMng.debug("Event: " + event);
    if(event !== 'created') {
        alertError('Error creating videoRoom');
        return false; // let's try to process in the 'standard' way ( on the lower level )
    }

    this.room = JSIG.getPluginData(signal, "room");

    aCtx().getVideoRoomMng().activeRooms[this.room + ''] = this;

    alertMng.alert("Room created: " + this.room);

    for(var i = 0; i < this.vrLifeCycleListeners.length; i++){
        try{this.vrLifeCycleListeners[i](this, 'created');}catch(e){}
    }

    // The room has been created, join it
    this.joinAsPublisher();

    return true;
};

/**
 * @description
 *    join VideoRoom as Publisher
 * @param {number} [feedId] Need for ptype = 'listener'
 */
VideoRoom.prototype.joinAsPublisher = function() {
    this.publisherPluginHandler.joinRoom();
};
VideoRoom.prototype.attachPluginAndJoinVideoRoom = function(){
    this.publisherPluginHandler = new PluginHandlerVideoRoom(aCtx().getJanusMng().getOptimalSignalSession(), this);

    var ecb = new EventCallback();

    ecb.onEvSuccess = function(msg, janusSignalSession, pluginHandler){
        /** register as active(connected) room - it can be done multiple(but w/o negative/positive effects all times after the first time) time since several pluginHandlers are required to process one VideoRoom */
        aCtx().getVideoRoomMng().activeRooms[this.room + ''] = this;
        // The plugin has been attached, join room
        this.publisherPluginHandler.joinRoom();
    }.bind(this);
    this.publisherPluginHandler.attachPlugin(ecb);
};
// Publish own stream
VideoRoom.prototype.publishOwnFeed = function() {
    this.publisherPluginHandler.publishMyself();
};

VideoRoom.prototype.unpublishOwnFeed = function() {
    this.publisherPluginHandler.unpublishMyself();
};

VideoRoom.prototype.processSignal = function(signal) {
    var room = JSIG.getPluginData(signal, "room");
    if(room != this.room) {
        alertMng.error('Wrong roomID: "' + room + '" <> "' + this.room + '"');
        return;
    }
    var myid = JSIG.getPluginData(signal, "id");

    var event = JSIG.getPluginData(signal, "videoroom");
    switch(event) {
        case "joined":
            alertMng.alert("Successfully joined room " + room + " with ID " + myid);
            for(var i = 0; i < this.vrLifeCycleListeners.length; i++){
                try{this.vrLifeCycleListeners[i](this, 'joined');}catch(e){}
            }
            // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
            this.publishOwnFeed();
            // Any new feed to attach to?
            var publishers_list = JSIG.getPluginData(signal, "publishers");
            if (publishers_list) {
                alertMng.debug("Got a list of available publishers/feeds:");
                alertMng.debug(publishers_list);
                for (var i1 = 0; i1 < publishers_list.length; i1++) {
                    var id = publishers_list[i1]["id"];
                    var display = publishers_list[i1]["display"];
                    alertMng.debug("  >> [" + id + "] " + display);
                    this.newRemoteFeed(id, display)
                }
            }
            break;
        case "event":
            // Any new feed to attach to?
            var publishers_list = JSIG.getPluginData(signal, "publishers");
            if (publishers_list) {
                alertMng.debug("Got a list of available publishers/feeds:");
                alertMng.debug(publishers_list);
                for (var i2 = 0; i2 < publishers_list.length; i2++) {
                    var id = publishers_list[i2]["id"];
                    var display = publishers_list[i2]["display"];
                    alertMng.debug("  >> [" + id + "] " + display);
                    this.newRemoteFeed(id, display)
                }
                return;
            }
            ///////////////////////////////////////////////////////////////////
            // Myself unpublished
            //{"janus":"event","session_id":1397870289,"sender":3217216773,"transaction":"f8Af6xPwXjZl",
            //    "plugindata":{"plugin":"janus.plugin.videoroom",
            //        "data":{"videoroom":"event","room":1234,"unpublished":"ok"}}}
            var unpublished = JSIG.getPluginData(signal, "unpublished");
            if(unpublished === 'ok') { //Myself unpublished
                /** @type {PluginHandlerVideoRoom} */
                var ph = this.publisherPluginHandler.janusSignalSession.pluginHandlers[signal['sender']];
                ph.onMyselfUnpublished();
                return;
            }
            // remote feed has unpublished
            //{"janus":"event","session_id":3284836034,"sender":1566833887,
            //    "plugindata":{"plugin":"janus.plugin.videoroom",
            //        "data":{"videoroom":"event","room":1234,"unpublished":2897170240}}}
            //{"janus":"event","session_id":4232377157,"sender":1238883205,
            //    "plugindata":{"plugin":"janus.plugin.videoroom",
            //        "data":{"videoroom":"event","room":1234,"leaving":1008275818}}}
            var leaving = JSIG.getPluginData(signal, "leaving");
            var remoteFeedID = leaving || unpublished;
            if (remoteFeedID) {
                alertMng.alert("Publisher left: " + remoteFeedID);
                /** @type {PluginHandlerVideoRoomFeed} */
                var remoteFeed = null;
                for (var f in this.remoteFeedsPluginHandlers) {
                        if(this.remoteFeedsPluginHandlers[f].feed == remoteFeedID) {
                            remoteFeed = this.remoteFeedsPluginHandlers[f];
                            break;
                        }
                }
                if (remoteFeed) {
                    alertMng.debug("Feed " + remoteFeed.feed + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                    var remoteVideoPanel = this.videoRoomUI.wnd.document.querySelector('#remote_video_panel_' + remoteFeed.feed);
                    if(remoteVideoPanel) // kapel
                        remoteVideoPanel.parentNode.removeChild(remoteVideoPanel);
                    if(leaving) {
                        remoteFeed.destroyHandler();
                        delete this.remoteFeedsPluginHandlers[remoteFeed.feed];
                    }
                }
                this.publisherPluginHandler.getRoomInfo();
                return;
            }
            ////////////////////
            var feedStarted = JSIG.getPluginData(signal, "started");
            if (feedStarted) {
                alertMng.debug('Feed started: ' + feedStarted);
                return;
            }
            ///////////////////
            var signalError = JSIG.getPluginData(signal, "error");
            if (signalError) {
                alertMng.error(signalError);
                return;
            }
            alertMng.error('Error: unknown signal\'s event - ' + JSON.stringify(signal));
            break;
        default:
            alertMng.error('Error: unknown signal - ' + JSON.stringify(signal));
            return;
    }
    return;
};

/**
 * @param msg
 * @param janusSignalSession
 * @param {PluginHandlerVideoRoomFeed} pluginHandler
 * @param feedId
 * @param displayName
 */
VideoRoom.prototype.onRemoteFeedPluginAttached = function (msg, janusSignalSession, pluginHandler, feedId, displayName) {
    this.remoteFeedsPluginHandlers[pluginHandler.handlerId] = pluginHandler;

    pluginHandler.joinRoom(feedId);

    alertMng.alert(msg);
    alertMng.alert("PluginHandler has been added for the remote feed.");
};
VideoRoom.prototype.newRemoteFeed = function(feedId, displayName){
    /** @type {EventCallback} */
    var ecb = new EventCallback();
    ecb.onEvSuccess = function(msg, janusSignalSession, pluginHandler){
        this.onRemoteFeedPluginAttached(msg, janusSignalSession, pluginHandler, feedId, displayName);
    }.bind(this);

    /** @type {PluginHandlerVideoRoomFeed} */
    var phvr = new PluginHandlerVideoRoomFeed(aCtx().getJanusMng().getOptimalSignalSession(), this);
    phvr.feed = feedId;
    phvr.rfdisplay = displayName;

    phvr.attachPlugin(ecb);
};

// destroy a session
VideoRoom.prototype.exitRoom = function(callbacks, syncRequest) {
    alertMng.log("Exiting room: " + (this.description || ('' + this.room)) + " (roomId=" + this.room + ")");
    callbacks = callbacks || new EventCallback();

    // Destroy all remoteFeeds handlers first
    for(var ph in this.remoteFeedsPluginHandlers) {
        /** @type {PluginHandler} */
        var phv = this.remoteFeedsPluginHandlers[ph];
        if(phv && phv.destroyHandler) {
            phv.destroyHandler(callbacks, syncRequest);
        }
    }
    this.publisherPluginHandler.destroyHandler(callbacks, syncRequest);

    var rp = this.getRoomPanel();
    rp.parentNode.removeChild(rp);
    if(this.videoRoomUI.wnd)
        this.videoRoomUI.wnd.close();

    delete aCtx().getVideoRoomMng().activeRooms[this.room + ''];

    aCtx().getVideoRoomMng().refreshRoomList();
};

/**
 * @returns {Element|Node}
 */
VideoRoom.prototype.getRoomPanel = function(){
//////////// create room panel ///////////////
    /** @type {Element} */
    //this.roomPanel = roomsWorkingPanel.querySelector('#room_panel_' + this.room);
    this.roomPanel = this.videoRoomUI.wnd.document.querySelector('#room_panel_' + this.room);
    if (!this.roomPanel) {
        //this.roomPanel = document.querySelector('#room_panel_template').cloneNode(true);
        this.roomPanel = loadHtmlPage('videoRoomTemplates.html', '#room_panel_template');
        this.roomPanel = this.videoRoomUI.wnd.document.adoptNode(this.roomPanel);
        this.roomPanel.id = 'room_panel_' + this.room;
        //this.roomPanel = FloatDivMng.showFD(null,'room_panel_' + this.room, 'videoRoomTemplates.html', '#room_panel_template');
        this.roomPanel.querySelector('#roomName').textContent = this.description || ('' + this.room);
        this.roomPanel.querySelector('#roomName').title = 'roomId: ' + this.room;
        this.roomPanel.querySelector('#exit_room_btn').onclick = function(){this.exitRoom();}.bind(this);
        //roomsWorkingPanel.appendChild(this.roomPanel);
        this.videoRoomUI.wnd.document.body.appendChild(this.roomPanel);
    }
    this.roomPanel.classList.remove('hidden');
    return this.roomPanel;
};

VideoRoom.prototype.toString = function(){
    return objToString(this);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @class
 * @constructor
 */
function VideoRoomUI() {
    /** @type {Window} */
    this.wnd = null;
    /** @type {Element} */
    this.roomPanel = null;
    /** @type {Element} */
    this.localVideoPanel = null;

    //bind2this(this);
}

function setSourceToMainVideo(elm){
    reattachMediaStream(document.querySelector('.mainvideo'), elm);
}