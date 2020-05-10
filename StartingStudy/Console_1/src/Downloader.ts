import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import { ClientRequestContext, Logger, LogLevel, OpenMode } from "@bentley/bentleyjs-core";
import { BriefcaseManager, IModelDb, PhysicalModel, PhysicalElement, PhysicalPartition, SpatialCategory, OpenParams, Element, ECSqlStatement, ConcurrencyControl } from "@bentley/imodeljs-backend";
import { SyncMode } from "@bentley/imodeljs-common"
import * as itwcli from "@bentley/itwin-client"

import { Config } from "./Config";


export class Downloader{

    constructor (){
        Logger.logTrace (Config.loggingCategory, "Donloader is constructed");
    }

    async Download (projId : string, modelId : string) {
        Logger.logTrace (Config.loggingCategory, `Downloading ${projId} from ${modelId}`);
        const authCtx = await Config.loginITwin ();
        //let openParams: OpenParams = new OpenParams (OpenMode.Readonly);
        const bcprops = await BriefcaseManager.download (authCtx, projId, modelId, { syncMode: SyncMode.PullOnly }); 
        Logger.logTrace (Config.loggingCategory, "Downloaded " + bcprops.iModelId);
        //let briefcase = await IModelDb.open(authContext, projectId!, iModelId!, openParams, iModelVersion);

    }


}