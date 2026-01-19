import { Client } from "ssh2";

class SshService {

    constructor(){
        // per-host busy flag (drop commands while busy)
        this._busyByHost = new Map();
    }

    exec(args) {
        const { host, port, username, password, cmd } = args || {};
        const readyTimeout = args?.readyTimeout ?? 4000;
        
        if (!host) throw new Error("SshService.exec: missing host ip");
        if (!port) throw new Error("SshService.exec: missing port");
        if (!username) throw new Error("SshService.exec: missing user");
        if (password === undefined || password === null) throw new Error("SshService.exec: missing password");
        if (!cmd) throw new Error("SshService.exec: missing cmd");
        const key = `${host}:${port}:${username}`;
        if (this._busyByHost.get(key)) {
            // Drop command when device connection is busy (no queue for now)
            return Promise.resolve({ busy: true, stdout: "", stderr: "", code: null, signal: null });
        }
        this._busyByHost.set(key, true);

        return new Promise((resolve, reject) => {
            const conn = new Client();
            let settled = false;
          
            const clearBusy = () => {
              this._busyByHost.delete(key);
            };
          
            const done = (err, result) => {
              if (settled) return;
              settled = true;
              clearBusy(); // ✅ always release busy flag
              try { conn.end(); } catch {}
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

    /**
     * Execute a series of commands over a single SSH connection (used for macros).
     * Each step: { cmd: string, delayAfterMs?: number }
     * Busy-drop is enforced per-host for the entire series.
     */
    execSeries(args) {
        const { host, port, username, password } = args || {};
        const steps = Array.isArray(args?.steps) ? args.steps : [];
        const connectReadyTimeout = args?.readyTimeout ?? 4000;
        const seriesTimeoutMs = args?.seriesTimeoutMs ?? 20000;

        if (!host) throw new Error("SshService.execSeries: missing host ip");
        if (!port) throw new Error("SshService.execSeries: missing port");
        if (!username) throw new Error("SshService.execSeries: missing user");
        if (password === undefined || password === null) throw new Error("SshService.execSeries: missing password");
        if (!steps.length) throw new Error("SshService.execSeries: missing steps");

        const key = `${host}:${port}:${username}`;
        if (this._busyByHost.get(key)) {
            return Promise.resolve({ busy: true, results: [] });
        }
        this._busyByHost.set(key, true);

        return new Promise((resolve, reject) => {
            const conn = new Client();
            let settled = false;

            const clearBusy = () => {
                this._busyByHost.delete(key);
            };

            const done = (err, result) => {
                if (settled) return;
                settled = true;
                clearBusy();
                try { conn.end(); } catch {}
                if (err) reject(err);
                else resolve(result);
            };

            const timer = setTimeout(() => {
                done(new Error(`SSH series timeout after ${seriesTimeoutMs}ms (${host}:${port})`));
            }, seriesTimeoutMs);

            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            const execOne = (cmd) => new Promise((resExec, rejExec) => {
                conn.exec(cmd, (err, stream) => {
                    if (err) return rejExec(err);
                    let stdout = "";
                    let stderr = "";
                    stream.on("data", (d) => (stdout += d.toString()));
                    stream.stderr.on("data", (d) => (stderr += d.toString()));
                    stream.on("close", (code, signal) => {
                        resExec({ stdout, stderr, code: typeof code === "number" ? code : null, signal: signal ?? null });
                    });
                });
            });

            conn
                .on("ready", async () => {
                    try {
                        const results = [];
                        for (const step of steps) {
                            const cmd = step?.cmd;
                            if (!cmd) continue;
                            const r = await execOne(cmd);
                            results.push(r);
                            const wait = Number(step?.delayAfterMs ?? 0);
                            if (wait > 0) await sleep(wait);
                        }
                        clearTimeout(timer);
                        done(null, { results });
                    } catch (err) {
                        clearTimeout(timer);
                        done(err);
                    }
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
                    readyTimeout: connectReadyTimeout,
                    hostVerifier: () => true,
                });
        });
    }
}

const sshService = new SshService();
export default sshService;
