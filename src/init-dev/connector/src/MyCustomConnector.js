class MyCustomConnector {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
  }

  UserSays (msg) {
    const requestObject = this._msgToRequestObject(msg)
    const responseObject = this._doRequestChatbotApi(requestObject)
    const botMsg = this._responseObjectToMsg(responseObject)
    console.log(`MyCustomConnector: ${msg.messageText} => ${botMsg.messageText}`)
    setTimeout(() => this.queueBotSays(botMsg), 0)
  }

  _msgToRequestObject (msg) {
    // TODO convert generic msg to chatbot specific requestObject
    return msg.messageText
  }

  _doRequestChatbotApi (requestObject) {
    // TODO request the Chatbot API using chatbot specific requestO0bject
    // and return bot response as responseObject
    return (this.caps.MYCUSTOMCONNECTOR_PREFIX || '') + requestObject
  }

  _responseObjectToMsg (msg) {
    // TODO convert chatbot specific requestObject to generic msg
    return { messageText: msg }
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: MyCustomConnector
}
