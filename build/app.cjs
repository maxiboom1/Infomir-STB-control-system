var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app.js
var import_express3 = __toESM(require("express"), 1);

// src/5-routes/routes.js
var import_express2 = __toESM(require("express"), 1);

// src/1-dal/sql.js
var import_mssql = __toESM(require("mssql"), 1);

// src/3-utilities/app-config.js
var import_fs3 = require("fs");

// src/3-utilities/logger.js
var import_fs = require("fs");
var import_path2 = __toESM(require("path"), 1);

// src/3-utilities/runtime-paths.js
var import_path = __toESM(require("path"), 1);
function getPkgInternalRoot() {
  const ep = process.pkg?.entrypoint;
  if (!ep) return null;
  const epDir = import_path.default.dirname(ep);
  if (import_path.default.basename(epDir).toLowerCase() === "build") {
    return import_path.default.dirname(epDir);
  }
  return epDir;
}
var INTERNAL_ROOT = process.pkg ? getPkgInternalRoot() || process.cwd() : process.cwd();
var EXTERNAL_ROOT = process.pkg ? import_path.default.dirname(process.execPath) : process.cwd();
function getInternalPath(...parts) {
  return import_path.default.join(INTERNAL_ROOT, ...parts);
}
function getExternalPath(...parts) {
  return import_path.default.join(EXTERNAL_ROOT, ...parts);
}

// src/3-utilities/logger.js
var _logDirReady = false;
function ensureLogDir() {
  if (_logDirReady) return;
  const dir = getExternalPath("logs");
  (0, import_fs.mkdirSync)(dir, { recursive: true });
  _logDirReady = true;
}
function getLogFilePath() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return import_path2.default.join(getExternalPath("logs"), `${y}-${m}-${d}.log`);
}
function logger(msg, color = "white") {
  ensureLogDir();
  const line = `${getCurrentDateTime()}  ${msg}`;
  if (colors[color] === void 0) {
    console.log(line);
  } else {
    console.log(`${getCurrentDateTime()} ${colors[color]}%s${colors.reset}`, `${msg}`);
  }
  try {
    (0, import_fs.appendFileSync)(getLogFilePath(), line + "\n", "utf8");
  } catch {
  }
}
function getCurrentDateTime() {
  const now = /* @__PURE__ */ new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hour = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
}
var colors = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  underlined: "\x1B[4m",
  blinking: "\x1B[5m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  strike: "\x1B[9m",
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  dimmed: "\x1B[38;5;244m"
};
var logger_default = logger;

// src/3-utilities/config-template.js
var import_fs2 = require("fs");
var import_path3 = __toESM(require("path"), 1);
function createConfigTemplate() {
  return {
    // HTTP
    appPort: 3e3,
    // SQL Server
    sqlServerHost: "YOUR-PC\\SQLEXPRESS",
    sqlServerUser: "test",
    sqlServerPassword: "1234",
    sqlServerDatabase: "mag_control",
    // Auth
    jwtSecret: "CHANGE_ME__LONG_RANDOM_STRING",
    jwtCookieName: "mag_auth",
    jwtExpiresMinutes: 30
  };
}
function ensureConfigFile(configPath) {
  if ((0, import_fs2.existsSync)(configPath)) return { created: false, path: configPath };
  const dir = import_path3.default.dirname(configPath);
  try {
  } catch {
  }
  const template = createConfigTemplate();
  (0, import_fs2.writeFileSync)(configPath, JSON.stringify(template, null, 2), "utf8");
  return { created: true, path: configPath };
}

// src/3-utilities/app-config.js
var CONFIG_PATH = getExternalPath("config.json");
var ensure = ensureConfigFile(CONFIG_PATH);
if (ensure.created) {
  logger_default(
    `[SYSTEM] config.json was not found. A template was created at: ${CONFIG_PATH}. Please edit it and restart the app.`,
    "yellow"
  );
  process.exit(1);
}
if (!(0, import_fs3.existsSync)(CONFIG_PATH)) {
  logger_default(`[SYSTEM] Missing config.json at: ${CONFIG_PATH}`, "red");
  process.exit(1);
}
var parsed;
try {
  const raw = (0, import_fs3.readFileSync)(CONFIG_PATH, "utf8");
  parsed = JSON.parse(raw);
} catch (err) {
  logger_default(`[SYSTEM] Failed to read/parse config.json (${CONFIG_PATH}): ${err}`, "red");
  process.exit(1);
}
var appConfig = parsed;
appConfig.version = "1.0.0";
appConfig.appPort = Number(appConfig.appPort ?? 3e3);
if (!Number.isFinite(appConfig.appPort) || appConfig.appPort <= 0) {
  logger_default(`[SYSTEM] Invalid appPort in config.json: ${appConfig.appPort}`, "red");
  process.exit(1);
}
var app_config_default = appConfig;

