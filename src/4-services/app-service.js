import sqlService from "./sql-service.js";
import sshService from "../1-dal/ssh.js";
import constants from "../0-models/local-db.js";
import logger from "../3-utilities/logger.js";
import bcrypt from "bcryptjs";

class AppService {

    /* =========================Devices========================= */

    async addNewStb(device) { // Expected device { name, ip, zoneId }
        try {
          const id = await sqlService.addNewDevice(device);
          return { ok: true, id, message: `Device added: ${device.name}` };
        } catch (err) {
          if (err?.number === 2627 || err?.number === 2601) {
            return { ok: false, status: 409, message: "Device already exists (duplicate name/ip)" };
          }
          return { ok: false, status: 500, message: "SQL error" };
        }
      }

    async getAllStb() {
        const stbs = await sqlService.getAllDevices();
        return stbs;
    }

    // Admin devices table (optional but useful for v0.7.1)
    async getAllDevicesDetailed() {
        const devices = await sqlService.getAllDevicesDetailed();
        return { ok: true, devices };
    }

    // Update device (admin)
    async updateStb(deviceId, patch) {
        const id = Number(deviceId);
        if (!Number.isInteger(id) || id <= 0) {
            return { ok: false, status: 400, message: "Invalid device id" };
        }

        // patch can include: name, ip, categoryId, zoneId, isOnline, tag, label
        // Keep it light for now (hard validation in v0.8.1)
        const safePatch = {};
        if (patch?.name !== undefined) safePatch.name = String(patch.name || "").trim();
        if (patch?.ip !== undefined) safePatch.ip = String(patch.ip || "").trim();
        if (patch?.zoneId !== undefined) safePatch.zoneId = Number(patch.zoneId);
        if (patch?.isOnline !== undefined) safePatch.isOnline = patch.isOnline ? 1 : 0;
        if (patch?.tag !== undefined) safePatch.tag = String(patch.tag || "");
        if (patch?.label !== undefined) safePatch.label = String(patch.label || "");
        
        // Optional hard-rule:
        if (patch?.categoryId !== undefined) {
          return { ok: false, status: 400, message: "Device category is derived from zone" };
        }

        // Optional: prevent setting empty name/ip if provided
        if (patch?.name !== undefined && !safePatch.name) {
            return { ok: false, status: 400, message: "Device name cannot be empty" };
        }
        if (patch?.ip !== undefined && !safePatch.ip) {
            return { ok: false, status: 400, message: "Device IP cannot be empty" };
        }

        if (patch?.zoneId !== undefined && (!Number.isInteger(safePatch.zoneId) || safePatch.zoneId <= 0)) {
            return { ok: false, status: 400, message: "Invalid zone id" };
          }

        try {
            const affected = await sqlService.updateDevice(id, safePatch);
            if (!affected) return { ok: false, status: 404, message: "Device not found" };
            return { ok: true, message: "Device updated" };
        } catch (err) {
            // 2627/2601 duplicates; FK errors possible too
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
            const affected = await sqlService.deleteDevice(id);
            if (!affected) return { ok: false, status: 404, message: "Device not found" };
            return { ok: true, message: "Device deleted" };
        } catch {
            return { ok: false, status: 500, message: "Delete failed" };
        }
    }

    /* =========================Categories========================= */

    async getCategories() {
        const categories = await sqlService.getAllCategories();
        return { ok: true, categories };
    }

    async createCategory(name) {
        const n = String(name || "").trim();
        if (!n) return { ok: false, status: 400, message: "Category name is required" };

        try {
            const id = await sqlService.createCategory(n);
            return { ok: true, id, message: "Category created" };
        } catch (err) {
            // likely unique constraint
            return { ok: false, status: 409, message: "Category already exists" };
        }
    }

    async updateCategory(id, name) {
        const cid = Number(id);
        const n = String(name || "").trim();
        if (!Number.isInteger(cid) || cid <= 0) return { ok: false, status: 400, message: "Invalid category id" };
        if (!n) return { ok: false, status: 400, message: "Category name is required" };

        try {
            const affected = await sqlService.updateCategory(cid, n);
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
            const affected = await sqlService.deleteCategory(cid);
            if (!affected) return { ok: false, status: 404, message: "Category not found" };
            return { ok: true, message: "Category deleted" };
        } catch {
            // FK prevents delete when zones/devices reference it
            return { ok: false, status: 409, message: "Category is in use (zones/devices exist)" };
        }
    }

