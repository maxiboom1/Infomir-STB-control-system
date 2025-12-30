// 4-services/sql-service.js
import db from "../1-dal/sql.js";
import logger from "../3-utilities/logger.js";

class SqlService {

    /* =========================DEVICES========================= */

    async addNewDevice(device) {
        // Expected: { name, ip, categoryId, zoneId, isOnline?, tag?, label? }
        const values = {
            name: device.name,
            ip: device.ip,
            category_id: device.categoryId,
            zone_id: device.zoneId,
            isOnline: device.isOnline ?? 0,
            tag: device.tag ?? "",
            label: device.label ?? ""
        };

        const sqlQuery = `
            INSERT INTO dbo.[devices] (name, ip, category_id, zone_id, isOnline, tag, label)
            OUTPUT inserted.id
            VALUES (@name, @ip, @category_id, @zone_id, @isOnline, @tag, @label);
        `;
        const result = await db.execute(sqlQuery, values);
        const assertedId = result?.recordset?.[0]?.id;
        logger(`[SQL] Registering new device: {${device.name}}, on {${device.ip}}`);
        return assertedId;
    }

    async getAllDevices() {
        const sqlQuery = `SELECT id, name FROM dbo.[devices] ORDER BY name;`;
        const result = await db.execute(sqlQuery);
        return result?.recordset || [];
    }

