import { ConversationReference, TurnContext } from "botbuilder";
import * as fetch from "isomorphic-fetch";
import { InMemoryConversationStorage } from "./InMemoryConversationStorage";

export class CloudConversationStorageService extends InMemoryConversationStorage {
    public constructor(private storageEndpoint: string) {
        super();
    }

    public async storeReference(context: TurnContext): Promise<ConversationReference> {
        const reference = await super.storeReference(context);

        if (reference !== null && reference !== undefined) {
            await fetch(this.storageEndpoint, {
                body: JSON.stringify({ reference }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
        }

        return reference;
    }
}
