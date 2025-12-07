// Ruta: backend/helpers/downloader.js

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "output");

/**
 * downloadAudio(url)
 * Descarga el audio de un video de YouTube como MP3 usando yt-dlp (vía spawn).
 * Devuelve:
 *  - filePath: ruta completa del MP3
 *  - fileName: nombre del archivo MP3
 *  - sizeBytes: tamaño en bytes
 *  - logs: { stdout: string[], stderr: string[], command: string, exitCode: number }
 */
function downloadAudio(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            return reject(new Error("URL de YouTube requerida"));
        }

        // Asegurar que exista la carpeta de salida
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        const logs = {
            stdout: [],
            stderr: [],
            command: "",
            exitCode: null,
        };

        // Usamos un nombre de archivo controlado (sin caracteres raros del título)
        const timestamp = Date.now();
        const filenameBase = `yt-audio-${timestamp}`;
        const outputTemplate = path.join(OUTPUT_DIR, `${filenameBase}.%(ext)s`);

        const args = [
            url,
            "-x", // extraer solo audio
            "--audio-format",
            "mp3", // convertir a mp3
            "-o",
            outputTemplate, // plantilla de salida
        ];

        logs.command = `yt-dlp ${args.join(" ")}`;

        const yt = spawn("yt-dlp", args, {
            shell: false, // más seguro que usar un shell
        });

        yt.stdout.on("data", (data) => {
            logs.stdout.push(data.toString());
        });

        yt.stderr.on("data", (data) => {
            logs.stderr.push(data.toString());
        });

        yt.on("error", (err) => {
            logs.exitCode = -1;
            reject({ error: err, logs });
        });

        yt.on("close", (code) => {
            logs.exitCode = code;

            if (code !== 0) {
                return reject({
                    error: new Error(`yt-dlp terminó con código ${code}`),
                    logs,
                });
            }

            // yt-dlp creará el MP3 con la extensión correcta
            const finalPath = path.join(OUTPUT_DIR, `${filenameBase}.mp3`);

            fs.stat(finalPath, (err, stats) => {
                if (err) {
                    return reject({
                        error: new Error(
                            `No se encontró el archivo de salida esperado: ${finalPath}`
                        ),
                        logs,
                    });
                }

                resolve({
                    filePath: finalPath,
                    fileName: path.basename(finalPath),
                    sizeBytes: stats.size,
                    logs,
                });
            });
        });
    });
}

module.exports = {
    downloadAudio,
    OUTPUT_DIR,
};
