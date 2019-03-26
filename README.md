# Proactive Messaging

When developers build bots they tend to focus on the _reactive_ case - the bot receives a message, processes it, and sends something in response. Correspondingly the botbuilder SDK is optimized to handle this case. Oftentimes, however, there is value in having the bot reach out to the user in a proactive way. This might be in scenarios when your bot is for example supposed to send user a price alert, act on timed reminder, inform user about order status change etc. To implement this functionality there is need for mechanism which allows to message a user _proactively_.

When building proactive messaging feature for your Bot Framework based bot, there are two different implementation and architecture approaches. Common thing for both approaches is, that there is need to store conversation reference. Conversation reference is set of properties used by Bot Framework that uniquely identifies specific conversation with specific user(s). In production scenarios this conversation reference should be stored in separate data store (database) and should be linked to user identity. Invocation of proactive messages then may originate in bot backend itself, but oftentimes, there is external system, which implements logic responsible for initiation of proactive messaging. For example let's consider e-commerce solution. Such solution has it's own core backend part responsible for the whole goods purchasing process and the initiation of proactive messaging may be needed in case of change of order status. In such case there is need to enable communication between bot and this external system so it can invoke proactive message request. Below we briefly describe two main approaches how to implement proactive messaging feature using Bot Framework:

1. **Reusing api/messages endpoint**

   This approach is described in official [Bot Framework documentation](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-proactive-message?view=azure-bot-service-4.0&tabs=csharp). In this case, bot defines only one endpoint, which is responsible for both processing incoming user messages (reactive messaging) and handling proactive message requests (proactive messaging). Official documentation sample describes scenario, in which requests to invoke proactive messages are being sent to bot backend as regular messages containing substring '*proactive*'. These messages are being sent from second conversation window. Such approach is purely demonstrative and does not provide possibility to automate proactive messaging. 

   One way to achieve automation of proactive messaging, in other words how to enable external system to instruct bot backend to send proactive messages using same api/messages endpoint, is to utilize **Direct Line channel**. Using Direct Line approach we are able to let external system talk to our bot backend thru Bot Connector and thus to target api/messages endpoint. When using this approach of shared endpoint for both reactive and proactive messages, proactive message requests flowing to api/messages endpoint need to have specific structure/content so bot knows it should treat the message as requests initiating proactive message. 

   One of the advantages of reusing api/messages endpoint for proactive messaging requests is that you are automatically provided with authentication layer of Bot Framework. However, this means you need to register Direct Line channel and handle authentication against Direct Line API within external system which invokes proactive messaging.

   Below we are stating architecture diagram describing flow to initiate proactive messages using api/messages endpoint and Direct Line channel.



    ![Proactive Messages using Direct Line](img\proactive_directline.png)

   <center>Proactive messaging flow using Direct Line</center>

2. **Creating standalone proactive messaging endpoint**

   When implementing proactive messaging you might want to split logic and code for processing reactive messages and request for proactive messages. This may be achieved by introducing of second endpoint to your bot backend, which will be responsible for listening to proactive message requests. This approach takes away need of setting up the Direct Line channel, however it leaves all the responsibility for securing of communication between external system and your bot backend on your shoulders. As in this case you are exposing new endpoint, new API, you should secure it (especially in production scenario). Simplest way how to achieve it is to use share secret or API key. Below we are again stating architecture diagram describing flow to initiate proactive messages using standalone endpoint.

   ![Proactive Messages using Standalone Endpoint](img\proactive_separeteendpoint.png)

   <center>Proactive messaging flow using Standalone endpoint</center>

------

This repository contains implementation instructions and code samples of proactive bots in Node and .NET using the botbuilder v4 SDK. These samples are utilizing standalone proactive messaging endpoint to receive proactive messaging requests. Each language includes one simple, self-contained sample (no external services). For Node.js you will find here also more complex, multi-service sample (uses external data store and Azure Function). 

## Instructions and Samples

1. [Node](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/node)
2. [.NET](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/dotnet)