// src/1-dal/sql.js
var config = {
  user: app_config_default.sqlServerUser,
  password: app_config_default.sqlServerPassword,
  server: app_config_default.sqlServerHost,
  database: app_config_default.sqlServerDatabase,
  options: {
    encrypt: false,
    // for Azure users
    trustServerCertificate: true
    // change to false for production environments
  }
};
var poolPromise = new import_mssql.default.ConnectionPool(config).connect().then((pool) => {
  logger_default(`[SYSTEM] SQL Client connected to ${config.database} database`);
  return pool;
}).catch((err) => {
  logger_default(`[SYSTEM] Error connecting to SQL Server: ${err}`, "red");
  throw err;
});
async function execute(query, values) {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    if (values && typeof values === "object") {
      for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          request.input(key, values[key]);
        }
      }
    }
    const result = await request.query(query);
    return result;
  } catch (err) {
    logger_default(`[SQL EXECUTER] Error executing query: ${err}`, "red");
    throw err;
  }
}
var sql_default = {
  execute
};

// src/4-services/sql-service.js
var SqlService = class {
  /* =========================DEVICES========================= */
  async addNewDevice(device) {
    const values = {
      name: device.name,
      ip: device.ip,
      zone_id: device.zoneId,
      isOnline: device.isOnline ?? 0,
      tag: device.tag ?? "",
      label: device.label ?? ""
    };
    const sqlQuery = `
      INSERT INTO dbo.[devices] (name, ip, zone_id, isOnline, tag, label)
      OUTPUT inserted.id
      VALUES (@name, @ip, @zone_id, @isOnline, @tag, @label);
    `;
    const result = await sql_default.execute(sqlQuery, values);
    const assertedId = result?.recordset?.[0]?.id;
    logger_default(`[SQL] Registering new device: {${device.name}}, on {${device.ip}}`);
    return assertedId;
  }
  async getAllDevices() {
    const sqlQuery = `SELECT id, name FROM dbo.[devices] ORDER BY name;`;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  async getDeviceById(id) {
    const sqlQuery = `
      SELECT id, name, ip, zone_id, isOnline, tag, label
      FROM dbo.[devices]
      WHERE id = @id;
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0] || null;
  }
  async updateDevice(id, patch) {
    const values = {
      id,
      name: patch.name ?? null,
      ip: patch.ip ?? null,
      zone_id: patch.zoneId ?? null,
      isOnline: patch.isOnline ?? null,
      tag: patch.tag ?? null,
      label: patch.label ?? null
    };
    const sqlQuery = `
      UPDATE dbo.[devices]
      SET
        name     = COALESCE(@name, name),
        ip       = COALESCE(@ip, ip),
        zone_id  = COALESCE(@zone_id, zone_id),
        isOnline = COALESCE(@isOnline, isOnline),
        tag      = COALESCE(@tag, tag),
        label    = COALESCE(@label, label)
      WHERE id = @id;

      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, values);
    return result?.recordset?.[0]?.affected ?? 0;
  }
  async deleteDevice(id) {
    const sqlQuery = `
      DELETE FROM dbo.[devices]
      WHERE id = @id;

      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0]?.affected ?? 0;
  }
  async getAllDevicesDetailed() {
    const sqlQuery = `
      SELECT
        d.id, d.name, d.ip,
        d.zone_id, z.name AS zone_name,
        z.category_id, c.name AS category_name,
        d.isOnline, d.tag, d.label
      FROM dbo.[devices] d
      INNER JOIN dbo.[zones] z ON z.id = d.zone_id
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      ORDER BY c.name, z.name, d.name;
    `;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  /* =========================CATEGORIES========================= */
  async getAllCategories() {
    const sqlQuery = `SELECT id, name FROM dbo.[categories] ORDER BY name;`;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  async createCategory(name) {
    const sqlQuery = `
      INSERT INTO dbo.[categories] (name)
      OUTPUT inserted.id
      VALUES (@name);
    `;
    const result = await sql_default.execute(sqlQuery, { name });
    return result?.recordset?.[0]?.id;
  }
  async updateCategory(id, name) {
    const sqlQuery = `
      UPDATE dbo.[categories]
      SET name = @name
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, { id, name });
    return result?.recordset?.[0]?.affected ?? 0;
  }
  async deleteCategory(id) {
    const sqlQuery = `
      DELETE FROM dbo.[categories]
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0]?.affected ?? 0;
  }
  /* =========================ZONES========================= */
  async getAllZones() {
    const sqlQuery = `
      SELECT z.id, z.name, z.category_id, c.name AS category_name
      FROM dbo.[zones] z
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      ORDER BY c.name, z.name;
    `;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  async createZone(name, categoryId) {
    const sqlQuery = `
      INSERT INTO dbo.[zones] (name, category_id)
      OUTPUT inserted.id
      VALUES (@name, @category_id);
    `;
    const result = await sql_default.execute(sqlQuery, { name, category_id: categoryId });
    return result?.recordset?.[0]?.id;
  }
  async updateZone(id, patch) {
    const values = {
      id,
      name: patch.name ?? null,
      category_id: patch.categoryId ?? null
    };
    const sqlQuery = `
      UPDATE dbo.[zones]
      SET
        name = COALESCE(@name, name),
        category_id = COALESCE(@category_id, category_id)
      WHERE id = @id;

      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, values);
    return result?.recordset?.[0]?.affected ?? 0;
  }
  async deleteZone(id) {
    const sqlQuery = `
      DELETE FROM dbo.[zones]
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0]?.affected ?? 0;
  }
  /* =========================USERS========================= */
  async getAllUsers() {
    const sqlQuery = `
      SELECT id, username, role, label, tag
      FROM dbo.[users]
      ORDER BY username;
    `;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  async getUserByUsername(username) {
    const sqlQuery = `
      SELECT TOP (1)
        id, username, password, role, label, tag
      FROM dbo.[users]
      WHERE username = @username;
    `;
    const result = await sql_default.execute(sqlQuery, { username });
    return result?.recordset?.[0] || null;
  }
  async getUserById(id) {
    const sqlQuery = `
      SELECT id, username, role
      FROM dbo.[users]
      WHERE id = @id;
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0] || null;
  }
  async createUser({ username, password, role, label, tag }) {
    const sqlQuery = `
      INSERT INTO dbo.[users] (username, password, role, label, tag)
      OUTPUT inserted.id
      VALUES (@username, @password, @role, @label, @tag);
    `;
    const result = await sql_default.execute(sqlQuery, {
      username,
      password,
      role,
      label: label ?? null,
      tag: tag ?? null
    });
    return result?.recordset?.[0]?.id;
  }
  async updateUser(id, patch) {
    const values = {
      id,
      username: patch.username ?? null,
      password: patch.password ?? null,
      role: patch.role ?? null,
      label: patch.label ?? null,
      tag: patch.tag ?? null
    };
    const sqlQuery = `
      UPDATE dbo.[users]
      SET
        username = COALESCE(@username, username),
        password = COALESCE(@password, password),
        role     = COALESCE(@role, role),
        label    = COALESCE(@label, label),
        tag      = COALESCE(@tag, tag)
      WHERE id = @id;

      SELECT @@ROWCOUNT AS affected;
    `;
    const result = await sql_default.execute(sqlQuery, values);
    return result?.recordset?.[0]?.affected ?? 0;
  }
  async deleteUser(id) {
    const sqlQuery = `
      BEGIN TRY
        BEGIN TRAN;

        DELETE FROM dbo.[user_zones]
        WHERE user_id = @id;

        DELETE FROM dbo.[users]
        WHERE id = @id;

        DECLARE @affected INT = @@ROWCOUNT;
        COMMIT;

        SELECT @affected AS affected;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
      END CATCH
    `;
    const result = await sql_default.execute(sqlQuery, { id });
    return result?.recordset?.[0]?.affected ?? 0;
  }
  /* =========================USER UI TREE========================= */
  async getUserTreeRowsForUser(userId) {
    const sqlQuery = `
      SELECT
        c.id   AS category_id,
        c.name AS category_name,
        z.id   AS zone_id,
        z.name AS zone_name,
        d.id   AS device_id,
        d.name AS device_name,
        d.ip   AS device_ip
      FROM dbo.[user_zones] uz
      INNER JOIN dbo.[zones] z ON z.id = uz.zone_id
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      LEFT JOIN dbo.[devices] d ON d.zone_id = z.id
      WHERE uz.user_id = @user_id
      ORDER BY c.name, z.name, d.name;
    `;
    const result = await sql_default.execute(sqlQuery, { user_id: userId });
    return result?.recordset || [];
  }
  async getUserTreeRowsForAdmin() {
    const sqlQuery = `
      SELECT
        c.id   AS category_id,
        c.name AS category_name,
        z.id   AS zone_id,
        z.name AS zone_name,
        d.id   AS device_id,
        d.name AS device_name,
        d.ip   AS device_ip
      FROM dbo.[zones] z
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      LEFT JOIN dbo.[devices] d ON d.zone_id = z.id
      ORDER BY c.name, z.name, d.name;
    `;
    const result = await sql_default.execute(sqlQuery);
    return result?.recordset || [];
  }
  /* =========================USER_ZONES========================= */
  async getUserZones(userId) {
    const sqlQuery = `
      SELECT uz.zone_id
      FROM dbo.[user_zones] uz
      WHERE uz.user_id = @user_id
      ORDER BY uz.zone_id;
    `;
    const result = await sql_default.execute(sqlQuery, { user_id: userId });
    return (result?.recordset || []).map((r) => r.zone_id);
  }
  async setUserZones(userId, zoneIds) {
    const delQuery = `DELETE FROM dbo.[user_zones] WHERE user_id = @user_id;`;
    await sql_default.execute(delQuery, { user_id: userId });
    for (const zid of zoneIds || []) {
      const insQuery = `
        INSERT INTO dbo.[user_zones] (user_id, zone_id)
        VALUES (@user_id, @zone_id);
      `;
      await sql_default.execute(insQuery, { user_id: userId, zone_id: zid });
    }
    return true;
  }
  // Compatibility helpers used by app-service.js
  async getZoneIdsForUser(userId) {
    return this.getUserZones(userId);
  }
  async replaceUserZones(userId, zoneIds) {
    await sql_default.execute(`DELETE FROM dbo.[user_zones] WHERE user_id = @user_id;`, { user_id: userId });
    let count = 0;
    for (const zid of zoneIds || []) {
      const insQuery = `
        INSERT INTO dbo.[user_zones] (user_id, zone_id)
        VALUES (@user_id, @zone_id);
      `;
      await sql_default.execute(insQuery, { user_id: userId, zone_id: zid });
      count++;
    }
    return count;
  }
};
var sql_service_default = new SqlService();

