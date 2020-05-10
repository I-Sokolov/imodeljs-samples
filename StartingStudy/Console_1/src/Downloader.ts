import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";

import { Config } from "./Config";


export class Downloader{

    private  authCtx : AuthorizedClientRequestContext;

    constructor (authCtx : AuthorizedClientRequestContext){
        Logger.logTrace (Config.loggingCategory, "Donloader is constructed");
        this.authCtx = authCtx;
    }

    Download (projId : string, modelId : string) : void {
        Logger.logTrace (Config.loggingCategory, `Downloading ${projId} from ${modelId}`);
    }


}