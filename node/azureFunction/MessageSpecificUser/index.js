require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // pull cosmos entry for specific user
    let conversationReferences = context.bindings.userSpecificDocuments;
    context.log(conversationReferences);
    
    // loop through cosmos entries
    let count = 0;
    for (let conversationReference of conversationReferences) {
        count++;
        // isolate conversation reference from entry
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
            if (count === conversationReferences.length) {
                context.res = {
                    status: 200,
                    body: "User has been notified on all channels"
                };
                context.done();
            };
        });
    }
    
    // handle edge case
    if(conversationReferences.length === 0){
        context.res = {
            status: 200,
            body: "No entries found"
        };
        context.done();
    }
};