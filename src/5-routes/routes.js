import express from "express";
import appService from "../4-services/app-service.js";
import authRoutes from "./auth.js"; 
import { requireAuth, requireAdminUnlocked } from "../2-middleware/auth-middleware.js";
import asyncHandler from "../3-utilities/async-handler.js";



const router = express.Router();
router.use("/auth", authRoutes); // Need to relocate to app.js

router.post("/send", requireAuth, asyncHandler(async (req, res) => {
    const data = req.body;
    const deviceId = data.deviceId;
    const cmd = String(data.command).toUpperCase();
    const result = await appService.sendCommand(deviceId, cmd, req.user);
    res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));

// Channel macro (digits + OK)
router.post("/channel-macro", requireAuth, asyncHandler(async (req, res) => {
    const { deviceId, channelNumber } = req.body || {};
    const result = await appService.runChannelMacro(deviceId, channelNumber, req.user);
    res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));

// Channels map (names for 1..64)
router.get("/channels-map", requireAuth, asyncHandler(async (req, res) => {
    const result = await appService.getChannelsMap();
    return res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));

router.put("/channels-map", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.updateChannelsMap(req.body, req.user);
    return res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));

// ==========================
// Admin: DB Export / Import
// ==========================

router.get("/db-export", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.exportDbSnapshot(req.user);
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `mag_control_export_${ts}.json`;

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return res.status(200).send(JSON.stringify(result.snapshot, null, 2));
}));

router.post("/db-import", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const { snapshot, keepAdmin } = req.body || {};
    const result = await appService.importDbSnapshot(snapshot, { keepAdmin: !!keepAdmin, actor: req.user });
    return res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));

router.get("/get-devices", requireAuth, asyncHandler(async (req, res) => {
    const devices = await appService.getAllStb();
    res.json({ ok: true, devices });
}));


router.post("/add-device",requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const device = req.body; // { name, ip, categoryId, zoneId }
    const result = await appService.addNewStb(device, req.user);
    if (!result.ok) { //{ ok:false, status:409, message:"..." }
      return res.status(result.status || 400).json(result);
    }
  
    return res.json(result); // { ok:true, id, message }
}));

// ==========================
// Admin: Devices CRUD extras
// ==========================

router.get("/devices-detailed", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.getAllDevicesDetailed();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
}));

router.put("/device/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const deviceId = req.params.id;
    const patch = req.body; // { name?, ip?, categoryId?, zoneId?, isOnline?, tag?, label? }
    const result = await appService.updateStb(deviceId, patch, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.delete("/device/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const deviceId = req.params.id;
    const result = await appService.deleteStb(deviceId, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

// Swap device grid positions (admin drag & drop)
router.post("/device-swap", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const { aId, bId } = req.body || {};
    const result = await appService.swapDevicePositions(aId, bId, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));


// ==========================
// Admin: Categories CRUD
// ==========================

router.get("/categories", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.getCategories();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
}));

router.post("/categories", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const { name } = req.body || {};
    const result = await appService.createCategory(name, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.put("/categories/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { name } = req.body || {};
    const result = await appService.updateCategory(id, name, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.delete("/categories/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteCategory(id, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));


// ==========================
// Admin: Zones CRUD
// ==========================

router.get("/zones", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.getZones();

    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
}));

router.post("/zones", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const { name, categoryId } = req.body || {};
    const result = await appService.createZone(name, categoryId, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

// Update zone (rename and/or assign to category)
router.put("/zones/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const patch = req.body; // { name?, categoryId? }
    const result = await appService.updateZone(id, patch, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.delete("/zones/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteZone(id, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));


// ==========================
// Admin: Users CRUD
// ==========================

router.get("/users", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const result = await appService.getUsers();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
}));

router.post("/users", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const { username, password, role, label, tag } = req.body || {};
    const result = await appService.createUser({ username, password, role, label, tag }, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.put("/users/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const patch = req.body; // { username?, password?, role?, label?, tag? }
    const result = await appService.updateUser(id, patch, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.delete("/users/:id", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteUser(id, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));


// ==========================
// Admin: User ⇄ Zones Assignment
// ==========================

router.get("/users/:id/zones", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const result = await appService.getUserZones(id);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));

router.put("/users/:id/zones", requireAuth, requireAdminUnlocked, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { zoneIds } = req.body || {}; // { zoneIds: [1,2,3] }
    const result = await appService.setUserZones(id, zoneIds, req.user);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
}));


// ==========================
// User UI: Filtered Category→Zones→Devices tree
// ==========================

router.get("/user-tree", requireAuth, asyncHandler(async (req, res) => {
    const result = await appService.getUserTree(req.user);
    return res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
}));


export default router;