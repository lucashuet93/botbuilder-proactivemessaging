import { ConversationReference, ConversationState, MemoryStorage, StatePropertyAccessor, TurnContext } from "botbuilder";
import { IConversationStorageService } from "./IConversationStorageService";

const CONVERSATION_REFERENCE = "CONVERSATION_REFERENCE";

export class InMemoryConversationStorage implements IConversationStorageService {
    private conversationState: ConversationState;
    private conversationReferenceStorage: StatePropertyAccessor;

    public constructor() {
        const memoryStorage = new MemoryStorage();
        this.conversationState = new ConversationState(memoryStorage);
        this.conversationReferenceStorage = this.conversationState.createProperty(CONVERSATION_REFERENCE);
    }

    public async storeReference(context: TurnContext): Promise< Partial<ConversationReference>> {
        const reference = await this.restoreReference(context);
        await this.conversationReferenceStorage.set(context, reference);
        return reference;
    }

    public async restoreReference(context: TurnContext): Promise< Partial<ConversationReference>> {
        // try extract stored reference
        let reference = await this.conversationReferenceStorage.get(context);
        const activity = context.activity;
        // else create a new reference from the context
        if (reference === null || reference === undefined) {
            reference = TurnContext.getConversationReference(activity);
        }
        return reference;
    }

    public async updateState(context: TurnContext) {
        await this.conversationState.saveChanges(context);
    }
}
