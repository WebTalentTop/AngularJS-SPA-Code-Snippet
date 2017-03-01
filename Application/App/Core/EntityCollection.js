(function (global) {
    'use strict';

    global.realineModule.factory('EntityCollection', ['ObservableCollection',
    function (ObservableCollection) {
        /*
        * @class EntityCollection - serves as base class for all entities. Objects with Id property
        */

        var EntityCollection = ObservableCollection.extend({
            init: function () {
                this._super();
                this.__ClassName = 'EntityCollection';
            },

            findById: function (id) {
                return this.find(function (item) {
                    return item.getId() === id;
                });
            },

            containsById: function (id) {
                return this.contains(function (item) {
                    return item.getId() === id;
                });
            },

            removeById: function (id) {
                var item = this.findById(id);
                if (item !== null) {
                    this.remove(item);
                }
            },

            containsAnyId: function (ids) {
                var i;
                for (i = 0; i < ids.length; i++) {
                    if (this.containsById(ids[i])) {
                        return true;
                    }
                }

                return false;
            },

            containsAny: function (items) {
                var i;
                for (i = 0; i < items.length; i++) {
                    if (this.containsById(items[i].getId())) {
                        return true;
                    }
                }

                return false;
            },            
        });

        return EntityCollection;
    }]);
})(window);