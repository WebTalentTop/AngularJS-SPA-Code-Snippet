/**
 * Created by Akira Matsui
 */
'use strict';

/**
 * @class
 * @description
 *  Permanent (until been removed or replaced) EventsHandler
 * @constructor
 */
function TransportEventsHandler() {
    /**
     * @param {string} msg
     * @param {*} [doer]
     */
    this.onTEvError = function(msg, doer){alertMng.alert(msg)};

    /**
     * @param {string} msg
     * @param {*} [doer]
     */
    this.onTEvInit = function(msg, doer){alertMng.alert('Transport initialized' + (msg ? ': ' + msg : '.'));};

    /**
     * @param {string} msg
     * @param {*} [doer]
     */
    this.onTEvMessage = function(msg, doer){alertMng.alert('got: ' + msg)};

    /**
     * @param {string} msg
     * @param {*} [doer]
     */
    this.onTEvClose = function(msg, doer){alertMng.alert('Transport closed' + (msg ? ': ' + msg : '.'));};
}

/**
 * @interface
 * @constructor
 */
function Transport() {}

Transport.prototype.sendKeepAliveMsg = function(msgStr) {};

/**
 * @abstract
 * @param {TransportEventsHandler} transportEventsHandler
 */
Transport.prototype.initTransport = function(transportEventsHandler) {};

Transport.prototype.sendMsg = function(str) {};

