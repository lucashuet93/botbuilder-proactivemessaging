import { ConversationReference, TurnContext } from "botbuilder";
import * as fetch from "isomorphic-fetch";
import { IBroadcastStorageService } from "./IBroadcastStorageService";
import { InMemoryConversationStorage } from "./InMemoryConversationStorage";

export class CloudConversationStorageService extends InMemoryConversationStorage implements IBroadcastStorageService {
    public constructor(private storageEndpoint: string, private restoreEndpoint: string) {
        super();
    }

    public async storeReference(context: TurnContext): Promise< Partial<ConversationReference> > {
        const reference = await super.storeReference(context);

        if (reference !== null && reference !== undefined) {
            const response = await fetch(this.storageEndpoint, {
                body: JSON.stringify({ reference }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            console.log(`${response.status}: ${response.statusText}`);
        }

        return reference;
    }

    public async restoreAllReferences(context: TurnContext): Promise< Array< Partial< ConversationReference > > > {
        const originReference = await this.restoreReference(context);

        const response = await fetch(this.restoreEndpoint, {
            body: JSON.stringify({ reference: originReference }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        if (response.status === 200) {
            const body = await response.json();
            return body.references;
        } else {
            return [originReference];
        }
    }
}
