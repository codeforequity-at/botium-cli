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

        vm.text = vm.msg.messageText;
        vm.media = vm.msg.media;
        vm.buttons = vm.msg.buttons;
        vm.cards = vm.msg.cards;

        vm.quickReply = function(text, payload) {
          $rootScope.$broadcast('reply', payload || text);
        };
        vm.postback = function(text, payload) {
          $rootScope.$broadcast('reply', payload || text);
        };
      }],
      controllerAs: 'vm'
    };
  }
})();
