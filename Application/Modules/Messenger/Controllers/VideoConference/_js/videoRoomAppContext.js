/**
 * Created by Akira Matsui
 */


function VideoRoomAppContext(){
    this.getJanusMng = function(){return JanusMng;};
    this.getVideoRoomMng = function(){return VideoRoomMng};
    /** @type {NotificationMng} */
    this.getNotificationMng = function(){return new NotificationMng();};

    this.mUI = new MessengerUIMng();
}
/**
 * @class MessengerUI Manager
 */
function MessengerUIMng() {
    /** @type Window */
    this.mWnd = window;
}
window.videoRoomAppContext = new VideoRoomAppContext();
