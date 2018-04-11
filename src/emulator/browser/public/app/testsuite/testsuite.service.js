(function() {

  angular.module('botiumemulator').factory('TestSuiteService', TestSuiteService);

  TestSuiteService.$inject = ['$http'];

  function TestSuiteService($http) {
    
    function startcontainer(callback) {
      $http.post('/api/startcontainer', {}).then(
        function successCallback(response) {
          if (response.data && response.data.success) {
            callback(null);
          } else {
            callback(response.data.error);
          }
        }, function errorCallback(response) {
          callback(response);
        });      
    }

    return {
      startcontainer: startcontainer
    };
  }

})();