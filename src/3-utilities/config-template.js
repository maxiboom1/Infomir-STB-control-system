import { existsSync, writeFileSync } from "fs";
import path from "path";

export function createConfigTemplate() {
  return {
    // HTTP
    appPort: 3000,

    // SQL Server
    sqlServerHost: "YOUR-PC\\SQLEXPRESS",
    sqlServerUser: "test",
    sqlServerPassword: "1234",
    sqlServerDatabase: "mag_control",

    // Auth
    jwtSecret: "CHANGE_ME__LONG_RANDOM_STRING",
    jwtCookieName: "mag_auth",
    jwtExpiresMinutes: 30,

    // Macros (Channel list)
    // Delay between digits and before OK/ENTER
    macroDigitDelayMs: 150,
    macroEnterDelayMs: 250,
  };
}

/**
 * Ensures config.json exists. If missing, creates a template file and returns { created: true }.
 * The caller decides whether to exit the process.
 */
export function ensureConfigFile(configPath) {
  if (existsSync(configPath)) return { created: false, path: configPath };

  const dir = path.dirname(configPath);
  // configPath is expected to be in exe root; still ensure folder exists.
  try {
    // If dir is '.' or already exists, no-op.
    // We avoid importing mkdirSync here to keep this utility minimal.
  } catch {}

  const template = createConfigTemplate();
  writeFileSync(configPath, JSON.stringify(template, null, 2), "utf8");
  return { created: true, path: configPath };
}
