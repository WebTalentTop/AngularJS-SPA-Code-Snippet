(function(global) {
    'use strict';

    global.realineModule.factory('backService', [
        '$window', '$location', 'pageNavigationService',
        function($window, $location, pageNavigationService) {

            var resolveTable = {};

            return {
                back: function() {
                    window.historyItems.length > 1 ? this.checkSkippingPages() : this.resolveBackUri();
                },

                resolveBackUri: function() {
                    var hashBang = $location.$$html5 ? '' : '#',
                        uri = hashBang + $location.path(),
                        requiredUri;

                    for (var key in pageNavigationService.pageLinks) {
                        if (pageNavigationService.pageLinks.hasOwnProperty(key)) {
                            if (pageNavigationService.pageLinks[key].Url === uri) {
                                requiredUri = key;
                                break;
                            }
                        }
                    }

                    var changeLoc = pageNavigationService.changeLocation.bind(pageNavigationService);

                    requiredUri !== undefined
                        ? resolveTable[requiredUri] !== undefined
                        ? changeLoc(resolveTable[requiredUri])
                        : changeLoc(pageNavigationService.pageLinks.Index)
                        : changeLoc(pageNavigationService.pageLinks.Index);
                },

                checkSkippingPages: function() {
                    for (var i = window.historyItems.length - 1; i > 0; i--) {
                        var currentPageDisplayName = window.historyItems[i].$$route.pageDisplayName;
                        if (currentPageDisplayName === "Terms"
                            || currentPageDisplayName === "About"
                            || currentPageDisplayName === "Privacy Policy"
                            || $location.path() === window.historyItems[i].$$route.originalPath) {
                            continue;
                        } else {
                            var pageKey = "Index";
                            for (var key in pageNavigationService.pageLinks) {
                                if (pageNavigationService.pageLinks.hasOwnProperty(key)) {
                                    if (pageNavigationService.pageLinks[key].Url === window.historyItems[i].$$route.originalPath) {
                                        pageKey = key;
                                        break;
                                    }
                                }
                            }

                            pageNavigationService.changeLocation(pageNavigationService.pageLinks[pageKey], window.historyItems[i].params);
                            return;
                        }
                    }

                    this.resolveBackUri();
                },

                addResolvePage: function(links) {
                    global.angular.extend(resolveTable, links);
                }
            };
        }
    ]);
})(window);