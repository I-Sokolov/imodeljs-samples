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

import { Utils } from "./Utils"
import { Repositories } from "./Repositories";
import { Item } from "./Repository";
import { Updater } from "./Updater";
import { Cleaner } from "./Cleaner";

/** Helper class to work with classification systems
 * @public
 */
export class Classifications {

    /** */
    private utils: Utils;

    /** */
    private repositories: Repositories;

    /** Mode to work with */
    private imodel: bk.IModelDb;

    /**
     * constructor.
     * @param imode The impdel to work with.
     */
    public constructor(imodel: bk.IModelDb, loggerCategory?: string) {
        this.utils = new Utils(loggerCategory);
        this.imodel = imodel;
        this.repositories = new Repositories(this.utils);
        this.utils.Trace("ClassificationSystems constructed");
    }

    /** Print info and statistics about classification systems to log */
    public LogInfo() {
        try {
            const saveLevel = core.Logger.getLevel(this.utils.loggerCategory);
            core.Logger.setLevel(this.utils.loggerCategory, core.LogLevel.Trace);
        
            this.utils.Trace(`ClassificationSystems information for ${this.imodel.name}`);

            this.utils.Trace("EC Schema");
            this.utils.LogQueryResult(this.imodel, "SELECT Name, Alias, VersionMajor, VersionWrite, VersionMinor FROM meta.ECSchemaDef WHERE Alias='clsf'");

            this.utils.Trace("Classifications");
            this.utils.LogQueryResult(this.imodel, "SELECT ECInstanceId clsfId, Model.id modelId, UserLabel FROM clsf.Classification");

            core.Logger.setLevel(this.utils.loggerCategory, (saveLevel == undefined) ? core.LogLevel.None : saveLevel!);
        }
        catch (err) {
            core.Logger.logError(this.utils.loggerCategory, err);
        }
    }

    /** Update all classification systems data */
    public UpdateAll() {
        try {
            const query = "SELECT ECInstanceId clsfId, Model.id modelId, UserLabel code FROM clsf.Classification";

            const stmt: bk.ECSqlStatement = this.imodel.prepareStatement(query);

            while (stmt.step() === cmn.DbResult.BE_SQLITE_ROW) {
                const row: any = stmt.getRow();

                const clsfId: core.Id64String = row.clsfId;
                const modelId: core.Id64String | null = row.modelId;
                const code: string = row.code;

                this.FindAndUpdateClassification(clsfId, modelId, code);
            }

            this.imodel.saveChanges("Classification tree is populated");

            const cleaner = new Cleaner(this.utils, this.imodel);
            cleaner.CleanAll();

            this.imodel.saveChanges("Removed unused classifications");
        }
        catch (err) {
            core.Logger.logError(this.utils.loggerCategory, err);
        }
    }

    /**  */
    private FindAndUpdateClassification(idClsf: core.Id64String, idModel: core.Id64String | null, code: string) {
        try {
            this.utils.Trace(`Updating ${code} ${idClsf} ${idModel}`);

            let table: bk.Element | undefined = undefined;
            let system: bk.Element | undefined = undefined;

            if (idModel) {
                const modelTable = this.imodel.models.getModel(idModel);
                const idTable = modelTable.modeledElement.id;
                table = this.imodel.elements.getElement(idTable);
                
                if (table.parent) {
                    const idSystem = table.parent.id;
                    system = this.imodel.elements.getElement(idSystem);
                }
            }
            
            const systemName = system ? system.userLabel : undefined;
            const tableName = table ? table.userLabel : undefined;

            const item = this.repositories.FindItem(systemName, tableName, code);
            if (item) {
                this.UpdateClassification(idClsf, item);
            }
            else {
                core.Logger.logWarning(this.utils.loggerCategory, `Classification item not found: ${code}, system ${systemName}, ${tableName}`);
            }
        }
        catch (err) {
            core.Logger.logError(this.utils.loggerCategory, `Failed to update classificatoin ${idClsf} ${code}: ` + err);
        }    
    }

    /**  */
    private UpdateClassification(idClsf: core.Id64String, item: Item) {
        const updater = new Updater(this.utils, this.imodel);
        updater.Update(idClsf, item);
    }
}
