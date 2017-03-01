/**
 * Created by Akira Matsui
 */

'use strict';

/**
 * @implements {Transport}
 * @constructor
 */
function LPTransport() {
    this.connected = null;
    this.sessionId = null; // TODO: it should belong to SignalLayer
}

LPTransport.prototype.initTransport = function () {
    $.ajax({
        type: 'POST',
        url: server,
        cache: false,
        contentType: "application/json",
        data: JSON.stringify(request),
        success: function (json) {
            Janus.debug(json);
            if (json["janus"] !== "success") {
                Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
                callbacks.error(json["error"].reason);
                return;
            }
            this.connected = true;
            this.sessionId = json.data["id"];
            Janus.log("Created session: " + sessionId);
            Janus.sessions[sessionId] = that;
            eventHandler();
            callbacks.success();
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            Janus.error(textStatus + ": " + errorThrown);	// FIXME
            if ($.isArray(servers)) {
                serversIndex++;
                if (serversIndex == servers.length) {
                    // We tried all the servers the user gave us and they all failed
                    callbacks.error("Error connecting to any of the provided Janus servers: Is the gateway down?");
                    return;
                }
                // Let's try the next server
                server = null;
                setTimeout(function () {
                    createSession(callbacks);
                }, 200);
                return;
            }
            if (errorThrown === "")
                callbacks.error(textStatus + ": Is the gateway down?");
            else
                callbacks.error(textStatus + ": " + errorThrown);
        },
        dataType: "json"
    });
};

LPTransport.prototype.sendKeepAliveMsg = function(msgStr) {
    // do nothing - not necessary
};
