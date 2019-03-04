// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, TurnContext } from "botbuilder";
import * as fetch from "isomorphic-fetch";
import { IBroadcastService } from "./services/IBroadcastService";
import { IConversationStorageService } from "./services/IConversationStorageService";

export class ProactiveBot {
    constructor(private conversationStorageService: IConversationStorageService,
                private broadcastService: IBroadcastService) {
    }

    /**
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} context on turn context object.
     */
    public onTurn = async (context: TurnContext) => {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        if (context.activity.type === ActivityTypes.Message) {
            const msg = context.activity.text;
            const keywordsRegExp = /(^delay|^postpone|^wait)/i;
            const match = msg.match(keywordsRegExp);

            if (match !== null) {
                if (match[0] === "delay" || match[0] === "postpone" || match[0] === "wait") {
                    const realmsg = msg.substring(match[0].length + 1).trim();
                    await this.sendDelayedMessage(context, realmsg, 5000);
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
                this.conversationStorageService.storeReference(context);
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
}
