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

import { Classification, ClassificationTable, ClassificationSystem} from "./ec2ts/ClassificationSystemsElements"
import { ClassificationProps, ClassificationTableProps, ClassificationSystemProps } from "./ec2ts/ClassificationSystemsElementProps"
import { ClassificationSystems} from "./ec2ts/ClassificationSystems"

import { Utils } from "./Utils"
import { Repositories } from "./Repositories";
import { Item, Table, System } from "./Repository";
import { EcefLocationProps } from "@bentley/imodeljs-common";

/** Update classification
 * @public
 */
export class Updater {

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

  /** */
  public Update(idClsf: core.Id64String, repoItem: Item) {
    core.Logger.logTrace(this.theApp.loggerCategory, `Updating ${repoItem.id} on EC ${idClsf}`);
  
    try {
      const existingItem: Classification = this.imodel.elements.getElement(idClsf);

      this.UpdateItemRecursive(existingItem, existingItem.model, repoItem);
    }
    catch (err) {
      core.Logger.logError(this.theApp.loggerCategory, `Failed to update classificatoin ${idClsf} ${repoItem.id}: ` + err);
    }
  }

  /**  */
  public UpdateItemRecursive(existingItem: Classification | undefined, existingModel: core.Id64String, repoItem: Item): Classification {
      
    if (repoItem.parent instanceof Table) {
      const repoTable = repoItem.parent as Table;
      const model = this.UpdateTable(existingModel, repoTable);
      return this.UpdateItemDirect(existingItem, repoItem, model);
    }

    else {
      const repoParent = repoItem.parent as Item;
      
      let existingParent: Classification | undefined = undefined;
      if (existingItem) {
        if (existingItem.parent) {
          const parentId: core.Id64String = existingItem.parent.id;
          if (parentId) {
            const found: Classification = this.imodel.elements.getElement(parentId);
            existingParent = found;
          }
        }
      }

      const newParent = this.UpdateItemRecursive(existingParent, existingModel, repoParent);

      return this.UpdateItemDirect(existingItem, repoItem, newParent.model, newParent)
    }
  }

  /** */
  private GetECDescription(repoItem: Item | Table): string | undefined {
    
    let description = undefined;

    if (repoItem.name && repoItem.id && repoItem.name.localeCompare(repoItem.id)) {
      description = repoItem.name;
    }

    if (!description || description.length == 0) {
      description = repoItem.description;
    }
    else if (repoItem.description && description.localeCompare(repoItem.description)) {
      description = description + ", " + repoItem.description;
    }

    return description;
  }

  /** */
  private UpdateExistingItem(repoItem: Item, modelId: core.Id64String, parentId: core.Id64String|null): Classification | undefined {

    let query = "";
    if (parentId) {
      query = `SELECT ECInstanceId FROM ${ClassificationSystems.schemaName}:${Classification.className} WHERE UserLabel='${repoItem.id}' AND parent.id=${parentId} AND model.id=${modelId} ORDER BY ECInstanceId LIMIT 1`;
    }
    else {
      query = `SELECT ECInstanceId FROM ${ClassificationSystems.schemaName}:${Classification.className} WHERE UserLabel='${repoItem.id}' AND parent is Null AND model.id=${modelId} ORDER BY ECInstanceId LIMIT 1`;
    }

    const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
      const sqlVal = stmt.getValue(0);
      const existingItemId = sqlVal.getId();

      const existingItem: ClassificationTable = this.imodel.elements.getElement(existingItemId);

      let update = false;

      const description = this.GetECDescription(repoItem);

      if (existingItem.description != description) {
        existingItem.description = description;
        update = true;
      }

      if (update) {
        existingItem.update();
      }

      return existingItem;
    }

