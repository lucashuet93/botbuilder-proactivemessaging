const fetch = require('isomorphic-fetch');

module.exports = async function (context, req) {
    context.log('Broadcasting the message!');

    const message = req.body.message;
    const references = req.body.references;
    let broadcastList = {
        message
    };
    const broadcastListEnpoint = process.env.broadcastListEnpoint;
    // build broadcasting list if nothing is provided
    if (references === null || references === undefined || references.length === 0) {
        context.log(`No references to broadcast provided. Extracting references from the endpoint.`);
        const postBody = { originReference: null, message };

        const response = await fetch(broadcastListEnpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        });
        broadcastList = await response.json();
    }

    const botBroadcastEndpoint = process.env.botBroadcastEndpoint;
    await fetch(botBroadcastEndpoint, {
        method: 'POST',
        body: JSON.stringify(broadcastList),
        headers: { 'Content-Type': 'application/json' }
    });
    context.res = {
        status: 200
    };
    context.log(`Broadcasted to ${broadcastList.references.length} conversations.`);
    context.done();
};