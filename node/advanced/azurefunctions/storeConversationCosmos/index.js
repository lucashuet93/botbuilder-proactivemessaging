module.exports = async function(context, documents) {
    if (!!documents && documents.length > 0) {
        context.log('Conversation Id: ', documents[0].conversation.id);
    }
};
