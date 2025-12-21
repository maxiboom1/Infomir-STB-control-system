import sql from "mssql";
import appConfig from "../4-utils/app-config";

const config = {
  user: appConfig.sqlUser,
  password: appConfig.sqlPassword,
  server: appConfig.sqlHost,
  database: appConfig.sqlDatabase,
  options: {
    encrypt: false, // for Azure users
    trustServerCertificate: true, // change to false for production environments
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    //logger(`[SYSTEM] SQL Client connected to ${config.database} database`);
    return pool;
  })
  .catch((err) => {
    //logger(`[SYSTEM] Error connecting to SQL Server: ${err}`, "red");
    throw err;
  });

// Your execute function:
async function execute(sql: string, values?: any[]) {
  try {
    const pool = await poolPromise;
    
    // Check if values are provided
    if (values) {
      const request = pool.request();

      // Loop through values and add them as parameters
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          request.input(key, values[key]);
        }
      }

      // Execute query with parameters
      const result = await request.query(sql);
      return result;
    } else {
      // Execute query without parameters
      const result = await pool.request().query(sql);
      return result.recordset;
    }
  } catch (err) {
    //logger(`Error executing query: ${err}`, "red");
    throw err;
  }
}

export default {
  execute
};