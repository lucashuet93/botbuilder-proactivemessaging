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
        const reference = TurnContext.getConversationReference(turnContext.activity);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);
    }

    async restoreReference(turnContext) {
        return await this.conversationReference.get(turnContext);
    }

    async saveState(turnContext) {
        await this.conversationState.saveChanges(turnContext);
    }
}

module.exports.ConversationInMemoryStorageService = ConversationInMemoryStorageService;
