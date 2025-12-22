import express from "express";
import controlService from "../4-services/control-service.js";


const router = express.Router();

router.post("/send", async (req, res) => {
    const data = req.body;
    const deviceId = data.deviceId;
    const cmd = String(data.command).toUpperCase();
    const result = await controlService.sendCommand(deviceId, cmd);
    res.status(result?.ok ? 200 : (result?.status || 500)).json(result);
});

export default router;