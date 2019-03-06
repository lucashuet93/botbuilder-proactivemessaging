import { ConversationReference } from "botbuilder";

export interface IBroadcastService {
    broadcast(references: Array< Partial<ConversationReference> >, message: string);
}
