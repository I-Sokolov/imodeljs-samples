/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module ClassificationSystems
 */

import * as core from "@bentley/bentleyjs-core";
import * as bk from "@bentley/imodeljs-backend";
import * as cmn from "@bentley/imodeljs-common"

import { Classification, ClassificationTable, ClassificationSystem } from "./ec2ts/ClassificationSystemsElements"
import { ClassificationProps, ClassificationTableProps, ClassificationSystemProps } from "./ec2ts/ClassificationSystemsElementProps"
import { ClassificationSystems } from "./ec2ts/ClassificationSystems"

import { Utils } from "./Utils"

/** Clean unused classifications
 * @public
 */
export class Cleaner {

  /**  */
  private theApp: Utils;
  private imodel: bk.IModelDb;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: Utils, imodel: bk.IModelDb) {
    this.theApp = theApp;
    this.imodel = imodel;
  }

  /**  */
  public CleanAll() {
    this.RemoveUnusedTables();
  }

  /**  */
  private RemoveUnusedTables() {
    const query = `SELECT ECInstanceId FROM ${ClassificationTable.classFullName}`;

    const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
      const sqlVal = stmt.getValue(0);
      const tableId = sqlVal.getId();

      const table: ClassificationTable = this.imodel.elements.getElement(tableId);

      const queryUsed = `SELECT c.UserLabel FROM ${Classification.classFullName} c JOIN bis.Model m ON c.model.id=m.ECInstanceId JOIN ${ClassificationTable.classFullName} t ON m.modeledElement.id=t.ECInstanceId LIMIT 1`;
      const stmtUsed: bk.ECSqlStatement = this.imodel.prepareStatement(queryUsed);

      let used = false;
      while (stmtUsed.step() === cmn.DbResult.BE_SQLITE_ROW) {
        const sqlVal = stmtUsed.getValue(0);
        const clsid = sqlVal.getString();
        core.Logger.logTrace(this.theApp.loggerCategory, `Table ${table.userLabel} used for ${clsid}`);
        used = true;
      }

      if (!used) {
        core.Logger.logTrace(this.theApp.loggerCategory, `Table ${table.userLabel} is not used`);
        table.delete();
      }
    }  
  }

}

