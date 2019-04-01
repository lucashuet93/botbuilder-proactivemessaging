# Proactive Messaging in Node Bot Framework v4 SDK

This sub repository contains code sample and instructions which demonstrate basic and advanced implementation of proactive messaging in Node. 

1. [Basic Implementation](#basic)
2. [Advanced Implementation](#advanced)

<a name="basic"></a>
# Basic Implementation

At its most basic level, sending proactive messages requires a few additions to a botbuilder SDK bot:

- A separate endpoint on the bot that uses a conversation reference to message the user outside the scope of the bot's onTurn handler
- A mechanism to store a conversation reference for the user
- A mechanism to retrieve the stored conversation reference and invoke the proactive message endpoint

***The bot project inside the /node/basic-sample directory fully implements the following instructions.***

### Create the Proactive Endpoint

The bot will need to accept requests on a different endpoint than /api/messages and will need to message the user there, though it is outside the scope of the bot's onTurn handler. The Bot Framework enables this functionality through the ```continueConversation()``` method on the BotFrameworkAdapter class. ```continueConversation()``` accepts an instance of the ConversationReference class, so requests to the endpoint must contain a stored instance of a conversation reference object.

The following code should be added to the index.js file, which creates an /api/proactive endpoint that expects a request body containing a conversation reference and message:

```javascript
server.post('/api/proactive', async (req, res) => {
    let reference = req.body.reference;
    let message = req.body.message;
    await adapter.continueConversation(reference, async (turnContext) => {
        await turnContext.sendActivity(message);
    });
});
```

In order for the restify server to handle request body objects, the server must use body parser middleware. Add the following code to the index.js file after the server creation logic:

```javascript
// add body parser
server.use(restify.plugins.bodyParser());
```

### Store the Conversation Reference

Conversation references can be retrieved during any conversation turn using the turnContext object. The TurnContext class contains a ```getConversationReference()``` method, which accepts an instance of the Activity class, accessible on any turnContext instance.

For basic implementation, the reference is stored in memory on runtime as conversation state. Instantiate conversation state in the index.js file and pass it into the bot's constructor:

```javascript
// Introduce state
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const myBot = new MyBot(conversationState);
```

Ensure that the bot's constructor accepts the conversation state and creates a property that will be used to later store the user's conversation reference:

```javascript
constructor(conversationState) {
    this.conversationState = conversationState;
    this.conversationReference = this.conversationState.createProperty('CONVERSATION_REFERENCE');
}
```

The following method takes the turnContext from a conversation turn, pulls the conversation reference using the ```getConversationReference()``` method, and stores it in the conversation state property created in the constructor. Add the method to your bot class:

```javascript
async storeConversationReference(turnContext) {
    // pull the reference
    const reference = TurnContext.getConversationReference(turnContext.activity);
    // store reference in memory using conversation data property
    await this.conversationReference.set(turnContext, reference);
}
```

Call the method in your bot's onTurn handler, preferably immediately when the bot receives a conversationUpdate activity:

```javascript
// store the conversation reference for the newly added user
await this.storeConversationReference(turnContext);
```

Make sure to save the conversation state after the method call:

```javascript
// save the conversation state
await this.conversationState.saveChanges(turnContext);
```

### Post the Stored Conversation Reference to the Proactive Endpoint

The /api/proactive endpoint can be hit by any service at this point so long as it sends a conversation reference and message in the request body, but for basic implementation the endpoint is configured to be hit by the bot itself. To complete the flow, you'll need to retrieve the stored conversation reference and make a post request to the /api/proactive endpoint with a body containing the reference and the message to send. The following method demonstrates this functionality:

```javascript
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
```

The above method uses the fetch npm package to make the post request, but any http client could be used in its place. Call the method from anywhere in your bot's onTurn handler and the bot will send a proactive message. In the basic implementation, the bot is configured to echo user messages unless the user sends a message that begins with "proactive - ", in which case it triggers the method:

```javascript
if (turnContext.activity.text.includes('proactive - ')) {
    // if user types proactive - {message}, send the message proactively
    const message = turnContext.activity.text.split('proactive - ')[1];
    await this.triggerProactiveMessage(turnContext, message);
} else {
    // otherwise, echo text back to user
    await turnContext.sendActivity(`You said '${turnContext.activity.text}'`);
}
```

<a name="advanced"></a>
# Advanced Implementation

In a more advanced implementaion, the goal is to trigger the proactive message outside of the bot. Triggering the /api/proactive endpoint created from earlier could be achieved through via an external web service, eventing mechanism, or a simple REST call. 

In this example, the service architecture must be capable of sending notifications to specific users as well as broadcasting to the entire subset of users that have interacted with the bot. In order to implement this flow, a few requirements must be met:

- An updated proactive endpoint capable of broadcasting
- A database to store conversation references (CosmosDB)
- An Azure Function capable of retrieving conversation references from the database and posting to the proactive endpoint

The bot will be configured to store conversation references in Cosmos DB and handle proactive messages to multiple conversations via POST requests. The Azure Function will be configured to retrieve the conversation references for all users or a single user and post them to the bot's proactive endpoint. The function can then be used by any external service to trigger proactive messages to users. The full flow is as follows:

1. The bot stores the conversation reference in Cosmos DB when a user starts a conversation with the bot on a new channel.
2. The Azure Function accepts a request with a body containing a message property.
3. The Azure Function retrieves a subset of the conversation references stored in CosmosDB and posts the references and message to the bot's proactive endpoint.
4. The bot proactively messages each conversation for which references were sent. 

It is important to note that any services could be used as alternatives to CosmosDB for storage and Azure Functions for endpoint triggering.

***The bot and azureFunction projects inside the /node/advanced-sample directory fully implement the following instructions.***

### Create the Proactive Endpoint

Broadcasting will require handling of multiple conversation references, and messaging a user could involve several conversation references as well. A user may chat with the bot on multiple channels and could thus have multiple conversation references attached to their user id. The proactive endpoint will continue to use the ```continueConversation()``` method on the BotFrameworkAdapter class, but will need to be updated in order to handle the array of conversation references the Azure Function will ultimately post to it.

The following code should be added to the index.js file, which creates an /api/proactive endpoint that expects a request body containing an array of conversation references and message, ultimately sending proactive messages to all references sent in the body:

```javascript
server.post('/api/proactive', async (req, res) => {
    let references = req.body.references;
    let message = req.body.message;
    for (let reference of references) {
        await adapter.continueConversation(reference, async (turnContext) => {
            await turnContext.sendActivity(message);
        });
    }
});
```

### Store the Conversation Reference using Cosmos DB

For this advanced implementation, the reference is stored in a Cosmos DB SQL API. Before implementing code to interact with Cosmos DB, provision a new empty Cosmos DB instance on Azure with the Core(SQL) API using the [Microsoft Docs](https://docs.microsoft.com/en-us/azure/cosmos-db/create-sql-api-nodejs#create-a-database-account)

Create a file called cosmos-config.json at the base of the bot folder and add the following properties taken from the Cosmos DB instance on the Azure Portal:

```javascript
{
    "SERVICE_ENDPOINT": "https://YOUR-ENDPOINT-NAME.documents.azure.com:443/",
    "AUTH_KEY": "YOUR-SECRET",
    "DATABASE": "DATABASE-NAME",
    "COLLECTION": "COLLECTION-NAME"
}
```

Make sure to npm install the @azure/cosmos package and require it, along with the cosmos-config file, in your bot.js file:

```javascript
const config = require('./cosmos-config');
const CosmosClient = require('@azure/cosmos').CosmosClient;
```

Next, create a method that will connect to your Cosmos DB instance and return a useable client for later database operations. Create a class property called ```cosmosClient``` and assign it to the client returned from your newly created method in the bot's constructor:

```javascript
constructor() {
    this.cosmosClient = this.createCosmosClient();
}

createCosmosClient() {
    const masterKey = config.AUTH_KEY;
    const endpoint = config.SERVICE_ENDPOINT;
    const cosmosClient = new CosmosClient({ endpoint: endpoint, auth: { masterKey: masterKey } });
    return cosmosClient;
}
```

The following method takes the turnContext from a conversation turn, pulls the conversation reference using the ```getConversationReference()``` method, and utilizes the ```cosmosClient``` class property initialized earlier to store it in the database and collection specified in the cosmos-config.json file. Add the method to your bot class:

```javascript
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
```

Much like the basic example, call the method in your bot's onTurn handler, preferably immediately when the bot receives a conversationUpdate activity:

```javascript
// store the conversation reference for the newly added user
await this.storeConversationReference(turnContext);
```

### Retrieve Cosmos DB data using the Azure Function

Azure Functions are able to connect to a number of other Azure services through bindings. Interaction with the Cosmos DB via the Azure Function will be achieved through the addition of the CosmosDB input binding. For more information on bindings, visit the [Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings)

Install the Azure Functions Core Tools npm package to take action on the function app via the CLI

```npm install -g azure-functions-core-tools```

Create a new local Azure Function app, and add 2 HTTP triggered functions to it called 'MessageAllUsers' and 'MessageSpecificUser'. For instructions on developing local functions, visit the [Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-develop-local)

In order to use the CosmosDB input binding, navigate into your function app's folder and install the extension:

```func extensions install -p Microsoft.Azure.WebJobs.Extensions.CosmosDB -v 3.0.0```

Before you can create the binding, the function must have access to its connection string via an environment variable. Add the following environment variable to the ```Values``` section of the local.settings.json file. 

```"AzureWebJobsDocumentDBConnectionString": "YOUR_COSMOS_CONNECTION_STRING"```

Each function should have generated a function.json file that contains configuration metadata, including binding configurations. The following code will create a binding that utilizes the connection string environment variable to assign the results of the ```sqlQuery``` to a variable called ```allDocuments```. Add it to the functions.json file in the 'MessageAllUsers' function:

```javascript
{
    "name": "allDocuments",
    "type": "cosmosDB",
    "direction": "in",
    "databaseName": "YOUR_DATABASE",
    "collectionName": "YOUR_COLLECTION",
    "sqlQuery": "SELECT * FROM c",
    "connectionStringSetting": "AzureWebJobsDocumentDBConnectionString"
}
```

The 'MessageSpecificUser' function requires the same addition with a different ```sqlQuery``` value and can use a different name, though that is entirely up to the developer. The /node/advanced-sample/azureFunction/MessageSpecificUser/function.json file demonstrates creation of the binding that retrieves conversation references for a specific user.

Using the binding in the function code is quite simple. Each function has access to an object called ```context``` that contains its bindings, accessible through ```context.bindings```. The binding name specified in the function.json file becomes a key on the ```context.bindings``` object, so in this case, ```context.bindings.allDocuments``` contains the results of the ```sqlQuery``` value. Add the following code to the 'MessageAllUsers' index.js file to retrieve all conversation references:

```javascript
// pull all cosmos entries, each of which is a conversation reference
let conversationReferences = context.bindings.allDocuments;
```

### Post the Stored Conversation Reference to the Proactive Endpoint

Before writing the code to post the references to the bot, the function will need access to the bot's proactive endpoint. The endpoint should be the deployed bot's url, or an ngrok tunnel can be created to generate a publicly accessible endpoint if the bot has not yet been deployed. For more info on ngrok tunnels to localhost, visit [ngrok](https://ngrok.com/). Add the following environment variable to the ```Values``` section of the local.settings.json file: 

```"ProactiveEndpoint": "YOUR_NGROK_ENDPOINT"```

The /api/proactive endpoint has been updated to accept and handle a ```references``` array and ```message``` string. The function is now capable of retrieving the conversation references, and it will accept the message via the POST body it receives (remember, it is an HTTP triggered function). The following code loops through the retrieved entries and isolates the properties relevant to the conversation reference (Cosmos DB attaches a few other properties like id to each entry automatically), then posts the references and message to the proactive endpoint taken from local.settings.json:

```javascript
let references = [];
// loop through cosmos entries
for (let conversationReference of conversationReferences) {
    // isolate conversation reference from entry
    const reference = {
        activityId: conversationReference.activityId,
        user: conversationReference.user,
        bot: conversationReference.bot,
        conversation: conversationReference.conversation,
        channelId: conversationReference.channelId,
        serviceUrl: conversationReference.serviceUrl
    }
    references.push(reference);
}

if (references.length > 0) {
    // hit proactive endpoint with message and conversation reference
    const postBody = {
        references: references,
        message: req.body.message
    };
    fetch(process.env.ProactiveEndpoint, {
        method: 'POST',
        body: JSON.stringify(postBody),
        headers: { 'Content-Type': 'application/json' }
    }).then((res) => {
        context.res = {
            status: 200,
            body: "Users have been notified"
        };
        context.done();
    });
} else {
    context.res = {
        status: 200,
        body: "No entries found"
    };
    context.done();
}
```
The above method uses the fetch npm package to make the post request, but any http client could be used in its place.

### Complete the Flow

Run the bot and Azure function simultaneously, then make a POST request to one of the Azure Function's endpoints to proactively broadcast a message or send the message to a specific user. 
