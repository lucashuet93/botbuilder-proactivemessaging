module.exports = async function(context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.reference || (req.body && req.body.reference)) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: 'Reference: ' + (req.query.reference || req.body.reference)
        };
    } else {
        context.res = {
            status: 400,
            body: 'Please pass a reference on the query string or in the request body'
        };
    }
    context.log(context.res);
};
