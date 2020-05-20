import { Logger, Id64String, Id64Array, DbOpcode } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"
import * as gm from "@bentley/geometry-core"
import * as itwcli from "@bentley/itwin-client"

import { Config } from "./Config";
import { PrintModelInfo } from "./ModelInfo";

export class Modify {

    private _authCtx : itwcli.AuthorizedClientRequestContext | undefined = undefined;
    private get authCtx () : itwcli.AuthorizedClientRequestContext {return this._authCtx!;}

    private bcprops : cmn.BriefcaseProps | undefined = undefined;
    
    private _imodeldb : bk.BriefcaseDb | undefined = undefined;
    private get imodeldb () : bk.BriefcaseDb {return this._imodeldb!;}

    constructor (){
    }

    async OpenModel (projId : string, modelId : string) {
        this._authCtx = await Config.loginITwin ();
        Logger.logTrace (Config.loggingCategory, `Opening from ${projId} model ${modelId}`);
        
        const opts : cmn.DownloadBriefcaseOptions = { syncMode: cmn.SyncMode.PullAndPush };
        this.bcprops = await bk.BriefcaseManager.download (this.authCtx, projId, modelId, opts); 
        Logger.logTrace (Config.loggingCategory, `Downloaded briefcase id=${this.bcprops.key}`);

        const opt : cmn.OpenBriefcaseOptions = {openAsReadOnly : false};
        this._imodeldb = await bk.BriefcaseDb.open (this.authCtx, this.bcprops.key, opt);
        Logger.logTrace (Config.loggingCategory, `iModel ${this.imodeldb.name} opened`);

        this.imodeldb.concurrencyControl.startBulkMode();

        const concurencyPolicy = this.imodeldb.concurrencyControl.getPolicy ();
        Logger.logTrace (Config.loggingCategory, `Concurency policy ${concurencyPolicy}`);
            
       // PrintModelInfo (this._imodeldb);
    }

    async CloseModel () {
        this.imodeldb.close ();
        await bk.BriefcaseManager.delete (this.authCtx, this.bcprops!.key);
        await bk.BriefcaseManager.purgeCache (this.authCtx);
    }

    private async PushModel (pushname : string) {

        await this.imodeldb.concurrencyControl.request (this.authCtx);

        this.imodeldb.saveChanges ();
        Logger.logTrace (Config.loggingCategory, "Changes saved");

        await this.imodeldb.pullAndMergeChanges (this.authCtx);
        Logger.logTrace (Config.loggingCategory, "Model merged");

        await this.imodeldb.pushChanges (this.authCtx, pushname);
        Logger.logTrace (Config.loggingCategory, "Changes pushed");
    }

    async DeleteAllGeometric () {
        try {
            Logger.logTrace (Config.loggingCategory, `Delete all geometric elements in ${this.imodeldb.name}`);
            
            const stmt : bk.ECSqlStatement = this.imodeldb.prepareStatement ("SELECT ECInstanceId FROM bis.GeometricElement3d");
            while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
                const row: any = stmt.getRow();
                const id = row.id;
                const elmprop : cmn.ElementProps = this.imodeldb.elements.getElementProps (id);

                //this.imodeldb.concurrencyControl.buildRequestForElement (elmprop, DbOpcode.Delete);
                //await this.imodeldb.concurrencyControl.request (this.authCtx);

                this.imodeldb.elements.deleteElement(id);
                //break;
            }
            Logger.logTrace (Config.loggingCategory, "All elements are deleted");

            await this.PushModel ("All deleted");
        }
        catch (err) {
            this.imodeldb.abandonChanges ();
            Logger.logError (Config.loggingCategory, err);
        }        
    }

    private CreateCircle (radius: number = 10): cmn.GeometryStreamProps {
        const builder = new cmn.GeometryStreamBuilder();
        const circle = gm.Arc3d.createXY(gm.Point3d.createZero(), radius);
        builder.appendGeometry(circle);
        return builder.geometryStream;
      }

    private FindFirst (clsName: string) : Id64String {
        const stmt : bk.ECSqlStatement = this.imodeldb.prepareStatement (`SELECT ECInstanceId FROM ${clsName} LIMIT 1`);
        while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
            const row: any = stmt.getRow();
            const id = row.id;
            return id;
        }
        Logger.logError (Config.loggingCategory, `No one ${clsName} found`);
        throw `No one ${clsName} found`;
    }

    private async CreateCircleElement (model: Id64String, cat: Id64String, name: string, location: gm.Point3d): Promise<Id64String> {

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

            //const mprops = this.imodeldb.models.getModelProps (model);
            //this.imodeldb.concurrencyControl.buildRequestForModel (mprops, DbOpcode.Insert);
            //await this.imodeldb.concurrencyControl.request (this.authCtx);
            //this.imodeldb.concurrencyControl.buildRequestForModel (mprops, DbOpcode.Update);
            //await this.imodeldb.concurrencyControl.request (this.authCtx);
            //iModelDb.concurrencyControl.buildRequestForModel (mprops, DbOpcode.Delete);
            //await iModelDb.concurrencyControl.request (authCtx);
            //this.imodeldb.concurrencyControl.buildRequestForElement (props, DbOpcode.Insert);
            //await this.imodeldb.concurrencyControl.request (this.authCtx);

            const id = this.imodeldb.elements.insertElement(props);

            return id;
    }

    async CreateCircles () {
        Logger.logTrace (Config.loggingCategory, `Create circles in ${this.imodeldb.name}`);

        try {
            const model = this.FindFirst ("bis.PhysicalModel");
            const cat = this.FindFirst ("bis.Category");

            let range : gm.Range3d = this.imodeldb.projectExtents.clone ();

            for (let x = 0; x < 10; x++) {
                for (let y=0; y < 10; y++) {
                    const name = `at(${x},${y})`;
                    let pt = new gm.Point3d (10*x, 10*y, 0);
                    const id = await this.CreateCircleElement (model, cat, name, pt);
                    range.extendPoint (pt);
                }
            }
            
            this.imodeldb.updateProjectExtents (range);

            Logger.logTrace (Config.loggingCategory, "All clircles are inserted");

            await this.PushModel ("Create circles");
        }
        catch (err) {
            this.imodeldb.abandonChanges ();
            Logger.logError (Config.loggingCategory, err);
        }
    }

}