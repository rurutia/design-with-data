(function() {
    'use strict';

    angular.module('sdp.util', [])
    .filter('removeJSONFileExt', function() {
      return function(input) {
        return input.replace('.json', '');
      };
    });

})();