require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // pull cosmos entry for specific user
    let conversationReferences = context.bindings.userSpecificDocument;

    // cosmos entry for given user is first value in conversationReferences array
    if (conversationReferences.length > 0) {
        // isolate conversation reference from entry
        let conversationReference = conversationReferences[0];
        const reference = {
            activityId: conversationReference.activityId,
            user: conversationReference.user,
            bot: conversationReference.bot,
            conversation: conversationReference.conversation,
            channelId: conversationReference.channelId,
            serviceUrl: conversationReference.serviceUrl
        }

        // hit proactive endpoint with message and conversation reference
        const postBody = {
            reference: reference,
            message: req.body.message
        };
        fetch(process.env.ProactiveEndpoint, {
            method: 'POST',
            body: JSON.stringify(postBody),
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => {
            context.res = {
                status: 200,
                body: "User has been notified"
            };
            context.done();
        });
    } else {
        context.res = {
            status: 200,
            body: "No entry found"
        };
        context.done();
    }
};