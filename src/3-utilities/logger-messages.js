import logger from "./logger.js";
import appConfig from "./app-config.js";
import os from "os";

class Messages {

    appLoadedMessage(){
        console.clear();
        logger(`**********************************************************************`,"blue");
        logger(`[SYSTEM] Infomir_STB_control_system, App Version: ${appConfig.version}, now starting...`,"green");
        logger(`[SYSTEM] App is available on http://www.${getLanIPv4()}:${appConfig.appPort}`,"green");


        logger(`**********************************************************************`,"blue");
    }

}

function getLanIPv4() {
    const nets = os.networkInterfaces();
  
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Node 18: net.family can be 'IPv4' or 4 (depending on platform)
        const isIPv4 = net.family === "IPv4" || net.family === 4;
        if (isIPv4 && !net.internal) return net.address; // first non-internal IPv4
      }
    }
    return "localhost";
}

const logMessages = new Messages();

export default logMessages;