(function (global) {
    'use strict';

    global.realineMessenger.factory('AttachmentModel', [
        'MessengerEnums', 'EntityModel', 'utils', 'Domains',
    function (MessengerEnums, EntityModel, utils, Domains) {

        var DOCUMENT_URL_TEMPLATE = Domains.MessengerDocumentStorage + '/api/document/getByGlobalUnitId?globalUnitId={0}';

        var Model = EntityModel.extend({
            init: function (data) {
                this._super(data);
                this.__ClassName = 'AttachmentModel';

                processAttachment.call(this);
            },

            getFileName: function () {
                return this.get(MessengerEnums.PropertyNames.FileName);
            },

            setFileName: function (value) {
                this.set(MessengerEnums.PropertyNames.FileName, value);
            },

            getFileType: function () {
                return this.get(MessengerEnums.PropertyNames.FileType);
            },

            setFileType: function (value) {
                this.set(MessengerEnums.PropertyNames.FileType, value);
            },

            getFileData: function () {
                return this.get(MessengerEnums.PropertyNames.FileData);
            },

            setFileData: function (value) {
                this.set(MessengerEnums.PropertyNames.FileData, value);
            },

            isImageFile: function () {
                return this.getFileType() === MessengerEnums.FileType.Image;
            },

            getOriginalFileUrl: function () {
                return this.get('OriginalFileUrl');
            },

            setOriginalFileUrl: function (value) {
                this.set('OriginalFileUrl', value);
            },

            getThumbnailUrl: function () {
                return this.get('ThumbnailUrl');
            },

            setThumbnailUrl: function (value) {
                this.set('ThumbnailUrl', value);
            },

            getThumbnailImage: function () {
                return this.thumbnailImage;
            },

        });

        function processAttachment() {

            var fileData;
            var fileUrl;

            try {
                fileData = JSON.parse(this.getFileData());
            }
            catch (err) {
                //protection from invalid json
                fileData = null;
            }

            this.setFileData(fileData);

            if (utils.common.isNullOrUndefined(fileData)) {
                return;
            }

            if (this.isImageFile()) {

                this.setOriginalFileUrl(fileData.Url);

                this.thumbnailImage = fileData.ResizedImages.findItem(function (item) {
                    return item.Size === 'small';
                });

                if (this.thumbnailImage !== null) {
                    this.setThumbnailUrl(this.thumbnailImage.Url);
                }
            }
            else {
                fileUrl = String.format(DOCUMENT_URL_TEMPLATE, fileData.FileId);
                this.setOriginalFileUrl(fileUrl);
            }
        }

        return Model;
    }
    ]);

})(window);