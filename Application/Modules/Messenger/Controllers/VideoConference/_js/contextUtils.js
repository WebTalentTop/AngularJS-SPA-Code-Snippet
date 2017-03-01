/**
 * Created by Akira Matsui
 */
function aCtx(){
    var w = window;
    while( w ){
        if( w.videoRoomAppContext )
            return w.videoRoomAppContext;
        else
            w = w.opener;
    }
    // if the client is working in an iFrame then wsClientContext must be in the window.top
    return window.top.videoRoomAppContext;
}
