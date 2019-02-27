using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BotBuilder_ProactiveMessaging
{
    public class ProactiveMessageRequestBody
    {
        [JsonProperty("conversationReference")]
        public ConversationReference ConversationReference { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }
    }
}
