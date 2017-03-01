/**
 * Created by Akira Matsui
 */

'use strict';

var VideoRoomMng = {};

VideoRoomMng.vrSettings = {};
VideoRoomMng.vrSettings.archiveRoom = true;

VideoRoomMng.vrSettings.MAX_PUBLISHERS = 32;
VideoRoomMng.RECORDING_DIR = "/tmp/janus/videorooms/";

/** @type {PluginHandler} */
VideoRoomMng.videoRoomMngPluginHandler = null;
/**
 * @description active VideoRooms are the signal/event handlers for the signalling. JanusSignalManager eventually routes signals to them.
 * @type { {id: {VideoRoom}, id: {VideoRoom}, id: {VideoRoom}} }
 */
VideoRoomMng.activeRooms = {};
/**
 * @description
 *  existent on the server VideoRooms we can join to
 * @type { {id: {VideoRoom}, id: {VideoRoom}, id: {VideoRoom}} }
 */
VideoRoomMng.availableRooms = {};

/**
 * @returns {number}
 */
VideoRoomMng.getAspectRatio= function(){
    return 640/480;
};


/**
 * @param {string} msg
 * @param {JanusSignalSession} janusSignalSession
 * @param {PluginHandler} pluginHandler
 */
VideoRoomMng.onStartingPluginAttached = function (msg, janusSignalSession, pluginHandler) {

    //VideoRoomMng.videoRoomPluginHandlers[pluginHandler.handlerId] = pluginHandler;
    VideoRoomMng.videoRoomMngPluginHandler = pluginHandler;

    VideoRoomMng.refreshRoomList();

    alertMng.alert(msg);
    alertMng.alert("  -- This is a VideoRoomMng");

    document.querySelector('#mm_room_create').disabled = false;
    document.querySelector('#mm_rooms_list_btn').disabled = false;
};

/**
 * @param {Array.<VideoRoomInfo>} roomsInfo
 * @description
 *  [
 *      {"room":1234,"description":"Demo Room","max_publishers":6,"bitrate":128000,"fir_freq":10,"record":"false","num_participants":0},
 *      {"room":2836028788,"description":"Just a new room","max_publishers":1,"bitrate":0,"fir_freq":0,"record":"false","num_participants":1}
 *  ]
 */
VideoRoomMng.buildRoomsList = function(roomsInfo) {

    VideoRoomMng.availableRooms = {};

    /** @type {Element} */
    var rl_panel = document.querySelector('#mm_rooms_list');
    while(rl_panel.firstChild)
        rl_panel.removeChild(rl_panel.firstChild);

    /** @type {Element} */
    var rl_item = document.querySelector('#mm_room_item_template');
    for(var i = 0; i < roomsInfo.length; i++) {
        var vr = VideoRoom.construct(roomsInfo[i]);
        VideoRoomMng.availableRooms[vr.room] = vr;

        var rli = rl_item.cloneNode(true);
        rli.id = 'mm_room_list_item_' + vr.room;
        rli.title = vr.toString();
        rli.querySelector('.mm_room').textContent = '' + vr.room;
        rli.querySelector('.mm_room_description').textContent = vr.description;
        rli.querySelector('.mm_room_num_participants').textContent = '' + vr.num_participants;

        rli.querySelector('.mm_room_join_btn').id = 'mm_room_join_btn_' + vr.room;
        rli.querySelector('.mm_room_join_btn')['data-room'] = vr.room + '';
        rli.querySelector('.mm_room_join_btn').onclick = function(){
            VideoRoomMng.joinExistentVideoRoomAsPublisher(this['data-room']);
        };
        rli.querySelector('.mm_room_join_btn').textContent = VideoRoomMng.activeRooms[vr.room + ''] ? 'To' : 'Join';

        rl_panel.appendChild(rli);

        rli.classList.remove('hidden');
    }
};

VideoRoomMng.refreshRoomList = function(){
    VideoRoomMng.getRoomsList();
};
/**
 * @description
 *    Get available Rooms List
 */
