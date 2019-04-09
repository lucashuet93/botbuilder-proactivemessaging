// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from "dotenv";
import * as path from "path";
import * as restify from "restify";

import { BotFrameworkAdapter } from "botbuilder";
import { BotConfiguration, IEndpointService } from "botframework-config";

import { ProactiveBot } from "./bot";
import { CloudConversationStorageService } from "./services/CloudConversationStorageService";
import { InMemoryConversationStorage } from "./services/InMemoryConversationStorage";
import { LocalBroadcastService } from "./services/LocalBroadcastService";

const ENV_FILE = path.join(__dirname, "..", ".env");
config({ path: ENV_FILE });

const DEV_ENVIRONMENT = "development";
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);
const BOT_FILE = path.join(__dirname, "..", (process.env.botFilePath || ""));

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978);
// Add body parser
server.use(restify.plugins.bodyParser());

// Read bot configuration from .bot file.
let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file.`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION) as IEndpointService;

// Create adapter.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword,
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    await context.sendActivity(`Oops. Something went wrong!`);
};

const localURL = "http://localhost:3978";
const botServiceURL = (BOT_CONFIGURATION === DEV_ENVIRONMENT) ? localURL : process.env.botAzureServiceURL;

const cloudStoreEndpoint = process.env.cloudStoreEndpoint;
const cloudRestoreEndpoint = process.env.cloudRestoreEndpoint;
// Create the main dialog.
const conversationStorageService = new CloudConversationStorageService(cloudStoreEndpoint, cloudRestoreEndpoint);
// const conversationStorageService = new InMemoryConversationStorage();
const broadcastEndpoint = `${botServiceURL}/api/broadcast`;
const broadcastService = new LocalBroadcastService(broadcastEndpoint);
const proactiveBot = new ProactiveBot(conversationStorageService, broadcastService);

// Listen for incoming requests.
server.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await proactiveBot.onTurn(context);
    });
});

// Listen for broadcasting requests
server.post("/api/broadcast", async (req, res) => {
    const broadcastMessage = req.body;
    if (broadcastMessage !== null && broadcastMessage !== undefined) {
        const references = broadcastMessage.references;
        const message = broadcastMessage.message;
        const notifyMessage = `*Broadcasting message is comming...*`;

        await references.forEach(async (reference) => {
            // Ensure we are not calling localhost references when we are deployed to the cloud
            const localUrl = reference.serviceUrl.includes("localhost");
            const localEnv = BOT_CONFIGURATION === DEV_ENVIRONMENT;
            const matchEnv = (localEnv) || (!localEnv && !localUrl);
            if (matchEnv) {
                try {
                    // Try restore conversation
                    await adapter.continueConversation(reference, async (turnContext) => {
                        await turnContext.sendActivity(notifyMessage);
                        await turnContext.sendActivity(message);
                    });
                } catch (err) {
                    // Catch for unresponsive references
                }
            }
        });
        res.send(200);
    } else {
        // No body found
        res.send(204);
    }
});
