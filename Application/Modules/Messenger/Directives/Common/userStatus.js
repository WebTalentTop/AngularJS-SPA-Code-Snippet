(function (global) {
    'use strict';

    global.realineMessenger.directive('userStatus', ['contactsCacheService', 'MessengerEnums', 'utils', '$log', '$',
    function (contactsCacheService, MessengerEnums, utils, $log, $) {
        return {
            restrict: 'A',

            //replace: true,

            //scope: {},

            //template: '',

            link: function ($scope, element, attrs) {

                var Directive = Class.extend({
                    init: function () {
                        var contact;

                        this.contact = null;
                        this.user = null;
                        this.profile = null;

                        this.userExpression = attrs['userStatus'];

                        contact = $scope.$eval(this.userExpression);

                        if (!utils.common.isNullOrUndefined(contact)) {
                            this.setupContact(contact);
                        }

                        this.bindEvents();
                    },

                    setupContact: function (contact) {
                        this.contact = contact;

                        if (this.contact.__ClassName === 'UserModel') {
                            this.setupUser(this.contact);
                        } else {
                            this.setupProfile(this.contact);
                        }
                    },

                    setupUser: function (user) {
                        this.user = user;
                        this.user.bindPropertyChanged(this.onUser_PropertyChanged, this);
                        this.updateUIState(this.user.getStatus());
                    },

                    setupProfile: function (profile) {
                        this.profile = profile;

                        if (this.profile.isLoaded) {
                            this.onProfileLoaded();
                        }
                        else {
                            this.profile.bindLoaded(this.onProfileLoaded, this);
                        }
                    },

                    onProfileLoaded: function (event) {
                        var indexUserId = this.profile.getGroupId();
                        var indexUser;
                        if (contactsCacheService.isCached(indexUserId)) {
                            indexUser = contactsCacheService.get(indexUserId);
                            this.setupUser(indexUser);
                        }
                        else {
                            this.updateUIState(MessengerEnums.UserStatuses.Unknown);
                        }
                    },

                    onUser_PropertyChanged: function (event) {
                        if (event.property === MessengerEnums.PropertyNames.Status) {
                            this.updateUIState(event.newValue, event.oldValue);
                        }
                    },

                    updateUIState: function (newValue, oldValue) {
                        if (!utils.common.isNullOrUndefined(oldValue)) {
                            element.removeClass(getCssClassByStatus(oldValue));
                        }

                        if (!utils.common.isNullOrUndefined(newValue)) {
                            element.addClass(getCssClassByStatus(newValue));
                        }
                    },

                    bindEvents: function () {
                        $scope.$on('$destroy', function () {
                            this.onDestroy();
                        }.bind(this));
                    },

                    onDestroy: function () {
                        if (!utils.common.isNullOrUndefined(this.user)) {
                            this.user.unbindPropertyChanged(this.onUser_PropertyChanged, this)
                        }

                        if (!utils.common.isNullOrUndefined(this.profile)) {
                            this.profile.unbindLoaded(this.onProfileLoaded, this);
                        }
                    }
                });

                function getCssClassByStatus(status) {
                    switch (status) {
                        case MessengerEnums.UserStatuses.Unknown:
                            return 'unknown';
                        case MessengerEnums.UserStatuses.Online:
                            return 'online';
                        case MessengerEnums.UserStatuses.Offline:
                            return 'offline';
                        case MessengerEnums.UserStatuses.Away:
                            return 'away';
                        case MessengerEnums.UserStatuses.Busy:
                            return 'busy';
                    }
                }


                $scope.directive = new Directive();
            },

            controller: ['$scope', function ($scope) {



            }],
        }
    }
    ]);

})(window);