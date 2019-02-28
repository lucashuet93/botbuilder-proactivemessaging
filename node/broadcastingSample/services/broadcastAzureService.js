const fetch = require('isomorphic-fetch');
const { BroadcastService } = require('./broadcastService.js');

class BroadcastAzureService extends BroadcastService {
    constructor(botBroadcastEndpoint, broadcastListEnpoint, broadcastServiceEndpoint) {
        super(botBroadcastEndpoint);
        this.broadcastServiceEndpoint = broadcastServiceEndpoint;
        this.broadcastListEnpoint = broadcastListEnpoint;
    }

    async getBroadcastList(originReference, message) {
        const postBody = { originReference, message };

        // get broadcasting references
        const response = await fetch(this.broadcastListEnpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        });

        return await response.json();
    }

    async azureBroadcast(broadCastList) {
        // send messages to all the referenced conversations
        await fetch(this.broadcastServiceEndpoint, {
            method: 'POST',
            body: JSON.stringify(broadCastList),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

module.exports.BroadcastAzureService = BroadcastAzureService;
