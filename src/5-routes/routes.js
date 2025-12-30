import express from "express";
import appService from "../4-services/app-service.js";
import authRoutes from "./auth.js"; 
import { requireAuth, requireAdmin } from "../2-middleware/auth-middleware.js";



const router = express.Router();
router.use("/auth", authRoutes); // Need to relocate to app.js

router.post("/send", requireAuth, async (req, res) => {
    const data = req.body;
    const deviceId = data.deviceId;
    const cmd = String(data.command).toUpperCase();
    const result = await appService.sendCommand(deviceId, cmd);
    res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
});

router.get("/get-devices", requireAuth, async (req, res) => {
    const devices = await appService.getAllStb();
    res.json({ ok: true, devices });
});


router.post("/add-device",requireAuth, requireAdmin, async (req, res) => {
    const device = req.body; // { name, ip, categoryId, zoneId }
    const result = await appService.addNewStb(device);
    if (!result.ok) { //{ ok:false, status:409, message:"..." }
      return res.status(result.status || 400).json(result);
    }
  
    return res.json(result); // { ok:true, id, message }
});

// ==========================
// Admin: Devices CRUD extras
// ==========================

router.get("/devices-detailed", requireAuth, requireAdmin, async (req, res) => {
    const result = await appService.getAllDevicesDetailed();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
});

router.put("/device/:id", requireAuth, requireAdmin, async (req, res) => {
    const deviceId = req.params.id;
    const patch = req.body; // { name?, ip?, categoryId?, zoneId?, isOnline?, tag?, label? }
    const result = await appService.updateStb(deviceId, patch);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.delete("/device/:id", requireAuth, requireAdmin, async (req, res) => {
    const deviceId = req.params.id;
    const result = await appService.deleteStb(deviceId);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});


// ==========================
// Admin: Categories CRUD
// ==========================

router.get("/categories", requireAuth, requireAdmin, async (req, res) => {
    const result = await appService.getCategories();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
});

router.post("/categories", requireAuth, requireAdmin, async (req, res) => {
    const { name } = req.body || {};
    const result = await appService.createCategory(name);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.put("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { name } = req.body || {};
    const result = await appService.updateCategory(id, name);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.delete("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteCategory(id);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});


// ==========================
// Admin: Zones CRUD
// ==========================

router.get("/zones", requireAuth, requireAdmin, async (req, res) => {
    const result = await appService.getZones();

    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
});

router.post("/zones", requireAuth, requireAdmin, async (req, res) => {
    const { name, categoryId } = req.body || {};
    const result = await appService.createZone(name, categoryId);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

// Update zone (rename and/or assign to category)
router.put("/zones/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const patch = req.body; // { name?, categoryId? }
    const result = await appService.updateZone(id, patch);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.delete("/zones/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteZone(id);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});


// ==========================
// Admin: Users CRUD
// ==========================

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
    const result = await appService.getUsers();
    if (!result.ok) {
        return res.status(result.status || 500).json(result);
    }
    return res.json(result);
});

router.post("/users", requireAuth, requireAdmin, async (req, res) => {
    const { username, password } = req.body || {};
    const result = await appService.createUser({ username, password });
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.put("/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const patch = req.body; // { username?, password? }
    const result = await appService.updateUser(id, patch);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await appService.deleteUser(id);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});


// ==========================
// Admin: User ⇄ Zones Assignment
// ==========================

router.get("/users/:id/zones", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await appService.getUserZones(id);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});

router.put("/users/:id/zones", requireAuth, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { zoneIds } = req.body || {}; // { zoneIds: [1,2,3] }
    const result = await appService.setUserZones(id, zoneIds);
    if (!result.ok) {
        return res.status(result.status || 400).json(result);
    }
    return res.json(result);
});


export default router;