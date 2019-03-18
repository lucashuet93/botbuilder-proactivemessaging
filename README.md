# Proactive Messaging

When developers build bots they tend to focus on the _reactive_ case - the bot receives a message, processes it, and sends something in response. Correspondingly the botbuilder SDK is optimized to handle this case. Oftentimes, however, there is value in having the bot reach out to the user in a proactive way. This might be in scenarios when your bot is for example supposed to send user a price alert, act on timed reminder, inform user about order status change or in general send notification which originates in external systems. To implement this functionality there is need for mechanism which allows to message a user _proactively_.

When building proactive messaging feature for your botbuilder SDK based bot, there are three different implementation and architecture approaches. Common for all of three approaches is that the bot needs to store conversation reference. Conversation reference is set of properties use by Bot Framework that uniquely identifies specific conversation with specific user. In production scenarios this conversation reference should be stored in external data store (database) which is accessible by external systems, which decides when and to which user the proactive messages should be sent. Below we briefly describe three main approaches to building proactive messaging feature:

1.  **Reusing api/messages endpoint**

   This approach is described in official botbuiler SDK documentation. In this case bot defines only one endpoint, which is responsible for both processing incoming user messages (reactive messaging) and handling proactive message requests (proactive messaging). Official documentation sample describes only scenario, when requests to invoke proactive messages are being sent to bot backend as messages containing substring with value *proactive* while those are being sent from second conversation window. Such approach is purely demonstrative and does not bring any possibility to automate proactive messaging. 

   One way how to achieve automation of proactive messaging, in other words how to enable external system to instruct our bot backend to send proactive messages using same api/messages endpoint is to utilize **Direct Line channel**. Using Direct Line approach we are able to let external system talk to our bot backend thru Bot Connector what ultimately means targeting of api/messages endpoint. When using this approach of shared endpoint for both reactive and proactive messages, proactive message requests flowing to api/messages endpoint need to have specific structure (simplest, yet not the most suitable production approach used also in documentation sample is to include word 'proactive' in message) and must contain Conversation Reference(s) which is later used to invoke proactive messages.  

   One of the big advantages of reusing api/messges endpoint for proactive messaging requests is that you are automatically provided with authentication layer of Bot Framework. This however means you need to register Direct Line channel and handle authentication against Direct Line APi within external system which invokes proactive messaging.

2. **Creating standalone proactive messaging endpoint**

   When implementing proactive messaging you might however want to split logic and code for processing This may be achieved by introducing second endpoint to your bot backend, which will be responsible for listening to proactive message requests.  

   Simplest way of shared secret/API key. 

This repository contains implementation instructions and code samples of proactive bots in Node and .NET using the botbuilder v4 SDK. These samples are utilizing standalone proactive messaging endpoint to receive proactive messaging requests. Each language includes one simple, self-contained sample (no external services), and a more complex, multi-service sample (uses external data store and Azure Fucnction). 

## Instructions and Samples

1. [Node](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/node)
2. [.NET](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/dotnet)