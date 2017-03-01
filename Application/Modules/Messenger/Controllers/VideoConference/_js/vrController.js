/**
 * Created by Akira Matsui
 */

'use strict';
(function(global) {
        global.realineMessenger
            .controller('VideoRoomController',
                ['$scope', '$log', 'messenger', 'messengerHub', 'MessageModel', 'CoreEnums', 'MessengerEnums', 'utils',
            function($scope, $log, messenger, messengerHub, MessageModel, CoreEnums, MessengerEnums, utils){
                var vrCtrl = this;

                /** @type {VideoRoom} */
                vrCtrl.videoRoom = null;

                ///// functionality /////////////////
                vrCtrl.createNewVideoRoom = function(){
                    aCtx().getVideoRoomMng().connectServerAndCreateVideoRoom(vrCtrl.vrLifeCycleListener);
                };
                /** @returns {boolean} */
                vrCtrl.canCreateNewVideoRoom = function(){
                    return true;
                };
                /** @param {number} roomId  */
                vrCtrl.joinVideoRoom = function(roomId){
                    aCtx().getVideoRoomMng().connectServerAndJoinVideoRoom(vrCtrl.vrLifeCycleListener, roomId);
                };
                /** @returns {boolean} */
                vrCtrl.canJoinVideoRoom = function(){
                    return true;
                };
                vrCtrl.exitVideoRoom = function(){
                    vrCtrl.videoRoom.exitRoom();
                };

                /**
                 * @param {VideoRoom} vr
                 * @param {string} eventType
                 */
                vrCtrl.vrLifeCycleListener = function (vr, eventType){
                    switch(eventType){
                        case 'created':
                            vrCtrl.videoRoom = vr;
                            vrCtrl.sendVideoRoomInvitation();
                            break;
                        case 'joined':
                            break;
                        case 'listener added':
                        default:
                            //alert('VideoRoom lifeCycle event. Id = ' + vr.room + ' EventType: ' + eventType);
                            break;
                    }
                };


                /////////////// UI //////////////////////////
                this.isMenuVisible = false;

                vrCtrl.onShowMenu = function () {
                    this.isMenuVisible = true;
                };
                vrCtrl.onHideMenu = function () {
                    this.isMenuVisible = false;
                };

                ///////////////////// signalling ////////////////////////////
                this.scope = $scope;
                this.scope.conversation.videoRoomCtrl = this;
                this.messenger = messenger;
                this.messengerHub = messengerHub;


                vrCtrl.sendVideoRoomInvitation = function () {

                    return messenger.getCurrentProfile().then(function (result) {
                        return this._sendVideoRoomInvitation(result)
                    }.bind(this), function (error) {
                        $log.debug('Failed to get global user during videoChat creation.');
                    })
                        .finally(function () {}
                            .bind(this));
                }.bind(this);

                vrCtrl._sendVideoRoomInvitation = function (currentProfile) {
                    this.messengerHub.startVideoChat({
                        ConversationId: this.scope.conversation.getId(),
                        VideoRoomId: '' + this.videoRoom.room,
                        Subject: currentProfile.getName()}). // FixMe: hack... ask for changing of the signal format ( add an info about the sender )
                    then(function () {$log.debug('VideoChat started.')}.bind(this),
                            function (error) {$log.debug('Failed to start videoChat. ' + error);}
                    );
                }.bind(this);

            }]
            );
    }
)(window);
