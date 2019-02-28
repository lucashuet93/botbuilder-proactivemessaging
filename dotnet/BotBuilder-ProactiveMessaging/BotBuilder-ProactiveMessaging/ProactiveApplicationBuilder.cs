using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration;
using Microsoft.Bot.Builder.Integration.AspNet.Core.Handlers;
using Microsoft.Bot.Configuration;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

namespace BotBuilder_ProactiveMessaging
{
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
           
            applicationBuilder.Map(
            endpoint,
            proactiveAppBuilder => proactiveAppBuilder.Run((new ProactiveHandler(adapter as BotAdapter, (botOptions.CredentialProvider as SimpleCredentialProvider).AppId ).HandleProactiveAsync)));

            return applicationBuilder;
        }
    }
}
