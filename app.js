import express from "express";
import adminRoutes from "./src/5-routes/admin-routes.js";
import controlRoutes from "./src/5-routes/control-routes.js";
import appConfig from "./src/3-utilities/app-config.js";
import logMessages from "./src/3-utilities/logger-messages.js";

const app = express(); 

app.use(express.json());
app.use("/api",adminRoutes);
app.use("/control",controlRoutes);

// Static server http://localhost:3000
app.use(express.static('public')); 

app.listen(appConfig.appPort, () => {logMessages.appLoadedMessage()});