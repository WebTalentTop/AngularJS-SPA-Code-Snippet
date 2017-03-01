(function (global) {
    'use strict';

    global.realineModule.factory('ObservableCollection', ['EventManager', 'CoreEnums',
    function (EventManager, CoreEnums) {

        var COLLECTION_CHANGED_EVENT = 'collection changed';

        var ObservableCollection = Class.extend({

            init: function () {
                this.__ClassName = 'ObservableCollection';
                this.list = [];
                this.eventManager = new EventManager();
            },

            push: function (item) {
                if (!global.angular.isArray(item)) {
                    item = [item];
                }

                if (item.length === 0) {
                    return;
                }

                Array.prototype.push.apply(this.list, item);
                this.fireAdd(this.list.length - item.length, item);
            },

            shift: function () {
                var item = this.first();

                if (item === null) {
                    return null;
                }

                this.removeAt(0);

                return item;
            },

            pop: function () {
                var item = this.last();

                if (item === null) {
                    return null;
                }

                this.removeAt(this.list.length - 1);
            },

            unshift: function (item) {
                if (!global.angular.isArray(item)) {
                    item = [item];
                }

                if (item.length === 0) {
                    return;
                }

                Array.prototype.unshift.apply(this.list, item);
                this.fireAdd(0, item);
            },

            insert: function (index, item) {
                if (!global.angular.isArray(item)) {
                    item = [item];
                }

                if (item.length === 0) {
                    return;
                }

                Array.prototype.splice.bind(this.list, index, 0).apply(this.list, item);

                this.fireAdd(index, item);
            },

            remove: function (item) {
                var index = this.list.indexOf(item);
                if (index < 0) {
                    return;
                }

                this.list.splice(index, 1);

                this.fireRemove(index, [item]);
            },

            removeAt: function (index, count) {
                var items;

                if (count === undefined || count === null) {
                    items = [this.list[index]];
                    this.list.splice(index, 1);

                    this.fireRemove(index, items);
                }
                else {
                    items = this.list.slice(index, index + count);
                    this.list.splice(index, count);
                    this.fireRemove(index, items);
                }
            },

            move: function (oldIndex, newIndex) {
                var item = this.list[oldIndex];
                var newItemIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;

                if (oldIndex === newIndex) {
                    return;
                }

                this.list.splice(oldIndex, 1);
                this.list.splice(newItemIndex, 0, item);

                this.fireMove(oldIndex, newIndex, item);
            },

            get: function (index) {
                return this.list[index];
            },

            set: function (index, newItem) {
                var oldItem = this.list[index];

                this.fireReplace(index, [newItem], [oldItem]);
            },

            first: function () {
                if (this.list.length === 0) {
                    return null;
                }

                return this.list[0];
            },

            last: function () {
                if (this.list.length === 0) {
                    return null;
                }

                return this.list[this.list.length - 1];
            },

            count: function () {
                return this.list.length;
            },

            length: function () {
                return this.list.length;
            },

            clear: function () {
                var oldList = this.list;
                this.list = [];
                if (oldList.length > 0) {
                    this.fireRemove(0, oldList);
                }
            },

            indexOf: function (item) {
                return this.list.indexOf(item);
            },

            lastIndexOf: function (item) {
                return this.list.lastIndexOf(item);
            },

            contains: function (callback, thisArg) {
                return this.find(callback, thisArg) !== null;
            },

            find: function (callback, thisArg) {
                return this.list.findItem(callback, thisArg);
            },

            findReverse: function (callback, thisArg) {
                var i;

                for (i = this.list.length - 1; i >= 0; i--) {
                    if (callback.call(thisArg, this.list[i], i, this)) {
                        return this.list[i];
                    }
                }

                return null;
            },

            findIndex: function (callback, thisArg) {
                return this.list.findIndex(callback, thisArg);
            },

            filter: function (callback, thisArg) {
                return this.list.filter(callback, thisArg);
            },

            map: function (callback, thisArg) {
                return this.list.map(callback, thisArg);
            },

            forEach: function (callback, thisArg) {
                var i;
                for (i = 0; i < this.list.length; i++) {
                    callback.call(thisArg, this.list[i])
                }
            },

            slice: function (start, end) {
                return this.list.slice(start, end);
            },

            sublist: function (startIndex, count) {
                return this.list.slice(startIndex, startIndex + count);
            },

            cloneArray: function () {
                return this.slice(0);
            },

            insertSorted: function (item, callback, thisArg) {
                var index = _.sortedIndex(this.list, item, callback, thisArg);

                this.insert(index, item);
            },

            bindCollectionChanged: function (listener, context) {
                this.eventManager.bind(COLLECTION_CHANGED_EVENT, listener, context);
            },

            unbindCollectionChanged: function (listener, context) {
                this.eventManager.detach(COLLECTION_CHANGED_EVENT, listener, context);
            },

            fireCollectionChanged: function (event) {
                event.type = COLLECTION_CHANGED_EVENT;
                event.sender = this;

                this.eventManager.fire(event);
            },

            fireAdd: function (startIndex, items) {
                var event = {
                    action: CoreEnums.CollectionAction.Add,
                    newStartingIndex: startIndex,
                    newItems: items
                };

                this.fireCollectionChanged(event);
            },

            fireRemove: function (statIndex, items) {
                var event = {
                    action: CoreEnums.CollectionAction.Remove,
                    oldStartingIndex: statIndex,
                    oldItems: items
                };

                this.fireCollectionChanged(event)
            },

            fireReplace: function (newStartingIndex, newItems, oldItems) {
                var event = {
                    action: CoreEnums.CollectionAction.Replace,
                    newStartingIndex: newStartingIndex,
                    newItems: newItems,
                    oldItems: oldItems
                };

                this.fireCollectionChanged(event);
            },

            fireMove: function (oldIndex, newIndex, item) {
                var event = {
                    action: CoreEnums.CollectionAction.Move,
                    oldIndex: oldIndex,
                    newIndex: newIndex,
                    item: item
                };

                this.fireCollectionChanged(event)
            },

            fireReset: function (newList, oldList) {
                var event = {
                    action: CoreEnums.CollectionAction.Reset,
                    newList: newList,
                    oldList: oldList,
                };

                this.fireCollectionChanged(event);
            }
        });

        return ObservableCollection;
    }]);
})(window);