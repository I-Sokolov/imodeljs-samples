import * as path from "path";


import { IModelHost, IModelHostConfiguration, IModelDb } from "@bentley/imodeljs-backend";
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import * as iModelClient from "@bentley/imodeljs-clients";
import { OidcAgentClient, OidcAgentClientConfiguration } from "@bentley/imodeljs-clients-backend";
import * as iTwinClient from "@bentley/itwin-client"
import * as bkitwcli from "@bentley/backend-itwin-client";

export class Config {

  public static get UseQAEnv () : boolean {
    return true;
  }

  public static get loggingCategory(): string {
    return "Console_1";
  }

  public static startup() {
    // The host configuration.
    // The defaults will work for most backends.
    // Here is an example of how the briefcasesCacheDir property of the host configuration
    // could be set from an environment variable, which could be set by a cloud deployment mechanism.

    if (Config.UseQAEnv) {
      process.env.imjs_buddi_resolve_url_using_region="102";
      Logger.logTrace(Config.loggingCategory, "Use QA env");
    }

    let briefcaseCacheDir = process.env.MY_SERVICE_BRIEFCASES_DIR;
    if (briefcaseCacheDir === undefined) {
      const tempDir = process.env.MY_SERVICE_TMP_DIR || process.env.TEMP || "c:\\temp";
      briefcaseCacheDir = path.join(tempDir, "iModelJs_cache");
    }
    Logger.logTrace(Config.loggingCategory, "Briefcase cache dir: " + briefcaseCacheDir);

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
    if (Config.UseQAEnv) {
      return {
        clientId: process.env.iModeljsAgentId_QA!,
        clientSecret: process.env.iModeljsAgentSecret_QA!,
        imsLogin: "igor.sokolov@bentley.com",
        imsPassword: process.env.ImsPassword_QA!,
        scope: "urlps-third-party context-registry-service:read-only imodelhub",
      }
    }   
    else {
      return {
        clientId: process.env.iModeljsAgentId!,
        clientSecret: process.env.iModeljsAgentSecret!,
        imsLogin: "igor.sokolov@bentley.com",
        imsPassword: process.env.ImsPassword_QA!,
        scope: "urlps-third-party context-registry-service:read-only imodelhub",
      }
    }
  };

  public static async login() : Promise<iModelClient.AuthorizedClientRequestContext> {
  
    Logger.logTrace(Config.loggingCategory, `Attempting to login to OIDC for ${Config.clientConfig.clientId}`);
    
    const client = new OidcAgentClient(Config.clientConfig);
    const actx = new ClientRequestContext("");
    const accessToken: iModelClient.AccessToken = await client.getToken(actx);
    Logger.logTrace(Config.loggingCategory, `Successful login`);

    let authCtx = new iModelClient.AuthorizedClientRequestContext(accessToken!);

    return authCtx;
  }

  public static async loginITwin () : Promise<iTwinClient.AuthorizedClientRequestContext> {
  
    Logger.logTrace(Config.loggingCategory, `Attempting to login to iTwin for ${Config.clientConfig.clientId}`);
    
    const client = new bkitwcli.AgentAuthorizationClient (Config.clientConfig);
    const accessToken: iTwinClient.AccessToken = await client.getAccessToken ();
    Logger.logTrace(Config.loggingCategory, `Successful login iTwing`);

    let authCtx = new iTwinClient.AuthorizedClientRequestContext(accessToken!);

    return authCtx;
  }

  public static async loginByEmail(): Promise<iTwinClient.AuthorizedClientRequestContext> {

    Logger.logTrace(Config.loggingCategory, `Attempting to login to iTwin for ${Config.clientConfig.imsLogin}`);
    
    const iModelClient_authToken: iModelClient.AuthorizationToken = await new iModelClient.ImsActiveSecureTokenClient().getToken(
      new ClientRequestContext(),
      { email: Config.clientConfig.imsLogin, password: Config.clientConfig.imsPassword }
    );

    if (!iModelClient_authToken) {
      throw new Error("iModelClient.ImsActiveSecureTokenClient().getToken failed");
    }
          
    const iModelClient_accessToken: iModelClient.AccessToken = await new iModelClient.ImsDelegationSecureTokenClient().getToken(
      new ClientRequestContext(),
      iModelClient_authToken!
    );

    if (!iModelClient_authToken) {
      throw new Error("iModelClient.ImsDelegationSecureTokenClient().getToken failed");      
    }

    //return new iModelClient.AuthorizedClientRequestContext(accessToken);

    const tokenString = iModelClient_accessToken.toTokenString();

    const iTwinClient_accessToken: iTwinClient.AccessToken = iTwinClient.AccessToken.fromTokenString(tokenString);

    if (!iTwinClient_accessToken) {
      throw new Error("iTwinClient.AccessToken.fromTokenString failed");
    }
    
    let authCtx = new iTwinClient.AuthorizedClientRequestContext(iTwinClient_accessToken);

    if (!authCtx) {
      throw new Error("new iTwinClient.AuthorizedClientRequestContext failed");
    }

    Logger.logTrace(Config.loggingCategory, `Successful login`);

    return authCtx;
    
  }

}
