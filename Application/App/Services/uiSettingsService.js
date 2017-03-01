(function (global) {
    'use strict';

    global.realineModule.factory('uiSettingsService', ['utils', '$window', '$log',
    function (utils, $window, $log) {
        var UI_SETTINGS = 'ui_settings';

        var UiSettingsService = Class.extend({
            init: function () {
                var opts = null;

                this.settings = {
                    isPanelVisible: true,
                    isPanelMinimized: true,
                };

                opts = $window.localStorage[UI_SETTINGS];

                if (!utils.common.isNullOrUndefined(opts)) {
                    try {
                        opts = JSON.parse(opts);
                        angular.extend(this.settings, opts);
                    } catch (error) {
                        $log.error('Failed to parse messenger settings. ' + error);
                    }
                }
            },

            save: function () {
                $window.localStorage[UI_SETTINGS] = JSON.stringify(this.settings);
            },

            getIsSideBarCollapsed: function () {
                return this.settings.isSideBarCollapsed;
            },

            setIsSideBarCollapsed: function (value) {
                this.settings.isSideBarCollapsed = value;
                this.save();
            }
        });

        return new UiSettingsService();
    }]);

})(window);