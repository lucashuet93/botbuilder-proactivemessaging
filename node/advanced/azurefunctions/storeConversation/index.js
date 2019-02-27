module.exports = async function(context, req) {
    // context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.reference || (req.body && req.body.reference)) {
        const conversationReference = req.query.reference || req.body.reference;
        context.res = {
            status: 200
        };
        // context.log(conversationReference);

        /* const testConversation = {
            "activityId": "9cc538f0-39dc-11e9-bdec-7d66fbbfe302",
            "user": { "id": "92236c90-62e1-4473-acc0-be385ed3ea37", "name": "User" },
            "bot": { "id": "1", "name": "Bot", "role": "bot" },
            "conversation": { "id": "9cb5f6b0-39dc-11e9-a569-49a1a0bccdd8|livechat" },
            "channelId": "emulator",
            "serviceUrl": "http://localhost:55811"
        }; */

        context.bindings.outputConversation = conversationReference;
    } else {
        context.res = {
            status: 400,
            body: 'Please pass a reference on the query string or in the request body'
        };
    }
    // context.log(context.res);
    context.done();
};
