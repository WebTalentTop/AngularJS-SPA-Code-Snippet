(function (global) {
    'use strict';

    global.realineModule.filter('friendlyDate', ['$filter', function ($filter) {

        var filter = function (input, mode) {
            if (!global.angular.isDate(input)) {
                return '';
            }

            var today = new Date();
            var time = $filter('date')(input, 'shortTime');

            if (input.getFullYear() === today.getFullYear()
                && input.getMonth() === today.getMonth()
                && input.getDate() === today.getDate()) {

                return 'Today';
            }
            else if (input.getFullYear() === today.getFullYear()) {
                return $filter('date')(input, 'd MMM');
            }
            else {
                return $filter('date')(input, 'd MMM, yyyy');
            }

        };

        function isFriendly(input) {
            var today = new Date();

            if (input.getFullYear() === today.getFullYear()
                && input.getMonth() === today.getMonth()
                && input.getDate() === today.getDate()) {

                return true;
            }
            else {
                return false;
            }
        }

        filter.isFriendly = isFriendly;

        return filter
    }]
);

})(window);