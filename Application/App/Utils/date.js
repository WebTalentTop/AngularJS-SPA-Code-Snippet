(function () {
    'use strict';

    var $type = Date,
        $prototype;

    $type.__typeName = 'Date';
    $type.__class = true;
    $prototype = $type.prototype;

    $type.getToday = Date.getToday || function () {
        var today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    };

    $type.locale = {
        en: {
            month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        }
    };

    $type.fromString = Date.fromString || function (value) {
        if (value === undefined || value == null) {
            return null;
        }

        return new Date(value);
    };

    $type.getTimezoneShort = Date.getTimezoneShort || function () {
        var str = (new Date()).toString();

        // Split on the first ( character
        var s = str.split("(");

        if (s.length === 2) {
            // remove the ending ')'
            var n = s[1].replace(")", "");

            // split on words
            var parts = n.split(" ");
            var abbr = "";

            for (var i = 0; i < parts.length; i++) {
                // for each word - get the first letter
                abbr += parts[i].charAt(0).toUpperCase();
            }
            return abbr;
        }
    };

    $prototype.getMonthName = function (lang) {
        lang = lang && (lang in Date.locale) ? lang : 'en';
        return Date.locale[lang].month_names[this.getMonth()];
    };

    $prototype.getMonthNameShort = function (lang) {
        lang = lang && (lang in Date.locale) ? lang : 'en';
        return Date.locale[lang].month_names_short[this.getMonth()];
    };

    $prototype.addDays = function(days) {
        var dat = new Date(this.valueOf());
        dat.setDate(dat.getDate() + days);
        return dat;
    };

    $prototype.toUTC = function () {
        return Math.floor(new Date(
            this.getUTCFullYear(),
            this.getUTCMonth(),
            this.getUTCDate(),
            this.getUTCHours(),
            this.getUTCMinutes(),
            this.getUTCSeconds()
        ).getTime());
    };

    $prototype.toUTC2 = function () {
        return Date.UTC(
            this.getUTCFullYear(),
            this.getUTCMonth(),
            this.getUTCDate(),
            this.getUTCHours(),
            this.getUTCMinutes(),
            this.getUTCSeconds()
        );
    };
})();