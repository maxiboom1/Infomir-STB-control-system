import express from "express";
import authService from "../4-services/auth-service.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const result = await authService.login(res, username, password);

        if (!result.ok) {
            return res.status(result.status || 500).json({ ok: false, message: result.message || "Login error" });
        }

        return res.json({ ok: true, role: result.role });
    } catch {
        return res.status(500).json({ ok: false, message: "Login error" });
    }
});

router.post("/logout", (req, res) => {
    const result = authService.logout(res);
    return res.json(result);
});

router.get("/me", (req, res) => {
    const result = authService.getMe(req);
    if (!result.ok) return res.status(result.status || 401).json({ ok: false });
    return res.json({ ok: true, user: result.user });
});

export default router;