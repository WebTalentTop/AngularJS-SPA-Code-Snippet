/** created by Akira Matsui */

'use strict';

/**
 * The 'form' tag must wraps a floatDiv's html-content of a pattern in case the pattern contains some 'input radio' tags.
 * This is necessary to avoid sharing radio-buttons-group between several opened floatingDivs
 */

/**
 //* @namespace
 * @type {{pathPrefix: string, createFd: Function, showFD: Function, setFDPosition: Function, setNotResizing: Function}}
 */
var FloatDivMng = {
    pathPrefixNull: '',
    pathPrefixFull: 'Application/Modules/Messenger/Controllers/VideoConference/',
    pathPrefix: '',
    /**
     * @param {string} [fd_frame_template_selector]
     * @param {string} [fdID]
     * @param {HTMLElement} [ownerElm]
     * @returns {HTMLElement}
     */
    createFd: function(fd_frame_template_selector, fdID, ownerElm) {
        if( ! ownerElm )
            ownerElm = window.document.body;
        if( ! fd_frame_template_selector )
            fd_frame_template_selector = '#fd_frame_template';
        /** @type HTMLElement */
        //var fd = /** @type HTMLElement */ window.document.querySelector(fd_frame_template_selector).cloneNode(true);
        var fd =  loadHtmlPage(this.pathPrefix + 'floatDiv.html', fd_frame_template_selector, false);
        fd = ownerElm.ownerDocument.adoptNode(fd);

        if(this.pathPrefix){
            var li = fd.querySelector('img.fd_close').src.lastIndexOf(window.location.origin);
            if(li < 0)
                li = 0;
            else
                li = window.location.origin.length + 1;
            var imgsElm = fd.querySelectorAll('img');
            for(var ii = 0; ii < imgsElm.length; ii++)
                imgsElm[ii].src = imgsElm[ii].src.substr(0, li) + this.pathPrefix + imgsElm[ii].src.substr(li);
        }

        fd.id = fdID ? fdID : 'fd_' + (new Date()).valueOf();
        ownerElm.appendChild(fd);
        /** @type FloatDiv */
        fd.FDD = new FloatDiv();
        fd.FDD.fdFrameTemplate_Selector = fd_frame_template_selector;
        fd.FDD.bornArea = ownerElm;
        fd.FDD.fd_element = fd;
        bringToTop(fd);
        return fd;
    },
    /**
     * @function
     * @memberOf {FloatDivMng}
     * @param {Event|Element} event_bornArea
     * @param {string} fdID
     * @param {string} templateHTML
     * @param {string} templateSelector
     * @param {string} [divCSSClassName]
     * @param {string} [iconPath]
     * @param {string} [title]
     * @param {string} [CSSFileName]
     * @param {boolean} [bornAreaIsOwnerElm]
     * @param {boolean} [setPosition]
     * @returns {HTMLElement}
     */
    showFD: function(event_bornArea, fdID, templateHTML, templateSelector, divCSSClassName, iconPath, title, CSSFileName, bornAreaIsOwnerElm, setPosition) {
        var ownerElm = window.document.body;
        if( event_bornArea instanceof Element && bornAreaIsOwnerElm)
            ownerElm = event_bornArea;
        /** @type HTMLElement */
        var fd = ownerElm.querySelector('#' + fdID);
        if (fd) {
            bringToTop(fd);
        } else {
            if(CSSFileName) {
                var cssLink = ownerElm.querySelector('link[rel="stylesheet"][type="text/css"][href="' + CSSFileName + '"]');
                if( ! cssLink ) {
                    cssLink = ownerElm.ownerDocument.createElement('link');
                    cssLink.setAttribute('rel', 'stylesheet');
                    cssLink.setAttribute('type', 'text/css');
                    cssLink.setAttribute('href', CSSFileName);
                    ownerElm.querySelector('html>head').appendChild(cssLink);
                }
            }

            fd = this.createFd('#fd_frame_template', fdID, ownerElm);
            if (divCSSClassName) {
                var clss = divCSSClassName.split(' ');
                clss.forEach(function(cls){fd.classList.add(cls);});
            }
            fd.FDD.template_htmlFileName = templateHTML;
            fd.FDD.template_elementId = templateSelector;
            fd.FDD.divCSSClassName = divCSSClassName;
            fd.FDD.iconFileName = iconPath;
            fd.FDD.title = title;

            if (iconPath)
                fd.querySelector('.fd_icon').src = iconPath;
            if (title)
                fd.querySelector('.fd_title').textContent = title;

            var content = loadHtmlPage(templateHTML, templateSelector, false);
            content = fd.ownerDocument.adoptNode(content);

            fd.querySelector('.fd_body').appendChild(content);

            fd.style.display = 'block';//must be here (before 'setFDPosition' is calling) for right positioning
            if(setPosition !== false)
                this.setFDPosition(fd, event_bornArea);//must be here for right positioning ( to collage only once all the frames belong to the same working area)
            fd.FDD.fillFDDInitSizeAndPosition(fd);
        }

        fd.style.display = 'block';

        return fd;
    },
    /**
     *
     * @param {HTMLElement} fd
     * @param {Event|HTMLElement} event_bornArea
     * @returns {undefined}
     */
    setFDPosition: function(fd, event_bornArea) {
        if (!event_bornArea) {
            fd.style.top = (window.innerHeight - fd.scrollHeight) / 2 + 'px';
            fd.style.left = (window.innerWidth - fd.scrollWidth) / 2 + 'px';
        } else if (event_bornArea instanceof Element || 'clientHeight' in event_bornArea) { // positioning up to bornArea
            fd.FDD.bornArea = event_bornArea;
            if (!event_bornArea.amountOfChildFDs)
                event_bornArea.amountOfChildFDs = 0;
            fd.style.top = (event_bornArea.offsetTop + (event_bornArea.clientHeight - fd.scrollHeight) / 5 * (event_bornArea.amountOfChildFDs % 10)) + 'px';
            fd.style.left = (event_bornArea.offsetLeft + (event_bornArea.clientWidth - fd.scrollWidth) / 10 * (event_bornArea.amountOfChildFDs % 20)) + 'px';
            event_bornArea.amountOfChildFDs++;
        } else if (event_bornArea.clientY) { // mouse event
            fd.style.top = (event_bornArea.clientY - 9) + 'px';
            fd.style.left = (event_bornArea.clientX - 9) + 'px';
        } else { // keyboard and any other events
            var cr = event_bornArea.target.getBoundingClientRect();
            fd.style.top = (cr.top + 10) + 'px';
            fd.style.left = (cr.left + 10) + 'px';
        }
        adjustElementPosition(fd);
    },

    setNotResizing: function(fd) {
        //fd.querySelector('.fd_leftupper_corner').onmousedown = null;
        //fd.querySelector('.fd_rightupper_corner').onmousedown = null;
        //fd.querySelector('.fd_leftbottom_corner').onmousedown = null;
        //fd.querySelector('.fd_rightbottom_corner').onmousedown = null;
        fd.querySelector('.fd_leftupper_corner').style.display = 'none';
        fd.querySelector('.fd_rightupper_corner').style.display = 'none';
        fd.querySelector('.fd_leftbottom_corner').style.display = 'none';
        fd.querySelector('.fd_rightbottom_corner').style.display = 'none';
    }
};
FloatDivMng.TOP_Z = 1000;
/**
 * @class
 * @constructor
 */
