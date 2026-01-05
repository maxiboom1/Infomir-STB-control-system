import express from "express";
import routes from "./src/5-routes/routes.js";
import appConfig from "./src/3-utilities/app-config.js";
import logMessages from "./src/3-utilities/logger-messages.js";
import { requirePageAuth } from "./src/2-middleware/auth-middleware.js";
import { errorMiddleware } from "./src/2-middleware/error-middleware.js";
import { getInternalPath } from "./src/3-utilities/runtime-paths.js";

const app = express();

app.use(express.json());
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
  try { console.error("[UNHANDLED REJECTION]", reason); } catch {}
});

process.on("uncaughtException", (err) => {
  try { console.error("[UNCAUGHT EXCEPTION]", err); } catch {}
});

app.listen(appConfig.appPort, () => { logMessages.appLoadedMessage(); });
