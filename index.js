module.exports = function(){

    this.name = 'hangouts';

    this.defaultPrefs = [{
        name: 'username',
        type: 'text',
        value: ''
    },{
        name: 'password',
        type: 'password',
        value: ''
    }];

    this.init = function(){
        var self = this;
        var hangoutsBot = require("hangouts-bot");
        this.getPrefs().done(function(prefs){
            var bot = new hangoutsBot(prefs.username, prefs.password);
            bot.on('online', function() {
                self.api.addMessageSender('hangouts', function(message, to){
                    bot.sendMessage(to, message);
                });
            });

            bot.on('message', function(from, message) {
                self.api.messageRecieved(from, 'hangouts', message)
            });
        })

    }

    return this;
}


