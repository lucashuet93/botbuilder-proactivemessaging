import { ConversationReference } from "botbuilder";

export interface IBroadcastService {
    broadcast(references: ConversationReference[], message: string);
}