// src/1-dal/ssh.js
var import_ssh2 = require("ssh2");
var SshService = class {
  constructor() {
    this._busyByHost = /* @__PURE__ */ new Map();
  }
  exec(args) {
    const { host, port, username, password, cmd } = args || {};
    const readyTimeout = args?.readyTimeout ?? 4e3;
    if (!host) throw new Error("SshService.exec: missing host ip");
    if (!port) throw new Error("SshService.exec: missing port");
    if (!username) throw new Error("SshService.exec: missing user");
    if (password === void 0 || password === null) throw new Error("SshService.exec: missing password");
    if (!cmd) throw new Error("SshService.exec: missing cmd");
    const key = `${host}:${port}:${username}`;
    if (this._busyByHost.get(key)) {
      return Promise.resolve({ busy: true, stdout: "", stderr: "", code: null, signal: null });
    }
    this._busyByHost.set(key, true);
    return new Promise((resolve, reject) => {
      const conn = new import_ssh2.Client();
      let settled = false;
      const clearBusy = () => {
        this._busyByHost.delete(key);
      };
      const done = (err, result) => {
        if (settled) return;
        settled = true;
        clearBusy();
        try {
          conn.end();
        } catch {
        }
        if (err) reject(err);
        else resolve(result);
      };
      const timer = setTimeout(() => {
        done(new Error(`SSH exec timeout after ${readyTimeout}ms (${host}:${port})`));
      }, readyTimeout);
      conn.on("ready", () => {
        conn.exec(cmd, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            return done(err);
          }
          let stdout = "";
          let stderr = "";
          stream.on("data", (d) => stdout += d.toString());
          stream.stderr.on("data", (d) => stderr += d.toString());
          stream.on("close", (code, signal) => {
            clearTimeout(timer);
            done(null, {
              stdout,
              stderr,
              code: typeof code === "number" ? code : null,
              signal: signal ?? null
            });
          });
        });
      }).on("error", (err) => {
        clearTimeout(timer);
        done(err);
      }).connect({
        host,
        port,
        username,
        password,
        readyTimeout,
        hostVerifier: () => true
      });
    });
  }
};
var sshService = new SshService();
var ssh_default = sshService;

