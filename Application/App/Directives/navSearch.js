(function (global) {
	'use strict';

	global.realineModule.directive('navSearch', ['appConfig', function (appConfig) {

		return {
			restrict: 'E',
			templateUrl: '/Application/App/Directives/Templates/nav-search.html',
			link: function(scope, element, attrs) {
				scope.resultList = new Array();
				for (var i = 0; i < 50; i++) {
					scope.resultList[i] = "Test data" + i;
				}
			    scope.link = appConfig;
			}
		};
	}]);
})(window);
