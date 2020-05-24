/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as core from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

/** Internal utilities
* @private
*/
export class TheApp {
  /**  */
  public loggerCategory: string = "Classification Systems Utility";

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(loggerCategory?: string) {
    if (loggerCategory)
      this.loggerCategory = loggerCategory;
  }

  /** */
  public Trace(message: string) {
    core.Logger.logTrace(this.loggerCategory, message);
  }

  /** */
  public LogQueryResult(imodel: bk.IModelDb, query: string) {
    try {
      const stmt: bk.ECSqlStatement = imodel.prepareStatement(query);
      let first: boolean = true;

      while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
        const row: any = stmt.getRow();
        //Trace ("count request, row as string: " + JSON.stringify(row));

        if (first) {
          let print = " ";
          for (let i = 0; i < stmt.getColumnCount(); i++) {
            const name = stmt.getValue(i).columnInfo.getPropertyName();
            print += name + "\t";
          }
          this.Trace(print);
          first = false;
        }

        let print = " ";
        for (let i = 0; i < stmt.getColumnCount(); i++) {
          const val = stmt.getValue(i);
          if (val.isNull) {
            print += "null\t";
          }
          else {
            const type: cmn.ECSqlValueType = val.columnInfo.getType();
            switch (type) {
              case cmn.ECSqlValueType.Navigation:
                const n = val.getNavigation();
                const str = n.id;
                print += str + "\t";
                break;
              default:
                //console.log(type);
                print += val.getString() + "\t";
            }
          }
        }
        this.Trace(print);

        //const num : number = row.Num;
        //Logger.logTrace (Config.loggingCategory, "Number of elements: " + num);
      }

      if (first)
        this.Trace("Request returned no results");
      
    } catch (error) {
      core.Logger.logError(this.loggerCategory, error);
    }
  }
}