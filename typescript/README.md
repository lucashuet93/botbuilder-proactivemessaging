# Proactive Bot - TypeScript Samples

## Proactive Bot - Basic Implementation

The Proactive Bot covers the following use cases:
- Send a proactive message within the same conversation.

### Prerequisites
1. This sample begins from creating a fresh new **typescript**-based **echo-bot**. For more details on how to make original setup checks this docs: [Create a bot with the Bot Framework SDK for JavaScript](https://docs.microsoft.com/en-us/azure/bot-service/javascript/bot-builder-javascript-quickstart?view=azure-bot-service-4.0).

2. To deploy the bot to the Azure Bot Service (ABS) follow the following instructions: [Deploy your bot](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0).

Important notes:
- Ensure you update the you `<botname>.bot` file with the configuration data that you get from the ABS generated bot. There are various strategies on how to manage encrypting, decrypting and updating the secret key. Just don't store decrypted file in a public repository, or a repository that may eventually become public.
- If you are using a CI/CD pipeline (e.g., Azure DevOps Pipeline), usure you added a TypeScript compliling step into your pipeline. In case you are using Azure DevOps, you can add the [Compile Typescript](https://marketplace.visualstudio.com/items?itemName=bool.compile-type-script) task component from the marketplace.
- Update the `web.config` file to reference to your starting point (e.g. `app.js` in the root folder, or `index.js` in the `lib` folder).

