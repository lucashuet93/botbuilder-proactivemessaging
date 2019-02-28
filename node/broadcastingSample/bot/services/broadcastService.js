const fetch = require('isomorphic-fetch');

class BroadcastService {
    constructor(botBroadcastEndpoint) {
        this.botBroadcastEndpoint = botBroadcastEndpoint;
    }

    async broadcast(broadCastList, broadcastEndpoint) {
        if (broadcastEndpoint === undefined) {
            broadcastEndpoint = this.botBroadcastEndpoint;
        }

        // send messages to all the referenced conversations
        await fetch(broadcastEndpoint, {
            method: 'POST',
            body: JSON.stringify(broadCastList),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

module.exports.BroadcastService = BroadcastService;
