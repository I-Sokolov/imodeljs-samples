
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import * as bkclient from "@bentley/imodeljs-clients-backend";
import { OidcAgentClient } from "@bentley/imodeljs-clients-backend";

import { Config } from "./Config";
import {Downloader } from "./Downloader";
import { ListModels } from "./ListModels";
import { Modify } from "./Modify"
import { LocalBim } from "./LocalBim"
import { DownloadFailed } from "@bentley/itwin-client";
import * as Graphisoft from "./Classifications/GetGraphisoftRepositories";
    
 ///////////////////////////////////////////////////////////////////////
  async function main(){
    try {
      Config.startup ();
      
      /*
      //list projects and models
      let authCtx = await Config.login ();
      let list = new ListModels (authCtx);
      await list.Print ();
*/
      let projId = '15e988af-57c2-44f8-a9fb-c1ad46c878f1';
      let modelId = '545b48ad-4a62-42a8-bc00-306910977a60'
      if (!Config.UseQAEnv) {
        projId = '39598190-6072-408b-a1e0-95a8cee4f761';
        modelId = '5c9875e4-4ac4-430c-bbb7-2bf4697701fc';
      }

      //Download model
      //let downloader = new Downloader ();
      //await downloader.Download('o:\\DevArea\\BridgeIFC\\out\\test.bim', projId, modelId);

/*
      const modify = new Modify ();
      await modify.OpenBriefcase (projId, modelId);
      //await modify.DeleteAllGeometric ();
      await modify.CreateCircles ();
      await modify.PushBriefcase ("changhes");
      await modify.CloseBriefcase ();
*/
      
      //LocalBim.CreateNew ("o:\\DevArea\\BridgeIfc\\out\\A.bim", "o:\\DevArea\\BridgeIfc\\out\\test.bim");
      //LocalBim.TestClassifications();

      const donwloader = new Graphisoft.Download();
      await donwloader.Run();

      Config.shutdown();
    }
    catch (error)  {
      Logger.logError (Config.loggingCategory, error);
    }    
  Logger.logTrace (Config.loggingCategory, "Finish main");
  }


//////////////////////////////////////////////////////////
Logger.initializeToConsole();
Logger.setLevel(Config.loggingCategory, LogLevel.Trace);
Logger.logTrace(Config.loggingCategory, "Logger initialized...");

if (require.main === module) {
  // Logger.logTrace(Config.loggingCategory, "Step in main");
  // tslint:disable-next-line:no-floating-promises
  main();
  // Logger.logTrace(Config.loggingCategory, "back from main");
}