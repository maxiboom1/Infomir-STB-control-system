import express from "express";
import authService from "../4-services/auth-service.js";
import { requireAuth, requireAdmin } from "../2-middleware/auth-middleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const result = await authService.login(res, username, password);

        if (!result.ok) {
            return res.status(result.status || 500).json({ ok: false, message: result.message || "Login error" });
        }

        return res.json({ ok: true, role: result.role, forcePasswordChange: !!result.forcePasswordChange });
    } catch {
        return res.status(500).json({ ok: false, message: "Login error" });
    }
});

router.post("/logout", (req, res) => {
    const result = authService.logout(res);
    return res.json(result);
});

router.get("/me", (req, res) => {
    // Note: async because we may query DB for admin default-password detection.
    Promise.resolve(authService.getMe(req)).then((result) => {
        if (!result.ok) return res.status(result.status || 401).json({ ok: false });
        return res.json({ ok: true, user: result.user, forcePasswordChange: !!result.forcePasswordChange });
    }).catch(() => res.status(401).json({ ok: false }));
});

// Admin password change (used for initial forced password update)
router.post("/change-admin-password", requireAuth, requireAdmin, async (req, res) => {
    try {
        const uid = req.user?.uid ?? req.user?.id;
        const { newPassword } = req.body || {};
        const result = await authService.changeAdminPassword(res, uid, newPassword);
        if (!result.ok) return res.status(result.status || 400).json({ ok: false, message: result.message || "Failed" });
        return res.json({ ok: true });
    } catch {
        return res.status(500).json({ ok: false, message: "Failed" });
    }
});

export default router;