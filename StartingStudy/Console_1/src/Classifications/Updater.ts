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

import { TheApp } from "./TheApp"
import { Repositories } from "./Repositories";
import { Item, Table, System } from "./Repository";
import { EcefLocationProps } from "@bentley/imodeljs-common";

/** Update classification
 * @public
 */
export class Updater {

  /**  */
  private theApp: TheApp;
  private imodel: bk.IModelDb;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp, imodel: bk.IModelDb) {
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

      return this.UpdateItemDirect(existingItem, repoParent, newParent.model, newParent)
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
  private UpdateItemDirect(existingItem: Classification | undefined, repoItem: Item, newModel: core.Id64String, parent?: Classification): Classification {
    
    const description = this.GetECDescription (repoItem);

    if (existingItem && existingItem.model == newModel) {
      existingItem.userLabel = repoItem.id;
      existingItem.description = description;
      existingItem.parent = parent;
      existingItem.update();
      return existingItem;
    }

    const props: ClassificationProps = {
      model: newModel,
      code: cmn.Code.createEmpty(),
      classFullName: ClassificationSystems.schemaName + ":" + Classification.className,
      //category: cat,
      userLabel: repoItem.id,
      description: description
    };

    const id = this.imodel.elements.insertElement(props);

    const newItem: Classification = this.imodel.elements.getElement(id);

    //TODO move relationships and delete old item

    return newItem;
  }    

  /** */
  private UpdateTable(existingTableModelId: core.Id64String, repoTable: Table): core.Id64String {

    const existingTableModel = this.imodel.models.getModel(existingTableModelId);
    const existingTableElemId = existingTableModel.modeledElement.id;
    const existingTableElem: ClassificationTable = this.imodel.elements.getElement(existingTableElemId);

    const existingSystemId = existingTableElem.parent!.id;
    const newSystemId = this.UpdateSystem(existingSystemId, repoTable.system);

    const description = this.GetECDescription(repoTable);

    if (newSystemId == existingSystemId && existingTableElem.userLabel == repoTable.id) {
      existingTableElem.description = description;
      existingTableElem.update();
      return existingTableModelId;
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
      description: description
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
  private UpdateSystem(existingSystemId: core.Id64String, repoSystem: System) : core.Id64String {
    
    const existingSystem: ClassificationSystem = this.imodel.elements.getElement(existingSystemId);

    if (existingSystem.userLabel == repoSystem.name) {
      existingSystem.edition = repoSystem.editionVersion;
      existingSystem.location = repoSystem.source;
      existingSystem.update();
      return existingSystem.id;
    }

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

