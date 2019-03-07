# Proactive Messaging
When developers build bots they tend to focus on the _reactive_ case - the bot receives a message, processes it, and sends something in response. Correspondingly the botbuilder SDK is optimized to handle this case. Oftentimes, however, there is value in having the bot reach out to the user in a non-reactive way. Bots that need to give users timed reminders, price alerts or notifications from external systems need a mechanism to message a user _proactively_.

This repository contains implementation instructions and code samples creating a proactive bot in Node and .NET using the botbuilder v4 SDK. Each language includes one simple, self-contained sample (no external services), and a more complex, multi-service sample (uses external data store and Azure Fucnction). 

## Instructions and Samples

1. [Node](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/node)
2. [.NET](https://github.com/lucashuet93/botbuilder-proactivemessaging/tree/master/dotnet)
