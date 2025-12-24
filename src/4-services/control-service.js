// 4-services/sql-service.js
import sqlService from "./sql-service.js";


class ControlService {

    async sendCommand(deviceId, command){
        const device = await sqlService.getDeviceById(deviceId);

    }
}

const controlService = new ControlService();
export default controlService;