    return undefined;
  }

  /** */
  private UpdateItemDirect(existingItem: Classification | undefined, repoItem: Item, newModel: core.Id64String, parent?: Classification): Classification {
    
    const found = this.UpdateExistingItem(repoItem, newModel, parent ? parent.id : null);
    if (found) {
      return found;
    }

    let relParent: cmn.RelatedElement | undefined = undefined;
    if (parent) {
      relParent = {
        id: parent.id,
        relClassName: "ClassificationSystems.ClassificationOwnsSubClassifications"
      };
    }

    const props: ClassificationProps = {
      model: newModel,
      code: cmn.Code.createEmpty(),
      classFullName: ClassificationSystems.schemaName + ":" + Classification.className,
      parent: relParent,
      userLabel: repoItem.id,
      description: this.GetECDescription(repoItem)
    };

    const id = this.imodel.elements.insertElement(props);

    const newItem: Classification = this.imodel.elements.getElement(id);

    if (existingItem && existingItem.id != newItem.id) {
      this.GrabClassified(existingItem, newItem);
      existingItem.delete();
    }

    return newItem;
  }    

  /** */
  private GrabClassified(existingItem: Classification, newItem: Classification) {

    const relClassFullName = "ClassificationSystems:ElementHasClassifications";

    //const queryAll = `SELECT * FROM ${relClassFullName}`;
    //this.theApp.LogQueryResult(this.imodel, queryAll);

    const query = `SELECT SourceECInstanceId FROM ${relClassFullName} WHERE TargetECInstanceId=${existingItem.id}`;

    const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
      const sqlVal = stmt.getValue(0);
      const idElem = sqlVal.getId();

      const props: bk.RelationshipProps = {
        classFullName: relClassFullName,
        sourceId: idElem,
        targetId: newItem.id,
      };

      const rel = this.imodel.relationships.createInstance(props);
      core.Logger.logTrace(this.theApp.loggerCategory, `Classify ${idElem} as ${newItem.id} by rel ${rel.id}`);
    }      
  }  

  /** */
  private UpdateExistingTable(repoTable: Table, systemId: core.Id64String): ClassificationTable | undefined {

    const query = `SELECT ECInstanceId FROM ${ClassificationSystems.schemaName}:${ClassificationTable.className} WHERE UserLabel='${repoTable.id}' AND parent.id=${systemId} ORDER BY ECInstanceId LIMIT 1`;

    const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
      const sqlVal = stmt.getValue(0);
      const existingTableId = sqlVal.getId();

      const existingTableElem: ClassificationTable = this.imodel.elements.getElement(existingTableId);
      
      let update = false;

      const description = this.GetECDescription(repoTable);

      if (existingTableElem.description != description) {
        existingTableElem.description = description;
        update = true;
      }
      
      if (update) {
        existingTableElem.update();
      }

      return existingTableElem;
    }

    return undefined;
  }

  /** */
  private UpdateTable(existingTableModelId: core.Id64String, repoTable: Table): core.Id64String {

    const existingTableModel = this.imodel.models.getModel(existingTableModelId);
    const existingTableElemId = existingTableModel.modeledElement.id;
    const existingTableElem: ClassificationTable = this.imodel.elements.getElement(existingTableElemId);

    const existingSystemId = existingTableElem.parent!.id;
    const newSystemId = this.UpdateSystem(existingSystemId, repoTable.system);

    const foundExisting = this.UpdateExistingTable(repoTable, newSystemId);
    if (foundExisting) {
      return foundExisting.id;
    }

    const parentSystem : cmn.RelatedElementProps = {
      id: newSystemId,
      relClassName: "ClassificationSystems:ClassificationSystemOwnsClassificationTable"
    }

    const props: ClassificationTableProps = {
      model: existingTableElem.model,
      code: cmn.Code.createEmpty(),
      classFullName: ClassificationSystems.schemaName + ":" + ClassificationTable.className,
      parent: parentSystem,
      userLabel: repoTable.id,
      description: this.GetECDescription(repoTable)
    };

    const idNewTable = this.imodel.elements.insertElement(props);
    const newTable: ClassificationTable = this.imodel.elements.getElement(idNewTable);

    const relElem : cmn.RelatedElementProps = {     
      id: newTable.id
      //relClassName?: string; - do we need?
    }

    const modelProps: cmn.ModelProps = {
      modeledElement: relElem,
      classFullName: existingTableModel.classFullName
    };

    const newModel = this.imodel.models.createModel(modelProps);
    const id = newModel.insert();
    return id;
  }

  /** */
  private UpdateExistingSystem(repoSystem: System): ClassificationSystem|undefined {

    const query = `SELECT ECInstanceId FROM ${ClassificationSystems.schemaName}:${ClassificationSystem.className} WHERE UserLabel='${repoSystem.name}' ORDER BY ECInstanceId LIMIT 1`;

    const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

    while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
      const sqlVal = stmt.getValue(0);
      const existingSystemId = sqlVal.getId();

      const existingSystem: ClassificationSystem = this.imodel.elements.getElement(existingSystemId);

      let update = false;

      if (existingSystem.edition != repoSystem.editionVersion) {
        existingSystem.edition = repoSystem.editionVersion;
        update = true;
      }

      if (existingSystem.location != repoSystem.source) {
        existingSystem.location = repoSystem.source;
        update = true;
      }

      if (update) {
        existingSystem.update();
      }
      
      return existingSystem;
    }

    return undefined
  }

  /** */
  private UpdateSystem(existingSystemId: core.Id64String, repoSystem: System) : core.Id64String {
    
    const foundSystem = this.UpdateExistingSystem(repoSystem);
    if (foundSystem) {
      return foundSystem.id;
    }

    const existingSystem: ClassificationSystem = this.imodel.elements.getElement(existingSystemId);

    const props : ClassificationSystemProps = {
      model: existingSystem.model,
      code: cmn.Code.createEmpty(),
      classFullName: ClassificationSystems.schemaName + ":" + ClassificationSystem.className,
      //category: existingSystem.cate
      userLabel: repoSystem.name,
      edition: repoSystem.editionVersion,
      location: repoSystem.source
    };

    const id = this.imodel.elements.insertElement(props);
    const newSystem: ClassificationSystem = this.imodel.elements.getElement(id);
    return newSystem.id;

  }
}

