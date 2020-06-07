import { Logger } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";
import {Modify} from "./Modify"
import { PrintModelInfo } from "./ModelInfo";
import { Classifications } from "./Classifications/Classifications"

export class LocalBim {
    
    static CreateNew (filePath : string, seedFile? :  string) {
        /*
                const root : cmn.RootSubjectProps = {
                    name : "MyRoot",
                    description : "My root subject"
                };

                const opts : cmn.CreateEmptySnapshotIModelProps = {
                    rootSubject : root
                };
            const iModel : bk.SnapshotDb = bk.SnapshotDb.createEmpty (filePath, {rootSubject:{name : ""}});
        */
       
        try {
            const iModelSeed : bk.SnapshotDb = bk.SnapshotDb.openFile (seedFile!);
            Logger.logTrace (Config.loggingCategory, `Opened seed iModel ${seedFile}`);

            PrintModelInfo (iModelSeed);

            const iModel : bk.SnapshotDb = bk.SnapshotDb.createFrom (iModelSeed, filePath);

            const modify = new Modify ();

            modify.SetModel (iModel);
            modify.DeleteAllGeometric ();
            modify.CreateCircles ();

            iModel.saveChanges ("Initial");
            iModel.close ();

        }
        catch (err){
            Logger.logError (Config.loggingCategory, err);
        }
    }

    private static async ImportSchema(imodel : bk.IModelDb, schemaFile : string) {
        const authCtx = await Config.loginITwin();
        await imodel.importSchemas (authCtx, [schemaFile]);
    }

    public static TestClassifications () {
        try {
            const srcModelFile = 'O:\\DevArea\\BridgeIFC\\out\\Winx64\\Product\\IfcBridgeSmokeTest\\run\\Output\\Mapping.bim';
            const srcModel = bk.SnapshotDb.openFile(srcModelFile);       
            
            const dstModelFile = 'o:\\DevArea\\BridgeIFC\\out\\clsf.bim';
            const dstModel = bk.SnapshotDb.createFrom(srcModel, dstModelFile);

            srcModel.close();

            //PrintModelInfo(dstModel);
            //await LocalBim.ImportSchema(dstModel, "O:\\DevArea\\BridgeIFC\\out\\schema\\ClassificationSystems.01.00.00.ecschema.xml");
            //PrintModelInfo(dstModel);

            const clsf = new Classifications(dstModel, Config.loggingCategory);
            clsf.LogInfo();
            clsf.UpdateAll();

            dstModel.saveChanges();
            dstModel.close();
        }
        catch (err) {
            Logger.logError(Config.loggingCategory, err);
        }
    }
}