VideoRoomMng.getRoomsList = function() {
    var createRequest = { "request": "list" };

    VideoRoomMng.videoRoomMngPluginHandler.sendMsgSignal(createRequest,
        function(answer) {
            //{"janus":"success","session_id":1045300337,"sender":4195168071,"transaction":"mHSl8VXO2gja","plugindata":{"plugin":"janus.plugin.videoroom","data":{"videoroom":"success","list":[{"room":1234,"description":"Demo Room","max_publishers":6,"bitrate":128000,"fir_freq":10,"record":"false","num_participants":0},{"room":2836028788,"description":"Just a new room","max_publishers":1,"bitrate":0,"fir_freq":0,"record":"false","num_participants":1}]}}}
            VideoRoomMng.buildRoomsList(answer.plugindata.data.list);
            return true;
        });
};
/**
 * @param {VideoRoom} vr
 * @returns {Element|Node}
 */
VideoRoomMng.switchToRoom = function(vr){
    /** @type {Element} */
    var roomsWorkingPanel = document.querySelector('#mm_rooms_working_panel');
    if(roomsWorkingPanel) {
        /** @type {NodeList} */
        var elms = roomsWorkingPanel.querySelectorAll('.room_panel');
        for (var i = 0; i < elms.length; i++)
            elms[i].classList.add('hidden');
    }

    return vr.getRoomPanel();
};
var resizedTimer;
/**
 * @param {number} room
 */
VideoRoomMng.joinExistentVideoRoomAsPublisher = function(room){

    if(VideoRoomMng.activeRooms[room + '']){ // already connected
        VideoRoomMng.switchToRoom(VideoRoomMng.activeRooms[room + '']);
        return;
    }

    var vrWnd = openWin('Application/Modules/Messenger/Controllers/VideoConference/videoRoom.html', '');
    vrWnd.onload = function() {
        /** @type {VideoRoom} */
        var vr = new vrWnd.VideoRoom(room);
        vr.videoRoomUI.wnd = vrWnd;
        vr.attachPluginAndJoinVideoRoom();
        vr.videoRoomUI.wnd.addEventListener('resize', onWndResized);
    };
};
/**
 * @param {Event} ev
 */
function onWndResized(ev){
    //vr.videoRoomUI.wnd.resizeTo(vr.videoRoomUI.wnd.outerHeight * vr.videoRoomUI.wnd.top.VideoRoomMng.getAspectRatio(), vr.videoRoomUI.wnd.outerHeight);
    if(resizedTimer)
        clearTimeout(resizedTimer);
    resizedTimer = setTimeout(function() {
        ev.target.removeEventListener('resize', onWndResized);
        ev.srcElement.removeEventListener('resize', onWndResized);
        var header = ev.target.outerHeight - ev.target.innerHeight;
        var border = ev.target.outerWidth - ev.target.innerWidth;
        var base = (ev.target.innerHeight + ev.target.innerWidth)/2;
        ev.target.resizeTo(base * VideoRoomMng.getAspectRatio() + border, base + header);

        /** @type {Element} */
        var lvp = ev.target.document.querySelector('.local_video_panel');
        var fd = getFDRootNode(lvp);
        if(fd.offsetLeft > fd.parentNode.clientWidth - getRootElementFontSize() * 2){
            fd.style.left = (fd.parentNode.clientWidth - getRootElementFontSize() * 2) + 'px';
            fd.style.right = (fd.parentNode.clientWidth - (fd.parentNode.clientWidth - getRootElementFontSize() * 2) - fd.offsetWidth) + 'px';
        }
        if(fd.offsetTop > fd.parentNode.clientHeight - getRootElementFontSize() * 2){
            fd.style.top = (fd.parentNode.clientHeight - getRootElementFontSize() * 2) + 'px';
            fd.style.bottom = (fd.parentNode.clientHeight - (fd.parentNode.clientHeight - getRootElementFontSize() * 2) - fd.offsetHeight) + 'px';
        }
        //fd.style.width = fd.clientWidth + 'px';
        //fd.style.heigh = fd.clientHeight + 'px';

        setTimeout(function() {ev.target.addEventListener('resize', onWndResized)}, 700);
    }, 500);
}
/**
 * @param {function(VideoRoom, string)} [vrLifeCycleListener = null]
 * @param {string} [room_desc = Room+genRandomID(4)]
 * @param {boolean} [record_room = false]
 * @param {number} [max_publishers = VideoRoomMng.vrSettings.MAX_PUBLISHERS]
 */
