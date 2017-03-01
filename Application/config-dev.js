(function () {
  'use strict';

  angular.module('realine-config', [])
      .constant('appConfig', {
        crossDomainHub: 'http://dev.crossdomainhub.realine.net/index.html',
        login: 'http://dev.login.realine.net',
        accountSettings: 'http://dev.accountsettings.realine.net',
        social: 'http://dev.social.realine.net',
        userMasters: 'http://dev.usermaster.realine.net',
        messenger: 'http://test.realine.net',
        newsFeed: 'http://test.realine.net',
        incomingBids: 'http://test.realine.net',
        incomingTenders: 'http://test.realine.net',
        loadSearch: 'http://test.realine.net',
        rating: 'http://test.realine.net',
        truckSearch: 'http://test.realine.net',
        eventFeed: 'http://test.realine.net',
        searchResultList: 'http://test.realine.net'
      });
})();