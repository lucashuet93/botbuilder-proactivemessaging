import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as fetch from "isomorphic-fetch";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Broadcasting to everyone');

    const message = (req.query.message || (req.body && req.body.message));
    
    const restoreReferencesEndpoint = process.env.cloudRestoreEndpoint;
    const broadcastingEndpoint = process.env.broadcastEndpoint;

    const response = await fetch(restoreReferencesEndpoint, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
        const body = await response.json();
        const references = body.references;

        await fetch(broadcastingEndpoint, {
            method: 'POST',
            body: JSON.stringify({
                message,
                references,
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        context.res = {
            status: 202,
            body: "Broadcasting complete.",
        };

    } else {
        context.res = {
            status: 404,
            body: "No conversation reference found for broadcasting.",
        };
    }
    context.done();
};

export default httpTrigger;