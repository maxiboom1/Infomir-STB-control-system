import express from "express";
import path from "path";
import routes from "./src/5-routes/routes.js";
import appConfig from "./src/3-utilities/app-config.js";
import logMessages from "./src/3-utilities/logger-messages.js";
import { requirePageAuth } from "./src/2-middleware/auth-middleware.js";

const app = express();

app.use(express.json());
app.use("/api", routes);

// Static (only login + assets)
app.use(express.static("webpage/public"));

// Root: must be logged in, then choose page by role
app.get("/", requirePageAuth, (req, res) => {
  const file = (req.user?.role === "admin")
    ? "webpage/application/admin.html"
    : "webpage/application/user.html";

  res.sendFile(path.resolve(file));
});

app.listen(appConfig.appPort, () => { logMessages.appLoadedMessage(); });
