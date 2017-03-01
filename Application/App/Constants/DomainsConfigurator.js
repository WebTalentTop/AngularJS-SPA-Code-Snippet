(function (global) {
    'use strict';

    var configurator = global.Realine.configurator || {},
        domain = 'https://test.messenger.realine.net/',
        infrastructure = domain + 'infrastructure',
        social = domain + 'social',
        utility = domain + 'utility',
        business = domain + 'business',
        subDomains = {
            auth: '/Platform.Auth.Web',
            context: '/Platform.ContextMasterDirectory.Web',
            socialSearch: '/Platform.SocialSearch.Web',
            socialProfile: '/Platform.SocialProfile.Web',
            socialNewsfeed: '/Platform.SocialNewsfeed.Web',
            companySetup: '/Platform.CompanySetup.Web',
            feedback: '/Platform.Feedback.Web',
            referrals: '/Platform.Referral.Web',
            globaldictionarydata: '/Platform.globaldictionarydata.web',
            userImageGalery: '/Platform.ImageStorage.Web',
            companyImageGalery: '/SocialCompanyUserPlatform.ImageStorage.Web',
            eventFeed: '/Platform.EventFeed.Web/'
        };
    //domain = 'http://localhost:45614';

    global.Realine.configurator = configurator;

    configurator.domainsConfigurator = {
        _pathSeparator: '/',
        buildDomain: function () {
            var url = Array.prototype.slice.call(arguments).join(this._pathSeparator);
            return url;
        }
    };

    global.realineModule.constant('Domains', {
        Domain: infrastructure,
        Auth: infrastructure + subDomains.auth,
        UserImagesGalery: infrastructure + subDomains.userImageGalery + '/api/ImageStorage/Save',
        CompanyImagesGalery: social + subDomains.companyImageGalery + '/api/ImageStorage/Save',
        Company: infrastructure,
        ShipmentRequests: infrastructure,
        Self: 'http://localhost:49943',
        Captcha: '/Captcha/Get',
        Context: infrastructure + subDomains.context,
        SocialSearch: social + subDomains.socialSearch,
        SocialProfile: social + subDomains.socialProfile,
        SocialNewsfeed: social + subDomains.socialNewsfeed,
        CompanySetup: infrastructure + subDomains.companySetup,
        Feedback: utility + subDomains.feedback,
        Referrals: utility + subDomains.referrals,
        GlobalDictionaryData: infrastructure + subDomains.globaldictionarydata,
        CompanyAuth: business + subDomains.auth,
        EventFeed: social + subDomains.eventFeed,
        MessengerServer: 'https://test.messenger.realine.net/signalr/',
        MessengerUser: 'https://test.messenger.realine.net/utility/platform.messenger.web/',
		//MessengerServer: 'http://test.s1.utility.realine.net:9085/signalr',
        //MessengerUser: 'http://test.s1.utility.realine.net:9085',
        MessengerDocumentStorage: 'http://test.realine.net/utility/platform.DocumentStorage.Web',
        MessengerImagesStorage: 'http://test.realine.net/infrastructure/Platform.ImageStorage.Web',
    });
})(window);
