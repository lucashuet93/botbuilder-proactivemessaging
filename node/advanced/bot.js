// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
require('es6-promise').polyfill();
const fetch = require('isomorphic-fetch');

class MyBot {
    constructor(conversationStorageService) {
        this.conversationStorageService = conversationStorageService;
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            if (turnContext.activity.text.includes('broadcast - ')) {
                // if user types proactive - {message}, send the message proactively
                const message = turnContext.activity.text.split('broadcast - ')[1];

                const broadCastList = await this.getBroadcastList(turnContext, message);
                await this.broadcastMessage(broadCastList);
            } else if (turnContext.activity.text.includes('proactive - ')) {
                // if user types proactive - {message}, send the message proactively
                const message = turnContext.activity.text.split('proactive - ')[1];

                const broadCastList = await this.getProactiveList(turnContext, message);
                await this.broadcastMessage(broadCastList);
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
                        await this.conversationStorageService.storeReference(turnContext);
                    }
                }
            }
        }
        await this.conversationStorageService.updateState(turnContext);
    }

    async broadcastMessage(broadCastList) {
        const localBroadcastEndpoint = 'http://localhost:3978/api/broadcast';

        // send messages to all the referenced conversations
        await fetch(localBroadcastEndpoint, {
            method: 'POST',
            body: JSON.stringify(broadCastList),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async getProactiveList(turnContext, message) {
        // pull the reference
        const originReference = await this.conversationStorageService.restoreReference(turnContext);

        const broadCastList = {
            references: [originReference],
            message
        };

        return broadCastList;
    }

    async getBroadcastList(turnContext, message) {
        // pull the reference
        const originReference = await this.conversationStorageService.restoreReference(turnContext);
        const postBody = { originReference, message };
        const broadcastEndpoint = 'https://proactive-bot-function.azurewebsites.net/api/broadcastConversation?code=ADT5RTIydqugxGMLVub3OyxzwEtYhZ16aUvkDmsrH7i5p7Fjuoj4ww==';

        // get broadcasting references
        const response = await fetch(broadcastEndpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        });

        return await response.json();
    }
}

module.exports.MyBot = MyBot;
