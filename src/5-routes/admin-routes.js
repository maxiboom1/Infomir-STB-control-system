import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import stbService from "../4-services/stb-service.js";

const router = express.Router();

// Put uploads in project root (recommended for POC)
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

// Get http://serverAddr:3000/api/get-devices
router.get("/get-devices", async (req, res) => {
  const devices = await stbService.getAllStb();
  res.json({ ok: true, devices });
});


router.post("/upload-pcap", upload.single("pcap"), async (req, res) => {

  if (!req.file) return res.status(400).json({ ok: false, message: "No file uploaded" });

  const name = (req.body?.name || "").trim();
  console.log(name);
  if (!name) return res.status(400).json({ ok: false, message: "Missing device name" });

  const result = await stbService.addNewStb(req.file.path, name);

  return res.status(result.status || 200).json({
    ok: result.ok,
    message: result.message,
  });
});

export default router;
