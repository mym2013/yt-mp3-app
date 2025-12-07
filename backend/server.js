// backend/server.js
"use strict";

const express = require("express");
const { checkEnv } = require("./helpers/check-env");
const { downloadAudio } = require("./helpers/downloader");
const { compressMp3IfNeeded } = require("./helpers/ffmpeg-tools");

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Verificar entorno antes de levantar el servidor
try {
    checkEnv();
} catch (err) {
    console.error("[FATAL] Falló la verificación de entorno.");
    console.error(err.message);
    process.exit(1); // Salir con error si falta ffmpeg o yt-dlp
}

// 2) Middlewares
app.use(express.json());

// 3) Ruta básica de prueba (GET /)
app.get("/", (req, res) => {
    res
        .status(200)
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("Servidor base YouTube → MP3 activo.\n");
});

// 4) Ruta principal de conversión: YouTube URL → MP3 (con compresión opcional)
app.post("/convert", async (req, res) => {
    try {
        const { url, maxSizeMB } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: "Falta el campo 'url' en el cuerpo de la petición",
            });
        }

        // 1) Descargar audio con yt-dlp
        const downloadResult = await downloadAudio(url);
        // { filePath, fileName, sizeBytes, logs }

        // 2) Comprimir si es necesario (por defecto 25 MB si no se envía otro valor)
        const compressResult = await compressMp3IfNeeded({
            filePath: downloadResult.filePath,
            sizeBytes: downloadResult.sizeBytes,
            maxSizeMB: maxSizeMB || 25,
        });
        // { compressed, filePath, fileName, sizeBytes, logs }

        return res.json({
            success: true,
            original: {
                fileName: downloadResult.fileName,
                sizeBytes: downloadResult.sizeBytes,
            },
            final: {
                fileName: compressResult.fileName,
                filePath: compressResult.filePath,
                sizeBytes: compressResult.sizeBytes,
                compressed: compressResult.compressed,
            },
            logs: {
                downloader: downloadResult.logs,
                ffmpeg: compressResult.logs,
            },
        });
    } catch (err) {
        console.error("Error en /convert:", err);

        // Si viene en formato { error, logs } desde los helpers
        if (err && err.error) {
            return res.status(500).json({
                success: false,
                error: err.error.message || "Error en conversión",
                logs: err.logs || null,
            });
        }

        // Error genérico
        return res.status(500).json({
            success: false,
            error: err.message || "Error interno en /convert",
        });
    }
});

// 5) Levantar servidor
app.listen(PORT, () => {
    console.log(`Servidor base escuchando en http://localhost:${PORT}`);
});
