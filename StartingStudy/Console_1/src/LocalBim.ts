import { Logger } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";
import {Modify} from "./Modify"
import { PrintModelInfo } from "./ModelInfo";

export class LocalBim {
    
    CreateNew (filePath : string, seedFile? :  string) {
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
}
