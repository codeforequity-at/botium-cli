(function() {


  angular.module('botiumemulator').directive('displayChatbotMessage', DisplayChatbotMessage);

  DisplayChatbotMessage.$inject = [];

  function DisplayChatbotMessage() {
    
    return {
      restrict: 'E',
      bindToController: {
        msg: '='
      },
      templateUrl: '/public/app/message/message.view.html',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        var vm = this;
        vm.msg = $scope.msg;

        vm.text = null;
        vm.structured = null;

        if (vm.msg.messageText) {
          vm.text = vm.msg.messageText;
        } else {
          vm.structured = vm.msg.sourceData;
        }

        vm.quickReply = function(text, payload) {
          $rootScope.$broadcast('reply', { message: { text: text, quick_reply: { payload: payload } } });
        };
        vm.postback = function(text, payload) {
          $rootScope.$broadcast('reply', { postback: { payload: payload } });
        };
      }],
      controllerAs: 'vm'
    };
  }
})();