    /* =========================Zones========================= */

    async getZones() {
        const zones = await sqlService.getAllZones();
        return { ok: true, zones };
    }

    async createZone(name, categoryId) {
        const n = String(name || "").trim();
        const cid = Number(categoryId);

        if (!n) return { ok: false, status: 400, message: "Zone name is required" };
        if (!Number.isInteger(cid) || cid <= 0) return { ok: false, status: 400, message: "Category is required" };

        try {
            const id = await sqlService.createZone(n, cid);
            return { ok: true, id, message: "Zone created" };
        } catch {
            return { ok: false, status: 409, message: "Zone already exists or category invalid" };
        }
    }

    async updateZone(id, patch) {
        const zid = Number(id);
        if (!Number.isInteger(zid) || zid <= 0) return { ok: false, status: 400, message: "Invalid zone id" };

        const name = patch?.name !== undefined ? String(patch.name || "").trim() : undefined;
        const categoryId = patch?.categoryId !== undefined ? Number(patch.categoryId) : undefined;

        if (name !== undefined && !name) return { ok: false, status: 400, message: "Zone name cannot be empty" };
        if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId <= 0))
            return { ok: false, status: 400, message: "Invalid categoryId" };

        try {
            const affected = await sqlService.updateZone(zid, { name, categoryId });
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
            const affected = await sqlService.deleteZone(zid);
            if (!affected) return { ok: false, status: 404, message: "Zone not found" };
            return { ok: true, message: "Zone deleted" };
        } catch {
            // FK prevents delete when devices/user_zones reference it
            return { ok: false, status: 409, message: "Zone is in use (devices/users assigned)" };
        }
    }

    /* =========================Users========================= */

    async getUsers() {
        const users = await sqlService.getAllUsers();
        return { ok: true, users };
    }

    async createUser({ username, password, role, label, tag }) {
        const u = String(username || "").trim();
        const p = String(password || "");
        // Role/label/tag are internal. System has exactly one constant admin user.
        // All created users are operators.
        const r = "operator";
        const lbl = null;
        const tg = null;

        if (!u) return { ok: false, status: 400, message: "Username is required" };
        if (!p) return { ok: false, status: 400, message: "Password is required" };
        // Reject attempts to create additional admins.
        if (role !== undefined && String(role || "").trim().toLowerCase() !== "operator") {
            return { ok: false, status: 400, message: "Role is not configurable" };
        }

        const hash = await bcrypt.hash(p, 10);

        try {
            const id = await sqlService.createUser({ username: u, password: hash, role: r, label: lbl, tag: tg });
            return { ok: true, id, message: "User created" };
        } catch {
            return { ok: false, status: 409, message: "Username already exists" };
        }
    }

    async updateUser(id, patch) {
        const uid = Number(id);
        if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };

        const username = patch?.username !== undefined ? String(patch.username || "").trim() : undefined;
        const password = patch?.password !== undefined ? String(patch.password || "") : undefined;
        // role/label/tag are internal and not editable through the admin UI.
        const role = undefined;
        const label = undefined;
        const tag = undefined;

        if (username !== undefined && !username) return { ok: false, status: 400, message: "Username cannot be empty" };

        // Prevent modifying admin user through API (by rule)
        const existing = await sqlService.getUserById(uid);
        if (!existing) return { ok: false, status: 404, message: "User not found" };
        if (existing.role === "admin") return { ok: false, status: 403, message: "Admin user cannot be modified" };

        const patchForSql = {};
        if (username !== undefined) patchForSql.username = username;

        // Ignore attempts to patch role/label/tag.

        if (password !== undefined) {
            if (!password) return { ok: false, status: 400, message: "Password cannot be empty" };
            patchForSql.password = await bcrypt.hash(password, 10);
        }

        try {
            const affected = await sqlService.updateUser(uid, patchForSql);
            if (!affected) return { ok: false, status: 404, message: "User not found" };
            return { ok: true, message: "User updated" };
        } catch {
            return { ok: false, status: 409, message: "Update failed (username already exists)" };
        }
    }

    async deleteUser(id) {
        const uid = Number(id);
        if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };

        const existing = await sqlService.getUserById(uid);
        if (!existing) return { ok: false, status: 404, message: "User not found" };
        if (existing.role === "admin") return { ok: false, status: 403, message: "Admin user cannot be deleted" };

        try {
            const affected = await sqlService.deleteUser(uid);
            if (!affected) return { ok: false, status: 404, message: "User not found" };
            return { ok: true, message: "User deleted" };
        } catch {
            return { ok: false, status: 500, message: "Delete failed" };
        }
    }

    /* =========================User Zones Assignments========================= */

    async getUserZones(userId) {
        const uid = Number(userId);
        if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };

        const user = await sqlService.getUserById(uid);
        if (!user) return { ok: false, status: 404, message: "User not found" };
        if (user.role === "admin") {
            // optional: admin can be treated as "all access" later; for now keep empty list
            return { ok: true, zoneIds: [] };
        }

        const zoneIds = await sqlService.getZoneIdsForUser(uid);
        return { ok: true, zoneIds };
    }

    async setUserZones(userId, zoneIds) {
        const uid = Number(userId);
        if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 400, message: "Invalid user id" };

        const user = await sqlService.getUserById(uid);
        if (!user) return { ok: false, status: 404, message: "User not found" };
        if (user.role === "admin") return { ok: false, status: 403, message: "Admin zones are not managed here" };

        const list = Array.isArray(zoneIds) ? zoneIds : [];
        const clean = list.map(Number).filter(z => Number.isInteger(z) && z > 0);

        // Note: we rely on FK constraints to reject invalid zone IDs
        try {
            const count = await sqlService.replaceUserZones(uid, clean);
            return { ok: true, count, message: "User zones updated" };
        } catch (err) {
            logger("[SERVICE] setUserZones error", err);
            return { ok: false, status: 400, message: "Invalid zoneIds or zone does not exist" };
        }
    }
    
    /* =========================User UI: Category → Zones → Devices tree========================= */

    async getUserTree(user) {
        try {
            // JWT payload uses `uid` (see auth-service.signToken).
            // Keep backward compatibility if something still sends `id`.
            const uid = Number(user?.uid ?? user?.id);
            if (!Number.isInteger(uid) || uid <= 0) return { ok: false, status: 401, message: "Unauthorized" };

            const isAdmin = (user?.role === "admin");
            const rows = isAdmin
                ? await sqlService.getUserTreeRowsForAdmin()
                : await sqlService.getUserTreeRowsForUser(uid);

            // Build tree
            const catMap = new Map(); // catId -> { id, name, zones: [], _zoneMap }

            for (const r of (rows || [])) {
                const catId = r.category_id;
                const catName = r.category_name;
                const zoneId = r.zone_id;
                const zoneName = r.zone_name;

                if (!catMap.has(catId)) {
                    catMap.set(catId, { id: catId, name: catName, zones: [], _zoneMap: new Map() });
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
                        ip: r.device_ip,
                    });
                }
            }

            // finalize (strip internal maps)
            const categories = Array.from(catMap.values()).map(c => {
                delete c._zoneMap;
                return c;
            });

            // Sort zones/devices by name (defensive)
            categories.sort((a, b) => String(a.name).localeCompare(String(b.name)));
            for (const c of categories) {
                c.zones.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                for (const z of c.zones) {
                    z.devices.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                }
            }

            return { ok: true, categories };
        } catch (err) {
            logger('[SERVICE] getUserTree error', err);
            return { ok: false, status: 500, message: 'Failed to build user tree' };
        }
    }

/* =========================User commands to device========================= */

    async sendCommand(deviceId, command) {
        try {
            const cmdKey = String(command || "").toUpperCase();

            const device = await sqlService.getDeviceById(deviceId);
            if (!device) return { ok: false, status: 404, message: `Device not found: ${deviceId}` };
            if (!device.ip) return { ok: false, status: 500, message: `Device has no IP: ${deviceId}` };

            const cmd = constants.commands[cmdKey];
            if (!cmd) return { ok: false, status: 400, message: `Unsupported command: ${cmdKey}` };

            const result = await sshService.exec({
                host: device.ip,
                port: constants.ssh.port,
                username: constants.ssh.username,
                password: constants.ssh.password,
                cmd,
                readyTimeout: 4000,
            });
            //{ host, port, username, password, cmd }
            // sendqtevent often returns empty stdout; success is exit code 0 or null
            if (result?.code !== null && result.code !== 0) {
                return { ok: false, status: 500, message: `Command failed (exit ${result.code})`, ...result };
            }

            return { ok: true, message: `Sent ${cmdKey} to ${device.name} (${device.ip})`, ...result };
        } catch (err) {
            return { ok: false, status: 500, message: `Send failed: ${err.message}` };
        }
    }

}

const appService = new AppService();

export default appService;