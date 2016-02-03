(function() {
    'use strict';

    var injectParams = ['$scope', '$rootScope', '$location', '$http', '$routeParams'];

    var loginCtrl = function($scope, $rootScope, $location, $http, $routeParams) {
        var vm = this;

        vm.login = function() {
            $http({
                    method: "post",
                    url: "/login",
                    data: {username: vm.username, password: vm.password}
                })
                .then(function(response) {
                    if(response.data.success) {
                		$rootScope.username = vm.username;
                		$location.path('home');
                    }
                });
        };

    };

    loginCtrl.$inject = injectParams;

    angular.module('sdp.login', [])
        .controller('loginCtrl', loginCtrl);

})();