VideoRoomMng.connectServerAndCreateVideoRoom = function(vrLifeCycleListener, room_desc, record_room, max_publishers) {
    room_desc = room_desc || ('Room ' + genRandomID(4));
    record_room = record_room || VideoRoomMng.vrSettings.archiveRoom;
    max_publishers = max_publishers || VideoRoomMng.vrSettings.MAX_PUBLISHERS;


    /** @type {EventCallback} */
    var eventCallback = new EventCallback();
    eventCallback.onEvSuccess = function(msg, signallingSession){
        alertMng.alert("Session created: " + signallingSession.sessionId);
        VideoRoomMng.createNewVideoRoomOnServer(vrLifeCycleListener, room_desc, record_room, max_publishers);
    };
    eventCallback.onEvError = function(errMsg, doer){
        alertMng.alert('VideoRoom error: ' + errMsg)
    };

    aCtx().getJanusMng().connectJanusServer(eventCallback);
};
/**
 * @param {function(VideoRoom, string)} vrLifeCycleListener
 * @param {string} roomId
 */
VideoRoomMng.connectServerAndJoinVideoRoom = function(vrLifeCycleListener, roomId) {

    /** @type {EventCallback} */
    var eventCallback = new EventCallback();
    eventCallback.onEvSuccess = function(msg, signallingSession){
        alertMng.alert("Session created: " + signallingSession.sessionId);
        VideoRoomMng.joinExistentVideoRoomAsPublisher(roomId);
    };
    eventCallback.onEvError = function(errMsg, doer){
        alertMng.alert('VideoRoom error: ' + errMsg)
    };

    aCtx().getJanusMng().connectJanusServer(eventCallback);
};
/**
 * @param {VideoRoom} vr
 * @param {string} eventType
 */
function vrLifeCycleListenerStd(vr, eventType){
    switch(eventType){
        case 'listener added':
            //alert('VideoRoom listener added. Id = ' + vr.room);
            break;
        case 'created':
            //alert('VideoRoom created. Id = ' + vr.room);
            break;
        case 'joined':
            //alert('Joined VideoRoom. Id = ' + vr.room);
            break;
        default:
            //alert('VideoRoom lifeCycle event. Id = ' + vr.room + ' EventType: ' + eventType);
            break;
    }
}
/**
 * @description
 *    Create new Video Room
 * @param {function(VideoRoom, string)} vrLifeCycleListener
 * @param {string} room_desc
 * @param {boolean} [record_room = false]
 * @param {number} [max_publishers = VideoRoomMng.vrSettings.MAX_PUBLISHERS]
 */
VideoRoomMng.createNewVideoRoomOnServer = function(vrLifeCycleListener, room_desc, record_room, max_publishers) {
    var vrWnd = openWin('Application/Modules/Messenger/Controllers/VideoConference/videoRoom.html', room_desc);
    vrWnd.onload = function() {
        /** @type {VideoRoom} */
        var vr = new vrWnd.VideoRoom();
        vr.videoRoomUI.wnd = vrWnd;
        vr.addLifeCycleListener(vrLifeCycleListener);
        vr.description = room_desc;
        vr.max_publishers = max_publishers || VideoRoomMng.vrSettings.MAX_PUBLISHERS;
        vr.record = (record_room === true);

        vr.attachPluginAndCreateThisNewVideoRoomOnServer();
        vr.videoRoomUI.wnd.addEventListener('resize', onWndResized);
    };
};

VideoRoomMng.exitAllRooms = function(){
    for(var rid in VideoRoomMng.activeRooms){
        /** @type {VideoRoom} */
        var r = VideoRoomMng.activeRooms[rid];
        if(r && r.exitRoom) {
            r.exitRoom();
        }
    }
};

//{"janus":"event","session_id":3874815055,"sender":2339613393,"transaction":"YmSNX2mcaBd7",
//    "plugindata":{"plugin":"janus.plugin.videoroom",
//    "data":{"videoroom":"event","error_code":429,"error":"Missing element (feed)"}}}"
