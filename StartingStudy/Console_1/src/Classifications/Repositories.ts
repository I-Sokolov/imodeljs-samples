/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs"
import * as path from "path"

import { TheApp } from "./TheApp"
import * as rp from "./Repository";

/** Access to classification repositories
* https://www.graphisoft.com/downloads/archicad/BIM_Data.html
* @private
*/
export class Repositories {
  
  /** */
  private theApp: TheApp;

  /** */
  private repositories: Array<rp.Repository>;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp) {
    this.theApp = theApp;
    this.repositories = new Array<rp.Repository>();
    this.ReadRepositories();
  }

  /** */
  public FindItem(systemName: string | undefined, tableName: string | undefined, itemCode:string): rp.Item | undefined {
    
    const root = this.FindRoot(systemName, tableName);
    
    if (root) { 
      return root.FindItem(itemCode);
    }

    //find in all systems
    for (const repo of this.repositories) {
      for (const system of repo.systems) {
        const item = system.FindItem(itemCode);
        if (item) {
          return item;
        }          
      }
    }

    return undefined;
  }

  /** */
  private FindRoot (systemName: string | undefined, tableName: string | undefined): rp.System | rp.Table | undefined {
    
    let system: rp.System  | undefined;
    
    if (systemName) {
      system = this.FindSystem (systemName);
    }

    let table: rp.Table | undefined;
    if (tableName) {
      if (system) {
        table = system.FindTable(tableName);
      }
      else {
        table = this.FindTableInAllSystems(tableName);
      }
    }

    if (table) {
      return table;
    }

    return system;
  }

  /**  */
  private FindSystem(name: string): rp.System | undefined {    
    
    for (const repo of this.repositories) {
      for (const system of repo.systems) {
        if (system.name == name)
          return system;
      }
    }

    //not found
    return undefined;
  }

  /**  */
  private FindTableInAllSystems(name: string): rp.Table | undefined {

    //search table
    for (const repo of this.repositories) {
      for (const system of repo.systems) {
        const table = system.FindTable(name);
        if (table)
          return table;
      }
    }

    //not found
    return undefined;
  }


  /** */
  private ReadRepositories() {
    const repoPath = "./src/Classifications/Repositories";
    this.theApp.Trace(`Searching classification systems repositories in ${repoPath}`);

    const files = fs.readdirSync(repoPath);

    for (const file of files) {
      this.theApp.Trace(`Found ${file}`);
      const filePath = path.join(repoPath, file);
      const repo = new rp.Repository(this.theApp, filePath);
      this.repositories.push(repo);
    }
  }

}