module.exports = async function(context, req) {
    context.log("Storing conversation reference.")

    if (req.query.reference || (req.body && req.body.reference)) {
        const conversationReference = req.query.reference || req.body.reference;
        context.res = {
            status: 200
        };
        context.bindings.outputConversation = conversationReference;
    } else {
        context.res = {
            status: 400,
            body: 'Please pass a reference on the query string or in the request body'
        };
    }
    context.done();
};