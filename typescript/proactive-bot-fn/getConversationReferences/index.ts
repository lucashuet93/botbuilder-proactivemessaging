import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Collecting broadcasting list.');

    const originReference = (req.query.reference || (req.body && req.body.reference));
    const conversations = context.bindings.conversationReferences;

    if (conversations.length > 0) {
        context.res = {
            status: 200,
            body: JSON.stringify({
                references: conversations,
                origin: originReference,
            }),
        }
    } else {
        context.res = {
            status: 404,
            body: "No active references found."
        };
    }
    
    context.done();
};

export default httpTrigger;