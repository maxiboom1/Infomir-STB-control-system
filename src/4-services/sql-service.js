// 4-services/sql-service.js
import db from "../1-dal/sql.js";
import logger from "../3-utilities/logger.js";

class SqlService {

    async addNewDevice(device) {
        const values = {
            name: device.name,
            ip: device.ip,
            port: device.port,
            blob: device.blob,
            keymap:JSON.stringify(device.keymap),
            zone: device.zone ?? null,
            isOnline: device.isOnline ?? 0,
            tag: device.tag ?? "",
            label: device.label ?? ""
        };

    const sqlQuery = `
      INSERT INTO dbo.[device] (name, ip, port, blob, zone, keymap, isOnline, tag, label)
      OUTPUT inserted.id
      VALUES (@name, @ip, @port, @blob, @zone, @keymap, @isOnline, @tag, @label);
    `;

        try {
            const result = await db.execute(sqlQuery, values);
            const assertedId = result.recordset[0].id;

            device.id = assertedId;
            logger(`[SQL] Registering new device: {${device.name}} {${device.ip}:${device.port}}`);

            return assertedId;
        } catch (error) {
            console.error("Error executing query:", error);
            throw error;
        }
    }

    async getAllDevices() {

        const sqlQuery = `SELECT id,name FROM device ORDER BY name;`;

        try {
            const result = await db.execute(sqlQuery);
            return result;

        } catch (error) {
            console.error('Error on fetching devices from SQL:', error);
            return [];
        }
    }

    async getDeviceById(id) {
        const values = { id };
        const sqlQuery = `SELECT id,name,ip,port,blob,keymap FROM device WHERE id = @id;`;
      
        try {
          const result = await db.execute(sqlQuery, values);
          return result.recordset[0] || null;
        } catch (error) {
          console.error(`Error on fetching device ${id} from SQL:`, error);
          return null;
        }
      }

}

const sqlService = new SqlService();
export default sqlService;
