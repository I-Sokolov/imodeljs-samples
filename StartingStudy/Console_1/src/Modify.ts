import { Logger, Id64String, Id64Array, DbOpcode } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"
import * as gm from "@bentley/geometry-core"
import * as itwcli from "@bentley/itwin-client"

import { Config } from "./Config";
import { PrintModelInfo } from "./ModelInfo";

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
            const stmt : bk.ECSqlStatement = imodel.prepareStatement ("SELECT ECInstanceId FROM bis.GeometricElement3d");
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

            await imodel.pushChanges (authCtx, "All deleted");
            Logger.logTrace (Config.loggingCategory, "Changes pushed");
        }
        catch (err) {
            imodel.abandonChanges ();
            Logger.logError (Config.loggingCategory, err);
        }

        imodel.close ();

        await bk.BriefcaseManager.delete (authCtx, bcprops.key);
    }

    private CreateCircle (radius: number = 10): cmn.GeometryStreamProps {
        const builder = new cmn.GeometryStreamBuilder();
        const circle = gm.Arc3d.createXY(gm.Point3d.createZero(), radius);
        builder.appendGeometry(circle);
        return builder.geometryStream;
      }

    private FindFirst (iModelDb: bk.IModelDb, clsName: string) : Id64String {
        const stmt : bk.ECSqlStatement = iModelDb.prepareStatement (`SELECT ECInstanceId FROM ${clsName} LIMIT 1`);
        while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
            const row: any = stmt.getRow();
            const id = row.id;
            return id;
        }
        Logger.logError (Config.loggingCategory, `No one ${clsName} found`);
        throw `No one ${clsName} found`;
    }

    private async CreateCircleElement (authCtx : itwcli.AuthorizedClientRequestContext, iModelDb: bk.BriefcaseDb, model: Id64String, cat: Id64String, name: string, location: gm.Point3d): Promise<Id64String> {

        const geom = this.CreateCircle ();

        const props = {
          model: model,
          code: cmn.Code.createEmpty(),
          classFullName: "BisCore:TextAnnotation3d", 
          category: cat,
          geom: geom,  
          placement: { origin: location, angles: new gm.YawPitchRollAngles() },
          userLabel: name
        };

        iModelDb.concurrencyControl.buildRequestForElement (props, DbOpcode.Insert);
        iModelDb.concurrencyControl.request (authCtx);
        return iModelDb.elements.insertElement(props);
      }

    async CreateCircles (projId : string, modelId : string) {
        Logger.logTrace (Config.loggingCategory, `Create circles ${projId} model ${modelId}`);

        const authCtx = await Config.loginITwin ();
        
        const opts : cmn.DownloadBriefcaseOptions = { syncMode: cmn.SyncMode.PullAndPush };
        const bcprops : cmn.BriefcaseProps = await bk.BriefcaseManager.download (authCtx, projId, modelId, opts); 
        Logger.logTrace (Config.loggingCategory, `Downloaded briefcase id=${bcprops.key}`);

        const opt : cmn.OpenBriefcaseOptions = {openAsReadOnly : false};
        const imodel : bk.BriefcaseDb = await bk.BriefcaseDb.open (authCtx, bcprops.key, opt);
        Logger.logTrace (Config.loggingCategory, `iModel ${imodel.name} opened`);

        //PrintModelInfo (imodel);

        const concurencyPolicy = imodel.concurrencyControl.getPolicy ();
        Logger.logTrace (Config.loggingCategory, `Concurency policy ${concurencyPolicy}`);

        try {
            const model = this.FindFirst (imodel, "bis.PhysicalModel");
            const cat = this.FindFirst (imodel, "bis.Category");

            for (let x = 0; x < 10; x++) {
                for (let y=0; y < 10; y++) {
                    const name = `at(${x},${y})`;
                    const pt = new gm.Point3d (10*x, 10*y, 0);
                    const id = await this.CreateCircleElement (authCtx, imodel, model, cat, name, pt);
                }
            }
            
            Logger.logTrace (Config.loggingCategory, "All clircles are inserted");

            imodel.saveChanges ();
            Logger.logTrace (Config.loggingCategory, "Changes saved");

            await imodel.pullAndMergeChanges (authCtx);
            Logger.logTrace (Config.loggingCategory, "Model merged");

            await imodel.pushChanges (authCtx, "Create circles");
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