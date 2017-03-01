(function (global) {
	'use strict';

	global.realineModule.directive('navServices', ['appConfig', function (appConfig) {
		return {
			restrict: 'E',
			templateUrl:'/Application/App/Directives/Templates/nav-services.html',
			link: function(scope, element, attrs) {
				scope.isOpened = false;
				scope.link = appConfig;
			},

			controller: [
				'$scope', function($scope) {
					$scope.tooglePanel = function() {
						$scope.isOpened = !$scope.isOpened
					};
				}
			]
		};
	}]);
})(window);
