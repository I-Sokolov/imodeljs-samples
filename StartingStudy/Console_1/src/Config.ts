import * as path from "path";


import { IModelHost, IModelHostConfiguration, IModelDb } from "@bentley/imodeljs-backend";
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import { OidcAgentClient, OidcAgentClientConfiguration } from "@bentley/imodeljs-clients-backend";
import * as itwcli from "@bentley/itwin-client"
import * as bkitwcli from "@bentley/backend-itwin-client";

export class Config {

  public static get loggingCategory(): string {
    return "Console_1";
  }

  public static startup() {
    // The host configuration.
    // The defaults will work for most backends.
    // Here is an example of how the briefcasesCacheDir property of the host configuration
    // could be set from an environment variable, which could be set by a cloud deployment mechanism.

    let briefcaseCacheDir = process.env.MY_SERVICE_BRIEFCASES_DIR;
    if (briefcaseCacheDir === undefined) {
      const tempDir = process.env.MY_SERVICE_TMP_DIR || process.env.TEMP || "c:\\temp";
      briefcaseCacheDir = path.join(tempDir, "iModelJs_cache");
    }

    const imHostConfig = new IModelHostConfiguration();
    imHostConfig.briefcaseCacheDir = briefcaseCacheDir;

    // Start up IModelHost, supplying the configuration.
    IModelHost.startup(imHostConfig);
    Logger.logTrace(Config.loggingCategory, "IModelHost started");
  }

  public static shutdown(){
    IModelHost.shutdown ();
    Logger.logTrace(Config.loggingCategory, "iModelHost stopped");
  }

  private static get clientConfig () { 
    return {
      clientId: process.env.iModeljsAgentId!,
      clientSecret: process.env.iModeljsAgentSecret!,
      scope: "urlps-third-party context-registry-service:read-only imodelhub",
    }
  };

  public static async login() : Promise<AuthorizedClientRequestContext> {
  
    Logger.logTrace(Config.loggingCategory, `Attempting to login to OIDC for ${Config.clientConfig.clientId}`);
    
    const client = new OidcAgentClient(Config.clientConfig);
    const actx = new ClientRequestContext("");
    const accessToken: AccessToken = await client.getToken(actx);
    Logger.logTrace(Config.loggingCategory, `Successful login`);

    let authCtx = new AuthorizedClientRequestContext(accessToken!);

    return authCtx;
  }

  public static async loginITwin () : Promise<itwcli.AuthorizedClientRequestContext> {
  
    Logger.logTrace(Config.loggingCategory, `Attempting to login to iTwin for ${Config.clientConfig.clientId}`);
    
    const client = new bkitwcli.AgentAuthorizationClient (Config.clientConfig);
    const accessToken: itwcli.AccessToken = await client.getAccessToken ();
    Logger.logTrace(Config.loggingCategory, `Successful login iTwing`);

    let authCtx = new itwcli.AuthorizedClientRequestContext(accessToken!);

    return authCtx;
  }
}