var FloatDiv = function() {
    //    this.fdElementID = null;
    this.fdFrameTemplate_Selector = null;
    this.template_htmlFileName = null;
    this.template_elementId = null;
    this.divCSSClassName = null;
    this.iconFileName = null;
    this.title = null;
    /** @type Element */
    this.bornArea = null;

    this.leftInitial = null;
    this.topInitial = null;
    this.widthInitial = null;
    this.heightInitial = null;

    this.left = null;
    this.top = null;
    this.width = null;
    this.height = null;

    this.aspectRatio = 0;

    this.fd_element = null;
};
//var fdd = new FloatDiv();

FloatDiv.prototype.fillFDDInitSizeAndPosition = function(fd) {
    if(!this.bornArea)
        this.bornArea = fd.ownerDocument.body;//window.document.body;

    this.leftInitial = fd.offsetLeft;
    this.topInitial = fd.offsetTop;
    this.widthInitial = fd.clientWidth;
    this.heightInitial = fd.clientHeight;

    this.left = fd.offsetLeft;
    this.top = fd.offsetTop;
    this.width = fd.clientWidth;
    this.height = fd.clientHeight;
};

////////////////////////////////////////////////////////////////////////////////
//////////////////////////// moving and resizing ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function FDSizeAndPosition() {
    /** type {HTMLElement} */
    this.el = null;
    this.initLeft = 0;
    this.initTop = 0;
    this.initWidth = 0;
    this.initHeight = 0;
    this.X = 0;
    this.Y = 0;

    this.gapEM = 3; // the minimum visible space size (initially in em) for all types of operations
    this.gapPX = 0; // will be calculated based on gapEM - the minimum visible space size (in px) for all types of operations

    this.nX= 0; // just for performance optimization
    this.nY = 0;

    this.resizingMethod = null;

    /** type {HTMLElement} */
    this.abuttingEl = null;
}
/** @type {FDSizeAndPosition} */
var fdSizeAndPosition = new FDSizeAndPosition();
/**
 * @param {Event} ev
 * @returns {HTMLElement}
 */
