// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, TurnContext } = require('botbuilder');
const config = require('./cosmos-config');
const CosmosClient = require('@azure/cosmos').CosmosClient;

class MyBot {
    constructor() {
        this.cosmosClient = this.createCosmosClient();
    }

    createCosmosClient() {
        const masterKey = config.AUTH_KEY;
        const endpoint = config.SERVICE_ENDPOINT;
        const cosmosClient = new CosmosClient({ endpoint: endpoint, auth: { masterKey: masterKey } });
        return cosmosClient;
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            // echo text back to user
            await turnContext.sendActivity(`You said '${turnContext.activity.text}'`);
        } else {
            await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
            if (turnContext.activity.membersAdded.length !== 0) {
                for (let idx in turnContext.activity.membersAdded) {
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        // store the conversation reference for the newly added user
                        await this.storeConversationReference(turnContext);
                    }
                }
            }
        }
    }

    async storeConversationReference(turnContext) {
        // pull the reference
        const reference = TurnContext.getConversationReference(turnContext.activity);
        // store reference in cosmosDB
        try {
            await this.cosmosClient.database(config.DATABASE).container(config.COLLECTION).items.create(reference);
        } catch (err) {
            turnContext.sendActivity(`Write failed: ${err}`);
            console.log(err);
        }
    }
}

module.exports.MyBot = MyBot;
