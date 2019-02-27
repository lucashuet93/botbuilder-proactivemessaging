const fetch = require('isomorphic-fetch');
const { BroadcastService } = require('./broadcastService.js');

class BroadcastAzureService extends BroadcastService {
    constructor(botBroadcastEndpoint, broadcastServiceEndpoint) {
        super(botBroadcastEndpoint);
        this.broadcastServiceEndpoint = broadcastServiceEndpoint;
    }

    async getBroadcastList(originReference, message) {
        const postBody = { originReference, message };

        // get broadcasting references
        const response = await fetch(this.broadcastServiceEndpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        });

        return await response.json();
    }
}

module.exports.BroadcastAzureService = BroadcastAzureService;
