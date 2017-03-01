(function (global) {
    'use strict';

    global.realineModule.filter('timeago', ['$filter', function ($filter) {

        var moment = global.moment,
            timeagoFilter;
        var longDateMode = 'longDateOnly',
            shortDateTime = 'shortDateTime';


        function isAgotime(today, input) {
            //if difference is less then 3 hours then display ago, otherwise display time

            if (moment(today).diff(input, 'hours') <= 3) {
                return true;
            }
            else {
                return false;
            }
        }

        timeagoFilter = function (input, mode) {
            if (!global.angular.isDate(input)) {
                return '';
            }

            var today = new Date();
            var time = $filter('date')(input, 'shortTime');
            var yesterday = moment().add(-1, 'days').toDate();

            if (isAgotime(today, input)) {
                return moment(input).fromNow();
            }

            if (input.getFullYear() === today.getFullYear()
                && input.getMonth() === today.getMonth()
                && input.getDate() === today.getDate()) {

                return time;
            }


            if (mode === shortDateTime) {
                if (input.getFullYear() === today.getFullYear()) {
                    return $filter('date')(input, 'd MMM') + ' ' + time;
                }
                else {
                    return $filter('date')(input, 'd MMM, yyyy') + ' ' + time;
                }
            }
            else {
                if (input.getFullYear() === yesterday.getFullYear()
                && input.getMonth() === yesterday.getMonth()
                && input.getDate() === yesterday.getDate()) {
                    return 'Yesterday';
                } else {
                    if (input.getFullYear() === today.getFullYear()) {
                        return $filter('date')(input, 'EEEE, d MMMM');
                    }
                    else {
                        return $filter('date')(input, 'EEEE, MMMM d, y');
                    }
                }
            }
        };

        timeagoFilter.isAgotime = isAgotime;

        return timeagoFilter;
    }]
);

})(window);