var _getFDRootNode = function(ev) {
    /** @type {HTMLElement} */
    var elm = ev.currentTarget;
    return getFDRootNode(elm);
};
/**
 * @param {HTMLElement} elm
 * @returns {HTMLElement}
 */
var getFDRootNode = function(elm) {
    /** @type {HTMLElement} */
    while(!elm.classList.contains('float_div'))
        elm = elm.parentNode;
    return elm;
};

//////////////////////////// moving /////////////////////////////////////////////
var startMoving = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    fdSizeAndPosition.el = _getFDRootNode(ev);
    bringToTop(fdSizeAndPosition.el);

    fdSizeAndPosition.nX = fdSizeAndPosition.el.offsetLeft;
    fdSizeAndPosition.X = ev.pageX;
    fdSizeAndPosition.nY = fdSizeAndPosition.el.offsetTop;
    fdSizeAndPosition.Y = ev.pageY;

    fdSizeAndPosition.gapPX = getRootElementFontSize() * fdSizeAndPosition.gapEM;

    window.document.addEventListener('mousemove', doMoving, true);
    window.document.addEventListener('mouseup', stopMoving, true);

    return false;
};
var doMoving = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    fdSizeAndPosition.nX += (ev.pageX - fdSizeAndPosition.X);
    fdSizeAndPosition.X = ev.pageX;
    if(fdSizeAndPosition.nX <= 0 )
        fdSizeAndPosition.el.style.left = 0 + 'px';
    else if(fdSizeAndPosition.nX >= (window.innerWidth - fdSizeAndPosition.gapPX) )
        fdSizeAndPosition.el.style.left = (window.innerWidth - fdSizeAndPosition.gapPX) + 'px';
    else
        fdSizeAndPosition.el.style.left = fdSizeAndPosition.nX + 'px';

    fdSizeAndPosition.nY += (ev.pageY - fdSizeAndPosition.Y);
    fdSizeAndPosition.Y = ev.pageY;
    if(fdSizeAndPosition.nY <= 0 )
        fdSizeAndPosition.el.style.top = 0 + 'px';
    else if(fdSizeAndPosition.nY >= (window.innerHeight - fdSizeAndPosition.gapPX) )
        fdSizeAndPosition.el.style.top = (window.innerHeight - fdSizeAndPosition.gapPX) + 'px';
    else
        fdSizeAndPosition.el.style.top = fdSizeAndPosition.nY + 'px';

    return false;
};

