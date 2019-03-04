# Proactive Bot - TypeScript Samples

## Proactive Bot - Basic Implementation

The Proactive Bot covers the following use cases:
- Send a proactive message within the same conversation.
- Broadcast a message to all live conversations from with-in chat.
- Broadcast a message to all live conversations from external endpoint.

### Prerequisites

1. This sample begins from creating a fresh new **typescript**-based **echo-bot**. For more details on how to make original setup checks this docs: [Create a bot with the Bot Framework SDK for JavaScript](https://docs.microsoft.com/en-us/azure/bot-service/javascript/bot-builder-javascript-quickstart?view=azure-bot-service-4.0).

2. To deploy the bot to the Azure Bot Service (ABS) follow the following instructions: [Deploy your bot](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0).

Important notes:
- Ensure you update your `<botname>.bot` file with the configuration data that you got from the ABS-generated bot. There are various strategies on how to manage encrypting, decrypting and updating the secret key. Just don't store decrypted file in a public repository, or a repository that may eventually become public.
- Update the `botFilePath` varible in Application Settings sections on the Azure Portal to reference to your `<botname>.bot` file, if the file name differs from the one generaterd by the ABS.
- If you are using a CI/CD pipeline (e.g., Azure DevOps Pipeline), ensure you added a TypeScript compliling step into your pipeline. In case you are using Azure DevOps, you can add the [Compile Typescript](https://marketplace.visualstudio.com/items?itemName=bool.compile-type-script) task component from the marketplace.
- Update the `web.config` file to reference to your starting point (e.g. `app.js` in the root folder, or `index.js` in the `lib` folder).

### Store Conversation Reference

To continue the conversation in a distant moment in future, we have to extract and store somewhere a reference to the current conversations:
- To extract the reference we use the static function: `TurnContext.getConversationReference`.
- To temporary same the reference we create a `ConversationState` object based on a `MemoryStorage` object.

These calls are encapsulated into a new class `InMemoryConversationStorage` in the `/services/` subfolder. Implement two main methods (optionally, you can also update the state):

*Restore or create a reference to the conversation*
```js
    public async restoreReference(context: TurnContext): Promise<ConversationReference> {
        // try extract stored reference
        let reference = await this.conversationReferenceStorage.get(context);
        // else create a new reference from the context
        if (reference === null || reference === undefined) {
            reference = TurnContext.getConversationReference(context.activity);
        }
        return reference;
    }
```

*Store a reference to the conversation*
```js
    public async storeReference(context: TurnContext): Promise<ConversationReference> {
        const reference = await this.restoreReference(context);
        await this.conversationReferenceStorage.set(context, reference);
        return Promise.resolve(reference);
    }
```

