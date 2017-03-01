/**
 * Created by Akira Matsui
 */
'use strict';

var alertMng = {
    tracingAreaElm: null,

    trace: function(msg, style_class_name){
        if( ! this.tracingAreaElm )
            this.tracingAreaElm = document.querySelector('#tracing_area');
        if( this.tracingAreaElm ) {
            var d = document.createElement('div');
            d.classList.add('tracing_msg');
            if(style_class_name)
                d.classList.add(style_class_name);
            d.textContent = msg;
            this.tracingAreaElm.appendChild(d);
            d.scrollIntoView();
            //setTimeout(function() {try{d.scrollIntoView();}catch(ex){}}, 700);
            return true;
        } else {
            console.log(msg);
            //return false;
            return true;
        }
    },

    log: function(msg){this.trace(msg);},

    debug: function(msg){this.trace(msg);},

    alert: function(msg){
        if( ! this.trace(msg) )
            alert(msg);
    },

    error: function(msg){
        this.trace('ERROR: ' + msg, 'tracing_msg_error');
        //alert('Error: ' + msg);
    },

    warn: function(msg){
        this.trace('WARNING: ' + msg, 'tracing_msg_warning');
    }
};

function bind2this(object){
    /////// bind to this all the functions of the object... ///////////
    for (var f in object) {
        if (typeof object[f] === 'function')// && this.hasOwnProperty(f))
            object[f] = object[f].bind(object);
    }
}

/**
 * @description
 *  Helper method to create random string identifiers
 * @param {number} len
 * @returns {string}
 */
function genRandomString(len) {
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * genRandomString.charSet.length);
        randomString += genRandomString.charSet.substring(randomPoz, randomPoz+1);
    }
    return randomString;
}
/** @type {string} */
genRandomString.charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * @description
 *  Helper method to create random numeric ID
 * @param {number} strictness_level
 * @returns {number}
 */
function genRandomID(strictness_level) {
    var randomString = (new Date().getTime() % (60*60*24*7)) + ''; // number of microsecs starting this week
    for (var i = 0; i < strictness_level; i++) {
        var randomPoz = Math.floor(Math.random() * genRandomString.charSet.length);
        randomString += genRandomString.charSet.substring(randomPoz, randomPoz+1);
    }
    return parseInt(randomString);
}
/** @type {string} */
genRandomID.charSet = '0123456789';


/**
 * @class
 * @description
 *  Once time callback ( for one call/transaction/operation only )
 * @constructor
 */
function EventCallback() {
    /**
     * @param {string} msg
     * @param {*} [handler]
     * @param {*} [object]
     */
    this.onEvSuccess = function(msg, handler, object){alertMng.alert('Success: ' + msg);};
    /**
     * @param {string} msg
     * @param {*} [handler]
     * @param {*} [object]
     */
    this.onEvError = function(msg, handler, object){alertMng.alert('Error: ' + msg);};
}

var noOp = function() {};
/**
 * @param {} object
 * @param {boolean} [onlyOwnProperties]
 * @returns {string}
 */
function objToString(object, onlyOwnProperties){
    var s = '';
    for(var f in object){
        if(typeof object[f] == 'function')
            continue;
        if(onlyOwnProperties !== true || object.hasOwnProperty(f))
            s += ', ' + f + ': ' + object[f];
    }
    return (s.length > 0 ? s.substr(1) : '');
}
/**
 * @param href
 * @param wname
 * @param width
 * @param height
 * @returns {Window}
 */
function openWin(href, wname, height, width) {
    if(!height)
        height = screen.height * 0.75;
    if(!width)
        width = height * aCtx().getVideoRoomMng().getAspectRatio();
    var left = (screen.width - width)/2;
    if(left < 0)
        left = 0;
    var top = (screen.height - height)/2 - getRootElementFontSize();
    if(top < 0 )
        top = 0;
    /** @type {Window} */
    return window.open(href, wname, 'titlebar=no,close=no,menubar=no,location=no,resizable=no,scrollbars=yes,status=no,width=' + width + ',height=' + height + ',top=' + top + ',left=' + left);
}
/**
 * @description
 *  Returns a size of the computed font-size (em) in px for the root <html> element
 * @returns {Number}
 */
function getRootElementFontSize() {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/**
 * @param {Element} elm
 * @returns {number}
 */
function getChildsWidthAmount(elm){
    var wa = 0;
    for(var i = elm.childNodes.length - 1; i > 0; i--)
        wa += elm.childNodes.item(i).clientWidth;
    return wa;
}
