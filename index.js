var xmppCore = require('node-xmpp-core'),
    xmppClient = require('node-xmpp-client'),
    hangouts = function(){
        this.name = 'hangouts';
        this.displayname = 'Google Hangouts Chat';
        this.description = 'Send messages to woodhouse via Google Hangouts';
        this.disconnected = false;

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
    this.getPrefs().done(function(prefs){
        this.prefs = prefs;
        this.connect();
    }.bind(this));

}

hangouts.prototype.connect = function() {
    this.connection = connection = new xmppClient({
        jid: this.prefs.username,
        password: this.prefs.password,
        host: "talk.google.com",
        reconnect: true
    });

    this.connection.connection.socket.setTimeout(0)
    this.connection.connection.socket.setKeepAlive(true, 10000)

    this.connection.on('disconnect', function() {
        if (!this.disconnected) {
            this.disconnected = true;
            this.connection.end();
            this.connect();
        }
    }.bind(this))

    this.connection.on('online', function() {
        this.disconnected = false;
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

        this.addMessageSender(function(message, to){
                var stanza = new xmppCore.Element('message',
                    {
                        to: to,
                        type: 'chat'
                    })
                    .c('body')
                    .t(message);

                this.connection.send(stanza);
        }.bind(this));
    }.bind(this));


    this.connection.on('stanza', function(stanza) {
        if (stanza.is('message') && (stanza.attrs.type !== 'error') && (stanza.getChildText('body'))) {
            var userParts = stanza.attrs.from.split('/');

            userParts = userParts.slice(0, userParts.length - 1);
            this.messageRecieved(stanza.attrs.from, stanza.getChildText('body'), userParts.join('/'));
        }

        if(stanza.is('presence') && stanza.attrs.type === 'subscribe') {
            stanza.attrs.to = stanza.attrs.from;
            delete stanza.attrs.from;

            connection.send(stanza);
        }
    }.bind(this));
}

hangouts.prototype.exit = function(){
    if (this.connection) {
        this.connection.end();
    }
}

module.exports = hangouts;
