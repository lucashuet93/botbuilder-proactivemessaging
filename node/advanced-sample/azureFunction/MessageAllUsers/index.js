require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // pull all cosmos entries, each of which is a conversation reference
    let conversationReferences = context.bindings.allDocuments;
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
};