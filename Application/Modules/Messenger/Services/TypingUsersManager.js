(function (global) {
    'use strict';

    global.realineMessenger.factory('TypingUsersManager', [
    'ObservableCollection', '$timeout', '$log', function (ObservableCollection, $timeout, $log) {

        //used to make typing animation without interuptions        
        var TIMEOUT_RESERVE = 300;

        var TypingUsersManager = Class.extend({

            init: function (typingTimeoutInterval) {
                this.list = new ObservableCollection();
                this.typingTimeoutInterval = typingTimeoutInterval;
            },

            add: function (user) {
                var typingUser = this.list.find(function (item) {
                    return item.user.getId() === user.getId();
                });

                if (typingUser) {
                    this.updateInternal(typingUser);
                }
                else {
                    this.addInternal(user);
                }
            },

            addInternal: function (user) {
                var typingUser = {
                    user: user,
                    timer: $timeout(this.remove.bind(this, user),
                                    this.typingTimeoutInterval + TIMEOUT_RESERVE)
                };

                this.list.push(typingUser);
            },

            updateInternal: function (typingUser) {

                $timeout.cancel(typingUser.timer);
                typingUser.timer = $timeout(this.remove.bind(this, typingUser.user),
                                            this.typingTimeoutInterval + TIMEOUT_RESERVE)
            },

            remove: function (user) {
                var typingUser = this.list.find(function (item) {
                    return item.user.getId() === user.getId();
                });

                if (!typingUser) {
                    return;
                }

                var index = this.list.indexOf(typingUser);

                $timeout.cancel(typingUser.timer);

                this.list.removeAt(index);
            },

            clear: function () {
                var i;

                for (i = 0; i < this.list.length() ; i++) {
                    $timeout.cancel(this.list.gte(i).timer);
                }

                this.list.clear();
            }
        });

        return TypingUsersManager;
    }
    ]);

})(window);