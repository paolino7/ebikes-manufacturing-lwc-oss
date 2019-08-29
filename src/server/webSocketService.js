const WebSocket = require('ws');

const WSS_PORT = 8081;
const WSS_PING_INTERVAL = 30000;

module.exports = class WebSocketService {
    constructor() {
        this.messageListeners = [];
    }

    connect() {
        // Start WebSocket server
        this.wss = new WebSocket.Server({
            port: WSS_PORT,
            clientTracking: true
        });
        // Listen for WS client connections
        this.wss.on('connection', wsClient => {
            console.log('WS client connected');
            wsClient.isAlive = true;

            wsClient.on('message', message => {
                const data = JSON.parse(message);
                if (data.type === 'pong') {
                    wsClient.isAlive = true;
                } else {
                    console.log('WS incomming message ', message);
                    this.messageListeners.forEach(listener => {
                        listener(data);
                    });
                }
            });

            wsClient.on('close', () => {
                console.log('WS connection closed');
            });
        });

        // Check if WS clients are alive
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setInterval(() => {
            this.wss.clients.forEach(wsClient => {
                if (wsClient.isAlive === false) {
                    console.log('Removing inactive WS client');
                    wsClient.terminate();
                } else {
                    wsClient.isAlive = false;
                    wsClient.send('{"type": "ping"}');
                }
            });
        }, WSS_PING_INTERVAL);
    }

    addMessageListener(listener) {
        this.messageListeners.push(listener);
    }

    broadcast(data) {
        console.log(
            `Broadcasting to ${this.wss.clients.size} client(s): `,
            data
        );
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, error => {
                    if (error) {
                        console.error('WS send error ', error);
                    }
                });
            }
        });
    }
};