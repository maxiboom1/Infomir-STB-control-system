import { existsSync, readFileSync } from "fs";
import logger from "./logger.js";
import { ensureConfigFile } from "./config-template.js";
import { getExternalPath } from "./runtime-paths.js";
import { pauseThenExitIfNeeded } from "./pause-console.js";

const CONFIG_PATH = getExternalPath("config.json");

// If config is missing in production (or dev), create template and exit.
const ensure = ensureConfigFile(CONFIG_PATH);
if (ensure.created) {
  logger(
    `[SYSTEM] config.json was not found. A template was created at: ${CONFIG_PATH}. Please edit it and restart the app.`,
    "yellow"
  );
  pauseThenExitIfNeeded(1);
}

if (!existsSync(CONFIG_PATH)) {
  logger(`[SYSTEM] Missing config.json at: ${CONFIG_PATH}`, "red");
  pauseThenExitIfNeeded(1);
}

let parsed;
try {
  const raw = readFileSync(CONFIG_PATH, "utf8");
  parsed = JSON.parse(raw);
} catch (err) {
  logger(`[SYSTEM] Failed to read/parse config.json (${CONFIG_PATH}): ${err}`, "red");
  pauseThenExitIfNeeded(1);
}

// ***************** App Advanced Configuration ***************** //

const appConfig = parsed;

// App Version
appConfig.version = "1.2.1";

// HTTP
appConfig.appPort = Number(appConfig.appPort ?? 3000);
if (!Number.isFinite(appConfig.appPort) || appConfig.appPort <= 0) {
  logger(`[SYSTEM] Invalid appPort in config.json: ${appConfig.appPort}`, "red");
  pauseThenExitIfNeeded(1);
}

// Macros (Channel list)
appConfig.macroDigitDelayMs = Number(appConfig.macroDigitDelayMs ?? 150);
appConfig.macroEnterDelayMs = Number(appConfig.macroEnterDelayMs ?? 250);

if (!Number.isFinite(appConfig.macroDigitDelayMs) || appConfig.macroDigitDelayMs < 0 || appConfig.macroDigitDelayMs > 5000) {
  logger(`[SYSTEM] Invalid macroDigitDelayMs in config.json: ${appConfig.macroDigitDelayMs}`, "red");
  pauseThenExitIfNeeded(1);
}

if (!Number.isFinite(appConfig.macroEnterDelayMs) || appConfig.macroEnterDelayMs < 0 || appConfig.macroEnterDelayMs > 5000) {
  logger(`[SYSTEM] Invalid macroEnterDelayMs in config.json: ${appConfig.macroEnterDelayMs}`, "red");
  pauseThenExitIfNeeded(1);
}

export default appConfig;
