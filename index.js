var xmpp;
var hangouts = function(){

    this.name = 'hangouts';
    this.displayname = 'Google Hangouts Chat';
    this.description = 'Send messages to woodhouse via Google Hangouts';

    this.defaultPrefs = [{
        name: 'username',
        displayname: 'Username',
        type: 'text',
        value: ''
    },{
        name: 'password',
        displayname: 'Password',
        type: 'password',
        value: ''
    }];


}

hangouts.prototype.init = function(){
    var self = this;
    xmpp = require('node-xmpp');
    this.getPrefs().done(function(prefs){
        self.connection = connection = new xmpp.Client({
            jid: prefs.username,
            password: prefs.password,
            host: "talk.google.com",
            reconnect: true
        });

        self.connection.on('online', function() {
            connection.send(new xmpp.Element('presence', {})
                .c('show')
                .t('chat')
                .up()
                .c('status')
                .t('Online')
            );

            var roster_elem = new xmpp.Element('iq', {
                'from': connection.jid,
                'type': 'get',
                'id': 'google-roster'
            }).c('query', {
                'xmlns': 'jabber:iq:roster',
                'xmlns:gr': 'google:roster',
                'gr:ext': '2'
            });

            connection.send(roster_elem);

            self.addMessageSender(function(message, to){
                    var stanza = new xmpp.Element('message',
                        {
                            to: to,
                            type: 'chat'
                        })
                        .c('body')
                        .t(message);

                    self.connection.send(stanza);
            });
        });


        self.connection.on('stanza', function(stanza) {
            if (stanza.is('message') && (stanza.attrs.type !== 'error') && (stanza.getChildText('body'))) {
                self.messageRecieved(stanza.attrs.from, stanza.getChildText('body'));
            }

            if(stanza.is('presence') && stanza.attrs.type === 'subscribe') {
                stanza.attrs.to = stanza.attrs.from;
                delete stanza.attrs.from;

                connection.send(stanza);
            }
        });
    })

}

hangouts.prototype.exit = function(){
    if (self.connection) {
        self.connection.end();
    }
}

module.exports = hangouts;
