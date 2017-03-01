(function (global) {
    'use strict';

    global.realineMessenger.filter('chatMessageDate', ['$filter', function ($filter) {
        //formats datetime to display as create date/time
        return function (input) {
            if (!angular.isDate(input)) {
                return '';
            }

            var today = new Date();
            var time = $filter('date')(input, 'shortTime');


            if (input.getFullYear() === today.getFullYear()
                && input.getMonth() === today.getMonth()
                && input.getDate() === today.getDate()) {
                return time;
            }
            else if (input.getFullYear() === today.getFullYear()) {
                return $filter('date')(input, 'd MMM') + ' ' + time;
            }
            else {
                return $filter('date')(input, 'd MMM, yyyy') + ' ' + time;
            }

        };
    }]
);

})(window);