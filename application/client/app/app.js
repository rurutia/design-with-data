(function() {
    'use strict';

    var app = angular.module('sketch-data-populator', ['ngRoute', 'blockUI','sdp.main', 'sdp.login', 'sdp.util']);

    app.config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider
            .when('/home', {
                templateUrl: 'app/main/main_viewer.html',
                controller: 'mainCtrl',
                controllerAs: 'vm'
            })
            .when('/login', {
                templateUrl: 'app/login/login_viewer.html',
                controller: 'loginCtrl',
                controllerAs: 'vm'
            })
            .otherwise({ redirectTo: '/home' });
        }]);
})();






