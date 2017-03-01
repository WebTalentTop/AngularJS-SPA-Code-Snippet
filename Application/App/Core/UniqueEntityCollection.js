(function (global) {
    'use strict';

    global.realineModule.factory('UniqueEntityCollection', ['EntityCollection', 'EntityDictionary', 'CoreEnums', 'observable',
    function (EntityCollection, EntityDictionary, CoreEnums, observable) {
        /*
        * @class UniqueEntityCollection - checks entity by id before adding to list
        */

        var UniqueEntityCollection = EntityCollection.extend({
            init: function () {
                this._super();

                this.dict = new EntityDictionary();
                this.__ClassName = 'UniqueEntityCollection';
            },

            push: function (item) {
                var newItems = this.dict.add(item);
                this._super(newItems);
            },

            unshift: function (item) {
                var newItems = this.dict.add(item);
                this._super(newItems);
            },

            insert: function (index, item) {
                var newItems = this.dict.add(item);
                this._super(index, newItems);
            },           

            remove: function (item) {
                if (!this.dict.contains(item)) {
                    return;
                }

                this.dict.remove(item);

                this._super(item);
            },

            removeAt: function (index, count) {
                var i,
                    items;

                if (count === undefined || count === null) {
                    count = 1;
                }

                items = this.list.slice(index, index + count);
                this.dict.remove(items);
                this._super(index, count);
            },

            set: function (index, newItem) {
                throw new Error('Not supported.');
                ////limited support of this method
                //var oldItem = this.list[index];

                //this.dict.remove(oldItem);

                //if (this.dict.contains(newItem)) {
                //    throw new Error('Inserting duplicate item in collection.');
                //}

                //this.dict.add(newItem);
            },

            clear: function () {
                this.dict.clear();
                this._super();
            },

            findById: function (id) {
                return this.dict.get(id);
                //return this.find(function (item) {
                //    return item.getId() === id;
                //});
            },

            containsById: function (id) {
                return this.dict.containsId(id);
                //return this.contains(function (item) {
                //    return item.getId() === id;
                //});
            },

            containsAnyId: function (ids) {
                var i;
                for (i = 0; i < ids.length; i++) {
                    if (this.dict.containsId(ids[i])) {
                        return true;
                    }
                }

                return false;
            },

            containsAny: function (items) {
                var i;
                for (i = 0; i < items.length; i++) {
                    if (this.dict.containsId(items[i].getId())) {
                        return true;
                    }
                }

                return false;
            },

            containsAll: function (items) {
                var i;
                for (i = 0; i < items.length; i++) {
                    if (!this.dict.containsId(items[i].getId())) {
                        return false;
                    }
                }

                return true;
            },

            removeById: function (id) {
                var item = this.findById(id);
                if (item !== null) {
                    this.remove(item);
                }
            },

            onItemPropertyChanged: function (event) {
                if (event.property !== CoreEnums.IdPropertyName) {
                    return;
                }

                //id of item has changed, so we need to replace it in dictionary
                this.dict.removeById(event.oldValue);
                this.dict.add(event.target);
            },

            fireCollectionChanged: function (event) {
                this._super(event);

                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onItemsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onItemsRemoved(event);
                        break;
                    case CoreEnums.CollectionAction.Replace:
                        this.onItemsReplaced(event);
                        break;
                    case CoreEnums.CollectionAction.Move:
                        //do nothing because items only moved withing collection
                        break;
                    case CoreEnums.CollectionAction.Reset:
                        this.onItemsReset(event);
                        break;
                }
            },

            onItemsAdded: function (event) {
                observable.bindPropertyChanged(event.newItems, this.onItemPropertyChanged, this);
            },

            onItemsRemoved: function (event) {
                observable.unbindPropertyChanged(event.oldItems, this.onItemPropertyChanged, this);
            },

            onItemsReplaced: function (event) {
                observable.unbindPropertyChanged(event.oldItems, this.onItemPropertyChanged, this);
                observable.bindPropertyChanged(event.newItems, this.onItemPropertyChanged, this);
            },

            onItemsReset: function (event) {
                observable.unbindPropertyChanged(event.oldList, this.onItemPropertyChanged, this);
                observable.bindPropertyChanged(event.newList, this.onItemPropertyChanged, this);
            }
        });

        return UniqueEntityCollection;
    }]);
})(window);