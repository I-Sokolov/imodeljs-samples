/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs"
import * as path from "path"

import { TheApp } from "./TheApp"
import { Repository } from "./Repository";

/** Access to classification repositories
* https://www.graphisoft.com/downloads/archicad/BIM_Data.html
* @private
*/
export class Repositories {
  /** */
  private theApp: TheApp;

  /** */
  private repositories: Array<Repository>;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp:TheApp) {
    this.theApp = theApp;
    this.repositories = new Array<Repository>();
    this.CreateRepositories();
  }

  /** */
  private CreateRepositories() {
    const repoPath = "./src/Classifications/Repositories";
    this.theApp.Trace(`Searching classification systems repositories in ${repoPath}`);

    const files = fs.readdirSync(repoPath);

    for (const file of files) {
      this.theApp.Trace(`Found ${file}`);
      const filePath = path.join(repoPath, file);
      const repo = new Repository(this.theApp, filePath);
      this.repositories.push(repo);
    }
  }

}