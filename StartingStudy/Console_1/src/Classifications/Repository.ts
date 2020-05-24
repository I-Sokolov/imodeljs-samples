/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { TheApp } from "./TheApp"

/** Access to classification repositories
* https://www.graphisoft.com/downloads/archicad/BIM_Data.html
* https://developer.mozilla.org/en-US/docs/Web/Guide/Parsing_and_serializing_XML
* @private
*/
export class Repository {
  /** */
  private theApp: TheApp;

  /** */
  private filePath: string;
  private parsed: boolean;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp, filePath:string) {
    this.theApp = theApp;
    this.filePath = filePath;
    this.parsed = false;
  }

}