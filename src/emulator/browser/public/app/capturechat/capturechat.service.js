(function() {

  angular.module('botiumemulator').factory('ChatSocket', ChatSocket);

  ChatSocket.$inject = ['socketFactory'];

  function ChatSocket(socketFactory) {
    return function(scope) {
      var socket = socketFactory({
        ioSocket: io.connect()
      });
      socket.forward('botsays', scope);
      return socket;
    };
  };

})();