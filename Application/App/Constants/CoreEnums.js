(function (global) {
    'use strict';

    global.realineModule.constant('CoreEnums', {
        HubConnectionState: {
            Connecting: 'Connecting',
            Connected: 'Connected',
            Reconnecting: 'Reconnecting',
            Disconnected: 'Disconnected'
        },

        CollectionAction: {
            Add: 'Add',
            Remove: 'Remove',
            Replace: 'Replace',
            Move: 'Move',
            Reset: 'Reset',
        },

        DictionaryAction: {
            Add: 'Add',
            Remove: 'Remove',            
        },

        IdPropertyName: 'Id',
    });
})(window);