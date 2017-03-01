/*
 * directive works in same was as ngRepeat does, but with ObservableCollection as source
 * at this time it supports only items addition, moving and deleting 
 */

(function (global) {
    'use strict';

    global.realineModule.directive('oRepeat', ['CoreEnums', 'ObservableCollection', '$animate', '$parse', '$log', 'utils',
    function (CoreEnums, ObservableCollection, $animate, $parse, $log, utils) {
       
        var Repeater = Class.extend({
            init: function (scope, element, attr, linker) {
                this.scope = scope;
                this.element = element;
                this.attr = attr;
                this.linker = linker;

                this.elements = new ObservableCollection();
                this.collection = null;

                this.parseExpression();
                this.bindEvents();
            },

            parseExpression: function () {
                // Parse the expression.  It should look like:
                // x in some-expression
                var expression = this.attr.oRepeat;
                var match = expression.match(/^\s*(.+)\s+in\s+(.*?)$/);
                if (!match) {
                    throw Error("Expected oRepeat in form of '_item_ in _collection_' but got '" + expression + "'.");
                }

                this.iterVariable = match[1];
                this.collectionExpression = match[2];

                match = this.iterVariable.match(/^(?:([\$\w]+))$/);
                if (!match) {
                    throw Error("'item' in 'item in collection' should be identifier but got '" + lhs + "'.");
                }

                this.collection = this.scope.$eval(this.collectionExpression);
            },

            bindEvents: function () {
                if (!utils.common.isNullOrUndefined(this.collection)) {
                    this.collection.bindCollectionChanged(this.Collection_Changed, this);

                    this.renderItems(0, this.collection.list);
                }
                else {
                    this.deregisterCollectionWatch = this.scope.$watch(this.collectionExpression, function (newCollection, oldCollection) {
                        if (!utils.common.isNullOrUndefined(oldCollection)) {
                            oldCollection.unbindCollectionChanged(this.Collection_Changed, this);
                        }

                        this.collection = newCollection;

                        if (!utils.common.isNullOrUndefined(newCollection)) {
                            this.collection.bindCollectionChanged(this.Collection_Changed, this);
                            this.renderItems(0, this.collection.list);
                        }

                        this.deregisterCollectionWatch();
                        this.deregisterCollectionWatch = null;
                    }.bind(this));
                }
                this.scope.$on('$destroy', function () {
                    if (!utils.common.isNullOrUndefined(this.collection)) {
                        this.collection.unbindCollectionChanged(this.Collection_Changed, this);
                    }

                    if (!utils.common.isNullOrUndefined(this.deregisterCollectionWatch)) {
                        this.deregisterCollectionWatch();
                        this.deregisterCollectionWatch = null;
                    }
                }.bind(this));
            },

            Collection_Changed: function (event) {
                switch (event.action) {
                    case CoreEnums.CollectionAction.Add:
                        this.onItemsAdded(event);
                        break;
                    case CoreEnums.CollectionAction.Remove:
                        this.onItemsRemoved(event);
                        break;
                    case CoreEnums.CollectionAction.Replace:
                        //implement later
                        break;
                    case CoreEnums.CollectionAction.Move:
                        this.onItemMoved(event);
                        break;
                    case CoreEnums.CollectionAction.Reset:
                        //implement later
                        break;
                }
            },

            onItemsAdded: function (event) {
                //this.renderItems(event.newItems,
                //                 event.newStartingIndex > this.elements.length() - 1);


                this.renderItems(event.newStartingIndex, event.newItems);
            },

            onItemsRemoved: function (event) {
                var i;
                var element;

                for (i = 0; i < event.oldItems.length; i++) {
                    element = this.elements.get(i + event.oldStartingIndex);
                    element.scope.$destroy();
                    element.node.remove();
                }

                this.elements.removeAt(event.oldStartingIndex, event.oldItems.length);
            },

            onItemMoved: function (event) {
                //method is not tested
                var element = this.elements.get(event.oldIndex);
                var newIndex = event.newIndex > event.oldIndex ? event.newIndex - 1 : event.newIndex;
                var prevElement;

                element.node.detach();

                if (event.newIndex === 0) {
                    this.element.after(element.node);
                }
                else {
                    prevElement = this.elements.get(newIndex);
                    prevElement.after(element.node);
                }
            },

            renderItems: function (newStartingIndex, newItems) {
                var i = 0;
                var newElement;
                var fragment = document.createDocumentFragment();
                var node;
                var tmpElements = [];
                var prevElement = this.element;

                for (i = 0; i < newItems.length ; i++) {
                    newElement = {
                        scope: this.scope.$new(),
                    };

                    newElement.scope[this.iterVariable] = newItems[i];

                    tmpElements.push(newElement);

                    node = this.linker(newElement.scope, function (clone) {
                        //$animate.enter(clone, null, protoElement);                        
                        fragment.appendChild(clone[0]);
                        newElement.node = clone;
                    }.bind(this));
                }

                if (newStartingIndex === 0) {
                    this.elements.unshift(tmpElements);
                }
                else if (newStartingIndex === this.elements.length()) {
                    this.elements.push(tmpElements);
                }
                else {
                    this.elements.insert(newStartingIndex, tmpElements);
                }

                if (newStartingIndex > 0 && this.elements.length() > 0) {
                    prevElement = this.elements.get(newStartingIndex - 1).node;
                }

                prevElement.after(fragment);
            },            
        });

        return {
            restrict: 'A',
            scope: true,
            transclude: 'element',
            priority: 1000,
            terminal: true,
            multiElement: true,
            $$tlb: true,
            compile: function (element, attr, linker) {
                return function ($scope, $element, $attr) {

                    $scope._controller = new Repeater($scope, $element, $attr, linker);
                }
            }
        };
    }]);
})(window);