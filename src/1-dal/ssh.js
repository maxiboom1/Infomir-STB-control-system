import { Client } from "ssh2";

class SshService {

    exec(args) {
        const { host, port, username, password, cmd } = args || {};
        const readyTimeout = args?.readyTimeout ?? 4000;
        
        if (!host) throw new Error("SshService.exec: missing host ip");
        if (!port) throw new Error("SshService.exec: missing port");
        if (!username) throw new Error("SshService.exec: missing user");
        if (password === undefined || password === null) throw new Error("SshService.exec: missing password");
        if (!cmd) throw new Error("SshService.exec: missing cmd");

        return new Promise((resolve, reject) => {
            const conn = new Client();
            let settled = false;

            const done = (err, result) => {
                if (settled) return;
                settled = true;
                try { conn.end(); } catch { }
                if (err) reject(err);
                else resolve(result);
            };

            const timer = setTimeout(() => {
                done(new Error(`SSH exec timeout after ${readyTimeout}ms (${host}:${port})`));
            }, readyTimeout);

            conn
                .on("ready", () => {
                    conn.exec(cmd, (err, stream) => {
                        if (err) {
                            clearTimeout(timer);
                            return done(err);
                        }

                        let stdout = "";
                        let stderr = "";

                        stream.on("data", (d) => (stdout += d.toString()));
                        stream.stderr.on("data", (d) => (stderr += d.toString()));

                        stream.on("close", (code, signal) => {
                            clearTimeout(timer);
                            done(null, {
                                stdout,
                                stderr,
                                code: typeof code === "number" ? code : null,
                                signal: signal ?? null,
                            });
                        });
                    });
                })
                .on("error", (err) => {
                    clearTimeout(timer);
                    done(err);
                })
                .connect({
                    host,
                    port,
                    username,
                    password,
                    readyTimeout,
                    hostVerifier: () => true,
                });
        });
    }
}

const sshService = new SshService();
export default sshService;
