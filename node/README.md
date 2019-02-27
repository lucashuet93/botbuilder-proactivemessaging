# Proactive Messaging for Node

1. [Basic Implementation](#basic)
2. [Advanced Implementation](#advanced)

<a name="basic"></a>
## Basic Implementation

At its most basic level, sending proactive messages in the Bot Framework requires a few additions to your solution:

- A separate endpoint on the bot that uses a conversation reference to message the user outside the scope of the bot's onTurn handler
- A way to pick up "proactive message".
- A mechanism to store a conversation reference for the user
- A mechanism to post the stored conversation reference to the separate endpoint

***The bot project inside the /node/basicSample directory fully implements the following instructions.***

### Create the Proactive Endpoint

The bot will need to accept requests on a different endpoint than /api/messages and will need to message the user there, though it is outside the scope of the bot's onTurn handler. The Bot Framework enables this functionality through the ```continueConversation()``` method on the BotFrameworkAdapter class. ```continueConversation()``` accepts an instance of the ConversationReference class, so requests to the endpoint must contain a stored instance of a conversation reference object.

The following code should be added to the index.js file, which creates an /api/proactive endpoint that expects a request bodies containing a conversation reference and message:

```javascript
server.post('/api/proactive', async (req, res) => {
    let reference = req.body.reference;
    let message = req.body.message;
    await adapter.continueConversation(reference, async (turnContext) => {
        await turnContext.sendActivity(message);
    });
});
```

### Pick up the proactive message

On every turn, if a user types in a keyword or phrase, bot picks it up and trigger triggerProactiveMessage method. The string is also split and cleaned up to retain the text string a person wants to send.

```javascript
if (turnContext.activity.text.includes('proactive - ')) { 
// if user types proactive - {message}, send the message proactively
const message = turnContext.activity.text.split('proactive - ')[1];
await this.triggerProactiveMessage(turnContext, message);
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
The "bot" is considered a user. Newly added "user" means when you start communicating to the bot, you are considered a new "user". 

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

The above method uses the fetch npm package to make the post request, but any http client could be used in its place. Call the method from anywhere in your bot's onTurn handler and the bot will send a proactive message.

<a name="advanced"></a>
## Advanced Implementation

In this example, the goal is to trigger the proactive message outside of the bot. Some ideas around this including trigerring through the endpoint created from earlier via a website, eventing mechanism or a simple REST call. 

In this example, Azure Functions is used as a trigger to the proactive endpoint created earlier. Some considerations in order the achieve this as follow:-

- A data store to keep conversation information.
- A mechanism to check the data store
- A mechanism to send proactive messages to user/s via the endpoint created from earlier

### CosmosDB to keep conversation information
### Azure Functions to check CosmosDB collection
### Send proactive messages to a specific user
### Send proactive messages to a group of users