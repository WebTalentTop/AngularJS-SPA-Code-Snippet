(function (global) {
    'use strict';

    global.realineMessenger.constant('MessengerEnums', {

        UserStatuses: {
            Unknown: 'Unknown',
            Online: 'Online',
            Offline: 'Offline',
            Away: 'Away',
            Busy: 'Busy'
        },

        MessageType: {
            TextMessage: 'TextMessage',
            AddParticipants: 'AddParticipants',
            LeaveConversation: 'LeaveConversation',
            RenameConversation: 'RenameConversation',
            Attachment: 'Attachment',
            Redirect: 'Redirect',
            UserRedirect: 'UserRedirect',
            MessageDeleted: 'MessageDeleted',
            ParticipantRemoved: 'ParticipantRemoved',
            GroupConversationCreated: 'GroupConversationCreated',
            ParticipantJoined: 'ParticipantJoined',
        },

        MessageState: {
            Success: 'Success',
            Sending: 'Sending',
            Error: 'Error',
        },

        FileUploadState: {
            Pending: 'Pending',
            Success: 'Success',
            Failed: 'Failed',
            Cancelled: 'Cancelled'
        },

        PropertyNames: {
            //common
            Id: 'Id',
            Name: 'Name',
            FirstName: 'FirstName',
            LastName: 'LastName',
            About: 'About',
            AvatarThumb: 'AvatarThumb',
            AvatarSourceUrl: 'AvatarSourceUrl',

            //message       
            IsRead: 'IsRead',
            Text: 'Text',
            AuthorId: 'AuthorId',
            ConversationId: 'ConversationId',
            CreateDate: 'CreateDate',
            MessageType: 'MessageType',
            Content: 'Content',
            AutoReplied: 'AutoReplied',
            RedirectedTo: 'RedirectedTo',
            ReadBy: 'ReadBy',
            IsDeleted: 'IsDeleted',
            State: 'State',
            LocalMasterId: 'LocalMasterId',

            //message record
            AuthorVisible: 'AuthorVisible',

            //user        
            Status: 'Status',
            FullName: 'FullName',
            GroupId: 'GroupId',
            BackgroundUrl: 'BackgroundUrl',

            //global user                        
            ContextGlobalMasterId: 'ContextGlobalMasterId',
            ContextName: 'ContextName',
            MessengerProfileType: 'MessengerProfileType',
            IsLoggedIn: 'IsLoggedIn',

            //conversation
            DisplayName: 'DisplayName',
            Title: 'Title',
            Subtitle: 'Subtitle',
            UnreadMessagesCount: 'UnreadMessagesCount',
            LastMessageDate: 'LastMessageDate',
            LastMessageText: 'LastMessageText',
            BusinessObjecType: 'BusinessObjecType',
            BusinessObjecId: 'BusinessObjecId',
            BusinessTransactionId: 'BusinessTransactionId',
            RequestId: 'RequestId',
            IsJoinedConversation: 'IsJoinedConversation',
            IsMuted: 'IsMuted',
            Type: 'Type',
            StreamId: 'StreamId',
            CompanyId: 'CompanyId',

            //conversation record
            IsSelected: 'IsSelected',

            //tags
            TagType: 'FolderType',
            UnreadConversationsCount: 'UnreadConversationsCount',

            //Attachments
            FileName: 'FileName',
            FileType: 'FileType',
            FileData: 'FileData',
        },

        FileType: {
            Document: 0,//'Document',
            Image: 1,//'Image'
        },

        ConversationType: {
            Private: 'Private',
            Group: 'Group',
            Public: 'Public',
        },

        MessengerProfileType: {
            User: 0,
            Company: 1,
        },

        MessengerPanelOpenAction: {
            None: 'none',
            Minimize: 'minimize',
            Maximize: 'maximize',
        },

        OrderDirection: {
            Asc: 0,
            Desc: 1,
        },

        TagType: {
            Draft: 0,
            Inbox: 1,
            Archive: 2,
            CustomFolder: 4,
            Starred: 5
        },

        CacheAction: {
            Add: 'Add',
            Remove: 'Remove',
        }
    });
})(window);