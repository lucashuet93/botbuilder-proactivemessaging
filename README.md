# Proactive Messaging

![ProactiveMessaging GIF](/node/images/ProactiveMessage.gif)

When developers build bots they tend to focus on the *reactive* case - the bot receives a message, processes it, and sends something to the user in response. As such, the botbuilder SDK is optimized to handle this case. However, there is often value in having the bot reach out to the user in a proactive way. There might be scenarios when the bot should send users a price alert, act on a timed reminder, inform users about an order status change, etc. To implement this functionality, some mechanism must allow the bot to message a user *proactively*.

When building the proactive messaging feature for a Bot Framework based bot, there are two different implementation and architecture approaches. Both approaches need to store a **conversation reference**. A conversation reference is a set of properties that is used by the Bot Framework. The set uniquely identifies a specific conversation for a specific user, or users. In production scenarios, this conversation reference should be stored in a separate data store (database) and should be linked to an existing user's identity.

Proactive messages may be invocated in the bot backend itself, but there is usually an external system to handle this. Either approach will implement logic to invoke the proactive messaging process. For example, let's consider an e-commerce solution. The solution has its own core backend that is responsible for the whole-goods purchasing process. If a customer's order status were to change from "Processing" to "Out for Delivery," they might want to be alerted. The system would then need to send a proactive message. There must be some mechanism for the bot and the external system to communicate and invoke a proactive message request that updates the user about their order status.

Below are two of the main approaches to implement the proactive messaging feature using the Bot Framework:

1. **Reusing the api/messages endpoint**

   This approach is described in the official [Bot Framework documentation](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-proactive-message?view=azure-bot-service-4.0&tabs=csharp). In this case, the bot defines only one endpoint (api/messages), which is responsible for processing incoming user messages (reactive messaging), and invoking proactive message requests (proactive messaging). The documentation walks through this approach in the linked sample code (available in [C#](https://github.com/Microsoft/BotBuilder-Samples/tree/master/samples/csharp_dotnetcore/16.proactive-messages) and [js](https://github.com/Microsoft/BotBuilder-Samples/tree/master/samples/javascript_nodejs/16.proactive-messages)). These proactive messages are being sent from a second conversation window.

   An advantage of reusing the api/messages endpoint for proactive messaging requests is that the authentication layer of the Bot Framework is automatically be provided. This means an external system (which invokes a proactive message) can register the Direct Line channel and handle authentication against the Direct Line API. While using the shared endpoint for reactive and proactive messages may simplify the overall architecture, it also means there must be specific structure/content to incoming messages from the administrator who seeks to invoke a proactive message. A specific example might be that every proactive message invocation begins with "proactive - ", and results in all bot users receiving the message after "-". This unfortunately also opens up an attack vector - if a user of your bot discovers how proactive messages are invoked, they could force your bot to send proactive messages at their will.

   Below is an architecture diagram describing the flow to initiate proactive messages using the api/messages endpoint and the Direct Line channel.

![Proactive Messages using Direct Line](https://github.com/lucashuet93/botbuilder-proactivemessaging/blob/master/img/proactive_directline.png)

<center><i>Fig. 1: Proactive messaging flow using DirectLine</i></center>

2. **Creating a standalone proactive messaging endpoint**

   The approach taken in these samples instead uses two endpoints, the bot's endpoint (api/messages) and an endpoint reserved expressly to trigger proactive messages (api/proactive). In this approach, we're not piggybacking off of DirectLine's authentication, which means we're responsible for securing securing communication between an external system and the proactive endpoint. This new endpoint should be secured by the developer, *especially* in a production scenario. The simplest way to do this is with a shared secret or API key.

   Below is an architecture diagram describing the flow to initiate proactive messages using the standalone api/proactive endpoint in tandem with the api/messages endpoint.

![Proactive Messages using Standalone Endpoint](https://github.com/lucashuet93/botbuilder-proactivemessaging/blob/master/img/proactive_separeteendpoint.png)

<center><i>Fig. 2: Proactive messaging flow using a standalone endpoint</i></center>

Some developers may want to limit the number of database queries. To do this, obtain a conversation reference object within the second step. Send this conversation reference as part of the request floating to the bot backend from the external system. This could apply to both scenarios - it depends purely on any architectural preferences, the scenario, and the estimated number of database queries.

------

This repository contains implementation instructions and code samples of proactive bots in Node and .NET using the botbuilder v4 SDK. These samples utilize the standalone proactive messaging endpoint to receive proactive messaging requests. Each language includes one simple, self-contained sample with no external services. For Node.js there is a more complex, multi-service sample that uses an external data store and Azure Functions.

## Instructions and Samples

1. [Node](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/node)
2. [.NET](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/dotnet)
3. [TypeScript](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/typescript)
