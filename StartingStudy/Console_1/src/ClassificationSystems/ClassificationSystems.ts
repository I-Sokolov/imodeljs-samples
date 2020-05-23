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

/** Helper class to work with classification systems
 * @public
 */
export class ClassificationSystems {

/** */
    private utils: Utils;

    /** Mode to work with */
    private imodel: bk.IModelDb;

    /**
     * constructor.
     * @param imode The impdel to work with.
     */
    public constructor(imodel: bk.IModelDb, loggerCategory?: string) {
        this.utils = new Utils(loggerCategory);
        this.imodel = imodel;        
        this.utils.Trace("ClassificationSystems constructed");
    }

    /** Print info and statistics about classification systems to log */
    public LogInfo() {
        const saveLevel = core.Logger.getLevel(this.utils.loggerCategory);
        core.Logger.setLevel(this.utils.loggerCategory,  core.LogLevel.Trace);
        
        this.utils.Trace(`ClassificationSystems information for ${this.imodel.name}`);

        this.utils.Trace ("EC Schema")
        this.utils.LogQueryResult(this.imodel, "SELECT Name, Alias, VersionMajor, VersionWrite, VersionMinor FROM meta.ECSchemaDef WHERE Alias='clsf'");

        core.Logger.setLevel(this.utils.loggerCategory, saveLevel ? saveLevel : core.LogLevel.None);
    }
    

}