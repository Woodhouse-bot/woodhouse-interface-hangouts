module.exports = function(){

    this.name = 'hangouts';
    this.displayname = 'Google Hangouts Chat';
    this.description = 'Send messages to woodhouse via Google Hangouts';

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
            self.bot = new hangoutsBot(prefs.username, prefs.password);
            self.bot.on('online', function() {
                self.addMessageSender(function(message, to){
                    self.bot.sendMessage(to, message);
                });
            });

            self.bot.on('message', function(from, message) {
                self.messageRecieved(from, message)
            });
        })

    }

    this.exit = function(){
        if (this.bot) {
            this.bot.connection.end();
        }
    }

    return this;
}


