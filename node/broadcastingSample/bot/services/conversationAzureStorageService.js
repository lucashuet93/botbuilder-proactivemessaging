const fetch = require('isomorphic-fetch');
const { ConversationInMemoryStorageService } = require('./conversationInMemoryStorageService.js');

class ConversationAzureStorageService extends ConversationInMemoryStorageService {
    constructor(storageServiceEndpoint) {
        super();
        this.storageServiceEndpoint = storageServiceEndpoint;
    }

    async storeReference(turnContext) {
        // pull the reference
        const reference = await this.restoreReference(turnContext);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);
        // store reference in external storage
        await fetch(this.storageServiceEndpoint, {
            method: 'POST',
            body: JSON.stringify({ reference }),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

module.exports.ConversationAzureStorageService = ConversationAzureStorageService;
