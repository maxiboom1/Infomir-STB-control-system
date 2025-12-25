import sqlService from "./sql-service.js";
import sshService from "../1-dal/ssh.js";
import constants from "../0-models/local-db.js";

class AppService {
    
    async addNewStb(device) { // Expected device { name, ip, categoryId, zoneId }
        
        try {
            const id = await sqlService.addNewDevice(device);
            return { ok: true, id, message: `Device added: ${device.name}` };
        } catch (err) {
            // Duplicate key errors in SQL Server: 2627 (unique constraint), 2601 (unique index)
            if (err?.number === 2627 || err?.number === 2601) {
                const msg = String(err?.message || "");
                const m = msg.match(/constraint '([^']+)'/i);
                const constraint = m?.[1] || "UNIQUE";

                return { ok: false, status: 409, message: `Device already exists (${constraint})` };
            }

            // other errors
            return { ok: false, status: 500, message: "SQL error" };
        }
    }

    async renameStb() {
        
    }

    async deleteStb() {
        
    }

    async getAllStb() {
        const stbs = await sqlService.getAllDevices();
        return stbs;
    }

    async sendCommand(deviceId, command) {
        try {
          const cmdKey = String(command || "").toUpperCase();
    
          const device = await sqlService.getDeviceById(deviceId);
          if (!device) return { ok: false, status: 404, message: `Device not found: ${deviceId}` };
          if (!device.ip) return { ok: false, status: 500, message: `Device has no IP: ${deviceId}` };
    
          const cmd = constants.commands[cmdKey];
          if (!cmd) return { ok: false, status: 400, message: `Unsupported command: ${cmdKey}` };
    
          const result = await sshService.exec({
            host: device.ip,
            port: constants.ssh.port,
            username: constants.ssh.username,
            password: constants.ssh.password,
            cmd,              
            readyTimeout: 4000,
          });
          //{ host, port, username, password, cmd }
          // sendqtevent often returns empty stdout; success is exit code 0 or null
          if (result?.code !== null && result.code !== 0) {
            return { ok: false, status: 500, message: `Command failed (exit ${result.code})`, ...result };
          }
    
          return { ok: true, message: `Sent ${cmdKey} to ${device.name} (${device.ip})`, ...result };
        } catch (err) {
          return { ok: false, status: 500, message: `Send failed: ${err.message}` };
        }
      }


}

const appService = new AppService();

export default appService;