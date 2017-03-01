(function (global) {
    'use strict';

    global.realineModule.factory('EntityDictionary', ['EventManager', 'CoreEnums',
        function (EventManager, CoreEnums) {

            var DICTIONARY_CHANGED_EVENT = 'dictionary changed';

            var EntityDictionary = Class.extend({
                init: function () {
                    this.__ClassName = 'EntityDictionary';
                    this.dict = {};
                    this.eventManager = new EventManager();
                },

                contains: function (item) {
                    return this.dict.hasOwnProperty(item.getId());
                },

                containsId: function (id) {
                    return this.dict.hasOwnProperty(id);
                },

                add: function (item) {
                    var i;
                    var newItems;

                    if (!global.angular.isArray(item)) {
                        if (!this.contains(item)) {
                            this.dict[item.getId()] = item;
                            this.fireAdd([item]);
                            return [item];
                        }

                        return [];
                    }

                    newItems = [];

                    for (i = 0; i < item.length; i++) {
                        if (!this.contains(item[i])) {
                            this.dict[item[i].getId()] = item[i];
                            newItems.push(item[i]);
                        }
                    }

                    this.fireAdd(newItems);

                    return newItems;
                },

                remove: function (item) {
                    if (!global.angular.isArray(item)) {
                        this.fireRemove([this.dict[item.getId()]]);
                        delete this.dict[item.getId()];
                        return;
                    }

                    var i, items = [];
                    for (i = 0; i < item.length; i++) {
                        items.push(this.dict[item[i].getId()]);
                        delete this.dict[item[i].getId()];
                    }

                    this.fireRemove(items);
                },

                removeById: function (id) {
                    if (!this.containsId(id)) {
                        return;
                    }
                    this.fireRemove([this.dict[id]]);
                    delete this.dict[id];
                },

                clear: function () {
                    this.dict = {};
                },

                get: function (id) {
                    if (!this.dict[id]) {
                        return null;
                    }
                    else {
                        return this.dict[id];
                    }
                },

                list: function () {
                    var prop,
                        list = [];
                    for (prop in this.dict) {
                        list.push(this.dict[prop]);
                    }

                    return list;
                },

                bindDictionaryChanged: function (listener, context) {
                    this.eventManager.bind(DICTIONARY_CHANGED_EVENT, listener, context);
                },

                unbindDictionaryChanged: function (listener, context) {
                    this.eventManager.detach(DICTIONARY_CHANGED_EVENT, listener, context);
                },

                fireAdd: function (items) {
                    var event = {
                        action: CoreEnums.DictionaryAction.Add,
                        items: items
                    };

                    this.fireCollectionChanged(event);
                },

                fireRemove: function (items) {
                    var event = {
                        action: CoreEnums.DictionaryAction.Remove,
                        items: items
                    };

                    this.fireCollectionChanged(event)
                },

                fireCollectionChanged: function (event) {
                    event.type = DICTIONARY_CHANGED_EVENT;
                    event.sender = this;

                    this.eventManager.fire(event);
                },
            });

            return EntityDictionary;

        }]);
})(window);