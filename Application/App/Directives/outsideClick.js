'use strict';

(function (global) {
    global.realineModule.directive("outsideClick", ['$document', function ($document) {
        return {
            link: function($scope, $element, $attributes) {
                var scopeExpression = $attributes.outsideClick,
                    onDocumentClick = function(event) {
                        var isChild = $element.find(event.target).length > 0;

                        if (!isChild && !$element.is(event.target)) {
                            $scope.$apply(scopeExpression);
                        }
                    };

                $document.on("click", onDocumentClick);

                $element.on('$destroy', function() {
                    $document.off("click", onDocumentClick);
                });
            }
        };
    }]);
})(window);