const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const lines = sql.split('\n');
console.log(`Verificando archivo SQL: ${sqlPath}`);
console.log(`Líneas totales: ${lines.length}`);

// Validar que contiene todas las sentencias clave
const checks = [
    'CREATE DATABASE IF NOT EXISTS `sentinelpro_iam`',
    'USE `sentinelpro_iam`;',
    'CREATE TABLE `configuracion_empresa`',
    'CREATE TABLE `turnos_laborales`',
    'CREATE TABLE `zonas_acceso`',
    'CREATE TABLE `trabajadores`',
    'CREATE TABLE `registros_acceso`',
    'CREATE TABLE `visitantes`',
    'CREATE TABLE `incidencias_acceso`',
    'CREATE TABLE `permisos_catalogo`',
    'CREATE TABLE `roles_sistema`',
    'CREATE TABLE `usuarios`',
    'CREATE TABLE `usuario_permisos_individuales`',
    'CREATE TABLE `sesiones_activas`',
    'CREATE TABLE `audit_logs`',
    'INSERT INTO `configuracion_empresa`',
    'INSERT INTO `turnos_laborales`',
    'INSERT INTO `zonas_acceso`',
    'INSERT INTO `trabajadores`',
    'INSERT INTO `registros_acceso`',
    'INSERT INTO `visitantes`',
    'INSERT INTO `incidencias_acceso`',
    'INSERT INTO `permisos_catalogo`',
    'INSERT INTO `roles_sistema`',
    'INSERT INTO `usuarios`',
    'INSERT INTO `usuario_permisos_individuales`',
    'INSERT INTO `audit_logs`'
];

let allOk = true;
checks.forEach(check => {
    if (sql.includes(check)) {
        console.log(`  ✅ Verificado: ${check.slice(0, 45)}...`);
    } else {
        console.error(`  ❌ Falta sentencia: ${check}`);
        allOk = false;
    }
});

if (allOk) {
    console.log("\n🎉 El archivo SQL contiene todas las 13 tablas relacionales y todas las inserciones de datos iniciales listas para importar.");
} else {
    process.exit(1);
}
