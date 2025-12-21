import logger from "./logger.js";
import appConfig from "./app-config.js";

class Messages {

    appLoadedMessage(){
        console.clear();
        logger(`**********************************************************************`,"blue");
        logger(`[SYSTEM] Infomir_STB_control_system, App Version: ${appConfig.version}, now starting...`,"green");
        logger(`**********************************************************************`,"blue");
    }

}

const logMessages = new Messages();

export default logMessages;