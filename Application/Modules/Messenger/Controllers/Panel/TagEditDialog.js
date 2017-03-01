(function (global) {
    'use strict';

    global.app.controller('TagEditDialogController', [
    'entity', 'BasePopupController', 'messengerHub',
    'MessengerEnums', '$scope', '$log', '$q', '$uibModalInstance', '$', 'utils',
    function (entity, BasePopupController, messengerHub,
        MessengerEnums, $scope, $log, $q, $uibModalInstance, $, utils) {

        var Controller = BasePopupController.extend({
            init: function (scope) {
                var selectedUser;

                this._super(scope, $uibModalInstance);

                $scope.controller = this;

                if (entity === null) {
                    this.entity = {
                        FolderType: MessengerEnums.TagType.CustomFolder,
                    };
                }
                else {
                    this.entity = global.angular.extend({}, entity.get());
                }
            },

            isEditing: function () {
                return entity !== null;
            },

            apply: function () {
                messengerHub.saveTag(this.entity).then(function () {
                    if (entity) {
                        entity.setDisplayName(this.entity.DisplayName);
                    }
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