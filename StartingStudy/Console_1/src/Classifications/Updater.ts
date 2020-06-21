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

import { TheApp } from "./TheApp"
import { Repositories } from "./Repositories";
import { Item } from "./Repository";

/** Update classification
 * @public
 */
export class Updater {

  /**  */
  private theApp: TheApp;
  private imodel: bk.IModelDb;
  private idClsf: core.Id64String;
  private item: Item;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp, imodel: bk.IModelDb, idClsf: core.Id64String, item: Item) {
    this.theApp = theApp;
    this.imodel = imodel;
    this.idClsf = idClsf;
    this.item = item;
  }

  /** */
  public Execute() {
    core.Logger.logTrace(this.theApp.loggerCategory, `Updating ${this.item.ID} on EC ${this.idClsf}`);
  
    //this.imodel.elements
  }
  
}