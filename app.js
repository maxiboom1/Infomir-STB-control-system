import express from "express";
import routes from "./src/5-routes/routes.js";
import appConfig from "./src/3-utilities/app-config.js";
import logMessages from "./src/3-utilities/logger-messages.js";
import { requirePageAuth } from "./src/2-middleware/auth-middleware.js";
import { errorMiddleware } from "./src/2-middleware/error-middleware.js";
import { getInternalPath } from "./src/3-utilities/runtime-paths.js";
import logger from "./src/3-utilities/logger.js";
import { pauseThenExitIfNeeded } from "./src/3-utilities/pause-console.js";

const app = express();

// Allow snapshot imports (JSON) without hitting the default 100kb limit.
app.use(express.json({ limit: "2mb" }));
app.use("/api", routes);

// Static (only login + assets)
app.use(express.static(getInternalPath("webpage", "public")));

// Root: must be logged in, then choose page by role
app.get("/", requirePageAuth, (req, res) => {
  const file = (req.user?.role === "admin")
    ? getInternalPath("webpage", "application", "admin.html")
    : getInternalPath("webpage", "application", "user.html");

  res.sendFile(file);
});

// Central error handler (must be last)
app.use(errorMiddleware);

// Do not crash silently on unhandled errors
process.on("unhandledRejection", (reason) => {
  try {
    const msg = (reason instanceof Error)
      ? `${reason.name}: ${reason.message}`
      : String(reason);
    logger(`[FATAL] Unhandled rejection: ${msg}`, "red");
    if (reason?.stack) logger(String(reason.stack), "dimmed");
  } catch {}
  pauseThenExitIfNeeded(1, "\nMAG Control stopped due to a fatal error.");
});

process.on("uncaughtException", (err) => {
  try {
    const msg = (err instanceof Error)
      ? `${err.name}: ${err.message}`
      : String(err);
    logger(`[FATAL] Uncaught exception: ${msg}`, "red");
    if (err?.stack) logger(String(err.stack), "dimmed");
  } catch {}
  pauseThenExitIfNeeded(1, "\nMAG Control stopped due to a fatal error.");
});

app.listen(appConfig.appPort, () => { logMessages.appLoadedMessage(); });
