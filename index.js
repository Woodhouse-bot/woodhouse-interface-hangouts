'use strict';

const xmppCore = require('node-xmpp-core');
const xmppClient = require('node-xmpp-client');

class hangouts {
    constructor() {
        this.name = 'hangouts';
        this.displayname = 'Google Hangouts Chat';
        this.description = 'Send messages to woodhouse via Google Hangouts';

        this.defaultPrefs = {
            username: {
                displayname: 'Username',
                type: 'text',
                value: ''
            },
            password: {
                displayname: 'Password',
                type: 'password',
                value: ''
            }
        };
    }

    init() {
        this.connect().then((client) => {
            this.addOnlineListener(client);
            this.addStanzaListener(client);
        });
    }

    connect() {
        return this.getAllPrefs().then((prefs) => {
            const client = new xmppClient({
                jid: prefs.username.value,
                password: prefs.password.value,
                host: "talk.google.com",
                reconnect: true
            });

            client.connection.socket.setTimeout(0);
            client.connection.socket.setKeepAlive(true, 10000);

            return client;
        });
    }

    addOnlineListener(client) {
        client.on('online', () => {
            client.send(new xmppCore.Element('presence', {})
                .c('show')
                .t('chat')
                .up()
                .c('status')
                .t('Online')
            );

            client.send(
                new xmppCore.Element(
                    'iq',
                    {
                        'from': client.jid,
                        'type': 'get',
                        'id': 'google-roster'
                    }
                ).c(
                    'query',
                    {
                        'xmlns': 'jabber:iq:roster',
                        'xmlns:gr': 'google:roster',
                        'gr:ext': '2'
                    }
                )
            );

            this.addMessageSender((to, message) => {
                client.send(
                    new xmppCore.Element('message', {to: to, type: 'chat'})
                    .c('body')
                    .t(message)
                );
            });
        });
    }

    addStanzaListener(client) {
        client.on('stanza', (stanza) => {
            if (
                stanza.is('message') &&
                stanza.attrs.type !== 'error' &&
                stanza.getChildText('body')
            ) {
                this.messageRecieved(
                    stanza.attrs.from,
                    stanza.getChildText('body'),
                    stanza.attrs.from.split('/').slice(0, -1).join('/')
                );
            }

            if (stanza.is('presence') && stanza.attrs.type === 'subscribe') {
                stanza.attrs.to = stanza.attrs.from;
                delete stanza.attrs.from;

                client.send(stanza);
            }
        });
    }
}

module.exports = hangouts;
