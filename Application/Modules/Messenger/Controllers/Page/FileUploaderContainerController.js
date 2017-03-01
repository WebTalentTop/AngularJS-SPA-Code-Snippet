(function (global) {
    'use strict';

    global.app.controller('FileUploaderContainerController',
    ['$scope', '$log', 'MessengerEnums', 'CoreEnums', 'events', 'utils', 'Domains',
        'CrossDomainStorage', 'authConstants', 'Upload', 'customHeaders', 'errorMessageProvider',
        'fileHelper',
    function ($scope, $log, MessengerEnums, CoreEnums, events, utils, Domains,
        CrossDomainStorage, authConstants, Upload, customHeaders, errorMessageProvider,
        fileHelper) {

        var IMAGE_UPLOAD_URL = Domains.MessengerImagesStorage + '/api/imagestorage/save/messenger',
                DOCUMENT_UPLOAD_URL = Domains.MessengerDocumentStorage + '/api/Document/Post',
                DOCUMENT_URL_TEMPLATE = Domains.MessengerDocumentStorage + '/api/document/getByGlobalUnitId?globalUnitId={0}';

        var DEFAULT_VERSION = '1.0.0.0';

        var FileAccessType =
            {
                Public: 0,
                OnlyForAllowed: 1,
                OnlyForMe: 2
            };

        var Controller = Class.extend({
            init: function (scope) {
                this.__ClassName = 'FileUploaderContainerController';

                this.scope = scope;
                this.scope.controller = this;

                this.initController();

                this.bindEvents();
            },

            bindEvents: function () {

                this.scope.$on('$destroy', function () {

                }.bind(this));
            },

            initController: function () {

            },

            uploadFiles: function (newFiles, invalidFiles) {
                return CrossDomainStorage.get(authConstants.localStorage).then(function (result) {
                    this.uploadFilesInternal(newFiles, result.value);
                }.bind(this), function (error) {
                    $log.debug('Failed to get token. ' + error);
                });
            },

            uploadFilesInternal: function (newFiles, token) {
                global.angular.forEach(newFiles, function (file) {

                    var request;

                    file.isImage = fileHelper.isImage(file.name);

                    request = {
                        url: this.buildUploadUrl(file),
                        data: { file: file },
                        headers: {},
                    }

                    request.headers[customHeaders.version] = DEFAULT_VERSION;
                    request.headers[authConstants.header] = token;

                    file.upload = Upload.upload(request);

                    file.upload.then(function (response) {
                        if (file.isImage) {
                            file.result = response.data.Model;
                            imageThumbnailUrl(file, response.data.Model);
                        } else {
                            file.result = {
                                FileId: response.data.Model,
                                FileUrl: String.format(DOCUMENT_URL_TEMPLATE, response.data.Model)
                            };
                        }
                    }, function (response) {
                        if (response.status > 0) {
                            file.errorMsg = response.status + ': ' + errorMessageProvider.getApiErrorMessage(response.data);
                        }
                        $log.debug(String.format('Failed to upload file {0}. Error: {1}', file.name, JSON.stringify(response.data)));
                    }, function (evt) {
                        file.progress = Math.min(100, parseInt(100.0 *
                                                 evt.loaded / evt.total));
                    });

                    this.scope.files.push(file);

                }, this);
            },

            buildUploadUrl: function (file) {
                if (file.isImage) {
                    return this.buildImageUploadUrl(file);
                }
                else {
                    return this.buildDocumentUploadUrl(file);
                }
            },

            buildImageUploadUrl: function (file) {
                return IMAGE_UPLOAD_URL;
            },

            buildDocumentUploadUrl: function (fileItem) {
                var request = this.buildDocumentUploadRequest(fileItem);
                var qs = buildQueryString(request);

                return DOCUMENT_UPLOAD_URL + '?' + qs;
            },

            buildDocumentUploadRequest: function (fileItem) {
                //var participantIds = this.conversation.Participants.map(function (user) {
                //    return user.getId();
                //});

                var request = {
                    Filename: fileItem.name,
                    //AllowedUserIds: participantIds,
                    FileAccessType: FileAccessType.Public,
                };

                return request;
            },

            onRemoveFile_Click: function (file) {
                this.scope.files.removeElement(file);
            },
        });

        function buildQueryString(request) {
            var qs = '',
                i;

            for (var prop in request) {
                if (!angular.isArray(request[prop])) {
                    if (qs) {
                        qs += '&';
                    }
                    qs = qs + String.format('{0}={1}', prop, encodeURIComponent(request[prop]));
                } else {
                    for (i = 0; i < request[prop].length; i++) {
                        if (qs) {
                            qs += '&';
                        }
                        qs = qs + String.format('{0}={1}', prop, encodeURIComponent(request[prop][i]));
                    }
                }
            }
            return qs;
        }

        function imageThumbnailUrl(file, model) {
            file.thumbnail = model.ResizedImages.findItem(function (item) {
                return item.Size === 'small';
            });
        }

        return new Controller($scope);
    }
    ]);

})(window);