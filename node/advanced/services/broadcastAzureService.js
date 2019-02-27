const fetch = require('isomorphic-fetch');

class BroadcastAzureService {
    constructor(broadcastServiceEndpoint) {
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
