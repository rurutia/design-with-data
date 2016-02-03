(function() {
    'use strict';

    var injectParams = ['$scope', '$rootScope'];

    var headerCtrl = function($scope, $rootScope) {
        $scope.logout = function() {
            delete $rootScope.username;
        };
    };

    headerCtrl.$inject = injectParams;

    angular.module('sketch-data-populator')
        .controller('headerCtrl', headerCtrl);

})();