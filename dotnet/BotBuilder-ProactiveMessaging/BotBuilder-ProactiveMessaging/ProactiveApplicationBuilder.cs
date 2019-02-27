using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration;
using Microsoft.Bot.Builder.Integration.AspNet.Core.Handlers;
using Microsoft.Bot.Configuration;
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
        public static IApplicationBuilder UseProactiveEndpoint(this IApplicationBuilder applicationBuilder)
        {
            if (applicationBuilder == null)
            {
                throw new ArgumentNullException(nameof(applicationBuilder));
            }

            var applicationServices = applicationBuilder.ApplicationServices;

            var appConfiguration = applicationServices.GetRequiredService<IConfiguration>();
            var proactiveEndpoint = appConfiguration.GetSection("proactiveEndpoint")?.Value;

            var bot = applicationServices.GetRequiredService<IBot>();
           
            applicationBuilder.Map(
            proactiveEndpoint,
            proactiveAppBuilder => proactiveAppBuilder.Run((bot as BotBuilder_ProactiveMessagingBot).HandleProactiveAsync));

            return applicationBuilder;
        }
    }
}
