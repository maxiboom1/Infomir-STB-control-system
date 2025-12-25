import express from "express";
import appService from "../4-services/app-service.js";


const router = express.Router();


router.post("/send", async (req, res) => {
    const data = req.body;
    const deviceId = data.deviceId;
    const cmd = String(data.command).toUpperCase();
    const result = await appService.sendCommand(deviceId, cmd);
    res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
});


router.get("/get-devices", async (req, res) => {
    const devices = await appService.getAllStb();
    res.json({ ok: true, devices });
});


router.post("/add-device", async (req, res) => {
    const device = req.body; // { name, ip, categoryId, zoneId }
    const result = await appService.addNewStb(device);
    if (!result.ok) { //{ ok:false, status:409, message:"..." }
      return res.status(result.status || 400).json(result);
    }
  
    return res.json(result); // { ok:true, id, message }
  });

export default router;