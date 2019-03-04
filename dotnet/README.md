# Proactive Messaging in C# Bot Framework v4 SDK

This sub repository contains a code sample and instructions which demonstrate implementation of proactive messaging in .NET using a separate invocation endpoint.  

At its most basic level, sending proactive messages requires a few implementation steps:

- A separate endpoint on the bot that uses a conversation reference to  message the user outside the scope of the bot's OnTurnAsync handler
- A mechanism to store a conversation reference for the user
- A mechanism to retrieve the stored conversation reference and invoke the proactive message endpoint

The bot [project](/dotnet/BotBuilder-ProactiveMessaging) inside the /dotnet/BotBuilder-ProactiveMessaging directory fully implements this functionality. Bellow we are going thru each of the step in detail.

### Create the Proactive Endpoint

As we want our bot to be able to receive proactive message requests on a different endpoint than  /api/messages we need to register new endpoint and add processing logic which enable our bot to message user outside of OnTurnAsync handler. To achieve this, we will build our custom middleware responsible for handling request for sending proactive messages.  Bot Framework itself enables sending of proactive messages through the `ContinueConversationAsync()` method on the BotFrameworkAdapter class. `ContinueConversationAsync()`  accepts an AppId parameter and instance of the ConversationReference class. That means requests to the proactive endpoint must contain a stored instance of a conversation reference  object.

To register new endpoint within our .NET Core bot application we created `ProactiveApplicationBuilderExtensions` class which implements Application Builder extension method `MapProactiveEndpoint`.  

```C#
public static class ProactiveApplicationBuilderExtensions
{
    // <summary>
    /// Maps proactive endpoint handlers to send proactive messages (notifications)
    /// </summary>
    /// <param name="applicationBuilder">The <see cref="IApplicationBuilder"/>.</param>
    /// <returns>A reference to this instance after the operation has completed.</returns>
    public static IApplicationBuilder MapProactiveEndpoint(this IApplicationBuilder applicationBuilder, string endpoint)
    {
        if (applicationBuilder == null)
        {
            throw new ArgumentNullException(nameof(applicationBuilder));
        }

        var applicationServices = applicationBuilder.ApplicationServices;

        //Get Bot Options from DI Container so we can access AppId stored within SimpleCredentialProvider object
        var botOptions = applicationServices.GetRequiredService<IOptions<BotFrameworkOptions>>().Value;

        //Get adapter reference, which we need for calling ContinueConversationAsync
        var adapter = applicationServices.GetRequiredService<IAdapterIntegration>();

        //map handler method to our new endpoint
        applicationBuilder.Map(
            endpoint,
            proactiveAppBuilder => proactiveAppBuilder.Run((new ProactiveHandler(adapter as BotAdapter, (botOptions.CredentialProvider as SimpleCredentialProvider).AppId ).HandleProactiveAsync)));

        return applicationBuilder;
    }
}
```

As a next step we will implement `ProactiveHandler` class, which implements logic for processing of incoming proactive message request and invokes sending of proactive message to a user. Notice the call of `adapter.ContinueConversationAsync()` method call within `HandleProactiveAsync` method. This method call will generate event, thanks to which our bot backend is capable to reopen discussion by reacting to it in defined callback method (`CreateCallback`).  `CreateCallback` method implements logic for building and sending proactive message based on incoming proactive message request body. In our sample it supports text messages, rich content in form of cards and carousels of cards and suggested actions. 

```c#
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
```

As you might have noticed we have defined form of body for incoming proactive message request in `ProactiveMessageRequestBody` class.  Our bot application is expecting request body to contain AppId (not required), ConversationReference and based on desired content to be sent to user any of the following: text message, list of Attachments (cards) and SuggestedActions. 

```c#
public class ProactiveMessageRequestBody
{
    [JsonProperty("conversationReference")]
    public ConversationReference ConversationReference { get; set; }

    [JsonProperty("message")]
    public string Message { get; set; }

    [JsonProperty("attachments")]
    public List<Attachment> Attachments { get; set; }

    [JsonProperty("suggestedActions")]
    public SuggestedActions SuggestedActions { get; set; }

    /// <summary>
    /// used in case of multi tenant bots
    /// </summary>
    [JsonProperty("appId")]
    public string AppId { get; set; }
}
```

