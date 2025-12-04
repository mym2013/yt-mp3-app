// backend/server.js
'use strict';

const http = require('http');
const { checkEnv } = require('./helpers/check-env');

const PORT = process.env.PORT || 3000;

// 1) Verificar entorno antes de levantar el servidor
try {
    checkEnv();
} catch (err) {
    console.error('[FATAL] Falló la verificación de entorno.');
    console.error(err.message);
    process.exit(1); // Salir con error si falta ffmpeg o yt-dlp
}

// 2) Servidor HTTP mínimo
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Servidor base YouTube → MP3 activo.\n');
});

server.listen(PORT, () => {
    console.log(`Servidor base escuchando en http://localhost:${PORT}`);
});
