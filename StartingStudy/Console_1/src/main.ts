
import { Id64String, Logger, LogLevel, ClientRequestContext } from "@bentley/bentleyjs-core";
import * as bkclient from "@bentley/imodeljs-clients-backend";
import { OidcAgentClient, AzureFileHandler } from "@bentley/imodeljs-clients-backend";
import { AccessToken, ConnectClient, HubIModel, IModelHubClient, Project, IModelQuery, Version, AuthorizedClientRequestContext, BriefcaseQuery, Briefcase as HubBriefcase } from "@bentley/imodeljs-clients";

import { Config } from "./Config";



  ///////////////////////////////////////////////////////////////////////
  /*
  private static get clientConfig (): bkclient.OidcAgentClientConfiguration {
        return {
          clientId: process.IMODELJS_USER,
          clientSecret: "Nnygx40qY35BaWJZFstuwmeoDC8Up4NLM2hOAdlvrl9KzGT8MS+MOnYO80YCkX5XZqzuQFhVx9rJ94a84eaDjQ==",
          scope: "urlps-third-party context-registry-service:read-only imodelhub",
        };
    }
  */
 const clientConfig : bkclient.OidcAgentClientConfiguration = {
    clientId: process.env.iModeljsAgentId!,
    clientSecret: process.env.iModeljsAgentSecret!,
    scope: "urlps-third-party context-registry-service:read-only imodelhub",
  };

  ///////////////////////////////////////////////////////////////////////
  const connectClient : ConnectClient = new ConnectClient();
  let authCtx : AuthorizedClientRequestContext;
  let hubClient : IModelHubClient;

  ///////////////////////////////////////////////////////////////////////
  /*async*/ function ProcessModel (model : HubIModel){
    Logger.logTrace (Config.loggingCategory, "    " + model.name);
    //this._iModelDb = await this._iModelDbHandler.openLatestIModelDb(authCtx, this._projectId!, this._iModelId!);
  }
  
  ///////////////////////////////////////////////////////////////////////
  async function ProcessProject (project : Project) /*: Promise<void>*/{
    Logger.logTrace (Config.loggingCategory, "  Project " + project.name);

    Logger.logTrace (Config.loggingCategory, "  Models:");
    hubClient = new IModelHubClient(new AzureFileHandler());    

    const imodels:HubIModel[] = await hubClient.iModels.get (authCtx!, project.wsgId/*, new IModelQuery().byName("iModelName")*/);
   
    imodels.forEach(ProcessModel);
  }

  ///////////////////////////////////////////////////////////////////////
  async function main(){
    try {
      Config.startup ();

      // Log in
      Logger.logTrace(Config.loggingCategory, `Attempting to login to OIDC for ${clientConfig.clientId}`);
      const client = new OidcAgentClient(clientConfig);
      const actx = new ClientRequestContext("");
      const accessToken: AccessToken = await client.getToken(actx);
      Logger.logTrace(Config.loggingCategory, `Successful login`);

      authCtx = new AuthorizedClientRequestContext(accessToken!);

      //get projects
      Logger.logTrace (Config.loggingCategory, "Get acessible projects");
      const projects = await connectClient.getProjects(authCtx, {
                                                                        $select: "*", 
                                                                        /*$filter: "Name+eq+'" + projectName + "'",*/
                                                                        });            
      projects.forEach(ProcessProject);

      Config.shutdown();
    }
    catch (error)  {
      Logger.logError (Config.loggingCategory, error);
    }    
  Logger.logTrace (Config.loggingCategory, "Finish getting projects");
  }


//////////////////////////////////////////////////////////
Logger.initializeToConsole();
Logger.setLevel(Config.loggingCategory, LogLevel.Trace);
Logger.logTrace(Config.loggingCategory, "Logger initialized...");

if (require.main === module) {
  // Logger.logTrace(Config.loggingCategory, "Step in main");
  // tslint:disable-next-line:no-floating-promises
  main();
  // Logger.logTrace(Config.loggingCategory, "back from main");
}