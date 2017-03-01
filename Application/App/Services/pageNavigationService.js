(function (global) {
    'use strict';

    global.realineModule.factory('pageNavigationService', ['$location', '$window',
        function ($location, $window) {
            return {
                pageLinks: {
                },

                addPageLinks: function (links) {
                    global.angular.extend(this.pageLinks, links);
                },

                changeLocation: function (page, params) {
                    if (global.angular.isString(page)) {
                        page = this.pageByName(page);
                    }

                    if (page.Away) {
                        var url = page.Url;

                        if(params){
                            var urlParams = "";
                            for (var key in params) {
                                if (!params.hasOwnProperty(key)) {
                                    continue;
                                }

                                if (urlParams !== "") {
                                    urlParams += "&";
                                }
                                urlParams += key + "=" + encodeURIComponent(params[key]);
                            }
                            url += '?' + urlParams;
                        }

                        $window.location.href = url;
                        return;
                    }

                    if (!params) {
                        $location.path(page.Url).search({});
                    } else {
                        $location.path(page.Url).search(params);
                    }
                },

                findPage: function (url) {

                    url = url.trimEnd("/");

                    for (var propertyName in this.pageLinks) {
                        if (this.pageLinks[propertyName].Url.endsWith(url)) {
                            return this.pageLinks[propertyName];
                        }
                    }
                    return null;
                },

                pageByName: function (name) {
                    return this.pageLinks[name];
                }
            };
        }
    ]);
})(window);
