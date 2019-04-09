import { ConversationReference, TurnContext } from "botbuilder";

export interface IConversationStorageService {
    storeReference(context: TurnContext): Promise< Partial<ConversationReference>>;
    restoreReference(context: TurnContext): Promise< Partial<ConversationReference>>;
}
