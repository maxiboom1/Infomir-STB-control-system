import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import appConfig from "../3-utilities/app-config.js";
import sqlService from "./sql-service.js";

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
    // If you want "delete on browser close", do NOT set maxAge/expires.
    // If you want persistent 30 min cookie, uncomment maxAge below.
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // set true behind HTTPS
        // maxAge: EXPIRES_MIN * 60 * 1000,
        path: "/",
    });
}

function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
}

function getTokenFromRequest(req) {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;

    return bearer || parseCookie(req, COOKIE_NAME);
}

function verifyToken(token) {
    if (!JWT_SECRET) throw new Error("jwtSecret missing in config.json");
    return jwt.verify(token, JWT_SECRET);
}

async function validateCredentials(username, password) {
    const user = await sqlService.getUserByUsername(username);
    if (!user) return null;

    const stored = String(user.password || "");
    let passOk = false;

    // Support bcrypt hashes and legacy plaintext (bootstrap only)
    if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
        passOk = await bcrypt.compare(password, stored);
    } else {
        passOk = (password === stored);
    }

    if (!passOk) return null;
    return user;
}

function signToken(user) {
    if (!JWT_SECRET) throw new Error("jwtSecret missing in config.json");

    const payload = {
        uid: user.id,
        username: user.username,
        role: user.role, // "admin" | "operator"
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: `${EXPIRES_MIN}m` });
}

async function login(res, username, password) {
    const u = String(username || "").trim();
    const p = String(password || "");

    if (!u || !p) {
        return { ok: false, status: 400, message: "Missing username/password" };
    }

    const user = await validateCredentials(u, p);
    if (!user) {
        return { ok: false, status: 401, message: "Invalid credentials" };
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return { ok: true, role: user.role };
}

function logout(res) {
    clearAuthCookie(res);
    return { ok: true };
}

function getMe(req) {
    const token = getTokenFromRequest(req);
    if (!token) return { ok: false, status: 401 };

    try {
        const decoded = verifyToken(token);
        return { ok: true, user: decoded };
    } catch {
        return { ok: false, status: 401 };
    }
}

export default {
    // constants 
    COOKIE_NAME,
    EXPIRES_MIN,

    // cookie helpers
    setAuthCookie,
    clearAuthCookie,

    // token helpers
    getTokenFromRequest,
    verifyToken,

    // high level actions
    login,
    logout,
    getMe,
};
