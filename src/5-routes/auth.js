import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import appConfig from "../3-utilities/app-config.js";
import sqlService from "../4-services/sql-service.js";

const router = express.Router();

const COOKIE_NAME = appConfig.jwtCookieName || "mag_auth";
const JWT_SECRET = appConfig.jwtSecret;
const EXPIRES_MIN = Number(appConfig.jwtExpiresMinutes || 30);

function parseCookie(req, name) {
    const header = req.headers.cookie;
    if (!header) return null;

    const parts = header.split(";").map((p) => p.trim());
    for (const part of parts) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        const k = part.slice(0, eq);
        const v = part.slice(eq + 1);
        if (k === name) return decodeURIComponent(v);
    }
    return null;
}

function setAuthCookie(res, token) {
    // Express has res.cookie() built-in
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // set true if you later run behind HTTPS
        path: "/",
    });
}

function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
}

router.post("/login", async (req, res) => {
    try {
        if (!JWT_SECRET) {
            return res.status(500).json({ ok: false, message: "jwtSecret missing in config.json" });
        }

        const { username, password } = req.body || {};
        const u = String(username || "").trim();
        const p = String(password || "");

        if (!u || !p) { return res.status(400).json({ ok: false, message: "Missing username/password" }); }

        const user = await sqlService.getUserByUsername(u);

        if (!user) { return res.status(401).json({ ok: false, message: "Invalid credentials" }); }

        const stored = String(user.password || "");
        let passOk = false;

        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            passOk = await bcrypt.compare(p, stored);
        } else {
            passOk = (p === stored);
        }

        if (!passOk) {
            return res.status(401).json({ ok: false, message: "Invalid credentials" });
        }

        const payload = {
            uid: user.id,
            username: user.username,
            role: user.role, // "admin" | "operator"
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${EXPIRES_MIN}m` });
        setAuthCookie(res, token);

        return res.json({ ok: true, role: user.role });
    } catch (err) {
        return res.status(500).json({ ok: false, message: "Login error" });
    }
});

router.post("/logout", async (req, res) => {
    clearAuthCookie(res);
    return res.json({ ok: true });
});

// Optional helper route (useful later)
router.get("/me", async (req, res) => {
    try {
        const token =
            parseCookie(req, COOKIE_NAME) ||
            (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

        if (!token) return res.status(401).json({ ok: false });

        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ ok: true, user: decoded });
    } catch {
        return res.status(401).json({ ok: false });
    }
});

export default router;
