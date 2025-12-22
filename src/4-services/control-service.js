// 4-services/sql-service.js
import logger from "../3-utilities/logger.js";
import sqlService from "./sql-service.js";
import commands from "../0-models/rc-commands.js";
import { magSendOnce } from "../1-dal/tcp-client.js";
import protocolCommands from "../0-models/protocol-commands.js";


class ControlService {

    async sendCommand(deviceId, command){
        const device = await sqlService.getDeviceById(deviceId);
        const keymap = JSON.parse(device.keymap);
        const hexPayload = device.blob + keymap[command];
        const connectHex = protocolCommands.connectReqHex;
        await magSendOnce(device.ip, device.port, connectHex, hexPayload);
        return {ok:true};
    }
}

const controlService = new ControlService();
export default controlService;
