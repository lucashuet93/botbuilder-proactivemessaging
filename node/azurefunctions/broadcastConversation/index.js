module.exports = async function (context, req) {
    context.log('Broadcasting message!');

    // 1. extract message
    // 2. get references from cosmosdb
    // 3. send response with message and references

    const message = req.body.message;
    const originReference = req.body.reference;

    const list = context.bindings.conversationsList;
    
    if (list.length > 0) {
        const references = context.bindings.conversationsList;  

        context.res = {
            status: 200,
            body: JSON.stringify({
                references,
                message,
            })
        };
        context.log(`Returned ${list.length} references`);
    }
    else {
        context.res = {
            status: 400,
            body: "No active references found."
        };
        context.log(`No active references found.`);
    }
};