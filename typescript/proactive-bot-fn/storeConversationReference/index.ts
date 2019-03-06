import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Storing conversation reference.");

    const reference = (req.query.reference || (req.body && req.body.reference));

    if (reference) {
        context.res = {
            status: 200
        };
        context.bindings.inputConversationReference = reference;
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a reference on the query string or in the request body"
        };
    }
    context.done();
};

export default httpTrigger;