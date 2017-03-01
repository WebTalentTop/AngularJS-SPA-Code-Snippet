(function (global) {
    'use strict';

    global.app.factory('cookieService', [function () {
        return {
            pluses: /\+/g,

            defaults: {},

            encode: function (s) {
                return this.cookie.raw ? s : encodeURIComponent(s);
            },

            decode: function (s) {
                return this.cookie.raw ? s : decodeURIComponent(s);
            },

            stringifyCookieValue: function (value) {
                return this.encode(this.cookie.json ? JSON.stringify(value) : String(value));
            },

            parseCookieValue: function (s, returnEncoded) {
                if (s.indexOf('"') === 0) {
                    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                }

                if (returnEncoded) {
                    return s;
                }

                try {
                    s = decodeURIComponent(s.replace(this.pluses, ' '));
                    return this.cookie.json ? JSON.parse(s) : s;
                } catch (e) { }
            },

            read: function (s, converter) {
                var value = this.cookie.raw ? s : this.parseCookieValue(s);
                return this.isFunction(converter) ? converter(value) : value;
            },

            cookie: function (key, value, options) {
                if (value !== undefined && !this.isFunction(value)) {
                    if (typeof options.expires === 'number') {
                        var days = options.expires,
                            t = options.expires = new Date();
                        t.setTime(+t + days * 864e+5);
                    }

                    return (document.cookie = [
				        this.encode(key), '=', this.stringifyCookieValue(value),
				        options.expires ? '; expires=' + options.expires.toUTCString() : '',
				        options.path ? '; path=' + options.path : '',
				        options.domain ? '; domain=' + options.domain : '',
				        options.secure ? '; secure' : ''
                    ].join(''));
                }

                // Read

                var result = key ? undefined : {};

                // To prevent the for loop in the first place assign an empty array
                // in case there are no cookies at all. Also prevents odd result when
                // calling cookie().
                var cookies = document.cookie ? document.cookie.split('; ') : [];

                for (var i = 0, l = cookies.length; i < l; i++) {
                    var parts = cookies[i].split('=');
                    var name = this.decode(parts.shift());
                    var cookie = parts.join('=');

                    if (key && key === name) {
                        // If second argument (value) is a function it's a converter...
                        result = this.read(cookie, value);
                        break;
                    }

                    // Prevent storing a cookie that we couldn't decode.
                    if (!key && (cookie = this.read(cookie)) !== undefined) {
                        result[name] = cookie;
                    }
                }

                return result;
            },

            rawCookie: function(key){
                var result = key ? undefined : {};

                var cookies = document.cookie ? document.cookie.split('; ') : [];

                for (var i = 0, l = cookies.length; i < l; ++i) {
                    var parts = cookies[i].split('=');
                    var name = this.decode(parts.shift());
                    var cookie = parts.join('=');

                    if (key && key === name) {
                        result = this.parseCookieValue(cookie, true);
                        break;
                    }

                    if (!key && (cookie = this.read(cookie)) !== undefined) {
                        result[name] = cookie;
                    }
                }

                return result;
            },

            removeCookie: function (key, options) {
                if (this.cookie(key) === undefined) {
                    return false;
                }

                this.cookie(key, '', { expires: -1 });
                return !this.cookie(key);
            },

            isFunction: function (func) {
                return Object.prototype.toString.call(func) == '[object Function]';
            }
        };
    }]);
})(window);