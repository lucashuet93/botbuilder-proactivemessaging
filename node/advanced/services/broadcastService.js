const fetch = require('isomorphic-fetch');

class BroadcastService {
    constructor(botBroadcastEndpoint) {
        this.botBroadcastEndpoint = botBroadcastEndpoint;
    }

    async broadcast(broadCastList) {
        // send messages to all the referenced conversations
        await fetch(this.botBroadcastEndpoint, {
            method: 'POST',
            body: JSON.stringify(broadCastList),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

module.exports.BroadcastService = BroadcastService;
