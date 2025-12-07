// Ruta: backend/helpers/ffmpeg-tools.js

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * compressMp3IfNeeded(options)
 *
 * Recibe:
 *  - filePath: ruta completa del MP3 original
 *  - sizeBytes: tamaño actual en bytes
 *  - maxSizeMB: límite en MB (por defecto 25)
 *
 * Lógica:
 *  - Si el archivo ya es <= maxSizeMB → no comprime, devuelve el original.
 *  - Si es mayor → ejecuta ffmpeg para generar un MP3 comprimido
 *    con menor bitrate y devuelve los datos del nuevo archivo.
 *
 * Devuelve (Promise):
 *  {
 *    compressed: boolean,
 *    filePath: string,
 *    fileName: string,
 *    sizeBytes: number,
 *    logs: { stdout: string[], stderr: string[], command: string, exitCode: number } | null
 *  }
 */
function compressMp3IfNeeded({ filePath, sizeBytes, maxSizeMB = 25 }) {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            return reject(new Error("filePath requerido para compresión"));
        }

        if (!sizeBytes || typeof sizeBytes !== "number") {
            return reject(new Error("sizeBytes inválido o no proporcionado"));
        }

        const sizeMB = sizeBytes / (1024 * 1024);

        // Si ya está por debajo del límite, devolvemos tal cual
        if (sizeMB <= maxSizeMB) {
            return resolve({
                compressed: false,
                filePath,
                fileName: path.basename(filePath),
                sizeBytes,
                logs: null,
            });
        }

        // Si supera el límite, procedemos a comprimir
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath); // .mp3
        const base = path.basename(filePath, ext);

        const compressedName = `${base}-compressed${ext}`;
        const compressedPath = path.join(dir, compressedName);

        const logs = {
            stdout: [],
            stderr: [],
            command: "",
            exitCode: null,
        };

        // Comando ffmpeg:
        // ffmpeg -y -i input.mp3 -vn -acodec libmp3lame -b:a 96k output-compressed.mp3
        const args = [
            "-y", // sobrescribir sin preguntar
            "-i",
            filePath,
            "-vn", // sin vídeo
            "-acodec",
            "libmp3lame",
            "-b:a",
            "96k", // bitrate de audio más bajo → archivo más pequeño
            compressedPath,
        ];

        logs.command = `ffmpeg ${args.join(" ")}`;

        const ff = spawn("ffmpeg", args, {
            shell: false,
        });

        ff.stdout.on("data", (data) => {
            logs.stdout.push(data.toString());
        });

        ff.stderr.on("data", (data) => {
            logs.stderr.push(data.toString());
        });

        ff.on("error", (err) => {
            logs.exitCode = -1;
            reject({ error: err, logs });
        });

        ff.on("close", (code) => {
            logs.exitCode = code;

            if (code !== 0) {
                return reject({
                    error: new Error(`ffmpeg terminó con código ${code}`),
                    logs,
                });
            }

            fs.stat(compressedPath, (err, stats) => {
                if (err) {
                    return reject({
                        error: new Error(
                            `No se encontró el archivo comprimido esperado: ${compressedPath}`
                        ),
                        logs,
                    });
                }

                resolve({
                    compressed: true,
                    filePath: compressedPath,
                    fileName: path.basename(compressedPath),
                    sizeBytes: stats.size,
                    logs,
                });
            });
        });
    });
}

module.exports = {
    compressMp3IfNeeded,
};
