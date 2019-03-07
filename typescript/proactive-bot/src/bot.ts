// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, TurnContext } from "botbuilder";
import { IBroadcastService } from "./services/IBroadcastService";
import { IBroadcastStorageService } from "./services/IBroadcastStorageService";

export class ProactiveBot {
    constructor(private conversationStorageService: IBroadcastStorageService,
                private broadcastService: IBroadcastService) {
    }

    /**
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} context on turn context object.
     */
    public async onTurn(context: TurnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        if (context.activity.type === ActivityTypes.Message) {
            const msg = context.activity.text;
            const keywordsRegExp = /(^delay|^postpone|^wait|^broadcast|^helloworld)/i;
            const match = msg.match(keywordsRegExp);

            if (match !== null) {
                const realmsg = msg.substring(match[0].length + 1).trim();
                if (match[0] === "delay" || match[0] === "postpone" || match[0] === "wait") {
                    await this.sendDelayedMessage(context, realmsg, 5000);
                } else if (match[0] === "broadcast" || match[0] === "spam" || match[0] === "helloworld") {
                    await this.sendBroadcastMessage(context, realmsg);
                }
            } else {
                await this.sendEchoMessage(context, context.activity.text);
            }
        } else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            // When the user (not the bot) enters the conversation, greet them
            const memberAdded = context.activity.membersAdded.length !== 0;
            const notBot = context.activity.membersAdded[0].id !== context.activity.recipient.id;
            if (memberAdded && notBot) {
                await this.sendWelcomeMessage(context);
                // Extract the reference from the context and store in inside the storage service
                await this.conversationStorageService.storeReference(context);
            }
        }
    }

    private async sendWelcomeMessage(context: TurnContext) {
        const welcomeMessage = `**Echo**: *Hello, friend*!`;
        await context.sendActivity(welcomeMessage);
    }

    private async sendEchoMessage(context: TurnContext, msg: string) {
        const echoMessage = `**Echo**: *${msg}*`;
        await context.sendActivity(echoMessage);
    }

    private async sendDelayedMessage(context: TurnContext, msg: string, delay: number) {
        const echoMessage = `**Delayed**: *${msg}*`;
        const notifyMessage = `*Delayed message will come in ~${delay / 1000} seconds.*`;
        await context.sendActivity(notifyMessage);
        // Restore conversation reference
        const reference = await this.conversationStorageService.restoreReference(context);
        setTimeout(async () => {
            await this.broadcastService.broadcast([reference], echoMessage);
        }, delay);
    }

    private async sendBroadcastMessage(context: TurnContext, msg: string) {
        const echoMessage = `**Broadcasting**: *${msg}*`;
        const notifyMessage = `*Broadcasting to everyone in the chat!*`;
        await context.sendActivity(notifyMessage);
        // Restore conversation reference
        const references = await this.conversationStorageService.restoreAllReferences(context);
        await this.broadcastService.broadcast(references, echoMessage);
    }
}
