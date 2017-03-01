(function (global) {
    'use strict';

    global.realineMessenger.constant('MessengerConstants', {
        StreamObjectType: '946d5193-1360-4937-ae48-a42000f54808',
    });

    global.realineMessenger.constant('fileExtensions', {
        image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
        document: ['.doc', '.docx', '.rtf'],
        excel: ['.xls, .xlsx'],
        presentation: ['.ppt', 'pptx'],
        text: ['.txt', '.me'],
        pdf: ['.pdf'],
    });
})(window);