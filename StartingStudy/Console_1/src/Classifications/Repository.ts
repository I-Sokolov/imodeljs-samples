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
  private name: string | undefined;
  private editionVersion: string | undefined;
  private editionDate: Date | undefined;
  private description: string | undefined;
  private source: string | undefined;

  /** */
  private items: Array<Item>;

  /** */
  constructor(theApp: TheApp, xmlNode: any) {
    this.theApp = theApp;

    if (xmlNode.Name)
      for (this.name of xmlNode.Name);
    if (xmlNode.EditionVersion)
      for (this.editionVersion of xmlNode.EditionVersion);
    if (xmlNode.EditionDate) {
      for (const date of xmlNode.EditionDate) {
        this.editionDate = new Date();
        if (date.Year)
          for (const val of date.Year)
            this.editionDate.setFullYear(val);
        if (date.Month)
          for (const val of date.Month)
            this.editionDate.setMonth(val);
        if (date.Day)
          for (const val of date.Day)
            this.editionDate.setDate(val);
      }
    }
    if (xmlNode.Description)
      for (this.description of xmlNode.Description);
    if (xmlNode.Source)
      for (this.source of xmlNode.Source);

    this.items = new Array<Item>();
    if (xmlNode.Items)
      for (const xmlItems of xmlNode.Items) {
        if (xmlItems.Item)
          for (const xmlItem of xmlItems.Item) {
            const item = new Item(theApp, this, xmlItem);
            this.items.push(item);
          }
      }
  }
}

/** Access to classification system in repository */
export class Item {
  /** */
  private theApp: TheApp;

  /** */
  private id: string | undefined;
  private name: string | undefined;
  private description: string | undefined;

  /** */
  private parent: Item | System;
  private children: Array<Item>;

  /** */
  constructor(theApp: TheApp, parent: Item | System, xmlNode: any) {
    this.theApp = theApp;

    this.parent = parent;

    if (xmlNode.ID)
      for (this.id of xmlNode.ID);
    if (xmlNode.Name)
      for (this.name of xmlNode.Name);
    if (xmlNode.Description)
      for (this.description of xmlNode.Description);

    this.children = new Array<Item>();
    if (xmlNode.Children)
      for (const xmlChild of xmlNode.Children)
        if (xmlChild.Item)
          for (const xmlItem of xmlChild.Item) {
            const item = new Item(theApp, this, xmlItem);
            this.children.push(item);
          }
  }
}
