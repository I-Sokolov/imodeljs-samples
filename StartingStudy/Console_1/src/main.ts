
import { ClientRequestContext, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AccessToken, AuthorizedClientRequestContext, ConnectClient, HubIModel, IModelHubClient, Project } from "@bentley/imodeljs-clients";
import * as bkclient from "@bentley/imodeljs-clients-backend";
import { OidcAgentClient } from "@bentley/imodeljs-clients-backend";

import { Config } from "./Config";
import {Downloader } from "./Downloader";
import { ListModels } from "./ListModels";

    
 ///////////////////////////////////////////////////////////////////////
  async function main(){
    try {
      Config.startup ();

      // Log in
      let authCtx = await Config.login ();
      
      //list projects and models
      let list = new ListModels (authCtx);
      await list.Print ();

      //Download model
      let downloader = new Downloader ();
      await downloader.Download ('O:\\DevArea\\BridgeIFC\\out_2\\down.bim', '39598190-6072-408b-a1e0-95a8cee4f761', '5c9875e4-4ac4-430c-bbb7-2bf4697701fc');

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