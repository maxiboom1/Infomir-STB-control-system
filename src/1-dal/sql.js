import sql from "mssql";
import appConfig from "../3-utilities/app-config.js";
import logger from "../3-utilities/logger.js";

const config = {
  user: appConfig.sqlServerUser,
  password: appConfig.sqlServerPassword,
  server: appConfig.sqlServerHost,
  database: appConfig.sqlServerDatabase,
  options: {
    encrypt: false, // for Azure users
    trustServerCertificate: true, // change to false for production environments
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    logger(`[SYSTEM] SQL Client connected to ${config.database} database`);
    return pool;
  })
  .catch((err) => {
    logger(`[SYSTEM] Error connecting to SQL Server: ${err}`, "red");
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
    return result; // ALWAYS full result (has .recordset)
  } catch (err) {
    logger(`[SQL EXECUTER] Error executing query: ${err}`, "red");
    throw err;
  }
}

/**
 * Run multiple queries inside a single SQL transaction.
 * Provides a minimal tx.execute(query, values) helper.
 */
async function withTransaction(handler) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  const txExecute = async (query, values) => {
    const request = new sql.Request(transaction);
    if (values && typeof values === "object") {
      for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          request.input(key, values[key]);
        }
      }
    }
    return request.query(query);
  };

  try {
    await transaction.begin();
    const result = await handler({ execute: txExecute, transaction });
    await transaction.commit();
    return result;
  } catch (err) {
    try {
      if (transaction._aborted !== true) {
        await transaction.rollback();
      }
    } catch {
      // ignore rollback errors
    }
    logger(`[SQL TX] Transaction failed: ${err}`, "red");
    throw err;
  }
}

export default {
  execute,
  withTransaction
};
