/**
 * Created by Akira Matsui
 */

'use strict';
(function(global) {
        global.realineMessenger.factory('videoRoomService', function(){
                return aCtx().getVideoRoomMng();
            });

        //global.app.extendAppModules(['videoRoomModule']);
    }
)(window);
