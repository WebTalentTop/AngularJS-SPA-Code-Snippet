(function (global) {
    'use strict';

    global.realineMessenger.factory('fileHelper', ['fileExtensions', '_', 'utils',
    function (fileExtensions, _, utils) {
        return {
            isImage: function (fileName) {
                if (utils.common.isNullOrEmpty(fileName)) {
                    return false;
                }

                var lastIndex = fileName.lastIndexOf('.');

                if (lastIndex < 0) {
                    return false;
                }

                var extension = fileName.slice(lastIndex).toLowerCase();

                var index = _.findIndex(fileExtensions.image, function (item) {
                    return extension == item;
                });

                return index > -1;
            }
        };
    }
    ]);


})(window);