As a last step, we need to register our application builder extension in `Startup` class in it's Configure method, where we setup the whole middleware stack for our application.

```c#
public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
{
    _loggerFactory = loggerFactory;

    app.UseDefaultFiles()
    .UseStaticFiles()
    .UseBotFramework()
    .MapProactiveEndpoint(_configuration.GetValue<string>("myProactiveEndpoint"));
}
```

`MapProactiveEndpoint` application builder extension method is taking string parameter on the input which defines address four our proactive endpoint. In our case we placed this value to AppSettings file and we read it using`Configuration` object. The value might be for instance *'api/proactive'*

**Note:** We have opened new endpoint for our application, which is not secured. In production scenario you would want to introduce security layer, e.g. using shared secrets.

**Alternative way to register new endpoint:** Another approach how to define new endpoint would be to use *mvc* middleware and implement request processing and initiate proactive message thru controller action. This approach introduces slight overkill in form of using the whole mvc middleware stack just to open one endpoint, on the other hand it provides quite simple way how to secure the endpoint using supported security providers. In this sample we wanted to  stick with the approach for defining /api/message endpoint used by Bot Framework and so we created our own application builder extension method and piece of middleware.

### Store the Conversation Reference

Once we have logic to send proactive message, we need logic for storing conversation reference, which  is needed for reopening of conversation with user, e.i. sending proactive message. In this sample we are storing conversation reference in memory as conversation state. In real world scenario you would want have external store and backend reading from this store, which is responsible for deciding when, with what content and to whom the proactive messages will be sent.

To store Conversation Reference within conversation state we needed to create new state accessor. We added following lines of code to class which defines state accessors (in our case `BotBuilder_ProactiveMessagingAccessors`):

```C#
...
public static string ConversationReferenceStateName { get; } = $"{nameof(BotBuilder_ProactiveMessagingAccessors)}.ConversationReferenceState";
...
public IStatePropertyAccessor<ConversationReference> ConversationReferenceState {get; set;}

```

As a next step we need to instantiate *ConversationReferenceState* property inside of constructor of our bot class (`BotBuilder_ProactiveMessagingBot` class in our case)

```C#
 _accessors = new BotBuilder_ProactiveMessagingAccessors(conversationState)
 {
 	CounterState = conversationState.CreateProperty<CounterState>(BotBuilder_ProactiveMessagingAccessors.CounterStateName),
 	ConversationReferenceState = conversationState.CreateProperty<ConversationReference>(BotBuilder_ProactiveMessagingAccessors.ConversationReferenceStateName)
 };
```

Now that we can use the newly created state property we will store the conversation reference in it. We do that in OnTurnAsync handler first time our bot receives any event of type other than message. E.g. conversation update event, when user starts the conversation. 

```c#
if (turnContext.Activity.Type == ActivityTypes.Message)
{
    ...
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
                //save the changes of the state
                await _accessors.ConversationState.SaveChangesAsync(turnContext);
            }
        }

        await turnContext.SendActivityAsync($"{turnContext.Activity.Type} event detected");
    }
}
```

### Invoke the Proactive Endpoint

Proactive endpoint can be hit by any service at this point as long as it sends a conversation reference and message content in the request  body. That means that for example it can be your backend which already takes care of invoking notification within mobile application, sends newsletter emails etc. However for this basic implementation the endpoint is configured to be hit  by the bot itself. To complete the flow, you'll need to retrieve the  stored conversation reference from conversation state and make a post request to the  proactive endpoint with a body containing the reference and the  message content to be sent (message text, attachments (cards) and suggested actions). Our bot is sending this in OnTurnAsync handler, in case incoming message is starting with word "proactive". For sake of demonstration besides text message we included also hero cards and suggested actions which we want to display within proactive message.

```c#
if (turnContext.Activity.Type == ActivityTypes.Message)
{
    //This should be sent out from your backend responsbile for generating proactive message requests
    //Bellow you can find examples of supported content types for proactive message by this sample

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
        ...
    }
}
```