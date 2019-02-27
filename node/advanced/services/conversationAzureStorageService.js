const { TurnContext, ConversationState, MemoryStorage } = require('botbuilder');
const fetch = require('isomorphic-fetch');

const CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE';

const STORE_FUNCTION_ENDPOINT = 'https://proactive-bot-function.azurewebsites.net/api/storeConversation?code=x/Q5YGZdBGlIHtoLOgu8hfjgGxTm2XYOB7TAnmzni82GRjKwikGOWA==';

class ConversationAzureStorageService {
    constructor() {
        const memoryStorage = new MemoryStorage();
        this.conversationState = new ConversationState(memoryStorage);

        this.conversationReference = this.conversationState.createProperty(CONVERSATION_REFERENCE);
    }

    async storeReference(turnContext) {
        // pull the reference
        const reference = await this.getReference(turnContext);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);

        await fetch(STORE_FUNCTION_ENDPOINT, {
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
