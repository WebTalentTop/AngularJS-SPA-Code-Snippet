(function () {
    'use strict';

    angular.module('realine-config', [])
        .constant('appConfig', {
            crossDomainHub: 'https://test.crossdomainhub.realine.net/index.html',
            login: 'https://test.login.realine.net',
            accountSettings: 'https://test.accountsettings.realine.net',
            social: 'https://test.social.realine.net',
            userMasters: 'https://test.usermaster.realine.net',
            messenger: 'https://test.messenger.realine.net',
            newsFeed: 'https://test.realine.net',
            incomingBids: 'https://test.realine.net',
            incomingTenders: 'https://test.realine.net',
            loadSearch: 'https://test.realine.net',
            rating: 'https://test.realine.net',
            truckSearch: 'https://test.realine.net',
            eventFeed: 'https://test.realine.net',
            searchResultList: 'https://test.realine.net',
            launcher: 'https://test.launcher.realine.net',
            about: 'https://test.login.realine.net/#/Infrastructure/Main/About',
            socialSearch: 'https://test.social.realine.net/#/Biznet/Main/AdvancedSearch'
        });
})();