﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BotBuilder_ProactiveMessaging
{
    /// <summary>
    /// The Startup class configures services and the request pipeline.
    /// </summary>
    public class Startup
    {
        private ILoggerFactory _loggerFactory;
        private readonly IConfiguration _configuration;
        private readonly bool _isProduction;

        public Startup(IHostingEnvironment env, IConfiguration configuration)
        {
            _configuration = configuration;
            _isProduction = env.IsProduction();
        }

        /// <summary>
        /// This method gets called by the runtime. Use this method to add services to the container.
        /// </summary>
        /// <param name="services">The <see cref="IServiceCollection"/> specifies the contract for a collection of service descriptors.</param>
        /// <seealso cref="IStatePropertyAccessor{T}"/>
        /// <seealso cref="https://docs.microsoft.com/en-us/aspnet/web-api/overview/advanced/dependency-injection"/>
        /// <seealso cref="https://docs.microsoft.com/en-us/azure/bot-service/bot-service-manage-channels?view=azure-bot-service-4.0"/>
        public void ConfigureServices(IServiceCollection services)
        {
 
            // Memory Storage is for local bot debugging only. When the bot
            // is restarted, everything stored in memory will be gone.
            IStorage dataStore = new MemoryStorage();

            // For production bots use the Azure Blob or
            // Azure CosmosDB storage providers. For the Azure
            // based storage providers, add the Microsoft.Bot.Builder.Azure
            // Nuget package to your solution. That package is found at:
            // https://www.nuget.org/packages/Microsoft.Bot.Builder.Azure/
            // Un-comment the following lines to use Azure Blob Storage
            // // Storage configuration name or ID from the .bot file.
            // const string StorageConfigurationId = "<STORAGE-NAME-OR-ID-FROM-BOT-FILE>";
            // var blobConfig = botConfig.FindServiceByNameOrId(StorageConfigurationId);
            // if (!(blobConfig is BlobStorageService blobStorageConfig))
            // {
            //    throw new InvalidOperationException($"The .bot file does not contain an blob storage with name '{StorageConfigurationId}'.");
            // }
            // // Default container name.
            // const string DefaultBotContainer = "<DEFAULT-CONTAINER>";
            // var storageContainer = string.IsNullOrWhiteSpace(blobStorageConfig.Container) ? DefaultBotContainer : blobStorageConfig.Container;
            // IStorage dataStore = new Microsoft.Bot.Builder.Azure.AzureBlobStorage(blobStorageConfig.ConnectionString, storageContainer);

            // Create and add conversation state.
            var conversationState = new ConversationState(dataStore);
            services.AddSingleton(conversationState);


            services.AddBot<BotBuilder_ProactiveMessagingBot>(
                //serviceProvider =>
                //{
                //    return new BotBuilder_ProactiveMessagingBot(conversationState, _loggerFactory, adapter, endpointService);
                //},
                options =>
            {
                var appId = _configuration.GetSection("MicrosoftAppId").Value;
                var appPassword = _configuration.GetSection("MicrosoftAppPassword").Value;
                
                options.CredentialProvider = new SimpleCredentialProvider(appId, appPassword);

                // Catches any errors that occur during a conversation turn and logs them to currently
                // configured ILogger.
                ILogger logger = _loggerFactory.CreateLogger<BotBuilder_ProactiveMessagingBot>();

                options.OnTurnError = async (context, exception) =>
                {
                    logger.LogError($"Exception caught : {exception}");
                    await context.SendActivityAsync("Sorry, it looks like something went wrong.");
                };
            });
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            _loggerFactory = loggerFactory;

            app.UseDefaultFiles()
                .UseStaticFiles()
                .UseBotFramework()
                .MapProactiveEndpoint(_configuration.GetValue<string>("myProactiveEndpoint"));
        }
    }
}
