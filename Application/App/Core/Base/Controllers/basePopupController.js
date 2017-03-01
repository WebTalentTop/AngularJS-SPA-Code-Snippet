(function (global) {
    global.realineModule.factory('BasePopupController', [
        '$timeout', function ($timeout) {
            var basePopupController = Class.extend({
                init: function ($scope, $modalInstance) {
                    this.$scope = $scope;
                    this.$modalInstance = $modalInstance;
                    this.initInternal();
                    this.$scope.updating = false;
                    this.$scope.controller = this;

                    this.$scope.$on('$destroy', this.onDestroy.bind(this));
                },

                initInternal: function () {

                    this.$scope.cancel = function () {
                        this.$modalInstance.dismiss('cancel');
                    }.bind(this);

                    this.$scope.ok = function (status) {
                        if (status === undefined || status === true) {
                            this.apply();
                        }
                    }.bind(this);

                    this.$modalInstance.opened.then(function () {
                        $timeout(function () {
                            this.loadData();
                        }.bind(this), 500);
                    }.bind(this));
                },

                loadData: function () {
                    // to be overriden in decsendants
                },

                apply: function () {
                    // to be overriden in decsendants
                },

                onDestroy: function () {

                },
            });

            return basePopupController;
        }
    ]);
})(window);
