(function() {

  angular.module('botiumemulator').factory('TestCaseService', TestCaseService);

  TestCaseService.$inject = ['$resource'];

  function TestCaseService($resource) {
    return $resource('/api/testcases/:sourceTag', {
      sourceTag: '@sourceTag'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
