/**
 * Created by Akira Matsui
 */

var MessengerUIMng = {
    isUIActivated: function(){return true;}
};

/**
 * @param {string} msgTitle
 * @param {(string|Array<string>)} errMsgs
 * @param {Event} [event]
 */
function logMessage(msgTitle, errMsgs, event) {
    console.log('-- ' + (msgTitle ? msgTitle : '') + ': ' + new Date() + ' -------------------');
    if(event){
        console.log('-- ' + 'event: ' + event.toString());
    }
    if (errMsgs instanceof Array) {
        for (var i = 0; i < errMsgs.length; i++)
            console.log(errMsgs[i]);
    } else {
        console.log(errMsgs);
    }
    console.log(' -------------------');
    return;
}

/**
 * @param {(string|Array<string>)} errMsgs
 * @param {Event} [event]
 */
var alertError = function(errMsgs, event) {
    if( ! MessengerUIMng.isUIActivated()){
        logMessage('error', errMsgs, event);
        return;
    }

    if(event){
        event.preventDefault();
        event.stopPropagation();
    }
    var fd = FloatDivMng.createFd('#fd_popup_template');

    fd.querySelector('.fd_header').classList.add('alert_error_header');
    fd.querySelector('.fd_body').classList.add('alert_error_body');
    fd.querySelector('.fd_footer').classList.add('alert_error_footer');
    fd.querySelector('.fd_icon').src = FloatDivMng.pathPrefix + '_img/common/warning.png';

    var d = fd.querySelector('.fp_popup_msg');
    if(errMsgs instanceof Array){
        errMsgs.forEach(function(str) {
            var s = aCtx().mUI.mWnd.document.createElement('span');
            s.textContent = str;
            s.classList.add('block');
            d.appendChild(s);
        });
        fd.style.height = (parseInt(aCtx().mUI.mWnd.getComputedStyle(fd).height) + (getRootElementFontSize() * (errMsgs.length - 1))) + 'px';
    } else {
        d.textContent = errMsgs;
    }
    FloatDivMng.setFDPosition(fd, event);
    stickToTop(fd);
};
/**
 * @param {(Array|string)} msgs
 * @param {Event} [event]
 */
var alertInfo = function(msgs, event) {
    if( ! MessengerUIMng.isUIActivated()){
        logMessage('info', msgs, event);
        return;
    }
    if(event){
        event.preventDefault();
        event.stopPropagation();
    }
    var fd = FloatDivMng.createFd('#fd_popup_template');

    fd.querySelector('.fd_header').classList.add('alert_info_header');
    fd.querySelector('.fd_body').classList.add('alert_info_body');
    fd.querySelector('.fd_footer').classList.add('alert_info_footer');
    fd.querySelector('.fd_icon').src = FloatDivMng.pathPrefix + '_img/common/info.png';

    //fd.querySelector('.fp_popup_msg').textContent = msg;

    var d = fd.querySelector('.fp_popup_msg');
    if(msgs instanceof Array){
        msgs.forEach(function(str) {
            var s = aCtx().mUI.mWnd.document.createElement('span');
            s.textContent = str;
            s.classList.add('block');
            d.appendChild(s);
        });
        fd.style.height = (parseInt(aCtx().mUI.mWnd.getComputedStyle(fd).height) + (getRootElementFontSize() * (msgs.length - 1))) + 'px';
    } else {
        d.textContent = msgs;
    }

    FloatDivMng.setFDPosition(fd, event);
    stickToTop(fd);
};

/**
 * @param {(Array|string)} msgs
 * @param {Event} [event]
 */
var showInfo = function(msgs, event) {
    if( ! MessengerUIMng.isUIActivated()){
        logMessage('info', msgs, event);
        return;
    }
    if(event){
        event.preventDefault();
        event.stopPropagation();
    }
    //var fd = FloatDivMng.createFd('#fd_popup_template');
    var fd = FloatDivMng.createFd('#fd_frame_template');

    var d = fd.querySelector('.fd_body');
    d.classList.add('show_info_body');
    if((msgs instanceof String) || (typeof msgs === 'string'))
        msgs = msgs.split('\n')
    if(msgs instanceof Array){
        msgs.forEach(function(str) {
            var s = aCtx().mUI.mWnd.document.createElement('span');
            s.textContent = str;
            s.classList.add('block');
            d.appendChild(s);
        });
        fd.style.height = (parseInt(aCtx().mUI.mWnd.getComputedStyle(fd).height) + (getRootElementFontSize() * (msgs.length - 1))) + 'px';
    } else {
        d.textContent = msgs;
    }

    FloatDivMng.setFDPosition(fd, event);
    stickToTop(fd);
};

