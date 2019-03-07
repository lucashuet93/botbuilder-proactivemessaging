// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, TurnContext } = require('botbuilder');
require('es6-promise').polyfill();
require('isomorphic-fetch');

const CONVERSATION_REFERENCE = 'CONVERSATION_REFERENCE';

class MyBot {
    constructor(conversationState) {
        this.conversationState = conversationState;
        this.conversationReference = this.conversationState.createProperty(CONVERSATION_REFERENCE);
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            if (turnContext.activity.text.includes('proactive - ')) {
                // if user types proactive - {message}, send the message proactively
                const message = turnContext.activity.text.split('proactive - ')[1];
                await this.triggerProactiveMessage(turnContext, message);
            } else {
                // otherwise, echo text back to user
                await turnContext.sendActivity(`You said '${turnContext.activity.text}'`);
            }
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
        await this.conversationState.saveChanges(turnContext);
    }

    async storeConversationReference(turnContext) {
        // pull the reference
        const reference = TurnContext.getConversationReference(turnContext.activity);
        // store reference in memory using conversation data property
        await this.conversationReference.set(turnContext, reference);
    }

    async triggerProactiveMessage(turnContext, message) {
        // pull the reference
        const reference = await this.conversationReference.get(turnContext);
        const postBody = { reference, message };
        const localProactiveEndpoint = 'http://localhost:3978/api/proactive';
        await turnContext.sendActivity('Proactive message incoming...');
        // send the conversation reference and message to the bot's proactive endpoint
        await fetch(localProactiveEndpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

module.exports.MyBot = MyBot;
