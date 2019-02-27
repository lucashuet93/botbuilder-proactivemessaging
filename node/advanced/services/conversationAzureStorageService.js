const { TurnContext } = require('botbuilder');
const fetch = require('isomorphic-fetch');
const { ConversationInMemoryStorageService } = require('ConversationInMemoryStorageService');

class ConversationAzureStorageService extends ConversationInMemoryStorageService {
    constructor(storageServiceEndpoint) {
        super();
        this.storageServiceEndpoint = storageServiceEndpoint;
    }

    async storeReference(turnContext) {
        // pull the reference
        const reference = await this.getReference(turnContext);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);

        await fetch(this.storageServiceEndpoint, {
            method: 'POST',
            body: JSON.stringify({ reference }),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async restoreReference(turnContext) {
        let reference = await this.conversationReference.get(turnContext);
        if (reference === null || reference === undefined) {
            reference = TurnContext.getConversationReference(turnContext.activity);
        }
        return reference;
    }

    async updateState(turnContext) {
        await this.conversationState.saveChanges(turnContext);
    }
}

module.exports.ConversationAzureStorageService = ConversationAzureStorageService;
