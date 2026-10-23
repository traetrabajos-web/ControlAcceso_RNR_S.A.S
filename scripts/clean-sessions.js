const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function cleanSessions() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'sentinelpro_iam'
        });
        await pool.query('UPDATE sesiones_activas SET activa = 0');
        await pool.query("UPDATE usuarios SET politica_concurrencia = 'CERRAR_ANTERIOR', max_sesiones_simultaneas = 3");
        console.log('MySQL: sesiones inactivadas y politica_concurrencia configurada en CERRAR_ANTERIOR.');
        await pool.end();
    } catch (e) {
        console.warn('MySQL clean error:', e.message);
    }

    const dbPath = path.join(__dirname, '..', 'database', 'db.json');
    if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        db.sesiones_activas = [];
        if (Array.isArray(db.usuarios)) {
            db.usuarios.forEach(u => {
                u.politica_concurrencia = 'CERRAR_ANTERIOR';
                u.max_sesiones_simultaneas = 3;
            });
        }
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        console.log('db.json: sesiones vaciadas y usuarios actualizados.');
    }
}

cleanSessions();