// src/0-models/local-db.js
var suffix = "sendqtevent -kqt ";
var altSuffix = "sendqtevent -a -kqt ";
var constants = Object.freeze({
  commands: Object.freeze({
    "0": suffix + "48",
    "1": suffix + "49",
    "2": suffix + "50",
    "3": suffix + "51",
    "4": suffix + "52",
    "5": suffix + "53",
    "6": suffix + "54",
    "7": suffix + "55",
    "8": suffix + "56",
    "9": suffix + "57",
    UP: suffix + "0x01000013",
    DOWN: suffix + "0x01000015",
    LEFT: suffix + "0x01000012",
    RIGHT: suffix + "0x01000014",
    OK: suffix + "0x01000004",
    OK2: suffix + "0x01000005",
    // Back/Exit/Menu
    BACK: suffix + "0x01000003",
    RETURN: suffix + "0x01000003",
    // alias (UI uses RETURN)
    EXIT: suffix + "0x01000000",
    HOME: suffix + "0x01000000",
    // alias (UI uses HOME)
    MENU: suffix + "0x0100003a",
    CH_PLUS: suffix + "0x01000001",
    CH_MINUS: suffix + "0x01000002",
    VOL_MINUS: suffix + "0x01000070",
    VOL_PLUS: suffix + "0x01000072",
    MUTE: altSuffix + "96",
    MUTE_ALT: altSuffix + "126",
    RED: suffix + "0x01000030",
    GREEN: suffix + "0x01000031",
    YELLOW: suffix + "0x01000032",
    BLUE: suffix + "0x01000033",
    // =========================
    // Extra operations
    // =========================
    REFRESH: suffix + "0x01000034",
    SCREEN_RESIZE: suffix + "0x01000035",
    PAGE_UP: suffix + "0x01000016",
    PAGE_DOWN: suffix + "0x01000017",
    // =========================
    // EPG / TV
    // =========================
    EPG: suffix + "0x01000037",
    TV: suffix + "0x01000039",
    // =========================
    // Media / Info / Power (ALT-modified)
    // =========================
    INFO: altSuffix + "89",
    PLAY_PAUSE: altSuffix + "82",
    STOP: altSuffix + "83",
    // POWER has a special syntax - so i hardcare this case
    POWER: "sendqtevent -a -kqt 0x55 -ks 0x75"
  }),
  ssh: Object.freeze({
    port: 22,
    username: "root",
    password: "930920"
  })
});
var local_db_default = constants;