var stopMoving = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    //fdSizeAndPosition.el.style.right = (fdSizeAndPosition.el.parentNode.clientWidth - fdSizeAndPosition.el.offsetLeft - fdSizeAndPosition.el.offsetWidth) + 'px';
    //fdSizeAndPosition.el.style.top = fdSizeAndPosition.el.offsetTop + 'px';
    ////fdSizeAndPosition.el.style.bottom = (fdSizeAndPosition.el.parentNode.clientHeight - fdSizeAndPosition.el.offsetTop - fdSizeAndPosition.el.offsetHeight) + 'px';
    //fdSizeAndPosition.el.style.width = fdSizeAndPosition.el.clientWidth + 'px';
    //fdSizeAndPosition.el.style.heigh = fdSizeAndPosition.el.clientHeight + 'px';
    //fdSizeAndPosition.el.style.left = 'auto';
    ////fdSizeAndPosition.el.style.top = 'auto';
    //fdSizeAndPosition.el.style.bottom = 'auto';

    fdSizeAndPosition.el = null;
    window.document.removeEventListener('mousemove', doMoving, true);
    window.document.removeEventListener('mouseup', stopMoving, true);
};

////////////////////////////// resizing ////////////////////////////////////////
var startFDResizing = function(ev) {
    fdSizeAndPosition.el = _getFDRootNode(ev);
    bringToTop(fdSizeAndPosition.el);
    startResizing(ev, fdSizeAndPosition.el);
    fdSizeAndPosition.el.FDD.lastAction = 'Resizing';
};
/**
 * @param {Event} ev
 * @param {string} abuttingElementSelector
 */
var startAbuttingResizing = function(ev, abuttingElementSelector) {
    var elementToResize = ev.currentTarget.parentNode;
    var abuttingElement = window.document.querySelector(abuttingElementSelector);
    startResizing(ev, elementToResize, abuttingElement);
};
/**
 * @param {Event} ev
 * @param {HTMLElement} elementToResize
 * @param {HTMLElement} abuttingElement
 * @returns {FDSizeAndPosition}
 */
