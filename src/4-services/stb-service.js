import parsePcap from "../3-utilities/pcap-parser.js";
import sqlService from "./sql-service.js";

class StbService {

    async addNewStb(pcapPath, name) {
        const device = await parsePcap(pcapPath); // { ip, port, blob }
        device.name = name;
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

}


const stbService = new StbService();

export default stbService;