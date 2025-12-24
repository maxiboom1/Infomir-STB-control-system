import express from "express";
import stbService from "../4-services/stb-service.js";

const router = express.Router();

// Get http://serverAddr:3000/api/get-devices
router.get("/get-devices", async (req, res) => {
  const devices = await stbService.getAllStb();
  res.json({ ok: true, devices });
});


export default router;
