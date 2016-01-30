var xmppCore = require('node-xmpp-core'),
    xmppClient = require('node-xmpp-client'),
    hangouts = function(){
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
    this.getPrefs().done(function(prefs){
        self.connection = connection = new xmppClient({
            jid: prefs.username,
            password: prefs.password,
            host: "talk.google.com",
            reconnect: true
        });

        self.connection.connection.socket.setTimeout(0)
        self.connection.connection.socket.setKeepAlive(true, 10000)

        self.connection.on('disconnect', function() {
            self.connection.connect();
        })

        self.connection.on('online', function() {
            connection.send(new xmppCore.Element('presence', {})
                .c('show')
                .t('chat')
                .up()
                .c('status')
                .t('Online')
            );

            var roster_elem = new xmppCore.Element('iq', {
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
                    var stanza = new xmppCore.Element('message',
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
                var userParts = stanza.attrs.from.split('/');

                userParts = userParts.slice(0, userParts.length - 1);
                self.messageRecieved(stanza.attrs.from, stanza.getChildText('body'), userParts.join('/'));
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
    if (this.connection) {
        this.connection.end();
    }
}

module.exports = hangouts;
