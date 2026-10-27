/**
 * Adaptador de Persistencia MySQL 8.0+ para SentinelPro Access & IAM
 * Empresa: Recuperaciones Naranjo Recycling S.A.S. (Cartagena de Indias)
 * Base de Datos Oficial: `sentinelpro_iam`
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sentinelpro_iam',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true
};

let pool = null;
let isConnected = false;

function getPool() {
    if (!pool) {
        pool = mysql.createPool(DB_CONFIG);
    }
    return pool;
}

async function testConnection() {
    try {
        const p = getPool();
        const [rows] = await p.query('SELECT 1 + 1 AS test');
        if (rows && rows[0] && rows[0].test === 2) {
            isConnected = true;
            console.log(`🗄️  Conectado exitosamente a MySQL: sentinelpro_iam (puerto ${DB_CONFIG.port})`);
            return true;
        }
    } catch (err) {
        isConnected = false;
        console.warn(`⚠️  Advertencia: No se pudo conectar a MySQL (${err.message}). Usando fallback en memoria/JSON.`);
        return false;
    }
    return false;
}

function isMySqlActive() {
    return isConnected;
}

// ---------------------------------------------------------------------------
// CONSULTAS DE TRABAJADORES Y PADRÓN
// ---------------------------------------------------------------------------
async function getTrabajadoresFromDb() {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            t.id, t.codigo_credencial, t.documento, t.nombres, t.apellidos, t.nombre_completo,
            t.cargo_id, t.cargo, t.departamento, t.tipo_personal, t.es_puesto_critico,
            t.turno_id, t.telefono, t.email, t.arl_vigente, t.estado, t.ubicacion_actual,
            DATE_FORMAT(t.ultima_entrada, '%Y-%m-%d %H:%i') as ultima_entrada,
            DATE_FORMAT(t.ultima_salida, '%Y-%m-%d %H:%i') as ultima_salida,
            t.foto_url
        FROM trabajadores t
        ORDER BY t.id ASC
    `);
    
    // Obtener zonas autorizadas por trabajador
    for (const trab of rows) {
        trab.es_puesto_critico = !!trab.es_puesto_critico;
        trab.arl_vigente = !!trab.arl_vigente;
        const [zonas] = await p.query(
            'SELECT zona_id FROM trabajador_zonas_autorizadas WHERE trabajador_id = ? AND nivel_permiso = "PERMITIDO"',
            [trab.id]
        );
        trab.zonas_autorizadas = zonas.map(z => Number(z.zona_id));
        if (trab.zonas_autorizadas.length === 0) {
            trab.zonas_autorizadas = [1];
        }
    }
    return rows;
}

async function findTrabajadorByIdent(ident) {
    const clean = String(ident || '').trim().toUpperCase();
    if (!clean) return null;
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            t.id, t.codigo_credencial, t.documento, t.nombres, t.apellidos, t.nombre_completo,
            t.cargo_id, t.cargo, t.departamento, t.tipo_personal, t.es_puesto_critico,
            t.turno_id, t.telefono, t.email, t.arl_vigente, t.estado, t.ubicacion_actual,
            DATE_FORMAT(t.ultima_entrada, '%Y-%m-%d %H:%i') as ultima_entrada,
            DATE_FORMAT(t.ultima_salida, '%Y-%m-%d %H:%i') as ultima_salida,
            t.foto_url
        FROM trabajadores t
        WHERE UPPER(t.documento) = ? OR UPPER(t.codigo_credencial) = ? OR t.id = ?
        LIMIT 1
    `, [clean, clean, Number(clean) || 0]);

    if (rows.length === 0) return null;
    const trab = rows[0];
    trab.es_puesto_critico = !!trab.es_puesto_critico;
    trab.arl_vigente = !!trab.arl_vigente;
    
    const [zonas] = await p.query(
        'SELECT zona_id FROM trabajador_zonas_autorizadas WHERE trabajador_id = ? AND nivel_permiso = "PERMITIDO"',
        [trab.id]
    );
    trab.zonas_autorizadas = zonas.map(z => Number(z.zona_id));
    if (trab.zonas_autorizadas.length === 0) {
        trab.zonas_autorizadas = [1];
    }
    return trab;
}

async function updateTrabajadorUbicacion(id, ubicacion, ultimaEntrada = null, ultimaSalida = null) {
    const p = getPool();
    let query = 'UPDATE trabajadores SET ubicacion_actual = ?';
    const params = [ubicacion];
    if (ultimaEntrada) {
        query += ', ultima_entrada = ?';
        params.push(ultimaEntrada);
    }
    if (ultimaSalida) {
        query += ', ultima_salida = ?';
        params.push(ultimaSalida);
    }
    query += ' WHERE id = ?';
    params.push(id);
    await p.query(query, params);
}

// ---------------------------------------------------------------------------
// REGISTROS DE ACCESO (FICHAJES KIOSCO Y PORTERÍA)
// ---------------------------------------------------------------------------
async function getRegistrosAccesoFromDb(limit = 100) {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            id, codigo_movimiento, trabajador_id, codigo_credencial, documento,
            trabajador_nombre, departamento, zona_id, zona_nombre,
            DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
            TIME_FORMAT(hora_entrada, '%H:%i') as hora_entrada,
            TIME_FORMAT(hora_salida, '%H:%i') as hora_salida,
            estado_asistencia, minutos_tardanza, estado_ciclo,
            minutos_trabajados, horas_formateadas, metodo_identificacion,
            registrado_por_email, registrado_por_nombre, observacion
        FROM registros_acceso
        ORDER BY id DESC
        LIMIT ?
    `, [limit]);
    return rows;
}

async function createRegistroAccesoInDb(reg) {
    const p = getPool();
    const [res] = await p.query(`
        INSERT INTO registros_acceso 
        (codigo_movimiento, trabajador_id, codigo_credencial, documento, trabajador_nombre, departamento, zona_id, zona_nombre, fecha, hora_entrada, hora_salida, estado_asistencia, minutos_tardanza, estado_ciclo, minutos_trabajados, horas_formateadas, metodo_identificacion, registrado_por_email, registrado_por_nombre, observacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        reg.codigo_movimiento, reg.trabajador_id, reg.codigo_credencial, reg.documento,
        reg.trabajador_nombre, reg.departamento, reg.zona_id, reg.zona_nombre,
        reg.fecha, reg.hora_entrada, reg.hora_salida || null,
        reg.estado_asistencia || 'PUNTUAL', reg.minutos_tardanza || 0,
        reg.estado_ciclo || 'EN_PLANTA', reg.minutos_trabajados || null,
        reg.horas_formateadas || null, reg.metodo_identificacion || 'TERMINAL_KIOSCO_PIN',
        reg.registrado_por_email || 'kiosco@recuperacionesnaranjo.com',
        reg.registrado_por_nombre || 'Terminal Garita Principal',
        reg.observacion || ''
    ]);
    return res.insertId;
}

async function updateRegistroAccesoSalidaInDb(regId, horaSalida, minutosTrabajados, horasFormateadas, observacion, codigoMovimiento = null) {
    const p = getPool();
    await p.query(`
        UPDATE registros_acceso 
        SET hora_salida = ?, estado_ciclo = 'FINALIZADO', minutos_trabajados = ?, horas_formateadas = ?, observacion = ?
        WHERE id = ? OR (codigo_movimiento IS NOT NULL AND codigo_movimiento = ?)
    `, [horaSalida, minutosTrabajados, horasFormateadas, observacion, regId, codigoMovimiento || String(regId)]);
}

// ---------------------------------------------------------------------------
// USUARIOS ADMINISTRATIVOS, SESIONES Y AUDITORÍA
// ---------------------------------------------------------------------------
async function getUsuariosFromDb() {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            u.id, u.nombre_completo, u.email, u.password_hash, u.rol_id, u.rol, u.cargo,
            u.max_sesiones_simultaneas, u.politica_concurrencia, u.activo,
            DATE_FORMAT(u.ultimo_login, '%Y-%m-%d %H:%i') as ultimo_login
        FROM usuarios u
        ORDER BY u.id ASC
    `);
    
    // Asignar overrides individuales
    for (const u of rows) {
        u.activo = !!u.activo;
        const [overrides] = await p.query(
            'SELECT permiso_codigo, accion FROM usuario_permisos_individuales WHERE usuario_id = ?',
            [u.id]
        );
        u.permisos_individuales = {};
        overrides.forEach(ov => {
            u.permisos_individuales[ov.permiso_codigo] = ov.accion;
        });
    }
    return rows;
}

async function findUserByEmailInDb(email) {
    const p = getPool();
    const clean = String(email || '').trim().toLowerCase();
    const [rows] = await p.query(`
        SELECT 
            u.id, u.nombre_completo, u.email, u.password_hash, u.rol_id, u.rol, u.cargo,
            u.max_sesiones_simultaneas, u.politica_concurrencia, u.activo,
            DATE_FORMAT(u.ultimo_login, '%Y-%m-%d %H:%i') as ultimo_login
        FROM usuarios u
        WHERE LOWER(u.email) = ?
        LIMIT 1
    `, [clean]);
    
    if (rows.length === 0) return null;
    const u = rows[0];
    u.activo = !!u.activo;
    const [overrides] = await p.query(
        'SELECT permiso_codigo, accion FROM usuario_permisos_individuales WHERE usuario_id = ?',
        [u.id]
    );
    u.permisos_individuales = {};
    overrides.forEach(ov => {
        u.permisos_individuales[ov.permiso_codigo] = ov.accion;
    });
    return u;
}

async function updateUsuarioLoginTimestamp(userId) {
    const p = getPool();
    await p.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [userId]);
}

async function createUsuarioInDb(userData) {
    const p = getPool();
    const [res] = await p.query(`
        INSERT INTO usuarios 
        (nombre_completo, email, password_hash, rol_id, rol, cargo, max_sesiones_simultaneas, politica_concurrencia, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        userData.nombre_completo, userData.email, userData.password_hash,
        userData.rol_id || 1, userData.rol, userData.cargo,
        userData.max_sesiones_simultaneas || 1,
        userData.politica_concurrencia || 'CERRAR_ANTERIOR',
        userData.activo ? 1 : 0
    ]);
    return res.insertId;
}

async function updateUsuarioInDb(userId, fields) {
    const p = getPool();
    const sets = [];
    const params = [];
    if (fields.nombre_completo) { sets.push('nombre_completo = ?'); params.push(fields.nombre_completo); }
    if (fields.email) { sets.push('email = ?'); params.push(fields.email); }
    if (fields.password_hash) { sets.push('password_hash = ?'); params.push(fields.password_hash); }
    if (fields.rol) { sets.push('rol = ?'); params.push(fields.rol); }
    if (fields.rol_id) { sets.push('rol_id = ?'); params.push(fields.rol_id); }
    if (fields.cargo) { sets.push('cargo = ?'); params.push(fields.cargo); }
    if (fields.max_sesiones_simultaneas !== undefined) { sets.push('max_sesiones_simultaneas = ?'); params.push(fields.max_sesiones_simultaneas); }
    if (fields.politica_concurrencia) { sets.push('politica_concurrencia = ?'); params.push(fields.politica_concurrencia); }
    if (fields.activo !== undefined) { sets.push('activo = ?'); params.push(fields.activo ? 1 : 0); }
    
    if (sets.length === 0) return;
    params.push(userId);
    await p.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
}

async function setUsuarioPermissionOverrideInDb(userId, permCode, accion) {
    const p = getPool();
    if (accion === 'NONE') {
        await p.query('DELETE FROM usuario_permisos_individuales WHERE usuario_id = ? AND permiso_codigo = ?', [userId, permCode]);
    } else {
        await p.query(`
            INSERT INTO usuario_permisos_individuales (usuario_id, permiso_codigo, accion, otorgado_por)
            VALUES (?, ?, ?, 'SUPER_ADMIN')
            ON DUPLICATE KEY UPDATE accion = VALUES(accion)
        `, [userId, permCode, accion]);
    }
}

// ---------------------------------------------------------------------------
// SESIONES ACTIVAS
// ---------------------------------------------------------------------------
async function getSesionesActivasFromDb() {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            token, usuario_id, usuario_email, usuario_rol, usuario_cargo,
            dispositivo, ip, 
            DATE_FORMAT(inicio_sesion, '%Y-%m-%d %H:%i:%s') as inicio_sesion,
            DATE_FORMAT(ultimo_acceso, '%Y-%m-%d %H:%i:%s') as ultimo_acceso,
            activa
        FROM sesiones_activas
        WHERE activa = 1
        ORDER BY inicio_sesion DESC
    `);
    return rows.map(r => ({ ...r, activa: !!r.activa }));
}

async function createSesionActivaInDb(s) {
    const p = getPool();
    await p.query(`
        INSERT INTO sesiones_activas 
        (token, usuario_id, usuario_email, usuario_rol, usuario_cargo, dispositivo, ip, inicio_sesion, ultimo_acceso, activa)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
        ON DUPLICATE KEY UPDATE ultimo_acceso = NOW(), activa = 1
    `, [s.token || s.session_id, s.usuario_id, s.usuario_email, s.rol || s.usuario_rol, s.cargo || s.usuario_cargo || 'Personal', s.dispositivo, s.ip]);
}

async function closeSesionInDb(token) {
    const p = getPool();
    await p.query('UPDATE sesiones_activas SET activa = 0 WHERE token = ?', [token]);
}

async function closeUserActiveSessionsInDb(userId) {
    const p = getPool();
    await p.query('UPDATE sesiones_activas SET activa = 0 WHERE usuario_id = ?', [userId]);
}

// ---------------------------------------------------------------------------
// AUDITORÍA
// ---------------------------------------------------------------------------
async function getAuditLogsFromDb(limit = 100) {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as timestamp,
            evento, modulo, permiso_evaluado, resultado, usuario_email, ip, detalle
        FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
    `, [limit]);
    return rows;
}

async function recordAuditLogInDb(log) {
    const p = getPool();
    await p.query(`
        INSERT INTO audit_logs (evento, modulo, permiso_evaluado, resultado, usuario_email, ip, detalle)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        log.evento || 'OPERACION',
        log.modulo || 'SISTEMA',
        log.permiso_evaluado || null,
        log.resultado || 'EXITO',
        log.usuario_email || 'SYSTEM',
        log.ip || '127.0.0.1',
        log.detalle || ''
    ]);
}

// ---------------------------------------------------------------------------
// VISITANTES
// ---------------------------------------------------------------------------
async function getVisitantesFromDb() {
    const p = getPool();
    const [rows] = await p.query(`
        SELECT 
            id, codigo_visita, nombre_completo, documento, empresa_origen, placa_vehiculo,
            motivo_visita, anfitrion_visitado, gafete_asignado, zona_id, zona_nombre,
            DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
            TIME_FORMAT(hora_ingreso, '%H:%i') as hora_ingreso,
            TIME_FORMAT(hora_salida, '%H:%i') as hora_salida,
            arl_verificada, estado, registrado_por_email
        FROM visitantes
        ORDER BY id DESC
    `);
    return rows.map(r => ({ ...r, arl_verificada: !!r.arl_verificada }));
}

async function createVisitanteInDb(v) {
    const p = getPool();
    const [res] = await p.query(`
        INSERT INTO visitantes 
        (codigo_visita, nombre_completo, documento, empresa_origen, placa_vehiculo, motivo_visita, anfitrion_visitado, gafete_asignado, zona_id, zona_nombre, fecha, hora_ingreso, arl_verificada, estado, registrado_por_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?, 'DENTRO', ?)
    `, [
        v.codigo_visita, v.nombre_completo, v.documento, v.empresa_origen,
        v.placa_vehiculo || null, v.motivo_visita, v.anfitrion_visitado,
        v.gafete_asignado, v.zona_id || 1, v.zona_nombre || 'Garita Principal',
        v.arl_verificada ? 1 : 0, v.registrado_por_email || 'vigilancia@recuperacionesnaranjo.com'
    ]);
    return res.insertId;
}

async function updateVisitanteSalidaInDb(id, horaSalida) {
    const p = getPool();
    await p.query('UPDATE visitantes SET hora_salida = ?, estado = "SALIO" WHERE id = ?', [horaSalida, id]);
}

// ---------------------------------------------------------------------------
// VISTAS ANALÍTICAS (CUADRILLA Y PRE-LIQUIDACIÓN 42H)
// ---------------------------------------------------------------------------
async function getCuadrillaEnVivoFromDb() {
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM vw_cuadrilla_en_vivo');
    return rows;
}

async function getPreliquidacionFromDb() {
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM vw_preliquidacion_quincenal_42h');
    return rows;
}

// ---------------------------------------------------------------------------
// RESUMEN EN VIVO DE KIOSCO Y PORTERÍA (QUERIES INDEXADAS)
// ---------------------------------------------------------------------------
async function getPublicBootstrapStatsFromDb() {
    const p = getPool();
    const [enPlantaRows] = await p.query("SELECT COUNT(*) AS total FROM trabajadores WHERE ubicacion_actual = 'DENTRO_PLANTA'");
    const [totalTrabRows] = await p.query("SELECT COUNT(*) AS total FROM trabajadores");
    const [regHoyRows] = await p.query("SELECT COUNT(*) AS total FROM registros_acceso WHERE fecha = CURDATE()");
    const [salidasHoyRows] = await p.query("SELECT COUNT(*) AS total FROM registros_acceso WHERE fecha = CURDATE() AND estado_ciclo = 'FINALIZADO'");
    const [tardanzasRows] = await p.query("SELECT COUNT(*) AS total FROM registros_acceso WHERE fecha = CURDATE() AND estado_asistencia LIKE 'TARDANZA%'");
    const [visitasRows] = await p.query("SELECT COUNT(*) AS total FROM visitantes WHERE fecha = CURDATE() AND (estado = 'DENTRO' OR estado = 'EN_PLANTA')");
    
    const [movRows] = await p.query(`
        SELECT 
            r.id, r.codigo_movimiento, r.trabajador_id, r.trabajador_nombre, r.departamento,
            TIME_FORMAT(r.hora_entrada, '%H:%i') as hora_entrada,
            TIME_FORMAT(r.hora_salida, '%H:%i') as hora_salida,
            r.estado_asistencia, r.estado_ciclo, r.horas_formateadas,
            t.cargo, t.foto_url
        FROM registros_acceso r
        LEFT JOIN trabajadores t ON t.id = r.trabajador_id
        WHERE r.fecha = CURDATE()
        ORDER BY r.id DESC
        LIMIT 15
    `);

    const eventos = [];
    movRows.forEach(r => {
        const base = {
            nombre: r.trabajador_nombre,
            cargo: r.cargo || r.departamento,
            foto_url: r.foto_url || null
        };
        eventos.push({
            ...base,
            tipo: 'ENTRADA',
            hora: r.hora_entrada,
            estado: r.estado_asistencia || 'PUNTUAL'
        });
        if (r.hora_salida) {
            eventos.push({
                ...base,
                tipo: 'SALIDA',
                hora: r.hora_salida,
                estado: r.horas_formateadas || 'Finalizado'
            });
        }
    });

    return {
        resumen_planta: {
            aforo_actual: Number(enPlantaRows[0]?.total) || 0,
            aforo_maximo: 150,
            entradas_hoy: Number(regHoyRows[0]?.total) || 0,
            salidas_hoy: Number(salidasHoyRows[0]?.total) || 0,
            visitantes_en_planta: Number(visitasRows[0]?.total) || 0,
            total_trabajadores_padron: Number(totalTrabRows[0]?.total) || 0
        },
        tardanzas_hoy: Number(tardanzasRows[0]?.total) || 0,
        ultimos_movimientos: eventos.slice(0, 8)
    };
}

module.exports = {
    testConnection,
    isMySqlActive,
    getTrabajadoresFromDb,
    findTrabajadorByIdent,
    updateTrabajadorUbicacion,
    getRegistrosAccesoFromDb,
    createRegistroAccesoInDb,
    updateRegistroAccesoSalidaInDb,
    getUsuariosFromDb,
    findUserByEmailInDb,
    updateUsuarioLoginTimestamp,
    createUsuarioInDb,
    updateUsuarioInDb,
    setUsuarioPermissionOverrideInDb,
    getSesionesActivasFromDb,
    createSesionActivaInDb,
    closeSesionInDb,
    closeUserActiveSessionsInDb,
    getAuditLogsFromDb,
    recordAuditLogInDb,
    getVisitantesFromDb,
    createVisitanteInDb,
    updateVisitanteSalidaInDb,
    getCuadrillaEnVivoFromDb,
    getPreliquidacionFromDb,
    getPublicBootstrapStatsFromDb
};
