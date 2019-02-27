const fetch = require('isomorphic-fetch');

module.exports = async function (context, req) {
    context.log('Broadcasting the message!');

    const message = req.body.message;
    const references = req.body.references;

    const broadcastList = {
        message,
        references
    };

    if (references.length > 0) {
        const botBroadcastEndpoint = "https://broadcastingbot.azurewebsites.net/api/broadcast/";

        await fetch(botBroadcastEndpoint, {
                method: 'POST',
                body: JSON.stringify(broadcastList),
                headers: { 'Content-Type': 'application/json' }
        });

        context.res = {
            status: 200
        };
        context.log(`Broadcasted to ${references.length} conversations.`);
    }
    else {
        context.res = {
            status: 400,
            body: "No references to broadcast provided."
        };
        context.log(`No references to broadcast provided.`);
    }
};