import { Logger } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";
import { PrintModelInfo } from "./ModelInfo";

export class Downloader{

    constructor (){
        Logger.logTrace (Config.loggingCategory, "Donloader is constructed");
    }

    async Download (filePath: string, projId : string, modelId : string) {
        Logger.logTrace (Config.loggingCategory, `Downloading to ${filePath} from ${projId} model ${modelId}`);

        const authCtx = await Config.loginITwin ();
        
        const opts : cmn.DownloadBriefcaseOptions = { syncMode: cmn.SyncMode.PullOnly };
        const bcprops : cmn.BriefcaseProps = await bk.BriefcaseManager.download (authCtx, projId, modelId, opts); 
        Logger.logTrace (Config.loggingCategory, "Downloaded briefcase " + bcprops.key);

        const imodeldb : bk.BriefcaseDb = await bk.BriefcaseDb.open (authCtx, bcprops.key);
        PrintModelInfo (imodeldb);

        const snapshot : bk.SnapshotDb = bk.SnapshotDb.createFrom (imodeldb, filePath);
        PrintModelInfo (snapshot);
        
        snapshot.saveChanges ();
        snapshot.close ();

        Logger.logTrace (Config.loggingCategory, "Saved " + filePath);

        imodeldb.close ();

        //bk.BriefcaseManager.delete (authCtx, bcprops.key);
    }


}