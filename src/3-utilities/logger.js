
/**
 * Logs a message to the console with an optional color.
 * 
 * @param {string} msg - The message to log.
 * @param {string} [color='white'] - The color to print the message in. 
 *                                   Supported colors: 'reset', 'bold', 'dim', 'underlined', 
 *                                   'blinking', 'reverse', 'hidden', 'strike', 'black', 'red', 
 *                                   'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'.
 *                                   If the color is not recognized, the message will be logged without any color.
 */
import { appendFileSync, mkdirSync } from "fs";
import path from "path";
import { getExternalPath } from "./runtime-paths.js";

let _logDirReady = false;

function ensureLogDir() {
    if (_logDirReady) return;
    const dir = getExternalPath("logs");
    mkdirSync(dir, { recursive: true });
    _logDirReady = true;
}

function getLogFilePath() {
    // YYYY-MM-DD.log
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return path.join(getExternalPath("logs"), `${y}-${m}-${d}.log`);
}

function logger(msg, color = "white"){
    ensureLogDir();

    const line = `${getCurrentDateTime()}  ${msg}`;

    // Console
    if (colors[color] === undefined) {
        console.log(line);
    } else {
        console.log(`${getCurrentDateTime()} ${colors[color]}%s${colors.reset}`, `${msg}`);
    }

    // File (plain text, no ANSI)
    try {
        appendFileSync(getLogFilePath(), line + "\n", "utf8");
    } catch {
        // do not crash app on logging failure
    }
}

function getCurrentDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
}

const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    underlined: "\x1b[4m",
    blinking: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    strike: "\x1b[9m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    dimmed: "\x1b[38;5;244m"
};

export default logger;