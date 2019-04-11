// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');
const CosmosClient = require('@azure/cosmos').CosmosClient;

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter } = require('botbuilder');

// This bot's main dialog.
const { MyBot } = require('./bot');

// Note: Ensure you have a .env file.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
  console.log(`\nTo talk to your bot, open advanced.bot file in the Emulator`);
});
// add body parser
server.use(restify.plugins.bodyParser());

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
  appId: process.env.microsoftAppID || "",
  appPassword: process.env.microsoftAppPassword || ""
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${error}`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

const cosmosClient = new CosmosClient({
  endpoint: process.env.SERVICE_ENDPOINT,
  auth: { masterKey: process.env.AUTH_KEY },
});

// Create the main dialog.
const myBot = new MyBot(cosmosClient, {
  collection: process.env.COLLECTION,
  database: process.env.DATABASE,
});

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // Route to main dialog.
    await myBot.onTurn(context);
  });
});

// add proactive endpoint
server.post('/api/proactive', async (req, res) => {
  let references = req.body.references;
  let message = req.body.message;
  for (let reference of references) {
    try {
      await adapter.continueConversation(reference, async (turnContext) => {
        await turnContext.sendActivity(message);
      });
    } catch (err) {
      res.send(400);
      console.log(err);
    }
  }
  res.send(200);
});
