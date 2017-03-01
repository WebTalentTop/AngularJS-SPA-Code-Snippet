(function (global) {
    'use strict';

    global.realineModule.constant('errorConstants', {
        clientErrorTitle: 'Script Error:'
    });

    global.realineModule.constant('authConstants', {
        cookie: 'X-PlatformAuth',
        header: 'X-PlatformAuth',
        localStorage: 'X-PlatformAuth',
    });

    global.realineModule.constant('customHeaders', {
        version: 'X-ApiVersion',        
    });

    global.realineModule.constant('events', {
        login: 'login',
        logout: 'logout',
        companyLogout: 'companyLogout',

        unreadConversationsChanged: 'chat.unreadConversationsChanged', //param {count}
        conversationOpen: 'chat.conversationOpen', //param {conversation}
        conversationClosed: 'chat.conversationClosed',//param {conversation}
        createBusinessObjectConversation: 'chat.createBusinessObjectConversation', //param {businessObjectType, businessObjectId}
        createConversation: 'chat.createConversation',
        createStreamConversation: 'chat.createStreamConversation',
        openChildConversation: 'chat.openChildConversation',
        setMessageTextForConversation: 'chat.setMessageTextForConversation',
        userStatusChanged: 'chat.userStatusChanged',
        closeAllChatTabs: 'chat.closeAllchatWindows',
        setMuteAllConversations: 'chat.setMuteAllConversations',
        muteAllConversationsChanged: 'chat.setMuteAllConversationsChanged',
        openMessenger: 'chat.openMessenger',
        conversationOpenedOnPage: 'chat.conversationOpenedOnPage',
        newMessageReceived: 'chat.newMessageReceived',
        businessObjectRecordOpened: 'chat.businessObjectRecordOpened',
        businessObjectRecordClosed: 'chat.businessObjectRecordClosed',
        streamsAreaOpened: 'chat.streamsAreaOpened',
        streamsAreaClosed: 'chat.streamsAreaClosed',
        hideStreamsConversations: 'chat.hideStreamsConversations',
        setUserStatus: 'chat.setUserStatus',
        setupUnavailableMessage: 'chat.setupUnavailableMessage',        
        activeFolderChanged: 'chat.activeFolderChanged',
    });

    global.realineModule.constant('validationRegex', {
        email: /^[_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-z0-9-]+)*(\.[a-zA-Z]{2,4})$/,
        login: /^[a-zA-Z]/,
        postalCodeUS: /^(\d{5}(-\d{4})?|[A-Z]\d[A-Z] *\d[A-Z]\d)$/
    });

    global.realineModule.constant("messages", {
        savedSuccessfully: 'The record was saved successfully.',
        companyLogged: 'Company logged successfully',
        doYouWantToDelete: 'Are you sure you want to permanently delete item?',
        deletedSuccessfully: 'The record was deleted successfully.',

        login: {
            userNotFound: 'User "Login" is not found'
        },

        titles: {
            success: 'Success'
        },

        validation: {
            userChangePassword: {
                passwordRequired: 'Password is required.',
                passwordLength: 'Password minimal length is 8 symbols.',
                passwordEquality: 'Password does not matches.'
            }
        },

        notifications: {
            passwordChanged: 'Your password has been successfully changed.'
        }
    });

    global.realineModule.constant('countries', [
        { name: 'United States', key: 'US' },
        { name: 'Mexico', key: 'MX' }
    ]);

    global.realineModule.constant('countryPhoneCodes', [
         { name: "+1", key: "US" },
        { name: "+52", key: "MX" }
    ]);
})(window);
