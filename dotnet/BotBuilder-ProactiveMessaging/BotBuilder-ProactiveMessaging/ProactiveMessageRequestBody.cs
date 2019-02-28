using Microsoft.Bot.Connector;
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
}
