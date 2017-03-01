(function (global) {
    'use strict';

    global.realineMessenger.factory('messengerSettingsService', ['utils', '$window', '$log',
    function (utils, $window, $log) {
        var MESSENGER_SETTINGS = 'messenger_settings';

        var MessengerSettingsService = Class.extend({
            init: function () {
                var opts = null;

                this.settings = {
                    isPanelVisible: true,
                    isPanelMinimized: true,
                };

                opts = $window.localStorage[MESSENGER_SETTINGS];

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
                $window.localStorage[MESSENGER_SETTINGS] = JSON.stringify(this.settings);
            },

            getIsPanelVisible: function () {
                return this.settings.isPanelVisible;
            },

            setIsPanelVisible: function (value) {
                this.settings.isPanelVisible = value;
                this.save();
            },

            getIsPanelMinimized: function () {
                return this.settings.isPanelMinimized;
            },

            setIsPanelMinimized: function (value) {
                this.settings.isPanelMinimized = value;
                this.save();
            }
        });

        return new MessengerSettingsService();
    }]);

})(window);