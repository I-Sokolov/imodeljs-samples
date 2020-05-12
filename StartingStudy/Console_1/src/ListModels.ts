import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AzureFileHandler, OidcAgentClient } from "@bentley/imodeljs-clients-backend";

import { Config } from "./Config";

export class ListModels {

    private readonly connectClient : ConnectClient = new ConnectClient();

    ///////////////////////////////////////////////////////////////////////
    constructor (private authCtx : AuthorizedClientRequestContext){
        Logger.logTrace (Config.loggingCategory, "ListModels is constructed");
    }

    ///////////////////////////////////////////////////////////////////////
    async Print (){
        Logger.logTrace (Config.loggingCategory, "Get acessible projects");
        const projects = await this.connectClient.getProjects(this.authCtx, {
                                                                          $select: "*", 
                                                                          /*$filter: "Name+eq+'" + projectName + "'",*/
                                                                          });     

        //projects.forEach(this.ProcessProject, this); - does not wait end of call
       for (const project of projects){
           await this.ProcessProject (project);
       }

       Logger.logTrace (Config.loggingCategory, "Finish projects");
    }

    ///////////////////////////////////////////////////////////////////////
    private async ProcessProject (project : Project) /*: Promise<void>*/{
        Logger.logTrace (Config.loggingCategory, `  Project ${project.name}   id: ${project.wsgId}`);

        Logger.logTrace (Config.loggingCategory, "  Models:");
        let hubClient = new IModelHubClient(new AzureFileHandler());    

        const imodels:HubIModel[] = await hubClient.iModels.get (this.authCtx, project.wsgId/*, new IModelQuery().byName("iModelName")*/);
   
        imodels.forEach(this.ProcessModel, this);

        Logger.logTrace (Config.loggingCategory, "  Finish models");
    }

    ///////////////////////////////////////////////////////////////////////
    private /*async*/ ProcessModel (model : HubIModel){
        Logger.logTrace (Config.loggingCategory, `      Model ${model.name}     id: ${model.id}`);
    }

}