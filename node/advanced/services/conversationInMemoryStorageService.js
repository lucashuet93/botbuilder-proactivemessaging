const { TurnContext, ConversationState, MemoryStorage } = require('botbuilder');

const CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE';

class ConversationInMemoryStorageService {
    constructor() {
        const memoryStorage = new MemoryStorage();
        this.conversationState = new ConversationState(memoryStorage);

        this.conversationReference = this.conversationState.createProperty(CONVERSATION_REFERENCE);
    }

    async storeReference(turnContext) {
        // pull the reference
        const reference = await this.restoreReference(turnContext);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);
    }
}

module.exports.ConversationInMemoryStorageService = ConversationInMemoryStorageService;
