// backend/helpers/check-env.js
'use strict';

const { spawnSync } = require('child_process');

/**
 * Ejecuta un comando de forma síncrona para verificar si existe en el PATH.
 * Devuelve un objeto con:
 *  - ok: boolean
 *  - name: nombre de la herramienta
 *  - message: detalle de error/estado
 */
function checkCommand(name, args = ['-version']) {
    const result = spawnSync(name, args, { encoding: 'utf-8' });

    if (result.error) {
        if (result.error.code === 'ENOENT') {
            return {
                ok: false,
                name,
                message: `El comando "${name}" no se encontró en el PATH.`,
            };
        }

        return {
            ok: false,
            name,
            message: `Error al ejecutar "${name}": ${result.error.message}`,
        };
    }

    if (typeof result.status === 'number' && result.status !== 0) {
        return {
            ok: false,
            name,
            message: `El comando "${name}" se ejecutó con código ${result.status}.`,
        };
    }

    return {
        ok: true,
        name,
        message: `Comando "${name}" disponible.`,
    };
}

/**
 * Verifica que ffmpeg y yt-dlp estén disponibles en el PATH.
 * Lanza Error si falta alguno.
 */
function checkEnv() {
    const tools = [
        { name: 'ffmpeg', args: ['-version'] },
        { name: 'yt-dlp', args: ['--version'] },
    ];

    const results = tools.map(tool => checkCommand(tool.name, tool.args));

    const missing = results.filter(r => !r.ok);

    results.forEach(r => {
        if (r.ok) {
            console.log(`[OK] ${r.message}`);
        } else {
            console.error(`[ERROR] ${r.message}`);
        }
    });

    if (missing.length > 0) {
        const names = missing.map(m => m.name).join(', ');
        throw new Error(
            `Entorno incompleto: faltan herramientas requeridas (${names}).`
        );
    }

    console.log('Entorno listo: ffmpeg y yt-dlp disponibles en el PATH.');
}

module.exports = {
    checkEnv,
};
