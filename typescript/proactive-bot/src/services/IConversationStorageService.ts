import { ConversationReference, TurnContext } from "botbuilder";

export interface IConversationStorageService {
    storeReference(context: TurnContext): Promise<ConversationReference>;
    restoreReference(context: TurnContext): Promise<ConversationReference>;
}
