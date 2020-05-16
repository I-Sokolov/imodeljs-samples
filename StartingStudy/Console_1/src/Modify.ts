import { Logger, Id64Array, DbOpcode } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";
import { PrintModelInfo } from "./ModelInfo";
import { Category } from "@bentley/imodeljs-backend";

export class Modify {

    constructor (){
    }

    async DeleteAllPhysical (projId : string, modelId : string) {
        Logger.logTrace (Config.loggingCategory, `Deleting all from ${projId} model ${modelId}`);

        const authCtx = await Config.loginITwin ();
        
        const opts : cmn.DownloadBriefcaseOptions = { syncMode: cmn.SyncMode.PullAndPush };
        const bcprops : cmn.BriefcaseProps = await bk.BriefcaseManager.download (authCtx, projId, modelId, opts); 
        Logger.logTrace (Config.loggingCategory, `Downloaded briefcase id=${bcprops.key}`);

        const opt : cmn.OpenBriefcaseOptions = {openAsReadOnly : false};
        const imodel : bk.BriefcaseDb = await bk.BriefcaseDb.open (authCtx, bcprops.key, opt);
        Logger.logTrace (Config.loggingCategory, `iModel ${imodel.name} opened`);

        const concurencyPolicy = imodel.concurrencyControl.getPolicy ();
        Logger.logTrace (Config.loggingCategory, `Concurency policy ${concurencyPolicy}`);

        try {
            const stmt : bk.ECSqlStatement = imodel.prepareStatement ("SELECT ECInstanceId FROM bis.PhysicalElement");
            while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
                const row: any = stmt.getRow();
                const id = row.id;
                const elmprop : cmn.ElementProps = imodel.elements.getElementProps (id);

                imodel.concurrencyControl.buildRequestForElement (elmprop, DbOpcode.Delete);
                await imodel.concurrencyControl.request (authCtx);
                imodel.elements.deleteElement(id);
            }
            Logger.logTrace (Config.loggingCategory, "All elements are deleted");

            imodel.saveChanges ();
            Logger.logTrace (Config.loggingCategory, "Changes saved");

            await imodel.pullAndMergeChanges (authCtx);
            Logger.logTrace (Config.loggingCategory, "Model merged");

            await imodel.pushChanges (authCtx, "All elements are deleted");
            Logger.logTrace (Config.loggingCategory, "Changes pushed");
        }
        catch (err) {
            imodel.abandonChanges ();
            Logger.logError (Config.loggingCategory, err);
        }

        imodel.close ();

        await bk.BriefcaseManager.delete (authCtx, bcprops.key);
    }


}