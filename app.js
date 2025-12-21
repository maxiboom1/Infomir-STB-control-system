import express from "express";
import routes from "./src/5-routes/routes.js";
import appProcessor from "./src/4-services/app-processor.js";
import appConfig from "./src/3-utilities/app-config.js";


const app = express(); 

app.use("/api",routes);

// Static server http://localhost:3000/plugin
app.use(express.static('public')); 

app.listen(appConfig.pluginPort, () => {
    appProcessor.initialize();
});