var Option = function(title, action, img, tooltip, isDefault) {
    this.title = title;
    this.action = action;
    this.img = img;
    this.tooltip = tooltip;
    this.isDefault = (isDefault === true) ;
};
/**
 * @param {(string|Array<string>)} msgs
 * @param {Option[]} options
 * @param {Event} [event]
 * @param {string} [title]
 * @param {function} [ignoreFunction]
 * @returns {Element}
 */
var optionDlg = function(msgs, options, event, title, ignoreFunction) {
    if(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    var fd = FloatDivMng.createFd('#fd_frame_template');

    fd.classList.add('option_dlg');
    fd.querySelector('.fd_header').classList.add('alert_info_header');
    fd.querySelector('.fd_body').classList.add('alert_info_body');
    fd.querySelector('.fd_footer').classList.add('alert_info_footer');
    //fd.querySelector('.fd_leftbottom_corner').onmousedown = null;
    //fd.querySelector('.fd_rightbottom_corner').onmousedown = null;
    fd.querySelector('.fd_icon').src = FloatDivMng.pathPrefix + '_img/common/questionMark.png';
    fd.querySelector('.fd_title').textContent = title || 'Choose an option';

    var bd = fd.querySelector('.fd_body');
    var d = aCtx().mUI.mWnd.document.createElement('div');
    if(msgs instanceof Array){
        msgs.forEach(function(str) {
            var s = aCtx().mUI.mWnd.document.createElement('span');
            s.textContent = str;
            s.classList.add('block');
            d.appendChild(s);
        });
        fd.style.height = (parseInt(aCtx().mUI.mWnd.getComputedStyle(fd).height) + (getRootElementFontSize() * (msgs.length - 1))) + 'px';
    } else {
        d.textContent = msgs;
    }
    bd.appendChild(d);
    var f = null;
    options.forEach(function(opt) {
        var b = aCtx().mUI.mWnd.document.createElement('button');
        //b.classList.add('option_button');
        b.textContent = opt.title;
        b.onclick = opt.action;
        if(opt.img){
            var img = aCtx().mUI.mWnd.document.createElement('img');
            img.src = FloatDivMng.pathPrefix + opt.img;
            b.appendChild(img);
        }
        bd.appendChild(b);
        if(opt.isDefault === true)
            f = b;
    });

    fd.querySelector('.fd_close').onclick = function(event) {
        if(ignoreFunction)
            ignoreFunction(event);
        removeFD(event);
    }.bind(this);

    FloatDivMng.setFDPosition(fd, event);

    if(f)
        f.focus();

    return fd;
};
/**
 * @param {(string|Array<string>)} statement
 * @param {function} acceptFunction
 * @param {function} declineFunction
 * @param {function} [ignoreFunction]
 * @param {Event} [event]
 * @param {string} [title]
 * @returns {Element}
 */
function confirmDlg(statement, acceptFunction, declineFunction, ignoreFunction, event, title){
    var opts = [];
    opts.push(new Option('Ok', function(ev) {
        if(acceptFunction)
            acceptFunction(ev);
        removeFD(ev);
    }, '_img/common/checked.png', '', true));
    opts.push(new Option('Cancel', function(ev) {
        if(declineFunction)
            declineFunction(ev);
        removeFD(ev);
    }, '_img/common/cancel.png'));
    return optionDlg(statement, opts, event, title, ignoreFunction);
};
/**
 * @param {(string|Array<string>)} statement
 * @param {function} acceptFunction
 * @param {function} [declineFunction]
 * @param {function} [ignoreFunction]
 * @param {Event} [event]
 * @param {string} [title]
 * @returns {Element}
 */
function confirmIncomingRing(statement, acceptFunction, declineFunction, ignoreFunction, event, title){
    var opts = [];
    opts.push(new Option('Accept', function(ev) {
        if(acceptFunction)
            acceptFunction(ev);
        removeFD(ev);
    }, '_img/common/checked.png', '', true));
    opts.push(new Option('Decline', function(ev) {
        if(declineFunction)
            declineFunction(ev);
        removeFD(ev);
    }, '_img/common/cancel.png'));
    return optionDlg(statement, opts, event, title, ignoreFunction);
};
