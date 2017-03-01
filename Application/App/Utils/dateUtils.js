(function (global) {
    'use strict';

    global.realineModule.factory('dateUtils', function () {
        return {
            getCurrentDayRange: function () {
                var now = new Date(),
                    today = now.getDate(),
                    year = now.getFullYear(),
                    month = now.getMonth(),
                    start = new Date(year, month, today),
                    end = new Date(year, month, today + 1);

                return {
                    start: start,
                    end: end
                };
            },

            getFormattedDate: function (date) {
                date = new Date(Date.parse(date));

                var year = date.getFullYear();
                var month = (1 + date.getMonth()).toString();
                month = month.length > 1 ? month : '0' + month;
                var day = date.getDate().toString();
                day = day.length > 1 ? day : '0' + day;
                return month + '/' + day + '/' + year;
            },

            getCurrentWeekRange: function () {
                var now = new Date(),
                    year = now.getFullYear(),
                    month = now.getMonth(),
                    week = (now.getDate() - now.getDay()) / 7,
                    start = new Date(year, month, week * 7),
                    end = new Date(year, month, (week + 1) * 7);

                return {
                    start: start,
                    end: end
                };
            },

            getCurrentMonthRange: function () {
                var now = new Date(),
                    year = now.getFullYear(),
                    month = now.getMonth(),
                    start = new Date(year, month, 0),
                    end = new Date(year, month + 1, 0);

                return {
                    start: start,
                    end: end
                };
            },

            getCurrentYearRange: function () {
                var year = (new Date()).getFullYear(),
                    start = new Date(year, 0, 0),
                    end = new Date(year + 1, 0, 0);

                return {
                    start: start,
                    end: end
                };
            },

            resetTime: function (date) {
                var day = new Date(date.getTime());
                day.setHours(0, 0, 0, 0);

                return day;
            },

            getDate: function (date) {
                return date ? date.toJSON().substring(0, 10).replace('T', ' ') : null;
            },

            getTime: function (date) {
                return date ? date.toJSON().substring(10, 19).replace('T', ' ') : null;
            },

            getDateTime: function (date) {
                return date ? date.toJSON().substring(0, 19).replace('T', ' ') : null;
            },

            getDateTimeWithoutSeconds: function (date) {
                return date ? date.toJSON().substring(0, 16).replace('T', ' ') : null;
            },

            dateDiff: function (date1, date2, interval) {
                if (!date1 || !date2) {
                    return undefined;
                }

                var second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24, week = day * 7;
                date1 = new Date(date1);
                date2 = new Date(date2);
                var timediff = date2 - date1;
                if (isNaN(timediff)) return NaN;
                switch (interval) {
                    case "years":
                        return date2.getFullYear() - date1.getFullYear();
                    case "months":
                        return (
                            (date2.getFullYear() * 12 + date2.getMonth())
                                -
                                (date1.getFullYear() * 12 + date1.getMonth())
                        );
                    case "weeks":
                        return Math.floor(timediff / week);
                    case "days":
                        return Math.floor(timediff / day);
                    case "hours":
                        return Math.floor(timediff / hour);
                    case "minutes":
                        return Math.floor(timediff / minute);
                    case "seconds":
                        return Math.floor(timediff / second);
                    default:
                        return undefined;
                }
            }
        };
    });
})(window);