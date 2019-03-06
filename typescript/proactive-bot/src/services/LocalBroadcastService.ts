import { ConversationReference } from "botbuilder";
import * as fetch from "isomorphic-fetch";
import { IBroadcastService } from "./IBroadcastService";

export class LocalBroadcastService implements IBroadcastService {
    public constructor(private localEndpoint) {
    }

    public async broadcast(references: Array< Partial<ConversationReference> >, message: string) {
        const broadcastMessage = {
            message,
            references,
        };

        await fetch(this.localEndpoint, {
            body: JSON.stringify(broadcastMessage),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });
    }
}
