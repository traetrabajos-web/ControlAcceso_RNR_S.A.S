const mysql = require('mysql2/promise');
const { verifyPassword, hashPassword } = require('../server/security');

async function test() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'sentinelpro_iam'
        });
        const [users] = await conn.query('SELECT id, email, password_hash FROM usuarios');
        console.log('Verificando contraseñas en MySQL:');
        for (const u of users) {
            console.log(u.email, 'admin123:', verifyPassword('admin123', u.password_hash));
        }
        await conn.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