var startResizing = function(ev, elementToResize, abuttingElement) {
    ev.stopPropagation();
    ev.preventDefault();

    if( ! elementToResize )
        elementToResize = ev.currentTarget.parentNode;

    fdSizeAndPosition.el = elementToResize;

    fdSizeAndPosition.initWidth = fdSizeAndPosition.el.clientWidth;
    fdSizeAndPosition.initHeight = fdSizeAndPosition.el.clientHeight;
    fdSizeAndPosition.initLeft = fdSizeAndPosition.el.offsetLeft;
    fdSizeAndPosition.initTop = fdSizeAndPosition.el.offsetTop;

    fdSizeAndPosition.X = ev.pageX;
    fdSizeAndPosition.Y = ev.pageY;

    fdSizeAndPosition.gapPX = getRootElementFontSize() * fdSizeAndPosition.gapEM;

    fdSizeAndPosition.abuttingEl = abuttingElement;

    if(ev.currentTarget.classList.contains('fd_leftupper_corner'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doLUResizing, true);
    else if(ev.currentTarget.classList.contains('fd_rightupper_corner'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doRUResizing, true);

    else if(ev.currentTarget.classList.contains('fd_leftbottom_corner'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doLBResizing, true);
    else if(ev.currentTarget.classList.contains('fd_rightbottom_corner'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doRBResizing, true);

    else if(ev.currentTarget.classList.contains('fd_ruler_top'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doUResizing, true);
    else if(ev.currentTarget.classList.contains('fd_ruler_left'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doLResizing, true);
    else if(ev.currentTarget.classList.contains('fd_ruler_right')) {
        if(fdSizeAndPosition.abuttingEl) {
            // fix the right element border - it is needed to hold the right position while entire browser window is resizing
            //fdSizeAndPosition.el.style.removeProperty('width');
            //fdSizeAndPosition.abuttingEl.style.removeProperty('width');
            //fdSizeAndPosition.el.style.right = (window.innerWidth - (fdSizeAndPosition.el.offsetLeft + fdSizeAndPosition.el.offsetWidth)) + 'px';
            var perc = fdSizeAndPosition.el.offsetWidth/window.innerWidth*100;
            fdSizeAndPosition.el.style.width = perc + '%';
            fdSizeAndPosition.el.style.right = 'auto';
            //fdSizeAndPosition.el.style.width = 'auto';
            //fdSizeAndPosition.abuttingEl.style.right = (window.innerWidth - (fdSizeAndPosition.abuttingEl.offsetLeft + fdSizeAndPosition.abuttingEl.offsetWidth)) + 'px';
            fdSizeAndPosition.abuttingEl.style.width = (100 - perc) + '%';
            fdSizeAndPosition.abuttingEl.style.right = 'auto';
            //fdSizeAndPosition.abuttingEl.style.width = 'auto';
            //fdSizeAndPosition.abuttingEl.style.left = 'auto';
            window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doJointRResizing, true);
        } else {
            window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doRResizing, true);
        }
    } else if(ev.currentTarget.classList.contains('fd_ruler_bottom'))
        window.document.addEventListener('mousemove', fdSizeAndPosition.resizingMethod = doBResizing, true);

    window.document.addEventListener('mouseup', stopResizing, true);

    //fdSizeAndPosition.el.FDD.lastAction = 'Resizing';

    return fdSizeAndPosition;
};
var doRBResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX >= 0 && ev.pageX <= window.innerWidth) {
        fdSizeAndPosition.nX = fdSizeAndPosition.initWidth + (ev.pageX - fdSizeAndPosition.X);
        if (fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX)
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
        else
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
    }

    if(ev.pageY >= 0 && ev.pageY <= window.innerHeight) {
        fdSizeAndPosition.nY = fdSizeAndPosition.initHeight + (ev.pageY - fdSizeAndPosition.Y);
        if (fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX)
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
        else
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';
    }

    return false;
};
var doLBResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX >= 0 && ev.pageX <= window.innerWidth) {
        fdSizeAndPosition.nX = fdSizeAndPosition.initWidth - (ev.pageX - fdSizeAndPosition.X);
        if (fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX) {
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
            fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + fdSizeAndPosition.initWidth - fdSizeAndPosition.gapPX) + 'px';
        } else {
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
            fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + (ev.pageX - fdSizeAndPosition.X)) + 'px';
        }
    }
    if(ev.pageY >= 0 && ev.pageY <= window.innerHeight) {
        fdSizeAndPosition.nY = (fdSizeAndPosition.initHeight + (ev.pageY - fdSizeAndPosition.Y));
        if (fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX)
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
        else
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';
    }

    return false;
};
var doLUResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX >= 0 && ev.pageX <= window.innerWidth) {
        fdSizeAndPosition.nX = fdSizeAndPosition.initWidth - (ev.pageX - fdSizeAndPosition.X);
        if (fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX) {
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
            fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + fdSizeAndPosition.initWidth - fdSizeAndPosition.gapPX) + 'px';
        } else {
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
            fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + (ev.pageX - fdSizeAndPosition.X)) + 'px';
        }
    }

    if(ev.pageY >= 0 && ev.pageY <= window.innerHeight) {
        fdSizeAndPosition.nY = (fdSizeAndPosition.initHeight - (ev.pageY - fdSizeAndPosition.Y));
        if (fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX) {
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
            fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + fdSizeAndPosition.initHeight - fdSizeAndPosition.gapPX) + 'px';
        } else {
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';
            fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + (ev.pageY - fdSizeAndPosition.Y)) + 'px';
        }
    }

    return false;
};
var doRUResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX >= 0 && ev.pageX <= window.innerWidth) {
        fdSizeAndPosition.nX = fdSizeAndPosition.initWidth + (ev.pageX - fdSizeAndPosition.X);
        if (fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX)
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
        else
            fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
    }

    if(ev.pageY >= 0 && ev.pageY <= window.innerHeight) {
        fdSizeAndPosition.nY = (fdSizeAndPosition.initHeight - (ev.pageY - fdSizeAndPosition.Y));
        if (fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX) {
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
            fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + fdSizeAndPosition.initHeight - fdSizeAndPosition.gapPX) + 'px';
        } else {
            fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';
            fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + (ev.pageY - fdSizeAndPosition.Y)) + 'px';
        }
    }

    return false;
};

var doUResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageY < 0 || ev.pageY > window.innerHeight)
        return;

    fdSizeAndPosition.nY = (fdSizeAndPosition.initHeight - (ev.pageY - fdSizeAndPosition.Y));
    if(fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX){
        fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
        fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + fdSizeAndPosition.initHeight - fdSizeAndPosition.gapPX) + 'px';
    } else {
        fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';
        fdSizeAndPosition.el.style.top = (fdSizeAndPosition.initTop + (ev.pageY - fdSizeAndPosition.Y)) + 'px';
    }

    return false;
};
var doLResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX < 0 || ev.pageX > window.innerWidth)
        return;

    fdSizeAndPosition.nX = fdSizeAndPosition.initWidth - (ev.pageX - fdSizeAndPosition.X);
    if(fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX){
        fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
        fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + fdSizeAndPosition.initWidth - fdSizeAndPosition.gapPX) + 'px';
    } else {
        fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
        fdSizeAndPosition.el.style.left = (fdSizeAndPosition.initLeft + (ev.pageX - fdSizeAndPosition.X)) + 'px';
    }

    return false;
};
var doRResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX < 0 || ev.pageX > window.innerWidth)
        return;

    fdSizeAndPosition.nX = fdSizeAndPosition.initWidth + (ev.pageX - fdSizeAndPosition.X);
    if(fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX)
        fdSizeAndPosition.el.style.width = fdSizeAndPosition.gapPX + 'px';
    else
        fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';

    return false;
};
var doBResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageY < 0 || ev.pageY > window.innerHeight)
        return;

    fdSizeAndPosition.nY = (fdSizeAndPosition.initHeight + (ev.pageY - fdSizeAndPosition.Y));
    if(fdSizeAndPosition.nY <= fdSizeAndPosition.gapPX)
        fdSizeAndPosition.el.style.height = fdSizeAndPosition.gapPX + 'px';
    else
        fdSizeAndPosition.el.style.height = fdSizeAndPosition.nY + 'px';

    return false;
};

var doJointRResizing = function(ev) {
    if(!fdSizeAndPosition.el)
        return true;

    ev.stopPropagation();
    ev.preventDefault();

    if(ev.pageX < 0 || ev.pageX > window.innerWidth)
        return;

    fdSizeAndPosition.nX = fdSizeAndPosition.initWidth + (ev.pageX - fdSizeAndPosition.X);

    if(fdSizeAndPosition.nX <= fdSizeAndPosition.gapPX)
        fdSizeAndPosition.nX = fdSizeAndPosition.gapPX;

    var nAEW = (fdSizeAndPosition.abuttingEl.offsetWidth - (fdSizeAndPosition.nX - fdSizeAndPosition.el.offsetWidth));
    if(nAEW < fdSizeAndPosition.gapPX)
        fdSizeAndPosition.nX = fdSizeAndPosition.nX - (fdSizeAndPosition.gapPX - nAEW);

    //fdSizeAndPosition.abuttingEl.style.width = (fdSizeAndPosition.abuttingEl.offsetWidth - (fdSizeAndPosition.nX - fdSizeAndPosition.el.offsetWidth)) + 'px';
    //fdSizeAndPosition.abuttingEl.style.width = ((fdSizeAndPosition.abuttingEl.offsetWidth - (fdSizeAndPosition.nX - fdSizeAndPosition.el.offsetWidth))/window.innerWidth*100) + '%';

    //fdSizeAndPosition.el.style.width = fdSizeAndPosition.nX + 'px';
    //fdSizeAndPosition.el.style.right = (window.innerWidth - (fdSizeAndPosition.el.offsetLeft + fdSizeAndPosition.nX)) + 'px';
    //fdSizeAndPosition.el.style.right = 'calc(100% - ' + (fdSizeAndPosition.el.offsetLeft + fdSizeAndPosition.nX) + 'px)';
    fdSizeAndPosition.el.style.width = (fdSizeAndPosition.nX/window.innerWidth*100) + '%';
    fdSizeAndPosition.abuttingEl.style.left = (fdSizeAndPosition.nX/window.innerWidth*100) + '%';
    fdSizeAndPosition.abuttingEl.style.width = (100 - (fdSizeAndPosition.nX/window.innerWidth*100)) + '%';

    // The commented line below is not needed since a fixed right position is used.
    // The fixed right position is set just once on resizing start.
    // It is needed to hold the right position while entire browser window is resizing
    //fdSizeAndPosition.abuttingEl.style.left = fdSizeAndPosition.el.offsetLeft + fdSizeAndPosition.el.offsetWidth + 'px';

    return false;
};