// src/4-services/app-service.js
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var AppService = class {
  /* =========================Devices========================= */
  async addNewStb(device) {
    try {
      const id = await sql_service_default.addNewDevice(device);
      return { ok: true, id, message: `Device added: ${device.name}` };
    } catch (err) {
      if (err?.number === 2627 || err?.number === 2601) {
        return { ok: false, status: 409, message: "Device already exists (duplicate name/ip)" };
      }
      return { ok: false, status: 500, message: "SQL error" };
    }
  }
  async getAllStb() {
    const stbs = await sql_service_default.getAllDevices();
    return stbs;
  }
  // Admin devices table (optional but useful for v0.7.1)
  async getAllDevicesDetailed() {
    const devices = await sql_service_default.getAllDevicesDetailed();
    return { ok: true, devices };
  }
  // Update device (admin)
  async updateStb(deviceId, patch) {
    const id = Number(deviceId);
    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, status: 400, message: "Invalid device id" };
    }
    const safePatch = {};
    if (patch?.name !== void 0) safePatch.name = String(patch.name || "").trim();
    if (patch?.ip !== void 0) safePatch.ip = String(patch.ip || "").trim();
    if (patch?.zoneId !== void 0) safePatch.zoneId = Number(patch.zoneId);
    if (patch?.isOnline !== void 0) safePatch.isOnline = patch.isOnline ? 1 : 0;
    if (patch?.tag !== void 0) safePatch.tag = String(patch.tag || "");
    if (patch?.label !== void 0) safePatch.label = String(patch.label || "");
    if (patch?.categoryId !== void 0) {
      return { ok: false, status: 400, message: "Device category is derived from zone" };
    }
    if (patch?.name !== void 0 && !safePatch.name) {
      return { ok: false, status: 400, message: "Device name cannot be empty" };
    }
    if (patch?.ip !== void 0 && !safePatch.ip) {
      return { ok: false, status: 400, message: "Device IP cannot be empty" };
    }
    if (patch?.zoneId !== void 0 && (!Number.isInteger(safePatch.zoneId) || safePatch.zoneId <= 0)) {
      return { ok: false, status: 400, message: "Invalid zone id" };
    }
    try {
      const affected = await sql_service_default.updateDevice(id, safePatch);
      if (!affected) return { ok: false, status: 404, message: "Device not found" };
      return { ok: true, message: "Device updated" };
    } catch (err) {
      if (err?.number === 2627 || err?.number === 2601) {
        return { ok: false, status: 409, message: "Duplicate name or IP" };
      }
      return { ok: false, status: 500, message: "SQL error" };
    }
  }
  // Delete device (admin)
  async deleteStb(deviceId) {
    const id = Number(deviceId);
    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, status: 400, message: "Invalid device id" };
    }
    try {
      const affected = await sql_service_default.deleteDevice(id);
      if (!affected) return { ok: false, status: 404, message: "Device not found" };
      return { ok: true, message: "Device deleted" };
    } catch {
      return { ok: false, status: 500, message: "Delete failed" };
    }
  }
  /* =========================Categories========================= */
  async getCategories() {
    const categories = await sql_service_default.getAllCategories();
    return { ok: true, categories };
  }
  async createCategory(name) {
    const n = String(name || "").trim();
    if (!n) return { ok: false, status: 400, message: "Category name is required" };
    try {
      const id = await sql_service_default.createCategory(n);
      return { ok: true, id, message: "Category created" };
    } catch (err) {
      return { ok: false, status: 409, message: "Category already exists" };
    }
  }
  async updateCategory(id, name) {
    const cid = Number(id);
    const n = String(name || "").trim();
    if (!Number.isInteger(cid) || cid <= 0) return { ok: false, status: 400, message: "Invalid category id" };
    if (!n) return { ok: false, status: 400, message: "Category name is required" };
    try {
      const affected = await sql_service_default.updateCategory(cid, n);
      if (!affected) return { ok: false, status: 404, message: "Category not found" };
      return { ok: true, message: "Category updated" };
    } catch {
      return { ok: false, status: 409, message: "Category name already exists" };
    }
  }
  async deleteCategory(id) {
    const cid = Number(id);
    if (!Number.isInteger(cid) || cid <= 0) return { ok: false, status: 400, message: "Invalid category id" };
    try {
      const affected = await sql_service_default.deleteCategory(cid);
      if (!affected) return { ok: false, status: 404, message: "Category not found" };
      return { ok: true, message: "Category deleted" };
    } catch {
      return { ok: false, status: 409, message: "Category is in use (zones/devices exist)" };
    }
  }
  /* =========================Zones========================= */
  async getZones() {
    const zones = await sql_service_default.getAllZones();
    return { ok: true, zones };
  }
  async createZone(name, categoryId) {
    const n = String(name || "").trim();
    const cid = Number(categoryId);
    if (!n) return { ok: false, status: 400, message: "Zone name is required" };
    if (!Number.isInteger(cid) || cid <= 0) return { ok: false, status: 400, message: "Category is required" };
    try {
      const id = await sql_service_default.createZone(n, cid);
      return { ok: true, id, message: "Zone created" };
    } catch {
      return { ok: false, status: 409, message: "Zone already exists or category invalid" };
    }
  }
  async updateZone(id, patch) {
    const zid = Number(id);
    if (!Number.isInteger(zid) || zid <= 0) return { ok: false, status: 400, message: "Invalid zone id" };
    const name = patch?.name !== void 0 ? String(patch.name || "").trim() : void 0;
    const categoryId = patch?.categoryId !== void 0 ? Number(patch.categoryId) : void 0;
    if (name !== void 0 && !name) return { ok: false, status: 400, message: "Zone name cannot be empty" };
    if (categoryId !== void 0 && (!Number.isInteger(categoryId) || categoryId <= 0))
      return { ok: false, status: 400, message: "Invalid categoryId" };
    try {
      const affected = await sql_service_default.updateZone(zid, { name, categoryId });
      if (!affected) return { ok: false, status: 404, message: "Zone not found" };
      return { ok: true, message: "Zone updated" };
    } catch {
      return { ok: false, status: 409, message: "Zone update failed (duplicate name or invalid category)" };
    }
  }
  async deleteZone(id) {
    const zid = Number(id);
    if (!Number.isInteger(zid) || zid <= 0) return { ok: false, status: 400, message: "Invalid zone id" };
    try {
      const affected = await sql_service_default.deleteZone(zid);
      if (!affected) return { ok: false, status: 404, message: "Zone not found" };
      return { ok: true, message: "Zone deleted" };
    } catch {
      return { ok: false, status: 409, message: "Zone is in use (devices/users assigned)" };
    }
  }
  /* =========================Users========================= */
  async getUsers() {
    const users = await sql_service_default.getAllUsers();
    return { ok: true, users };
  }
  async createUser({ username, password, role, label, tag }) {
    const u = String(username || "").trim();
    const p = String(password || "");
    const r = "operator";
    const lbl = null;
    const tg = null;
    if (!u) return { ok: false, status: 400, message: "Username is required" };
    if (!p) return { ok: false, status: 400, message: "Password is required" };
    if (role !== void 0 && String(role || "").trim().toLowerCase() !== "operator") {
      return { ok: false, status: 400, message: "Role is not configurable" };
    }
    const hash = await import_bcryptjs.default.hash(p, 10);
    try {
      const id = await sql_service_default.createUser({ username: u, password: hash, role: r, label: lbl, tag: tg });
      return { ok: true, id, message: "User created" };
    } catch {
      return { ok: false, status: 409, message: "Username already exists" };
    }
  }
  async updateUser(id, patch) {
    const uid = Number(id);
    if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };
    const username = patch?.username !== void 0 ? String(patch.username || "").trim() : void 0;
    const password = patch?.password !== void 0 ? String(patch.password || "") : void 0;
    const role = void 0;
    const label = void 0;
    const tag = void 0;
    if (username !== void 0 && !username) return { ok: false, status: 400, message: "Username cannot be empty" };
    const existing = await sql_service_default.getUserById(uid);
    if (!existing) return { ok: false, status: 404, message: "User not found" };
    if (existing.role === "admin") return { ok: false, status: 403, message: "Admin user cannot be modified" };
    const patchForSql = {};
    if (username !== void 0) patchForSql.username = username;
    if (password !== void 0) {
      if (!password) return { ok: false, status: 400, message: "Password cannot be empty" };
      patchForSql.password = await import_bcryptjs.default.hash(password, 10);
    }
    try {
      const affected = await sql_service_default.updateUser(uid, patchForSql);
      if (!affected) return { ok: false, status: 404, message: "User not found" };
      return { ok: true, message: "User updated" };
    } catch {
      return { ok: false, status: 409, message: "Update failed (username already exists)" };
    }
  }
  async deleteUser(id) {
    const uid = Number(id);
    if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };
    const existing = await sql_service_default.getUserById(uid);
    if (!existing) return { ok: false, status: 404, message: "User not found" };
    if (existing.role === "admin") return { ok: false, status: 403, message: "Admin user cannot be deleted" };
    try {
      const affected = await sql_service_default.deleteUser(uid);
      if (!affected) return { ok: false, status: 404, message: "User not found" };
      return { ok: true, message: "User deleted" };
    } catch (err) {
      if (err?.number === 547 && String(err?.message || "").includes("FK_user_zones_user")) {
        return { ok: false, status: 409, message: "User has assigned zones. Remove permissions first." };
      }
      return { ok: false, status: 500, message: "Delete failed" };
    }
  }
  /* =========================User Zones Assignments========================= */
  async getUserZones(userId) {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };
    const user = await sql_service_default.getUserById(uid);
    if (!user) return { ok: false, status: 404, message: "User not found" };
    if (user.role === "admin") {
      return { ok: true, zoneIds: [] };
    }
    const zoneIds = await sql_service_default.getZoneIdsForUser(uid);
    return { ok: true, zoneIds };
  }
  async setUserZones(userId, zoneIds) {
    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };
    const user = await sql_service_default.getUserById(uid);
    if (!user) return { ok: false, status: 404, message: "User not found" };
    if (user.role === "admin") return { ok: false, status: 403, message: "Admin zones are not managed here" };
    const list = Array.isArray(zoneIds) ? zoneIds : [];
    const clean = list.map(Number).filter((z) => Number.isInteger(z) && z > 0);
    try {
      const count = await sql_service_default.replaceUserZones(uid, clean);
      return { ok: true, count, message: "User zones updated" };
    } catch (err) {
      logger_default("[SERVICE] setUserZones error", err);
      return { ok: false, status: 400, message: "Invalid zoneIds or zone does not exist" };
    }
  }
  /* =========================User UI: Category → Zones → Devices tree========================= */
  async getUserTree(user) {
    try {
      const uid = Number(user?.uid ?? user?.id);
      if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 401, message: "Unauthorized" };
      const isAdmin = user?.role === "admin";
      const rows = isAdmin ? await sql_service_default.getUserTreeRowsForAdmin() : await sql_service_default.getUserTreeRowsForUser(uid);
      const catMap = /* @__PURE__ */ new Map();
      for (const r of rows || []) {
        const catId = r.category_id;
        const catName = r.category_name;
        const zoneId = r.zone_id;
        const zoneName = r.zone_name;
        if (!catMap.has(catId)) {
          catMap.set(catId, { id: catId, name: catName, zones: [], _zoneMap: /* @__PURE__ */ new Map() });
        }
        const cat = catMap.get(catId);
        if (!cat._zoneMap.has(zoneId)) {
          const zoneObj = { id: zoneId, name: zoneName, devices: [] };
          cat._zoneMap.set(zoneId, zoneObj);
          cat.zones.push(zoneObj);
        }
        const zone = cat._zoneMap.get(zoneId);
        if (r.device_id) {
          zone.devices.push({
            id: r.device_id,
            name: r.device_name,
            ip: r.device_ip
          });
        }
      }
      const categories = Array.from(catMap.values()).map((c) => {
        delete c._zoneMap;
        return c;
      });
      categories.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      for (const c of categories) {
        c.zones.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        for (const z of c.zones) {
          z.devices.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        }
      }
      return { ok: true, categories };
    } catch (err) {
      logger_default("[SERVICE] getUserTree error", err);
      return { ok: false, status: 500, message: "Failed to build user tree" };
    }
  }
  /* =========================User commands to device========================= */
  async sendCommand(deviceId, command) {
    try {
      const cmdKey = String(command || "").toUpperCase();
      const device = await sql_service_default.getDeviceById(deviceId);
      if (!device) return { ok: false, status: 404, message: `Device not found: ${deviceId}` };
      if (!device.ip) return { ok: false, status: 500, message: `Device has no IP: ${deviceId}` };
      const cmd = local_db_default.commands[cmdKey];
      if (!cmd) return { ok: false, status: 400, message: `Unsupported command: ${cmdKey}` };
      const result = await ssh_default.exec({
        host: device.ip,
        port: local_db_default.ssh.port,
        username: local_db_default.ssh.username,
        password: local_db_default.ssh.password,
        cmd,
        readyTimeout: 4e3
      });
      if (result?.busy) {
        return { ok: false, status: 409, message: `Device busy` };
      }
      if (result?.code !== null && result.code !== 0) {
        return { ok: false, status: 500, message: `Command failed (exit ${result.code})`, ...result };
      }
      return { ok: true, message: `Sent ${cmdKey} to ${device.name} (${device.ip})`, ...result };
    } catch (err) {
      return { ok: false, status: 500, message: `Send failed: ${err.message}` };
    }
  }
};
var appService = new AppService();
var app_service_default = appService;

