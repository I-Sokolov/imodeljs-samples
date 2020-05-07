
import { Id64String, Logger, LogLevel, ClientRequestContext } from "@bentley/bentleyjs-core";
import * as bkclient from "@bentley/imodeljs-clients-backend";
import { OidcAgentClient, AzureFileHandler } from "@bentley/imodeljs-clients-backend";
import { AccessToken, ConnectClient, HubIModel, IModelHubClient, Project, IModelQuery, Version, AuthorizedClientRequestContext, BriefcaseQuery, Briefcase as HubBriefcase } from "@bentley/imodeljs-clients";

import { Config } from "./Config";

const actx = new ClientRequestContext("");

export class MyApp
{
    public static get clientConfig (): bkclient.OidcAgentClientConfiguration {
        return {
          clientId: "service-3gCb5lDykM5MdfbUkRVVHC6IQ",
          clientSecret: "JvSTYIBwMJBZ8NPO/cLfjVrnizH/+Iz7H7OgTI6abPqp4rZn1GujJByUvFrL56pan7yMNEQRkNyZ4thAsh+F0Q==",
          scope: "urlps-third-party context-registry-service:read-only imodelhub",
        };
    }

  ///////////////////////////////////////////////////////////////////////
  public static async main(){
    Config.startup ();

    // Log in
    Logger.logTrace(Config.loggingCategory, `Attempting to login to OIDC for ${MyApp.clientConfig.clientId}`);
    const client = new OidcAgentClient(MyApp.clientConfig);
    const jwt: AccessToken = await client.getToken(actx);
    Logger.logTrace(Config.loggingCategory, `Successful login`);


    Config.shutdown();
  }
}

//////////////////////////////////////////////////////////
Logger.initializeToConsole();
Logger.setLevel(Config.loggingCategory, LogLevel.Trace);
Logger.logTrace(Config.loggingCategory, "Logger initialized...");

if (require.main === module) {
  Logger.logTrace(Config.loggingCategory, "Step in main");
  // tslint:disable-next-line:no-floating-promises
  MyApp.main();
  Logger.logTrace(Config.loggingCategory, "back from main");
}