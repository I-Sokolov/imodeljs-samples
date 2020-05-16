
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import * as bkclient from "@bentley/imodeljs-clients-backend";
import { OidcAgentClient } from "@bentley/imodeljs-clients-backend";

import { Config } from "./Config";
import {Downloader } from "./Downloader";
import { ListModels } from "./ListModels";
import { Modify } from "./Modify"

    
 ///////////////////////////////////////////////////////////////////////
  async function main(){
    try {
      Config.startup ();

      // Log in
      let authCtx = await Config.login ();
      
      /*
      //list projects and models
      let list = new ListModels (authCtx);
      await list.Print ();
*/
/*
      //Download model
      let downloader = new Downloader ();
      if (Config.UseQAEnv){
        await downloader.Download ('O:\\DevArea\\BridgeIFC\\out_2\\down.bim', '15e988af-57c2-44f8-a9fb-c1ad46c878f1', '95cfefde-badb-4476-9ee2-fff53a8f35be');
      }
      else {
        await downloader.Download ('O:\\DevArea\\BridgeIFC\\out_2\\down.bim', '39598190-6072-408b-a1e0-95a8cee4f761', '5c9875e4-4ac4-430c-bbb7-2bf4697701fc');
      }
*/

      const modify = new Modify ();
      if (Config.UseQAEnv){
        await modify.DeleteAllPhysical ('15e988af-57c2-44f8-a9fb-c1ad46c878f1', '95cfefde-badb-4476-9ee2-fff53a8f35be');
      }

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