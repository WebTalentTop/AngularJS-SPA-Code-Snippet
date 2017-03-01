(function (global) {
    'use strict';

    global.realineModule.factory('businessObjectService', ['messageBus', 'events', 'utils',
    function (messageBus, events, utils) {

        var BusinessObjectService = Class.extend({
            init: function () {
                this.dict = {};
                this.businessObject = null;
            },

            registerType: function (desriptor) {
                /*
                 * {id, name, editPageUrl, transactionIdPropertyName}
                 * id - guid                 
                 * name - user friendly translated name e.g. 'Shipment request'
                 * editPageUrl - edit page url must be in format '/folder1/folder2/{id}'
                 * transactionIdPropertyName - name of property which stores user friendly code (usually it is 'BusinessTransactionId')
                 * transactionIdGetter - function which accepts bustness object and returns user friendly id
                 */

                if (utils.common.isNullOrUndefined(desriptor)) {
                    throw new Error('Business object type descriptor ');
                }

                if (utils.common.isNullOrEmpty(desriptor.transactionIdPropertyName) &&
                    utils.common.isNullOrUndefined(desriptor.transactionIdGetter)) {
                    desriptor.transactionIdPropertyName = 'BusinessTransactionId';
                }

                if (!utils.common.isNullOrUndefined(desriptor.transactionIdPropertyName)) {
                    desriptor.transactionIdGetter = function (model) {
                        return model[desriptor.transactionIdPropertyName];
                    };
                }

                this.dict[desriptor.id] = desriptor;
            },

            getName: function (typeId) {
                if (utils.common.isNullOrUndefined(this.dict[typeId])) {
                    return null;
                }
                else {
                    return this.dict[typeId].name;
                }
            },

            getEditPage: function (typeId) {
                if (utils.common.isNullOrUndefined(this.dict[typeId])) {
                    return null;
                }
                else {
                    return this.dict[typeId].editPage;
                }
            },

            //getTransactionIdPropertyName: function (typeId) {
            //    if (utils.common.isNullOrUndefined(this.dict[typeId])) {
            //        return null;
            //    }
            //    else {
            //        return this.dict[typeId].transactionIdPropertyName;
            //    }
            //},

            getObjectTransactionId: function (model, typeId) {
                if (utils.common.isNullOrUndefined(this.dict[typeId])) {
                    return null;
                }

                return this.dict[typeId].transactionIdGetter(model);
            },

            getCurrentObject: function () {
                return this.businessObject;
            },

            openBusinessObject: function (object, openMesenger) {

                //object - {type, id, transactionId}

                if (utils.common.isNullOrEmpty(object.type)) {
                    throw new Error('Business object type cannot be empty.');
                }

                if (utils.common.isNullOrEmpty(object.id)) {
                    throw new Error('Business object id cannot be empty.');
                }

                if (utils.common.isNullOrEmpty(object.transactionId)) {
                    throw new Error('Business object transaction id cannot be empty.');
                }

                if (openMesenger === undefined) {
                    //open by default
                    openMesenger = true;
                }

                if (openMesenger) {
                    messageBus.fire({
                        type: events.openMessenger,
                        state: 'maximize',
                    });
                }

                if (!utils.common.isNullOrUndefined(this.businessObject)) {
                    if (this.businessObject === object.id) {
                        //this object is already opened
                        return;
                    }
                }

                this.businessObject = {
                    type: object.type,
                    id: object.id,
                    transactionId: object.transactionId,
                };

                messageBus.fire({
                    type: events.businessObjectRecordOpened,
                    data: {
                        businessObjectType: object.type,
                        businessObjectId: object.id,
                        businessTransactionId: object.transactionId
                    }
                });
            },

            closeBusinessObject: function (object) {
                //object - {type, id, transactionId}

                if (utils.common.isNullOrEmpty(object.type)) {
                    throw new Error('Business object type cannot be empty.');
                }

                messageBus.fire({
                    type: events.businessObjectRecordClosed,
                    data: {
                        businessObjectType: object.type,
                        businessObjectId: object.id,
                        businessTransactionId: object.transactionId
                    }
                });

                this.businessObject = null;
            },

            createConversation: function (object) {
                //object - {type, id, transactionId}

                if (utils.common.isNullOrEmpty(object.type)) {
                    throw new Error('Business object type cannot be empty.');
                }

                if (utils.common.isNullOrEmpty(object.id)) {
                    throw new Error('Business object id cannot be empty.');
                }

                if (utils.common.isNullOrEmpty(object.transactionId)) {
                    throw new Error('Business object transaction id cannot be empty.');
                }

                messageBus.fire({
                    type: events.createBusinessObjectConversation,
                    data: {
                        businessObjectType: object.type,
                        businessObjectId: object.id,
                        businessTransactionId: object.transactionId
                    }
                });
            },
        });

        return new BusinessObjectService();
    }]);
})(window);