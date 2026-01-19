// 4-services/sql-service.js
import db from "../1-dal/sql.js";
import logger from "../3-utilities/logger.js";

class SqlService {

  /* =========================DEVICES========================= */

  async addNewDevice(device) {
    // Expected: { name, ip, zoneId, posIndex, isOnline?, tag?, label? }
    const values = {
      name: device.name,
      ip: device.ip,
      zone_id: device.zoneId,
      pos_index: device.posIndex,
      isOnline: device.isOnline ?? 0,
      tag: device.tag ?? "",
      label: device.label ?? ""
    };

    const sqlQuery = `
      INSERT INTO dbo.[devices] (name, ip, zone_id, pos_index, isOnline, tag, label)
      OUTPUT inserted.id
      VALUES (@name, @ip, @zone_id, @pos_index, @isOnline, @tag, @label);
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
      SELECT id, name, ip, zone_id, pos_index, isOnline, tag, label
      FROM dbo.[devices]
      WHERE id = @id;
    `;
    const result = await db.execute(sqlQuery, { id });
    return result?.recordset?.[0] || null;
  }

  async updateDevice(id, patch) {
    // patch: { name?, ip?, zoneId?, posIndex?, isOnline?, tag?, label? }
    const values = {
      id,
      name: patch.name ?? null,
      ip: patch.ip ?? null,
      zone_id: patch.zoneId ?? null,
      pos_index: (patch.posIndex !== undefined) ? patch.posIndex : null,
      isOnline: patch.isOnline ?? null,
      tag: patch.tag ?? null,
      label: patch.label ?? null,
    };

    const sqlQuery = `
      UPDATE dbo.[devices]
      SET
        name     = COALESCE(@name, name),
        ip       = COALESCE(@ip, ip),
        zone_id  = COALESCE(@zone_id, zone_id),
        pos_index = COALESCE(@pos_index, pos_index),
        isOnline = COALESCE(@isOnline, isOnline),
        tag      = COALESCE(@tag, tag),
        label    = COALESCE(@label, label)
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
    // category derived from zones.category_id
    const sqlQuery = `
      SELECT
        d.id, d.name, d.ip,
        d.zone_id, z.name AS zone_name,
        z.category_id, c.name AS category_name,
        d.pos_index,
        d.isOnline, d.tag, d.label
      FROM dbo.[devices] d
      INNER JOIN dbo.[zones] z ON z.id = d.zone_id
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      ORDER BY c.name, z.name, d.name;
    `;
    const result = await db.execute(sqlQuery);
    return result?.recordset || [];
  }

  // Grid helpers
  async getUsedPositionsInZone(zoneId) {
    const sqlQuery = `
      SELECT pos_index
      FROM dbo.[devices]
      WHERE zone_id = @zone_id AND pos_index IS NOT NULL;
    `;
    const result = await db.execute(sqlQuery, { zone_id: zoneId });
    return (result?.recordset || []).map(r => r.pos_index);
  }

  async getDeviceZoneAndPos(id) {
    const sqlQuery = `
      SELECT id, zone_id, pos_index
      FROM dbo.[devices]
      WHERE id = @id;
    `;
    const result = await db.execute(sqlQuery, { id });
    return result?.recordset?.[0] || null;
  }

  async swapDevicePositions(deviceAId, deviceBId) {
    // Swap pos_index values between two devices. Transactional + safe.
    const sqlQuery = `
      BEGIN TRAN;

      DECLARE @a_zone INT, @a_pos INT, @b_zone INT, @b_pos INT;

      SELECT @a_zone = zone_id, @a_pos = pos_index FROM dbo.[devices] WHERE id = @a_id;
      SELECT @b_zone = zone_id, @b_pos = pos_index FROM dbo.[devices] WHERE id = @b_id;

      IF (@a_zone IS NULL OR @b_zone IS NULL)
      BEGIN
        ROLLBACK TRAN;
        RAISERROR('Device not found', 16, 1);
      END

      IF (@a_zone <> @b_zone)
      BEGIN
        ROLLBACK TRAN;
        RAISERROR('Devices must be in the same zone to swap', 16, 1);
      END

      -- Perform swap
      UPDATE dbo.[devices]
      SET pos_index = CASE
        WHEN id = @a_id THEN @b_pos
        WHEN id = @b_id THEN @a_pos
        ELSE pos_index
      END
      WHERE id IN (@a_id, @b_id);

      COMMIT TRAN;

      SELECT 1 AS ok;
    `;

    const result = await db.execute(sqlQuery, { a_id: deviceAId, b_id: deviceBId });
    return result?.recordset?.[0]?.ok === 1;
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
    const sqlQuery = `
      SELECT id, username, role, label, tag
      FROM dbo.[users]
      ORDER BY username;
    `;
    const result = await db.execute(sqlQuery);
    return result?.recordset || [];
  }

  async getUserByUsername(username) {
    const sqlQuery = `
      SELECT TOP (1)
        id, username, password, role, label, tag
      FROM dbo.[users]
      WHERE username = @username;
    `;

    const result = await db.execute(sqlQuery, { username });
    return result?.recordset?.[0] || null;
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

  async createUser({ username, password, role, label, tag }) {
    const sqlQuery = `
      INSERT INTO dbo.[users] (username, password, role, label, tag)
      OUTPUT inserted.id
      VALUES (@username, @password, @role, @label, @tag);
    `;
    const result = await db.execute(sqlQuery, {
      username,
      password,
      role,
      label: label ?? null,
      tag: tag ?? null,
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
      tag: patch.tag ?? null,
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

    const result = await db.execute(sqlQuery, values);
    return result?.recordset?.[0]?.affected ?? 0;
  }

  async deleteUser(id) {
    // Delete assignments first to avoid FK violation (FK_user_zones_user).
    // Keep affected count for the user row only.
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

    const result = await db.execute(sqlQuery, { id });
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
        d.ip   AS device_ip,
        d.pos_index AS device_pos_index
      FROM dbo.[user_zones] uz
      INNER JOIN dbo.[zones] z ON z.id = uz.zone_id
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      LEFT JOIN dbo.[devices] d ON d.zone_id = z.id AND d.pos_index IS NOT NULL
      WHERE uz.user_id = @user_id
      ORDER BY c.name, z.name, d.pos_index, d.name;
    `;

    const result = await db.execute(sqlQuery, { user_id: userId });
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
        d.ip   AS device_ip,
        d.pos_index AS device_pos_index
      FROM dbo.[zones] z
      INNER JOIN dbo.[categories] c ON c.id = z.category_id
      LEFT JOIN dbo.[devices] d ON d.zone_id = z.id AND d.pos_index IS NOT NULL
      ORDER BY c.name, z.name, d.pos_index, d.name;
    `;

    const result = await db.execute(sqlQuery);
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
    const result = await db.execute(sqlQuery, { user_id: userId });
    return (result?.recordset || []).map(r => r.zone_id);
  }

  async setUserZones(userId, zoneIds) {
    // replace assignment set (simple dev-friendly approach)
    const delQuery = `DELETE FROM dbo.[user_zones] WHERE user_id = @user_id;`;
    await db.execute(delQuery, { user_id: userId });

    for (const zid of (zoneIds || [])) {
      const insQuery = `
        INSERT INTO dbo.[user_zones] (user_id, zone_id)
        VALUES (@user_id, @zone_id);
      `;
      await db.execute(insQuery, { user_id: userId, zone_id: zid });
    }

    return true;
  }

  // Compatibility helpers used by app-service.js
  async getZoneIdsForUser(userId) {
    return this.getUserZones(userId);
  }

  async replaceUserZones(userId, zoneIds) {
    await db.execute(`DELETE FROM dbo.[user_zones] WHERE user_id = @user_id;`, { user_id: userId });

    let count = 0;
    for (const zid of (zoneIds || [])) {
      const insQuery = `
        INSERT INTO dbo.[user_zones] (user_id, zone_id)
        VALUES (@user_id, @zone_id);
      `;
      await db.execute(insQuery, { user_id: userId, zone_id: zid });
      count++;
    }
    return count;
  }
}

export default new SqlService();
