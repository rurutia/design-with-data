(function() {
  'use strict';

    var injectParams = ['$scope', '$rootScope', '$location', '$http', '$routeParams' ,'$timeout'];

    var mainCtrl = function ($scope, $rootScope, $location, $http, $routeParams, $timeout) {
    	var vm = this;

      vm.current = {name: 'Select data'};
      vm.isNew = false;

      $http({method: "get", url: "/live"})
      .then(function(response) {
        vm.liveResources = response.data;
      });

      $http({method: "get", url: "/files"})
      .then(function(response) {
        vm.staticFiles = response.data;
      });

      vm.select = function(data) {
        console.log(data);
        vm.current = data;
        $http({method: "get", url: "/" + data.type + "/" + data.name})
        .then(function(response) {
          vm.jsonContent = response.data.content;
        });
      };

      vm.update = function() {
        console.log($rootScope.username);
        $http({
          method: "post",
          url: "/file/" + vm.current.name,
          data: vm.jsonContent
        })
        .then(function(response) {
          console.log(response.data.success);
          vm.info = vm.current.name + ".json has been successfully updated.";
          $timeout(function() {
            vm.info = null;
          }, 2000);
        }, function(response){
             vm.info = null;
             vm.warning = "Failed to update! Check JSON syntax before tyr again.";
              $timeout(function() {
                vm.warning = null;
              }, 2000);
          });
      };

      vm.saveNew = function() {
        $http({
          method: "post",
          url: "/newfile/" + vm.newFilename,
          data: vm.jsonContent
        })
        .then(function(response) {
          console.log(response.data);
          if(response.data.success) {
            vm.isNew = false;
            $http({method: "get", url: "/files"})
            .then(function(resp) {
              vm.staticFiles = resp.data;
              vm.current = response.data.file;
            });
          }
        }, function(response){
             alert("Failed to update! Check JSON syntax before tyr again.");
          });
      };

      vm.download = function() {
          var data = vm.jsonContent;
          var filename = 'sketch-' + vm.current.name.replace('.json', '') + "-" + new Date().toLocaleString() + '.json';

          var blob = new Blob([data], {type: 'text/json'}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a');

          a.download = filename;
          a.href = window.URL.createObjectURL(blob);
          a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
          e.initMouseEvent('click', true, false, window,
              0, 0, 0, 0, 0, false, false, false, false, 0, null);
          a.dispatchEvent(e);
          vm.info = vm.current.name + ".json has been successfully downloaded.";
          $timeout(function() {
            vm.info = null;
          }, 2000);
      };

      vm.refresh = function() {
        $http({method: "get", url: "/" + vm.current.type + "/" + vm.current.name})
        .then(function(response) {
          vm.jsonContent = response.data.content;
          vm.info = vm.current.name + ".json has been successfully reloaded.";
          $timeout(function() {
            vm.info = null;
          }, 2000);
        });
      }
   };

    mainCtrl.$inject = injectParams;

    angular.module('sdp.main', [])
      .controller('mainCtrl', mainCtrl);

})();