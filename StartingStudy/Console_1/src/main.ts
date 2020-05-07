
import { Id64String, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { Config } from "./Config";

Logger.initializeToConsole();
Logger.setLevel(Config.loggingCategory, LogLevel.Trace);
Logger.logTrace(Config.loggingCategory, "Logger initialized...");

Config.startup ();

Config.shutdown();