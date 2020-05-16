import { Logger } from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Config } from "./Config";

export function PrintModelInfo (imodel : bk.IModelDb) {
    Logger.logTrace (Config.loggingCategory, "iModelDb info for " + imodel.name);
    Logger.logTrace (Config.loggingCategory, imodel.isBriefcase ? "briefcase" : "not a briefcase");
    Logger.logTrace (Config.loggingCategory, imodel.isSnapshot ? "snapshot" : "not a snapshot");
    Logger.logTrace (Config.loggingCategory, imodel.isReadonly ? "readonly" : "writable");

    const stmt : bk.ECSqlStatement = imodel.prepareStatement ("SELECT COUNT(*)  Num FROM bis.Element");
    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
        const row: any = stmt.getRow();
        Logger.logTrace (Config.loggingCategory, "count request, row as string: " + JSON.stringify(row));

        const num : number = row.Num;
        Logger.logTrace (Config.loggingCategory, "Number of elements: " + num);
      }

    Logger.logTrace (Config.loggingCategory, "-- end of model info --")
}