var stopResizing = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    if(fdSizeAndPosition.el.FDD.aspectRatio !== 0) {
        //var base = (fdSizeAndPosition.el.clientWidth + fdSizeAndPosition.el.clientHeight)/2;
        var base = fdSizeAndPosition.el.clientHeight;
        fdSizeAndPosition.el.style.height = base + 'px';
        fdSizeAndPosition.el.style.width = (base * fdSizeAndPosition.el.FDD.aspectRatio) + 'px';

        //fdSizeAndPosition.el.style.right = (fdSizeAndPosition.el.parentNode.clientWidth - fdSizeAndPosition.el.offsetLeft - fdSizeAndPosition.el.offsetWidth) + 'px';
        //fdSizeAndPosition.el.style.top = fdSizeAndPosition.el.offsetTop + 'px';
        ////fdSizeAndPosition.el.style.bottom = (fdSizeAndPosition.el.parentNode.clientHeight - fdSizeAndPosition.el.offsetTop - fdSizeAndPosition.el.offsetHeight) + 'px';
        //fdSizeAndPosition.el.style.width = fdSizeAndPosition.el.clientWidth + 'px';
        //fdSizeAndPosition.el.style.heigh = fdSizeAndPosition.el.clientHeight + 'px';
        //fdSizeAndPosition.el.style.left = 'auto';
        ////fdSizeAndPosition.el.style.top = 'auto';
        //fdSizeAndPosition.el.style.bottom = 'auto';
    }

    fdSizeAndPosition.el = null;
    fdSizeAndPosition.abuttingEl = null;
    window.document.removeEventListener('mousemove', fdSizeAndPosition.resizingMethod, true);
    window.document.removeEventListener('mouseup', stopResizing, true);
};

var hideFD = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    var fd = _getFDRootNode(ev);
    fd.style.display = 'none';
};
var removeFD = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    var fd = _getFDRootNode(ev);
    fd.parentNode.removeChild(fd);
};
var maximizeFD = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    var fd = _getFDRootNode(ev);

    if(fd.FDD.lastAction != 'maximizeFD'){
        fd.FDD.left = fd.offsetLeft;
        fd.FDD.top = fd.offsetTop;
        fd.FDD.width = fd.clientWidth;
        fd.FDD.height = fd.clientHeight;
    }

    fd.style.top = fd.FDD.bornArea.offsetTop + 'px';
    fd.style.left = fd.FDD.bornArea.offsetLeft + 'px';
    fd.style.height = fd.FDD.bornArea.scrollHeight + 'px';
    fd.style.width = fd.FDD.bornArea.scrollWidth + 'px';

    fd.querySelector('.fd_maximize').style.display = 'none';
    fd.querySelector('.fd_normilize').style.display = 'inline-block';

    fd.FDD.lastAction = 'maximizeFD';
};
var minimizeFD = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    var fd = _getFDRootNode(ev);

    if(fd.FDD.lastAction != 'minimizeFD'){
        fd.FDD.left = fd.offsetLeft;
        fd.FDD.top = fd.offsetTop;
        fd.FDD.width = fd.clientWidth;
        fd.FDD.height = fd.clientHeight;
    }

    fdSizeAndPosition.gapPX = getRootElementFontSize() * fdSizeAndPosition.gapEM;
    fd.style.top = (fd.FDD.bornArea.offsetTop + fd.FDD.bornArea.offsetHeight - fdSizeAndPosition.gapPX) + 'px';
    fd.style.left = (fd.FDD.bornArea.offsetLeft + fd.FDD.bornArea.offsetWidth - fd.FDD.widthInitial) + 'px';
    fd.style.height = fdSizeAndPosition.gapPX + 'px';
    fd.style.width = fd.FDD.widthInitial + 'px';

    fd.querySelector('.fd_maximize').style.display = 'none';
    fd.querySelector('.fd_normilize').style.display = 'inline-block';

    fd.FDD.lastAction = 'minimizeFD';
};
var normalizeFD = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    var fd = _getFDRootNode(ev);

    if(fd.FDD.lastAction == 'maximizeFD' || fd.FDD.lastAction == 'minimizeFD'){
        fd.style.top = fd.FDD.top + 'px';
        fd.style.left = fd.FDD.left + 'px';
        fd.style.height = fd.FDD.height + 'px';
        fd.style.width = fd.FDD.width + 'px';
    } else {
        fd.style.top = fd.FDD.topInitial + 'px';
        fd.style.left = fd.FDD.leftInitial + 'px';
        fd.style.height = fd.FDD.heightInitial + 'px';
        fd.style.width = fd.FDD.widthInitial + 'px';
    }

    fd.querySelector('.fd_maximize').style.display = 'inline-block';
    fd.querySelector('.fd_normilize').style.display = 'none';

    fd.FDD.lastAction = 'normalizeFD';
};
/////////////////////////////////////////////////////////////////////////
////////// some UI functions indifferent to FloatDiv ////////////////////
/////////////////////////////////////////////////////////////////////////
var bringToTop = function(element) {
    element.style.zIndex = ++FloatDivMng.TOP_Z;
};
var stickToTop = function(element) {
    //element.style.zIndex = ++FloatDivMng.MOSTTOP_Z;
    bringToTop(element);
};
/**
 * @param {MouseEvent} ev
 * @param {boolean} removeFD
 */
