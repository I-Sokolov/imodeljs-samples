import * as path from "path";

import { Id64String, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelHost, IModelHostConfiguration, IModelDb } from "@bentley/imodeljs-backend";

export class Config {

  public static get loggingCategory(): string {
    return "Console_1";
  }

  public static startup() {
    // The host configuration.
    // The defaults will work for most backends.
    // Here is an example of how the briefcasesCacheDir property of the host configuration
    // could be set from an environment variable, which could be set by a cloud deployment mechanism.

    let briefcaseCacheDir = process.env.MY_SERVICE_BRIEFCASES_DIR;
    if (briefcaseCacheDir === undefined) {
      const tempDir = process.env.MY_SERVICE_TMP_DIR || process.env.TEMP || "c:\\temp";
      briefcaseCacheDir = path.join(tempDir, "iModelJs_cache");
    }

    const imHostConfig = new IModelHostConfiguration();
    imHostConfig.briefcaseCacheDir = briefcaseCacheDir;

    // Start up IModelHost, supplying the configuration.
    IModelHost.startup(imHostConfig);
    Logger.logTrace(Config.loggingCategory, "IModelHost started");
  }

  public static shutdown(){
    IModelHost.shutdown ();
    Logger.logTrace(Config.loggingCategory, "iModelHost stopped");
  }
}