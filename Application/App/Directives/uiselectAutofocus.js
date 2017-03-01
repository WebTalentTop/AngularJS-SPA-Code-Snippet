(function (global) {
    'use strict';

    global.realineModule.directive("uiselectAutofocus", ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            require: 'uiSelect',
            link: function (scope, elem, attr) {
                $timeout(function () {
                    var input = elem.find('input');

                    if (attr.uiselectAutofocus == 'open')
                        input.click();

                    input.focus()
                }, 0);
            }
        }
    }]);

})(window);