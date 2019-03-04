// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, TurnContext } from 'botbuilder';

export class ProactiveBot {
    /**
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} context on turn context object.
     */
    public onTurn = async (context: TurnContext) => {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        if (context.activity.type === ActivityTypes.Message) {
            await this.sendEchoMessage(context, context.activity.text);
        } else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            // When the user (not the bot) enters the conversation, greet them
            const memberAdded = context.activity.membersAdded.length !== 0;
            const notBot = context.activity.membersAdded[0].id !== context.activity.recipient.id;
            if (memberAdded && notBot) {
                await this.sendWelcomeMessage(context);
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
}
