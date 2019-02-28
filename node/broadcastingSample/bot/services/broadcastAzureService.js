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
        this.broadcast(broadCastList, this.broadcastServiceEndpoint);
    }
}

module.exports.BroadcastAzureService = BroadcastAzureService;
