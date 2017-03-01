(function (global) {
    'use strict';

    global.realineMessenger.directive('conversationMessageGroup',
        ['$document', '$compile', 'MessengerEnums', 'utils', '$', '$log',
    function ($document, $compile, MessengerEnums, utils, $, $log) {
        return {
            restrict: 'E',

            replace: true,

            templateUrl: '/Application/Modules/Messenger/Html/ConversationMessageGroup.html',

            controller: 'ConversationMessageGroupController',

            link: function ($scope, element, attrs) {
                var readersMenu, errorOptionsMenu, errorOptionsVisible = false;
                //perfonamce optimizations: this does not create watches

                $scope.usersScope = null;

                $scope.setIsReadStatus = function (value) {
                    if (value) {
                        element.find('.unread_mark-js').addClass('removed');
                    }
                    else {
                        element.find('.unread_mark-js').show();
                    }
                };


                $scope.showReadByOthersMark = function (value) {
                    if (value) {
                        element.find('.read_by_others-js').show();
                    }
                    else {
                        element.find('.read_by_others-js').hide();
                    }
                };


                $scope.showReadersPanel = function (users) {
                    //manually position menu because we have overflow:hidden for containers
                    var html =
'<li ng-repeat="user in users">\
    <a>\
        <span class="pull-left margin-right">\
            <img width="16" ng-src="{{user.getAvatarThumbUrl() | defaultValue:\'/images/no_profile_photo.png\'}}" class="img-circle"> {{user.getName()}}\
        </span>\
        <i class="fa fa-check pull-right no-margin"></i>\
        <span class="clearfix">\
        </span>\
    </a>\
</li>   ';

                    var menuParent;

                    if ($scope.usersScope) {
                        return;
                    }

                    menuParent = element.find('.read_by_others-js');

                    readersMenu = element.find('.readers-js').clone();

                    $scope.usersScope = $scope.$new();
                    $scope.usersScope.users = users;

                    html = $compile(html)($scope.usersScope);
                    readersMenu.append(html);

                    readersMenu.removeClass('ng-hide');

                    $.positionDropdownMenu(menuParent, readersMenu);

                    $('body').append(readersMenu);
                    readersMenu.show();

                    //do not use outside-click because with it we may have many hundreds of 
                    //sleeping handlers which will be executed on every click inside document
                    $document.on('click', $scope.onDocumentClick_Readers);

                };

                $scope.hideReadersPanel = function () {
                    if ($scope.usersScope === null) {
                        return;
                    }

                    $document.off("click", $scope.onDocumentClick_Readers);

                    readersMenu.detach();
                    $scope.usersScope.$destroy();
                    $scope.usersScope = null;
                    readersMenu = null;
                };

                //need to create directive for this
                $scope.onDocumentClick_Readers = function (event) {
                    var isChild = element.find('.read_by_others-js').find(event.target).length > 0;

                    if (!isChild && !element.find('.read_by_others-js').is(event.target)) {
                        $scope.hideReadersPanel();
                    }
                };

                $scope.onErrorOptionsClick = function (event) {
                    //manually position menu because we have overflow:hidden for containers
                    var menuParent;
                    if (errorOptionsVisible) {
                        return;
                    }

                    menuParent = element.find('.error-options-js');

                    if (!errorOptionsMenu) {
                        errorOptionsMenu = element.find('.error-options-menu-js').detach();

                        errorOptionsMenu.removeClass('ng-hide');
                    }

                    $.positionDropdownMenu(menuParent, errorOptionsMenu);

                    $('body').append(errorOptionsMenu);

                    errorOptionsMenu.show();
                    errorOptionsVisible = true;
                    //do not use outside-click because with it we may have many hundreds of 
                    //sleeping handlers which will be executed on every click inside document
                    $document.on('click', $scope.onDocumentClick_ErrorOptions);
                };

                $scope.hideErrorOptionsPanel = function () {
                    $document.off("click", $scope.onDocumentClick_ErrorOptions);

                    errorOptionsMenu.detach();
                    errorOptionsVisible = false;
                };

                //need to create directive for this
                $scope.onDocumentClick_ErrorOptions = function (event) {
                    var isChild = element.find('.error-options-js').find(event.target).length > 0;

                    if (!isChild && !element.find('.error-options-js').is(event.target)) {
                        $scope.hideErrorOptionsPanel();
                    }
                };

                $scope.markAsDeleted = function (msg) {
                    //hacks to increase perfomance
                    var msgSelector, filesSelector,
                        record;

                    msgSelector = String.format('[msgid={0}]', msg.getId());
                    record = element.find(msgSelector);

                    //remove all attachments
                    record.find('attachment-js').remove();

                    element.find('.content-js').remove();

                    //handle text message
                    record.addClass('removed_message').text(msg.getPlainText())
                        .removeClass('ng-hide');
                };

                $scope.changeMsgId = function (newValue, oldValue) {
                    var msgSelector = String.format('[msgid={0}]', newValue),
                        record = element.find(msgSelector);

                    record.attr('msgid', newValue);
                };

                $scope.setMessageState = function (msg, isLast) {
                    var value = msg.getState();

                    switch (value) {
                        //case MessengerEnums.MessageState.Success:                            
                        //    break;
                        case MessengerEnums.MessageState.Sending:
                            $scope.markAsError(msg, isLast, false);
                            $scope.markAsSending(msg, isLast, true);
                            break;
                        case MessengerEnums.MessageState.Error:
                            $scope.markAsSending(msg, isLast, false);
                            $scope.markAsError(msg, isLast, true);
                            break;
                        default:
                            $scope.markAsSending(msg, isLast, false);
                            $scope.markAsError(msg, isLast, false);
                            if (msg.Readers.length() === 0
                                && $scope.controller.isOutgoingMessage(msg)) {
                                $scope.markAsSent(msg, true, isLast);
                            }
                            break;
                    }
                };

                $scope.markAsSending = function (msg, isLast, value) {
                    if (isLast) {
                        if (value) {
                            element.find('.sending_msg_mark-js').show();
                        }
                        else {
                            element.find('.sending_msg_mark-js').hide();
                        }
                    }
                };

                $scope.markAsSent = function (msg, isLast, value) {
                    if (isLast) {
                        if (value) {
                            element.find('.msg_sent_mark-js').show();
                        }
                        else {
                            element.find('.msg_sent_mark-js').hide();
                        }
                    }
                };

                $scope.markAsError = function (msg, isLast, value) {
                    var msgSelector = String.format('.text_message[msgid={0}]', msg.getId()),
                        record = element.find(msgSelector);

                    if (value) {
                        record.addClass('error_message');
                    }
                    else {
                        record.removeClass('error_message');
                    }

                    //if (isLast) {
                    //    $scope.setCommonErrorState(value);
                    //}
                };

                $scope.setCommonErrorState = function (value) {
                    if (value) {
                        element.find('.error-options-js').show();
                    }
                    else {
                        element.find('.error-options-js').hide();
                    }
                };

                $scope.updateAvatar = function (url) {
                    //replacement for bo-src="message.Author.getAvatarThumbUrl()|defaultValue:'/Images/no_profile_photo.png'"                     

                    if (utils.common.isNullOrEmpty(url)) {
                        url = element.find('.user_piture-js').attr('data-default-src');
                    }

                    element.find('.user_piture-js').attr('src', url);
                };

                $scope.updateUserName = function (name) {
                    element.find('.user_name').text(name);
                }

                $scope.msgController.updateUI();
            }
        };
    }]);

})(window);