var hideElementByMouseMoving = function(ev, removeFD) {
    ev.preventDefault();
    ev.stopPropagation();
    var pn = ev.relatedTarget;
    while (pn) {
        if (pn === ev.currentTarget) {
            return;
        }
        pn = pn.parentNode;
    }
    ev.currentTarget.style.display = 'none';
    if(removeFD === true && ev.currentTarget.parentNode)
        ev.currentTarget.parentNode.removeChild(ev.currentTarget);
};
var removeElementByMouseMoving = function(ev) {
    hideElementByMouseMoving(ev, true);
};
/**
 * @param {Element} element
 * @returns {undefined}
 */
function adjustElementPosition(element) {
    if (element.offsetHeight + element.offsetTop > window.innerHeight)
        element.style.top = (window.innerHeight - element.offsetHeight - 4) + 'px';
    if (element.offsetWidth + element.offsetLeft > window.innerWidth)
        element.style.left = (window.innerWidth - element.offsetWidth - 4) + 'px';
}


/**
 * @param {string} pageName
 * @param {string} elSelector
 * @param {boolean} [async=false]
 * @param {HTMLElement} [ownerEl]
 * @returns {HTMLElement}
 */
var loadHtmlPage = function(pageName, elSelector, async, ownerEl) {
    /** @type {HTMLElement} */
    var hlel = window.document.querySelector('#_html_loader');
    if( ! hlel ){
        hlel = window.document.createElement('div');
        hlel.id = '_html_loader';
        hlel.style.display = 'none';
        window.document.body.appendChild(hlel);
    }
    while(hlel.firstChild)
        hlel.removeChild(hlel.firstChild);

    var x = new XMLHttpRequest();

    x.open('GET', pageName + '?' + 'anticache=' + new Date().getTime(), async);
    x.send();

    if( ! async ) {
        hlel.innerHTML = x.responseText;
        var loaded_el = hlel.querySelector(elSelector);
        while(hlel.firstChild)
            hlel.removeChild(hlel.firstChild);
        return loaded_el;
    }

    x.onreadystatechange = function() {
        if(x.readyState == 4){
            if(x.status == 200){
                hlel.innerHTML = x.responseText;
                var loaded_el = hlel.querySelector(elSelector);
                while(hlel.firstChild)
                    hlel.removeChild(hlel.firstChild);
                ownerEl.appendChild(loaded_el);
            } else {
                var err_msg_el = window.document.createElement('span');
                err_msg_el.textContent = 'Error loading document';
                ownerEl.appendChild(err_msg_el);
            }
        }
    }
};
