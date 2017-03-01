(function (global) {
    'use strict';

    global.app.controller('TagDeleteDialogController', [
    'entity', 'BasePopupController', 'messengerHub',
    'MessengerEnums', '$scope', '$log', '$q', '$uibModalInstance', '$', 'utils',
    function (entity, BasePopupController, messengerHub,
        MessengerEnums, $scope, $log, $q, $uibModalInstance, $, utils) {

        var Controller = BasePopupController.extend({
            init: function (scope) {
                var selectedUser;

                this._super(scope, $uibModalInstance);

                $scope.controller = this;

                this.tag = entity;
                this.MoveToArchive = false;
            },

            apply: function () {
                var request = {
                    FolderId: this.tag.getId(),
                    MoveToArchive: this.MoveToArchive,
                };

                messengerHub.deleteTag(request).then(function () {
                    $uibModalInstance.close();
                }.bind(this), function (result) {
                    $log.error('Failed to save folder.' + result);
                });

            },
        });

        return new Controller($scope);
    }
    ]);

})(window);