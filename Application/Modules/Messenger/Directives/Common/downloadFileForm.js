
/*
 * this directive is used to download file from DocumentStorage
 * I use this hack because we cannot use cookies for authorization
 * and cannot send headers when broser navigates to by file url
 * so I build form with method=post and hidden field with token
 * It looks like link so user should click on it to download
 */

(function (global) {
    'use strict';

    global.realineMessenger.directive('downloadFileForm', ['cookieService', 'authConstants', '$timeout', '$',
    function (cookieService, authConstants, $timeout, $) {
        return {
            restrict: 'E',

            replace: true,

            transclude: true,

            template:
'<span ng-transclude></span>',

            link: function ($scope, element, attrs) {

                //build form manually because angular as directive ngForm with own functionality

                var formHtml =
'<form class="download-form" method="post" target="_blank">\
<input class="js-token" type="hidden"/>\
<button class="js-button file-download-btn" type="submit"></button>\
</form>';
                var cookie = cookieService.cookie(authConstants.cookie);

                var content = element.html();

                var form = $(formHtml);

                form.attr('action', attrs.fileUrl);
                form.find('.js-button').html(content);

                element.removeAttr('file-url');
                element.removeAttr('file-name');
                //cleanup content because we will set new content
                element.empty();

                form.submit(function () {
                    //improve security a little bit by setting token only when necessary for limited time
                    var cookie = cookieService.cookie(authConstants.cookie);
                    form.find('.js-token').attr('name', authConstants.header).val(cookie);
                    $timeout(function () {
                        form.find('.js-token').attr('name', authConstants.header).val('');
                    }, 1000);
                });

                element.append(form);
            }
        };
    }]);

})(window);