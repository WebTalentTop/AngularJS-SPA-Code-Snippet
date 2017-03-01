(function (global) {
    'use strict';

    global.realineMessenger.factory('notificationHub', [
        'HubBase', 'utils', 'signalRUtils', '$rootScope', '$q', '$log', '$',
    function (HubBase, utils, signalRUtils, $rootScope, $q, $log, $) {

        var CONTACT_ADDED_EVENT = 'contact added',
            CONTACT_REMOVED_EVENT = 'contact removed',
        USER_INFO_CHANGED_EVENT = 'user info changed',
        COMPANY_INFO_CHANGED_EVENT = 'company info changed',
        COMPANY_USER_ADDED_EVENT = 'company user added',
        NOTIVICATION_RECEIVED = 'notification received';

        var NotificationHub = HubBase.extend({
            init: function () {
                this._super($.connection.notificationHub);
            },

            notifyContactAdded: function (contactMasterId) {
                return signalRUtils.callMethod(
                    this.hub.server.notifyContactAdded,
                    this.hub, [contactMasterId]);
            },

            bindHubEvents: function () {
                this.hub.client.onContactAdded = function (data) {
                    this.fireNotifyContactAdded(data);
                }.bind(this);

                this.hub.client.onContactRemoved = function (data) {
                    this.fireContactRemoved(data);
                }.bind(this);

                this.hub.client.onUserInfoChanged = function (data) {
                    this.fireUserInfoChanged(data);
                }.bind(this);

                this.hub.client.onCompanyInfoChanged = function (data) {
                    this.fireCompanyInfoChanged(data);
                }.bind(this);

                this.hub.client.onCompanyUserAdded = function (data) {
                    this.fireCompanyUserAdded(data);
                }.bind(this);

                this.hub.client.onNotification = function (data) {
                    preprocessNotification(data);
                    this.fireNotificationReceived(data);
                }.bind(this);
            },

            dummy: function () {
                return signalRUtils.callMethod(
                   this.hub.server.dummy,
                   this.hub, []);
            },

            //
            // events
            //

            bindNotifyContactAdded: function (handler, context) {
                this.eventManager.bind(CONTACT_ADDED_EVENT, handler, context);
            },

            unbindNotifyContactAdded: function (handler, context) {
                this.eventManager.detach(CONTACT_ADDED_EVENT, handler, context);
            },

            fireNotifyContactAdded: function (data) {
                var fired = this.eventManager.fire({
                    type: CONTACT_ADDED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindContactRemoved: function (handler, context) {
                this.eventManager.bind(CONTACT_REMOVED_EVENT, handler, context);
            },

            unbindContactRemoved: function (handler, context) {
                this.eventManager.detach(CONTACT_REMOVED_EVENT, handler, context);
            },

            fireContactRemoved: function (data) {
                var fired = this.eventManager.fire({
                    type: CONTACT_REMOVED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindUserInfoChanged: function (handler, context) {
                this.eventManager.bind(USER_INFO_CHANGED_EVENT, handler, context);
            },

            unbindUserInfoChanged: function (handler, context) {
                this.eventManager.detach(USER_INFO_CHANGED_EVENT, handler, context);
            },

            fireUserInfoChanged: function (data) {
                var fired = this.eventManager.fire({
                    type: USER_INFO_CHANGED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindCompanyInfoChanged: function (handler, context) {
                this.eventManager.bind(COMPANY_INFO_CHANGED_EVENT, handler, context);
            },

            unbindCompanyInfoChanged: function (handler, context) {
                this.eventManager.detach(COMPANY_INFO_CHANGED_EVENT, handler, context);
            },

            fireCompanyInfoChanged: function (data) {
                var fired = this.eventManager.fire({
                    type: COMPANY_INFO_CHANGED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindCompanyUserAdded: function (handler, context) {
                this.eventManager.bind(COMPANY_USER_ADDED_EVENT, handler, context);
            },

            unbindCompanyUserAdded: function (handler, context) {
                this.eventManager.detach(COMPANY_USER_ADDED_EVENT, handler, context);
            },

            fireCompanyUserAdded: function (data) {
                var fired = this.eventManager.fire({
                    type: COMPANY_USER_ADDED_EVENT,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },

            //

            bindNotificationReceived: function (handler, context) {
                this.eventManager.bind(NOTIVICATION_RECEIVED, handler, context);
            },

            unbindNotificationReceived: function (handler, context) {
                this.eventManager.detach(NOTIVICATION_RECEIVED, handler, context);
            },

            fireNotificationReceived: function (data) {
                var fired = this.eventManager.fire({
                    type: NOTIVICATION_RECEIVED,
                    data: data
                });

                if (fired) {
                    $rootScope.safeApply();
                }
            },
        });

        function preprocessNotification(notification) {
            //notification.Status = getNotificationStatus(notification.Status);
        }

        //function getNotificationStatus(value) {
        //    switch (value) {
        //        case 0:
        //            return NotificationsEnums.NotificationStatus.New;
        //        case 1:
        //            return NotificationsEnums.NotificationStatus.Unread;
        //        case 2:
        //            return NotificationsEnums.NotificationStatus.Read;
        //        default:
        //            $log.debug('Unknown notification status value: ' + value);

        //    }
        //}

        return new NotificationHub();
    }]);

})(window);