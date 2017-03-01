(function ($, window) {

    /*
     * calculates position of element relatively to parentElement on top or bottom     
     */

    $.positionDropdownMenu = function (parentElement, elem) {
        var jqElem = $(elem),
            clone = jqElem.clone(),
            jqBody = $('body'),
            jqParent = $(parentElement),
            parentRect,
            elemHeight;

        clone.css('visibility', 'hidden');
        clone.offset({ left: '-1000px', top: '-1000px' });

        jqBody.append(clone);

        elemHeight = clone.outerHeight();
        clone.remove();

        //set menu position        
        parentRect = jqParent.offset();
        parentRect.width = jqParent.width();
        parentRect.height = jqParent.height();

        if (elemHeight + parentRect.top + parentRect.height < window.innerHeight) {
            jqElem.css({
                left: 'auto',
                right: jqBody.outerWidth() - (parentRect.left + parentRect.width) + 'px',
                top: parentRect.top + parentRect.height + 'px',
                bottom: 'auto'
            });
        }
        else {
            jqElem.css({
                left: 'auto',
                right: jqBody.outerWidth() - (parentRect.left + parentRect.width) + 'px',
                top: 'auto',
                bottom: window.innerHeight - parentRect.top + 'px'
            });
        }
    }

})(jQuery, window);