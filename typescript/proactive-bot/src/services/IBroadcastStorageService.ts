import { ConversationReference, TurnContext } from "botbuilder";
import { IConversationStorageService } from "./IConversationStorageService";

export interface IBroadcastStorageService extends IConversationStorageService {
    restoreAllReferences(context: TurnContext): Promise< Array< Partial< ConversationReference > > >;
}
