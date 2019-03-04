// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Configuration;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace BotBuilder_ProactiveMessaging
{
    /// <summary>
    /// Represents a bot that processes incoming activities.
    /// For each user interaction, an instance of this class is created and the OnTurnAsync method is called.
    /// This is a Transient lifetime service.  Transient lifetime services are created
    /// each time they're requested. For each Activity received, a new instance of this
    /// class is created. Objects that are expensive to construct, or have a lifetime
    /// beyond the single turn, should be carefully managed.
    /// For example, the <see cref="MemoryStorage"/> object and associated
    /// <see cref="IStatePropertyAccessor{T}"/> object are created with a singleton lifetime.
    /// </summary>
    /// <seealso cref="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-2.1"/>
    public class BotBuilder_ProactiveMessagingBot : IBot
    {
        private readonly BotBuilder_ProactiveMessagingAccessors _accessors;
        private readonly ILogger _logger;
        private readonly BotAdapter _adapter;
        private readonly EndpointService _endpointService;


        public static ConversationReference Reference;
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="conversationState">The managed conversation state.</param>
        /// <param name="loggerFactory">A <see cref="ILoggerFactory"/> that is hooked to the Azure App Service provider.</param>
        /// <seealso cref="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging/?view=aspnetcore-2.1#windows-eventlog-provider"/>
        public BotBuilder_ProactiveMessagingBot(ConversationState conversationState, ILoggerFactory loggerFactory)
        {
            if (conversationState == null)
            {
                throw new System.ArgumentNullException(nameof(conversationState));
            }

            if (loggerFactory == null)
            {
                throw new System.ArgumentNullException(nameof(loggerFactory));
            }

            _accessors = new BotBuilder_ProactiveMessagingAccessors(conversationState)
            {
                CounterState = conversationState.CreateProperty<CounterState>(BotBuilder_ProactiveMessagingAccessors.CounterStateName),
                ConversationReferenceState = conversationState.CreateProperty<ConversationReference>(BotBuilder_ProactiveMessagingAccessors.ConversationReferenceStateName)
            };
           
            _logger = loggerFactory.CreateLogger<BotBuilder_ProactiveMessagingBot>();
            _logger.LogTrace("Turn start.");
        }

        /// <summary>
        /// Every conversation turn for our Echo Bot will call this method.
        /// There are no dialogs used, since it's "single turn" processing, meaning a single
        /// request and response.
        /// </summary>
        /// <param name="turnContext">A <see cref="ITurnContext"/> containing all the data needed
        /// for processing this conversation turn. </param>
        /// <param name="cancellationToken">(Optional) A <see cref="CancellationToken"/> that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A <see cref="Task"/> that represents the work queued to execute.</returns>
        /// <seealso cref="BotStateSet"/>
        /// <seealso cref="ConversationState"/>
        /// <seealso cref="IMiddleware"/>
        public async Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default(CancellationToken))
        {

            Reference = turnContext.Activity.GetConversationReference();

            // Handle Message activity type, which is the main activity type for shown within a conversational interface
            // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            if (turnContext.Activity.Type == ActivityTypes.Message)
            {
                //This should be sent out from your backend responsbile for generating proactive message requests
                //Bellow you can find examples of supported content for proactive message by this sample

                if (turnContext.Activity.Text.ToLower().StartsWith("proactive"))
                {
                    var card = new HeroCard
                    {
                        Text = "You can upload an image or select one of the following choices",
                        Buttons = new List<CardAction>()
                        {
                            new CardAction(ActionTypes.ImBack, title: "1. Inline Attachment", value: "1"),
                            new CardAction(ActionTypes.ImBack, title: "2. Internet Attachment", value: "2"),
                            new CardAction(ActionTypes.ImBack, title: "3. Uploaded Attachment", value: "3"),
                        }
                    };

                    var sa = new SuggestedActions()
                    {
                        Actions = new List<CardAction>()
                        {
                        new CardAction() { Title = "Red", Type = ActionTypes.ImBack, Value = "Red" },
                        new CardAction() { Title = "Yellow", Type = ActionTypes.ImBack, Value = "Yellow" },
                        new CardAction() { Title = "Blue", Type = ActionTypes.ImBack, Value = "Blue" },
                        }
                    };

                    var message = new ProactiveMessageRequestBody()
                    {
                        ConversationReference = await _accessors.ConversationReferenceState.GetAsync(turnContext),
                        Message = "Hello",
                        Attachments = new List<Attachment>() { card.ToAttachment(), card.ToAttachment() },
                        SuggestedActions = sa
                    };

                    //SET this based on the adress of your proactive endpoint
                    var localProactiveEndpoint = "http://localhost:3978/api/proactive";

                    await turnContext.SendActivityAsync("Proactive message incoming...");
                    
                    // send the conversation reference and message to the bot's proactive endpoint
                    var messageContent = JsonConvert.SerializeObject(message);

                    //In production this would be implemented on the side of backend service, which initiates proactive messages
                    using (var client = new HttpClient())
                    {
                        var buffer = System.Text.Encoding.UTF8.GetBytes(messageContent);
                        var byteContent = new ByteArrayContent(buffer);
                        byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");

                        var result = await client.PostAsync(localProactiveEndpoint, byteContent);
                    }
                }
                else
                {
                    // Get the conversation state from the turn context.
                    var state = await _accessors.CounterState.GetAsync(turnContext, () => new CounterState());

                    // Bump the turn count for this conversation.
                    state.TurnCount++;

                    // Set the property using the accessor.
                    await _accessors.CounterState.SetAsync(turnContext, state);

                    // Save the new turn count into the conversation state.
                    await _accessors.ConversationState.SaveChangesAsync(turnContext);

                    // Echo back to the user whatever they typed.
                    var responseMessage = $"Turn {state.TurnCount}: You sent '{turnContext.Activity.Text}'\n";
                    await turnContext.SendActivityAsync(responseMessage);
                }
            }
            else
            {
                if (turnContext.Activity.MembersAdded.Count > 0)
                {
                    foreach (var m in turnContext.Activity.MembersAdded)
                    {
                        if (m.Id != turnContext.Activity.Recipient.Id)
                        {
                            // store the conversation reference for the newly added user
                            // in production scenario you want to store conversation reference in an external store e.g. Cosmos DB, Table Storage etc.
                            await _accessors.ConversationReferenceState.SetAsync(turnContext, turnContext.Activity.GetConversationReference());
                            await _accessors.ConversationState.SaveChangesAsync(turnContext);
                        }
                    }

                    await turnContext.SendActivityAsync($"{turnContext.Activity.Type} event detected");
                }
            }
        }
    }
}
