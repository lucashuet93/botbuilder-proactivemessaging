using Microsoft.AspNetCore.Http;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BotBuilder_ProactiveMessaging
{
    public class ProactiveHandler
    {
        private string _appId;
        private BotAdapter _adapter;

        public ProactiveHandler(BotAdapter botAdapter, string appId)
        {
            this._adapter = botAdapter;
            this._appId = appId;
        }

        /// <summary>
        /// Middleware handler for incoming proactive message request
        /// </summary>
        /// <param name="httpContext"></param>
        /// <returns></returns>
        public async Task HandleProactiveAsync(HttpContext httpContext)
        {
            var request = httpContext.Request;
            var response = httpContext.Response;

            //TODO add security layer to request validation

            if (request.Method != HttpMethods.Post)
            {
                response.StatusCode = (int)HttpStatusCode.MethodNotAllowed;
                return;
            }

            if (request.ContentLength == 0)
            {
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                return;
            }

            try
            {
                ProactiveMessageRequestBody proactiveReq;
                using (var reader = new StreamReader(request.Body, Encoding.UTF8))
                {
                    string value = reader.ReadToEnd();
                    proactiveReq = JsonConvert.DeserializeObject<ProactiveMessageRequestBody>(value);
                }

                var appId = proactiveReq.AppId ?? this._appId;

                await this._adapter.ContinueConversationAsync(appId, proactiveReq.ConversationReference, CreateCallback(proactiveReq), CancellationToken.None);
                response.StatusCode = (int)HttpStatusCode.OK;
            }
            catch (UnauthorizedAccessException)
            {
                response.StatusCode = (int)HttpStatusCode.Forbidden;
            }
        }

        /// <summary>
        /// Builds and sends proactive message
        /// </summary>
        /// <returns></returns>
        private BotCallbackHandler CreateCallback(ProactiveMessageRequestBody req)
        {
            return async (turnContext, token) =>
            {
                try
                {
                    Activity proactiveMessage = turnContext.Activity.CreateReply(); ;

                    if (req.Attachments != null)
                        //We want to display multiple attachments as carousel
                        if (req.Attachments.Count > 1)
                            proactiveMessage = MessageFactory.Carousel(req.Attachments.ToArray()) as Activity;
                        else
                            proactiveMessage.Attachments = req.Attachments;
                    

                    if (String.IsNullOrEmpty(req.Message))
                        proactiveMessage.Text = req.Message;

                    if (req.SuggestedActions != null)
                        proactiveMessage.SuggestedActions = req.SuggestedActions;

                    // Send the user a proactive confirmation message.
                    await turnContext.SendActivityAsync(proactiveMessage);
                }
                catch(Exception e)
                {
                    //TODO handle error logging
                    throw e;
                }
            };
        }
    }
}
