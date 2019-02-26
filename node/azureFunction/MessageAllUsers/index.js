require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // pull all cosmos entries, each of which is a conversation reference
    let conversationReferences = context.bindings.allDocuments;

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
        context.log(reference);
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
                    status: 200
                };
                context.done();
            };
        });
    }
    
    // handle edge case
    if(conversationReferences.length === 0){
        context.res = {
            status: 200
        };
        context.done();
    }
};