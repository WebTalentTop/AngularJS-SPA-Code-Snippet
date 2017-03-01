(function (global) {
    'use strict';

    global.realineModule.factory('floatingWindowBuilder', [
    '$animate', '$document', '$compile', '$controller', '$http', '$rootScope', '$q', '$templateRequest', '$timeout',
    function ($animate, $document, $compile, $controller, $http, $rootScope, $q, $templateRequest, $timeout) {

        var body = $document.find('body');

        var Service = Class.extend({
            init: function () {

            },

            open: function (options) {
                var self = this;

                //  Create a deferred we'll resolve when the modal is ready.
                var deferred = $q.defer();

                //  Validate the input parameters.
                var controllerName = options.controller;
                if (!controllerName) {
                    deferred.reject("No controller has been specified.");
                    return deferred.promise;
                }

                getTemplate(options.template, options.templateUrl)
                .then(function (result) {
                    var wnd = self.buildWindow(options, result);
                    deferred.resolve(wnd);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },

            buildWindow: function (options, template) {
                //  Create the inputs object to the controller - this will include
                //  the scope, as well as all inputs provided.
                //  We will also create a deferred that is resolved with a provided
                //  close function. The controller can then call 'close(result)'.
                //  The controller can also provide a delay for closing - this is
                //  helpful if there are closing animations which must finish first.

                var closingDeferred = $q.defer();
                var closedDeferred = $q.defer();

                //  Create a new scope for the modal.
                var windowScope = $rootScope.$new();

                //  If we have provided any inputs, pass them to the controller.
                var inputs = angular.extend({}, options.params);

                inputs.$scope = windowScope;
                var closeFunction = function (result, delay) {
                    if (delay === undefined || delay === null) delay = 0;

                    $timeout(function () {
                        //  Resolve the 'closing' promise.
                        closingDeferred.resolve(result);

                        //  Let angular remove the element and wait for animations to finish.
                        $animate.leave(windowElement)
                          .then(function () {
                              //  Resolve the 'closed' promise.
                              closedDeferred.resolve(result);

                              //  We can now clean up the scope
                              windowScope.$destroy();

                              //  Unless we null out all of these objects we seem to suffer
                              //  from memory leaks, if anyone can explain why then I'd
                              //  be very interested to know.
                              inputs.wnd = null;                              
                              closingDeferred = null;
                              inputs = null;
                              windowElement.remove();
                              windowElement = null;                              
                              windowScope = null;
                          });
                    }, delay);
                };

                //  Compile then link the template element, building the actual element.
                //  Set the $element on the inputs so that it can be injected if required.
                var linkFn = $compile(template);
                var windowElement = linkFn(windowScope);
                inputs.$element = windowElement;

                //  We now have a window object...
                var wnd = {
                    //controller: modalController,
                    //scope: windowScope,
                    //element: windowElement,
                    closing: closingDeferred.promise,
                    closed: closedDeferred.promise,
                    close: closeFunction
                };

                inputs.wnd = wnd;

                //  Create the controller, explicitly specifying the scope to use.
                var windowController = $controller(options.controller, inputs);

                if (options.controllerAs) {
                    modalScope[options.controllerAs] = windowController;
                }

                //  Finally, append the modal to the dom.
                if (options.appendElement) {
                    // append to custom append element
                    appendChild(options.appendElement, windowElement);
                } else {
                    // append to body when no custom append element is specified
                    appendChild(body, windowElement);
                }

                return wnd;
            }
        });

        //  Returns a promise which gets the template, either
        //  from the template parameter or via a request to the
        //  template url parameter.
        function getTemplate(template, templateUrl) {
            var deferred = $q.defer();
            if (template) {
                deferred.resolve(template);
            } else if (templateUrl) {
                $templateRequest(templateUrl, true)
                  .then(function (template) {
                      deferred.resolve(template);
                  }, function (error) {
                      deferred.reject(error);
                  });
            } else {
                deferred.reject("No template or templateUrl has been specified.");
            }
            return deferred.promise;
        };

        //  Adds an element to the DOM as the last child of its container
        //  like append, but uses $animate to handle animations. Returns a
        //  promise that is resolved once all animation is complete.
        function appendChild(parent, child) {
            var children = parent.children();
            if (children.length > 0) {
                return $animate.enter(child, parent, children[children.length - 1]);
            }
            return $animate.enter(child, parent);
        };

        return new Service();
    }
    ]);


})(window);