    async getDeviceById(id) {
        const sqlQuery = `
            SELECT id, name, ip, category_id, zone_id, isOnline, tag, label
            FROM dbo.[devices]
            WHERE id = @id;
            `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0] || null;
    }

    async updateDevice(id, patch) {
        // patch: { name?, ip?, categoryId?, zoneId?, isOnline?, tag?, label? }
        const values = {
            id,
            name: patch.name ?? null,
            ip: patch.ip ?? null,
            category_id: patch.categoryId ?? null,
            zone_id: patch.zoneId ?? null,
            isOnline: patch.isOnline ?? null,
            tag: patch.tag ?? null,
            label: patch.label ?? null,
        };

        const sqlQuery = `
          UPDATE dbo.[devices]
          SET
            name        = COALESCE(@name, name),
            ip          = COALESCE(@ip, ip),
            category_id = COALESCE(@category_id, category_id),
            zone_id     = COALESCE(@zone_id, zone_id),
            isOnline    = COALESCE(@isOnline, isOnline),
            tag         = COALESCE(@tag, tag),
            label       = COALESCE(@label, label)
          WHERE id = @id;
    
          SELECT @@ROWCOUNT AS affected;
        `;

        const result = await db.execute(sqlQuery, values);
        return result?.recordset?.[0]?.affected ?? 0;
    }

    async deleteDevice(id) {
        const sqlQuery = `
            DELETE FROM dbo.[devices]
            WHERE id = @id;

            SELECT @@ROWCOUNT AS affected;
        `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0]?.affected ?? 0;
    }

    async getAllDevicesDetailed() {
        // useful for admin devices table later
        const sqlQuery = `
            SELECT
            d.id, d.name, d.ip, d.zone_id, z.name AS zone_name,
            d.category_id, c.name AS category_name,
            d.isOnline, d.tag, d.label
            FROM dbo.[devices] d
            INNER JOIN dbo.[zones] z ON z.id = d.zone_id
            INNER JOIN dbo.[categories] c ON c.id = d.category_id
            ORDER BY c.name, z.name, d.name;
        `;
        const result = await db.execute(sqlQuery);
        return result?.recordset || [];
    }

    /* =========================CATEGORIES========================= */

    async getAllCategories() {
        const sqlQuery = `SELECT id, name FROM dbo.[categories] ORDER BY name;`;
        const result = await db.execute(sqlQuery);
        return result?.recordset || [];
    }



    async createCategory(name) {
        const sqlQuery = `
            INSERT INTO dbo.[categories] (name)
            OUTPUT inserted.id
            VALUES (@name);
            `;
        const result = await db.execute(sqlQuery, { name });
        return result?.recordset?.[0]?.id;
    }

    async updateCategory(id, name) {
        const sqlQuery = `
            UPDATE dbo.[categories]
            SET name = @name
            WHERE id = @id;
            SELECT @@ROWCOUNT AS affected;
            `;
        const result = await db.execute(sqlQuery, { id, name });
        return result?.recordset?.[0]?.affected ?? 0;
    }

    async deleteCategory(id) {
        const sqlQuery = `
      DELETE FROM dbo.[categories]
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0]?.affected ?? 0;
    }

    /* =========================ZONES========================= */

    async getAllZones() {
        // include category name for UI convenience
        const sqlQuery = `
      SELECT z.id, z.name, z.category_id, c.name AS category_name
      FROM dbo.[zones] z
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      ORDER BY c.name, z.name;
    `;
        const result = await db.execute(sqlQuery);
        return result?.recordset || [];
    }

    async createZone(name, categoryId) {
        const sqlQuery = `
      INSERT INTO dbo.[zones] (name, category_id)
      OUTPUT inserted.id
      VALUES (@name, @category_id);
    `;
        const result = await db.execute(sqlQuery, { name, category_id: categoryId });
        return result?.recordset?.[0]?.id;
    }

    async updateZone(id, patch) {
        // patch: { name?, categoryId? }
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

        const result = await db.execute(sqlQuery, values);
        return result?.recordset?.[0]?.affected ?? 0;
    }

    async deleteZone(id) {
        const sqlQuery = `
      DELETE FROM dbo.[zones]
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0]?.affected ?? 0;
    }

    /* =========================USERS========================= */

    async getAllUsers() {
        // do NOT return password hash
        const sqlQuery = `
      SELECT id, username, role
      FROM dbo.[users]
      ORDER BY username;
    `;
        const result = await db.execute(sqlQuery);
        return result?.recordset || [];
    }

    async getUserById(id) {
        const sqlQuery = `
      SELECT id, username, role
      FROM dbo.[users]
      WHERE id = @id;
    `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0] || null;
    }

    async getUserByUsername(username) {
        const sqlQuery = `
      SELECT TOP 1 id, username, password, role
      FROM dbo.[users]
      WHERE username = @username;
    `;
        const result = await db.execute(sqlQuery, { username });
        return result?.recordset?.[0] || null;
    }

    async createUser({ username, password, role = "operator" }) {
        const sqlQuery = `
      INSERT INTO dbo.[users] (username, password, role)
      OUTPUT inserted.id
      VALUES (@username, @password, @role);
    `;
        const result = await db.execute(sqlQuery, { username, password, role });
        return result?.recordset?.[0]?.id;
    }

    async updateUser(id, patch) {
        // patch: { username?, password?, role? }
        const values = {
            id,
            username: patch.username ?? null,
            password: patch.password ?? null,
            role: patch.role ?? null
        };

        const sqlQuery = `
      UPDATE dbo.[users]
      SET
        username = COALESCE(@username, username),
        password = COALESCE(@password, password),
        role = COALESCE(@role, role)
      WHERE id = @id;

      SELECT @@ROWCOUNT AS affected;
    `;

        const result = await db.execute(sqlQuery, values);
        return result?.recordset?.[0]?.affected ?? 0;
    }

    async deleteUser(id) {
        const sqlQuery = `
      DELETE FROM dbo.[users]
      WHERE id = @id;
      SELECT @@ROWCOUNT AS affected;
    `;
        const result = await db.execute(sqlQuery, { id });
        return result?.recordset?.[0]?.affected ?? 0;
    }

    /* =========================USER_ZONES (Assignments)========================= */

    async getZoneIdsForUser(userId) {
        const sqlQuery = `
      SELECT zone_id
      FROM dbo.[user_zones]
      WHERE user_id = @user_id
      ORDER BY zone_id;
    `;
        const result = await db.execute(sqlQuery, { user_id: userId });
        return (result?.recordset || []).map(r => r.zone_id);
    }

    async replaceUserZones(userId, zoneIds) {
        // DEV-simple implementation: delete then insert.
        // Service layer will validate zoneIds exist + user exists.
        const cleanZoneIds = (Array.isArray(zoneIds) ? zoneIds : [])
            .map(z => Number(z))
            .filter(z => Number.isInteger(z) && z > 0);

        // Delete existing
        await db.execute(`DELETE FROM dbo.[user_zones] WHERE user_id = @user_id;`, { user_id: userId });

        // Insert new
        for (const zid of cleanZoneIds) {
            await db.execute(
                `INSERT INTO dbo.[user_zones] (user_id, zone_id) VALUES (@user_id, @zone_id);`,
                { user_id: userId, zone_id: zid }
            );
        }

        return cleanZoneIds.length;
    }
}

const sqlService = new SqlService();
export default sqlService;
