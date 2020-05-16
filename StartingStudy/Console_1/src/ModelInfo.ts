import { Logger } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";

function MakeQuery (imodel: bk.IModelDb, query:string) {
  try {
    const stmt : bk.ECSqlStatement = imodel.prepareStatement (query);
    let first : boolean = true;

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
        const row: any = stmt.getRow();
        //Logger.logTrace (Config.loggingCategory, "count request, row as string: " + JSON.stringify(row));

        if (first) {
          let print = " ";
          for (let i = 0; i < stmt.getColumnCount(); i++) {
            const name = stmt.getValue(i).columnInfo.getPropertyName ();
            print += name + "\t";
          }
          console.log (print);
          first = false;
        }

        let print = " ";
        for (let i = 0; i < stmt.getColumnCount(); i++) {
          const val = stmt.getValue(i);
          print += val.getString () + "\t";
        }
        console.log (print);

        //const num : number = row.Num;
        //Logger.logTrace (Config.loggingCategory, "Number of elements: " + num);
      }
  } catch (error){
    Logger.logError (Config.loggingCategory, error);
  }
}

export function PrintModelInfo (imodel : bk.IModelDb) {
    Logger.logTrace (Config.loggingCategory, "iModelDb info for " + imodel.name);
    Logger.logTrace (Config.loggingCategory, imodel.isBriefcase ? "briefcase" : "not a briefcase");
    Logger.logTrace (Config.loggingCategory, imodel.isSnapshot ? "snapshot" : "not a snapshot");
    Logger.logTrace (Config.loggingCategory, imodel.isReadonly ? "readonly" : "writable");


    Logger.logTrace (Config.loggingCategory, "============== Number of elements: ");
    MakeQuery (imodel, "SELECT COUNT(*) NumberOfElements FROM bis.Element");

    Logger.logTrace (Config.loggingCategory, "============== Schemas: ");
    MakeQuery (imodel, "SELECT Name, Alias, VersionMajor, VersionWrite, VersionMinor FROM meta.ECSchemaDef ORDER BY Name");

    Logger.logTrace (Config.loggingCategory, "============== BisCore classes: ");
    MakeQuery (imodel, "SELECT cls.Name, cls.Modifier FROM meta.ECSchemaDef sch JOIN meta.ECClassDef cls ON cls.Schema.id=sch.ECInstanceId WHERE sch.Name='BisCore' ORDER BY cls.Name");

   // Logger.logTrace (Config.loggingCategory, "============== All classes by schema: ");
   //MakeQuery (imodel, "SELECT sch.Name, cls.Name, cls.Modifier FROM meta.ECSchemaDef sch JOIN meta.ECClassDef cls ON cls.Schema.id=sch.ECInstanceId ORDER BY sch.Name, cls.Name");

    Logger.logTrace (Config.loggingCategory, "-- end of model info --")
}