import { ConversationReference, ConversationState, MemoryStorage, StatePropertyAccessor, TurnContext } from 'botbuilder';

const CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE';

export class InMemoryConversationStorage {
    private conversationState: ConversationState;
    private conversationReferenceStorage: StatePropertyAccessor;

    constructor() {
        const memoryStorage = new MemoryStorage();
        this.conversationState = new ConversationState(memoryStorage);
        this.conversationReferenceStorage = this.conversationState.createProperty(CONVERSATION_REFERENCE);
    }

    public async storeReference(context: TurnContext): Promise<ConversationReference> {
        const reference = await this.restoreReference(context);
        await this.conversationReferenceStorage.set(context, reference);
        return Promise.resolve(reference);
    }

    public async restoreReference(context: TurnContext): Promise<ConversationReference> {
        // try extract stored reference
        let reference = await this.conversationReferenceStorage.get(context);
        // else create a new reference from the context
        if (reference === null || reference === undefined) {
            reference = TurnContext.getConversationReference(context.activity);
        }
        return reference;
    }

    public async updateState(context: TurnContext) {
        await this.conversationState.saveChanges(context);
    }
}
