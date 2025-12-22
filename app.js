import express from "express";
import routes from "./src/5-routes/routes.js";
import appConfig from "./src/3-utilities/app-config.js";
import logMessages from "./src/3-utilities/logger-messages.js";


const app = express(); 

app.use("/api",routes);

// Static server http://localhost:3000
app.use(express.static('public')); 

app.listen(appConfig.appPort, () => {logMessages.appLoadedMessage()});