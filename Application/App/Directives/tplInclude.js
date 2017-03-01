(function (global) {
	'use strict';

	global.realineModule.directive('tplInclude', function () {
		return {
			restrict: 'E',
			templateUrl:function (elem, attr) {
				return attr.src;
			},
		};
	});
})(window);