// src/5-routes/auth.js
var import_express = __toESM(require("express"), 1);

// src/4-services/auth-service.js
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var COOKIE_NAME = app_config_default.jwtCookieName || "mag_auth";
var JWT_SECRET = app_config_default.jwtSecret;
var EXPIRES_MIN = Number(app_config_default.jwtExpiresMinutes || 30);
function parseCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}
function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    // set true behind HTTPS
    // maxAge: EXPIRES_MIN * 60 * 1000,
    path: "/"
  });
}
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
function getTokenFromRequest(req) {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  return bearer || parseCookie(req, COOKIE_NAME);
}
function verifyToken(token) {
  if (!JWT_SECRET) throw new Error("jwtSecret missing in config.json");
  return import_jsonwebtoken.default.verify(token, JWT_SECRET);
}
async function validateCredentials(username, password) {
  const user = await sql_service_default.getUserByUsername(username);
  if (!user) return null;
  const stored = String(user.password || "");
  let passOk = false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    passOk = await import_bcryptjs2.default.compare(password, stored);
  } else {
    passOk = password === stored;
  }
  if (!passOk) return null;
  return user;
}
function signToken(user) {
  if (!JWT_SECRET) throw new Error("jwtSecret missing in config.json");
  const payload = {
    uid: user.id,
    username: user.username,
    role: user.role
    // "admin" | "operator"
  };
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: `${EXPIRES_MIN}m` });
}
async function login(res, username, password) {
  const u = String(username || "").trim();
  const p = String(password || "");
  if (!u || !p) {
    return { ok: false, status: 400, message: "Missing username/password" };
  }
  const user = await validateCredentials(u, p);
  if (!user) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }
  const token = signToken(user);
  setAuthCookie(res, token);
  return { ok: true, role: user.role };
}
function logout(res) {
  clearAuthCookie(res);
  return { ok: true };
}
function getMe(req) {
  const token = getTokenFromRequest(req);
  if (!token) return { ok: false, status: 401 };
  try {
    const decoded = verifyToken(token);
    return { ok: true, user: decoded };
  } catch {
    return { ok: false, status: 401 };
  }
}
var auth_service_default = {
  // constants 
  COOKIE_NAME,
  EXPIRES_MIN,
  // cookie helpers
  setAuthCookie,
  clearAuthCookie,
  // token helpers
  getTokenFromRequest,
  verifyToken,
  // high level actions
  login,
  logout,
  getMe
};

