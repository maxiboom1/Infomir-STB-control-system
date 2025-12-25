// 4-services/sql-service.js
import db from "../1-dal/sql.js";
import logger from "../3-utilities/logger.js";

class SqlService {

    async addNewDevice(device) { // Expected device { name, ip, categoryId, zoneId }
        const values = {
            name: device.name,
            ip: device.ip,
            category: device.category ?? null,
            zone: device.zone ?? null,
            isOnline: device.isOnline ?? 0,
            tag: device.tag ?? "",
            label: device.label ?? ""
        };

    const sqlQuery = `
      INSERT INTO dbo.[device] (name, ip, category, zone, isOnline, tag, label)
      OUTPUT inserted.id
      VALUES (@name, @ip, @category, @zone, @isOnline, @tag, @label);
    `;

        try {
            const result = await db.execute(sqlQuery, values);
            const assertedId = result.recordset[0].id;

            device.id = assertedId;
            logger(`[SQL] Registering new device: {${device.name}}, on {${device.ip}}`);

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
        const sqlQuery = `SELECT id, name, ip FROM device WHERE id = @id;`;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0] || null;
      }
}

const sqlService = new SqlService();
export default sqlService;
