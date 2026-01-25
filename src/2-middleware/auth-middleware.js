import jwt from "jsonwebtoken";
import appConfig from "../3-utilities/app-config.js";
import authService from "../4-services/auth-service.js";

const COOKIE_NAME = appConfig.jwtCookieName || "mag_auth";
const JWT_SECRET = appConfig.jwtSecret;

function getCookie(req, name) {
    const header = req.headers.cookie;
    if (!header) return null;

    const parts = header.split(";").map(p => p.trim());
    for (const part of parts) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        const k = part.slice(0, eq);
        const v = part.slice(eq + 1);
        if (k === name) return decodeURIComponent(v);
    }
    return null;
}

export function requireAuth(req, res, next) {
    try {
        const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
        const token = bearer || getCookie(req, COOKIE_NAME);
        if (!token) return res.status(401).json({ ok: false, message: "Unauthorized" });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
}

export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    next();
}

// Admin is authenticated but locked until default password is changed.
export async function requireAdminUnlocked(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    try {
        const uid = req.user?.uid ?? req.user?.id;
        const locked = await authService.isDefaultAdminPasswordByUserId(uid);
        if (locked) {
            return res.status(423).json({ ok: false, message: "Admin password must be changed", forcePasswordChange: true });
        }
        return next();
    } catch {
        return res.status(500).json({ ok: false, message: "Auth check failed" });
    }
}


export function attachUserFromToken(req, res, next) {
    // Non-blocking: if token exists and valid -> req.user
    // If no token/invalid -> req.user remains undefined
    try {
        const bearer = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;

        const token = bearer || getCookie(req, COOKIE_NAME);
        if (token) {
            req.user = jwt.verify(token, JWT_SECRET);
        }
    } catch {
        // ignore
    }
    next();
}

export function requirePageAuth(req, res, next) {
    // Blocking for HTML pages: redirect to login instead of JSON 401
    try {
        const bearer = req.headers.authorization?.startsWith("Bearer ")? req.headers.authorization.slice(7): null;

        const token = bearer || getCookie(req, COOKIE_NAME);
        if (!token) return res.redirect("/login.html");

        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.redirect("/login.html");
    }
}