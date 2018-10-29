(function() {

  angular.module('botiumemulator').factory('TestCaseService', TestCaseService);

  TestCaseService.$inject = ['$resource'];

  function TestCaseService($resource) {
    return $resource('/api/testcases/:filename', {
      filename: '@sourceTag.filename'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
