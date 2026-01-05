import logger from "../3-utilities/logger.js";

// Central error middleware.
// Keeps routes/services clean and ensures we never crash on unhandled async errors.

export function errorMiddleware(err, req, res, next) {
  try {
    const status = Number(err?.status) || 500;
    const message = err?.message || "Server error";

    logger(`[ERROR] ${req?.method} ${req?.originalUrl} -> ${status}: ${message}`, "red");

    if (res.headersSent) return next(err);

    // API responses
    if (req?.originalUrl?.startsWith("/api")) {
      return res.status(status).json({ ok: false, message });
    }

    // Fallback for page requests
    return res.status(status).send("Server error");
  } catch (e) {
    // Last resort: never crash
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Server error" });
    }
    return next(e);
  }
}
