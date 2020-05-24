/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs"
import * as xml from "xml2js"

import { Logger } from "@bentley/bentleyjs-core";

import { TheApp } from "./TheApp"


/** Classification repository
* https://www.graphisoft.com/downloads/archicad/BIM_Data.html
* https://usefulangle.com/post/106/nodejs-read-xml
* https://github.com/Leonidas-from-XIV/node-xml2js 
* @private
*/
export class Repository {
  /** */
  private theApp: TheApp;

  /** */
  private filePath: string;
  private parsed: boolean;

  /** */
  private systems: Array<System>;

  /**
   * constructor.
   * @param imode The impdel to work with.
   */
  public constructor(theApp: TheApp, filePath: string) {
    this.theApp = theApp;
    this.filePath = filePath;
    this.parsed = false;
    this.systems = new Array<System>();

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
      const parser = new xml.Parser();
      parser.parseString(str, (err:any, xml:any)=>this.OnXMLParsed(err,xml));
    }
    catch (err) {
      Logger.logException(this.theApp.loggerCategory, err);
    }
  }

  /** */
  private OnXMLParsed(err: any, xml: any) {
    if (err)   {
      throw err;
    }
    else {
      const buildingInformation = xml.BuildingInformation;
      for (const classification of buildingInformation.Classification) {
        for (const xmlSystem of classification.System) {
          const sys = new System(this.theApp, xmlSystem);
          this.systems.push(sys);
        }
      }
    }
  }
}

/** Classification system in repository */
export class System {
  /** */
  private theApp: TheApp;

  /** */
  private name: string;
  private editionVersion: string;
  private editionDate: Date;
  private description: string;
  private source: string;

  /** */
  private items: Array<Item>;

  /** */
  constructor(theApp: TheApp, xmlNode: any) {
    this.theApp = theApp;

    this.name = xmlNode.Name;
    this.editionVersion = xmlNode.editionVersion;
    this.editionDate = new Date();
    this.editionDate.setFullYear(xmlNode.editionDate.Year);
    this.editionDate.setMonth(xmlNode.editionDate.setMonth);
    this.editionDate.setDate(xmlNode.editionDate.Day);
    this.description = xmlNode.description;
    this.source = xmlNode.source;

    this.items = new Array<Item>();
    for (const xmlItem of xmlNode.items) {
      const item = new Item(theApp, xmlItem);
      this.items.push(item);
    }
  }

}

/** Access to classification system in repository */
export class Item {
  /** */
  private theApp: TheApp;

  /** */
  private id: string;
  private name: string;
  private description: string;

  /** */
  private children: Array<Item>;

  /** */
  constructor(theApp: TheApp, xmlNode: any) {
    this.theApp = theApp;

    this.id = xmlNode.id;
    this.name = xmlNode.name;
    this.description = xmlNode.description;

    this.children = new Array<Item>();
    for (const xmlItem of xmlNode.items) {
      const item = new Item(theApp, xmlItem);
      this.children.push(item);
    }

  }
}
