/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs"
import * as xml from "xml2js"

import { Logger } from "@bentley/bentleyjs-core";

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
  private xmldoc: Document|null;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp, filePath:string) {
    this.theApp = theApp;
    this.filePath = filePath;
    this.parsed = false;
    this.xmldoc = null;

    this.Parse();
  }

/** */
  private Parse() {
    if (this.parsed)
      return;
    this.parsed = true;

    try {
      this.theApp.Trace(`Parsing ${this.filePath}`);
      const str: string = fs.readFileSync(this.filePath, "utf8");
      const parser = new xml.Parser()
      parser.parseString(str, this.OnParse);
      //this.xmldoc = parser.parseFromString(str, "application/xml");
    }
    catch (err) {
      Logger.logException(this.theApp.loggerCategory, err);
    }
  }

  private OnParse(err: any, data: any) {
    if (err)   {
      console.dir(err);
    }
    else {
      console.dir(data);
    }
  }
}