// src/5-routes/auth.js
var router = import_express.default.Router();
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await auth_service_default.login(res, username, password);
    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, message: result.message || "Login error" });
    }
    return res.json({ ok: true, role: result.role });
  } catch {
    return res.status(500).json({ ok: false, message: "Login error" });
  }
});
router.post("/logout", (req, res) => {
  const result = auth_service_default.logout(res);
  return res.json(result);
});
router.get("/me", (req, res) => {
  const result = auth_service_default.getMe(req);
  if (!result.ok) return res.status(result.status || 401).json({ ok: false });
  return res.json({ ok: true, user: result.user });
});
var auth_default = router;

// src/2-middleware/auth-middleware.js
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var COOKIE_NAME2 = app_config_default.jwtCookieName || "mag_auth";
var JWT_SECRET2 = app_config_default.jwtSecret;
function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}
function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    const token = bearer || getCookie(req, COOKIE_NAME2);
    if (!token) return res.status(401).json({ ok: false, message: "Unauthorized" });
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  next();
}
function requirePageAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    const token = bearer || getCookie(req, COOKIE_NAME2);
    if (!token) return res.redirect("/login.html");
    req.user = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    next();
  } catch {
    return res.redirect("/login.html");
  }
}

// src/3-utilities/async-handler.js
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// src/5-routes/routes.js
var router2 = import_express2.default.Router();
router2.use("/auth", auth_default);
router2.post("/send", requireAuth, asyncHandler(async (req, res) => {
  const data = req.body;
  const deviceId = data.deviceId;
  const cmd = String(data.command).toUpperCase();
  const result = await app_service_default.sendCommand(deviceId, cmd);
  res.status(result?.ok ? 200 : result?.status || 500).json(result);
}));
router2.get("/get-devices", requireAuth, asyncHandler(async (req, res) => {
  const devices = await app_service_default.getAllStb();
  res.json({ ok: true, devices });
}));
router2.post("/add-device", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const device = req.body;
  const result = await app_service_default.addNewStb(device);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/devices-detailed", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const result = await app_service_default.getAllDevicesDetailed();
  if (!result.ok) {
    return res.status(result.status || 500).json(result);
  }
  return res.json(result);
}));
router2.put("/device/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const deviceId = req.params.id;
  const patch = req.body;
  const result = await app_service_default.updateStb(deviceId, patch);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.delete("/device/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const deviceId = req.params.id;
  const result = await app_service_default.deleteStb(deviceId);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/categories", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const result = await app_service_default.getCategories();
  if (!result.ok) {
    return res.status(result.status || 500).json(result);
  }
  return res.json(result);
}));
router2.post("/categories", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  const result = await app_service_default.createCategory(name);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.put("/categories/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name } = req.body || {};
  const result = await app_service_default.updateCategory(id, name);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.delete("/categories/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await app_service_default.deleteCategory(id);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/zones", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const result = await app_service_default.getZones();
  if (!result.ok) {
    return res.status(result.status || 500).json(result);
  }
  return res.json(result);
}));
router2.post("/zones", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body || {};
  const result = await app_service_default.createZone(name, categoryId);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.put("/zones/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const patch = req.body;
  const result = await app_service_default.updateZone(id, patch);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.delete("/zones/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await app_service_default.deleteZone(id);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/users", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const result = await app_service_default.getUsers();
  if (!result.ok) {
    return res.status(result.status || 500).json(result);
  }
  return res.json(result);
}));
router2.post("/users", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { username, password, role, label, tag } = req.body || {};
  const result = await app_service_default.createUser({ username, password, role, label, tag });
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.put("/users/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const patch = req.body;
  const result = await app_service_default.updateUser(id, patch);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.delete("/users/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await app_service_default.deleteUser(id);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/users/:id/zones", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await app_service_default.getUserZones(id);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.put("/users/:id/zones", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { zoneIds } = req.body || {};
  const result = await app_service_default.setUserZones(id, zoneIds);
  if (!result.ok) {
    return res.status(result.status || 400).json(result);
  }
  return res.json(result);
}));
router2.get("/user-tree", requireAuth, asyncHandler(async (req, res) => {
  const result = await app_service_default.getUserTree(req.user);
  return res.status(result?.ok ? 200 : result?.status || 500).json(result);
}));
var routes_default = router2;

// src/3-utilities/logger-messages.js
var Messages = class {
  appLoadedMessage() {
    console.clear();
    logger_default(`**********************************************************************`, "blue");
    logger_default(`[SYSTEM] Infomir_STB_control_system, App Version: ${app_config_default.version}, now starting...`, "green");
    logger_default(`**********************************************************************`, "blue");
  }
};
var logMessages = new Messages();
var logger_messages_default = logMessages;

// src/2-middleware/error-middleware.js
function errorMiddleware(err, req, res, next) {
  try {
    const status = Number(err?.status) || 500;
    const message = err?.message || "Server error";
    logger_default(`[ERROR] ${req?.method} ${req?.originalUrl} -> ${status}: ${message}`, "red");
    if (res.headersSent) return next(err);
    if (req?.originalUrl?.startsWith("/api")) {
      return res.status(status).json({ ok: false, message });
    }
    return res.status(status).send("Server error");
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Server error" });
    }
    return next(e);
  }
}

// app.js
var app = (0, import_express3.default)();
app.use(import_express3.default.json());
app.use("/api", routes_default);
app.use(import_express3.default.static(getInternalPath("webpage", "public")));
app.get("/", requirePageAuth, (req, res) => {
  const file = req.user?.role === "admin" ? getInternalPath("webpage", "application", "admin.html") : getInternalPath("webpage", "application", "user.html");
  res.sendFile(file);
});
app.use(errorMiddleware);
process.on("unhandledRejection", (reason) => {
  try {
    console.error("[UNHANDLED REJECTION]", reason);
  } catch {
  }
});
process.on("uncaughtException", (err) => {
  try {
    console.error("[UNCAUGHT EXCEPTION]", err);
  } catch {
  }
});
app.listen(app_config_default.appPort, () => {
  logger_messages_default.appLoadedMessage();
});
