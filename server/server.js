/**
 * Servidor Backend Principal — SentinelPro IAM
 * Sistema Empresarial de Control de Acceso de Trabajadores (Entradas/Salidas en Portería),
 * Gestión de Garita (Rol Vigilante), Visitantes, Zonas y Autorización Granular (RBAC + Overrides ALLOW/DENY).
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { PRESETS, getTodayStr } = require('./presets');
const {
    CATALOGO_PERMISOS,
    ROLES_SISTEMA,
    TOKEN_TTL_MS,
    normalizeRoleCode,
    hashPassword,
    verifyPassword,
    createSignedToken,
    verifySignedToken,
    resolveEffectivePermissions,
    recordAuditLog
} = require('./security');
const mysqlDb = require('./db-mysql');

const PORT = Number(process.env.PORT) || 3460;
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'database', 'db.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// ============================================================================
// 1. PERSISTENCIA TRANSACCIONAL Y AUTO-MIGRACIÓN
// ============================================================================
function ensureDb() {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        const initialData = PRESETS.naranjo();
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (!Array.isArray(db.trabajadores) || !Array.isArray(db.registros_acceso) || !Array.isArray(db.zonas_acceso) || db.preset_activo !== 'naranjo') {
            const fresh = PRESETS.naranjo();
            fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), 'utf-8');
            return fresh;
        }
        db.permisos_catalogo = CATALOGO_PERMISOS;
        db.roles_sistema = ROLES_SISTEMA;
        if (!Array.isArray(db.sesiones_activas)) db.sesiones_activas = [];
        if (!Array.isArray(db.audit_logs)) db.audit_logs = [];
        if (!Array.isArray(db.horarios_oficiales)) db.horarios_oficiales = PRESETS.naranjo().horarios_oficiales;
        if (!Array.isArray(db.autorizaciones_extras_patio)) db.autorizaciones_extras_patio = [];
        return db;
    } catch {
        const fallback = PRESETS.naranjo();
        fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
        return fallback;
    }
}

function readDb() {
    return ensureDb();
}

function saveDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(collection) {
    if (!Array.isArray(collection) || collection.length === 0) return 1;
    return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

// ============================================================================
// 2. UTILIDADES DE HORARIOS, PUNTUALIDAD Y CÁLCULO DE JORNADA LABORAL 42H
// ============================================================================
function timeToMinutes(hhmm) {
    if (!hhmm || !String(hhmm).includes(':')) return 0;
    const [h, m] = String(hhmm).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function getCurrentTimeHHMM() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function formatDurationMinutes(totalMin) {
    const safeMin = Math.max(1, Math.round(totalMin));
    const h = Math.floor(safeMin / 60);
    const m = safeMin % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
}

function getOfficialScheduleForDate(db, dateObj = new Date()) {
    const dayOfWeek = dateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
    const schedule = (db.horarios_oficiales || []).find(h => Number(h.codigo_dia) === Number(dayOfWeek));
    if (schedule) return schedule;
    return {
        dia: dayOfWeek === 1 ? 'Lunes' : (dayOfWeek === 6 ? 'Sábado' : (dayOfWeek === 0 ? 'Domingo' : 'Ordinario')),
        codigo_dia: dayOfWeek,
        entrada: dayOfWeek === 1 ? '08:00' : '07:30',
        salida: dayOfWeek === 1 ? '16:30' : (dayOfWeek >= 2 && dayOfWeek <= 5 ? '17:00' : '13:00'),
        horas_ordinarias: dayOfWeek === 1 ? 7.0 : (dayOfWeek >= 2 && dayOfWeek <= 5 ? 8.5 : 0),
        es_jornada_extra: dayOfWeek === 0 || dayOfWeek === 6
    };
}

function evaluateAttendanceStatus(horaEntradaHHMM, trabajador, db) {
    const schedule = getOfficialScheduleForDate(db);
    const dayOfWeek = new Date().getDay();
    const entradaMin = timeToMinutes(horaEntradaHHMM);
    const scheduledMin = timeToMinutes(schedule.entrada || '07:30');
    const tolerancia = Number(db.configuracion_empresa?.tolerancia_tardanza_min) || 10;
    const limiteMin = scheduledMin + tolerancia;

    if (schedule.es_jornada_extra || dayOfWeek === 0 || dayOfWeek === 6) {
        return 'EXTRAORDINARIA';
    }

    if (entradaMin > limiteMin) {
        const diff = entradaMin - scheduledMin;
        return `TARDANZA (${diff}m)`;
    }
    return 'PUNTUAL';
}

// ============================================================================
// PUERTA ÚNICA DE ACCESO (Portería Principal) — La planta tiene un solo acceso
// físico peatonal; el Kiosco siempre registra contra esta puerta.
// ============================================================================
const PUERTA_UNICA_ID = 1;

function findWorkerByIdent(db, identificador) {
    const cleanIdent = String(identificador || '').trim().toUpperCase();
    if (!cleanIdent) return null;
    return db.trabajadores.find(t =>
        String(t.documento).toUpperCase() === cleanIdent ||
        String(t.codigo_credencial).toUpperCase() === cleanIdent
    ) || null;
}

/**
 * Construye el perfil del trabajador para el Kiosco SIN registrar movimiento:
 * datos del cargo/rol, estado actual, validaciones previas y la acción que le corresponde.
 */
function buildKioskProfile(db, trabajador) {
    const today = getTodayStr(0);
    const dayOfWeek = new Date().getDay();
    const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
    const horario = getOfficialScheduleForDate(db);
    const dentro = trabajador.ubicacion_actual === 'DENTRO_PLANTA';
    const accion = dentro ? 'SALIDA' : 'ENTRADA';

    const regAbierto = db.registros_acceso.find(r =>
        Number(r.trabajador_id) === Number(trabajador.id) && r.estado_ciclo === 'EN_PLANTA'
    ) || null;
    const historialHoy = db.registros_acceso
        .filter(r => Number(r.trabajador_id) === Number(trabajador.id) && r.fecha === today)
        .map(r => ({
            hora_entrada: r.hora_entrada,
            hora_salida: r.hora_salida,
            estado_asistencia: r.estado_asistencia,
            horas_formateadas: r.horas_formateadas
        }));

    let minutosEnPlanta = null;
    if (regAbierto) {
        const minIn = timeToMinutes(regAbierto.hora_entrada);
        const minNow = timeToMinutes(getCurrentTimeHHMM());
        minutosEnPlanta = regAbierto.fecha === today && minNow >= minIn ? (minNow - minIn) : null;
    }

    const autorizadoFinde = (db.autorizaciones_extras_patio || []).some(a =>
        Number(a.trabajador_id) === Number(trabajador.id) && a.fecha_programada === today && a.estado === 'APROBADO'
    );
    const jornadaHabilitada = !esFinDeSemana || trabajador.tipo_personal === 'PATIO' || autorizadoFinde;

    const validaciones = [
        { codigo: 'ESTADO', etiqueta: 'Credencial activa', ok: trabajador.estado === 'ACTIVO',
          detalle: trabajador.estado === 'ACTIVO' ? 'Habilitado en el padrón' : `Estado: ${trabajador.estado}` },
        { codigo: 'ARL', etiqueta: 'Afiliación ARL vigente', ok: trabajador.arl_vigente !== false,
          detalle: trabajador.arl_vigente !== false ? 'Cobertura SST al día' : 'ARL vencida o sin soporte' },
        { codigo: 'JORNADA', etiqueta: 'Jornada habilitada hoy', ok: accion === 'SALIDA' || jornadaHabilitada,
          detalle: esFinDeSemana
              ? (jornadaHabilitada ? 'Jornada extraordinaria permitida' : 'Personal administrativo: no labora fin de semana')
              : `${horario.dia}: ${horario.entrada} – ${horario.salida}` },
        { codigo: 'ANTIPASSBACK', etiqueta: 'Control anti-passback', ok: true,
          detalle: dentro ? `Dentro desde ${regAbierto ? regAbierto.hora_entrada : (trabajador.ultima_entrada || '—')}: corresponde SALIDA` : 'Fuera de planta: corresponde ENTRADA' }
    ];
    // La salida nunca se bloquea por ARL/estado: la persona debe poder salir de la planta.
    const bloqueante = accion === 'ENTRADA' ? validaciones.find(v => !v.ok) : null;

    return {
        trabajador: {
            id: trabajador.id,
            codigo_credencial: trabajador.codigo_credencial,
            documento: trabajador.documento,
            nombre_completo: trabajador.nombre_completo,
            cargo: trabajador.cargo,
            departamento: trabajador.departamento,
            tipo_personal: trabajador.tipo_personal,
            es_puesto_critico: !!trabajador.es_puesto_critico,
            estado: trabajador.estado,
            arl_vigente: trabajador.arl_vigente !== false,
            ubicacion_actual: trabajador.ubicacion_actual,
            ultima_entrada: trabajador.ultima_entrada || null,
            foto_url: trabajador.foto_url || null
        },
        accion_sugerida: accion,
        puede_marcar: !bloqueante,
        motivo_bloqueo: bloqueante ? `${bloqueante.etiqueta}: ${bloqueante.detalle}` : null,
        validaciones,
        registro_abierto: regAbierto ? { hora_entrada: regAbierto.hora_entrada, fecha: regAbierto.fecha, estado_asistencia: regAbierto.estado_asistencia } : null,
        minutos_en_planta: minutosEnPlanta,
        historial_hoy: historialHoy,
        horario_hoy: horario
    };
}

/**
 * Procesa el registro físico de ENTRADA o SALIDA de un trabajador en una Puerta/Zona.
 * Utilizado tanto por la Consola del Vigilante como por el Terminal Kiosco.
 */
function processWorkerAccessMovement(db, params) {
    const {
        identificador, // puede ser ID numérico, documento (DNI) o codigo_credencial (EMP-001)
        tipo_movimiento, // 'ENTRADA' | 'SALIDA'
        zona_id,
        hora_manual,
        metodo_identificacion = 'TARJETA_RFID',
        observacion = '',
        operador_email = 'kiosco@recuperacionesnaranjo.com',
        operador_nombre = 'Terminal Kiosco Portería',
        ip = '127.0.0.1'
    } = params;

    const cleanIdent = String(identificador || '').trim().toUpperCase();
    const trabajador = db.trabajadores.find(t =>
        String(t.id) === cleanIdent ||
        String(t.documento).toUpperCase() === cleanIdent ||
        String(t.codigo_credencial).toUpperCase() === cleanIdent
    );

    if (!trabajador) {
        return {
            ok: false,
            status: 404,
            code: 'WORKER_NOT_FOUND',
            error: `No se encontró ningún trabajador con documento o credencial "${identificador}".`
        };
    }

    const zona = db.zonas_acceso.find(z => Number(z.id) === Number(zona_id)) || db.zonas_acceso[0];
    const today = getTodayStr(0);
    const horaActual = hora_manual || getCurrentTimeHHMM();

    // 1. Verificar si el trabajador está ACTIVO
    if (trabajador.estado !== 'ACTIVO') {
        const alerta = {
            id: nextId(db.incidencias_acceso),
            fecha_hora: `${today} ${horaActual}`,
            trabajador_nombre: `${trabajador.nombre_completo} (${trabajador.codigo_credencial})`,
            documento: trabajador.documento,
            zona_nombre: zona.nombre,
            tipo_alerta: `CREDENCIAL_${trabajador.estado}`,
            severidad: 'ALTA',
            detalle: `Intento de ${tipo_movimiento} bloqueado: el trabajador tiene estado [${trabajador.estado}].`,
            estado_resolucion: 'PENDIENTE',
            registrado_por: operador_nombre
        };
        db.incidencias_acceso.unshift(alerta);
        recordAuditLog(db, {
            usuario_email: operador_email,
            evento: 'ACCESO_FISICO_DENEGADO_ESTADO',
            modulo: 'porteria',
            resultado: 'DENEGADO',
            ip,
            detalle: `Bloqueado ingreso de ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) en ${zona.nombre}: estado ${trabajador.estado}.`
        });
        saveDb(db);
        return {
            ok: false,
            status: 403,
            code: 'WORKER_SUSPENDED',
            error: `ACCESO FÍSICO DENEGADO: El trabajador ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) se encuentra en estado [${trabajador.estado}]. Se ha generado una alerta de seguridad.`,
            alerta
        };
    }

    // 2. Verificar si el trabajador tiene autorización para esta Puerta / Zona Física
    const zonasAuth = Array.isArray(trabajador.zonas_autorizadas) ? trabajador.zonas_autorizadas.map(Number) : [1];
    if (!zonasAuth.includes(Number(zona.id))) {
        const alerta = {
            id: nextId(db.incidencias_acceso),
            fecha_hora: `${today} ${horaActual}`,
            trabajador_nombre: `${trabajador.nombre_completo} (${trabajador.codigo_credencial})`,
            documento: trabajador.documento,
            zona_nombre: zona.nombre,
            tipo_alerta: 'ZONA_NO_AUTORIZADA',
            severidad: 'ALTA',
            detalle: `Intento de ${tipo_movimiento} en [${zona.nombre}] rechazado: la credencial ${trabajador.codigo_credencial} no tiene permiso para esta zona.`,
            estado_resolucion: 'PENDIENTE',
            registrado_por: operador_nombre
        };
        db.incidencias_acceso.unshift(alerta);
        recordAuditLog(db, {
            usuario_email: operador_email,
            evento: 'ACCESO_FISICO_ZONA_NO_AUTORIZADA',
            modulo: 'porteria',
            resultado: 'DENEGADO',
            ip,
            detalle: `${trabajador.nombre_completo} intentó acceder a zona restringida [${zona.nombre}] sin autorización.`
        });
        saveDb(db);
        return {
            ok: false,
            status: 403,
            code: 'ZONE_UNAUTHORIZED',
            error: `ZONA NO AUTORIZADA: ${trabajador.nombre_completo} no tiene permiso para ingresar por "${zona.nombre}" (${zona.nivel_seguridad}).`,
            alerta
        };
    }

    const movUpper = String(tipo_movimiento || 'ENTRADA').toUpperCase();

    // 3. Procesar ENTRADA (Check-In)
    if (movUpper === 'ENTRADA') {
        if (trabajador.ubicacion_actual === 'DENTRO_PLANTA') {
            return {
                ok: false,
                status: 409,
                code: 'ALREADY_INSIDE',
                error: `El trabajador ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) ya figura DENTRO DE LA EMPRESA (última entrada: ${trabajador.ultima_entrada}). Debe registrar su SALIDA primero.`
            };
        }

        // Validación SST: sin ARL vigente no se permite el ingreso a planta
        if (trabajador.arl_vigente === false) {
            const alerta = {
                id: nextId(db.incidencias_acceso),
                fecha_hora: `${today} ${horaActual}`,
                trabajador_nombre: `${trabajador.nombre_completo} (${trabajador.codigo_credencial})`,
                documento: trabajador.documento,
                zona_nombre: zona.nombre,
                tipo_alerta: 'ARL_NO_VIGENTE',
                severidad: 'ALTA',
                detalle: 'Intento de ingreso sin afiliación ARL vigente (SST).',
                estado_resolucion: 'PENDIENTE',
                registrado_por: operador_nombre
            };
            db.incidencias_acceso.unshift(alerta);
            saveDb(db);
            return {
                ok: false,
                status: 403,
                code: 'ARL_EXPIRED',
                error: `INGRESO BLOQUEADO: ${trabajador.nombre_completo} no tiene ARL vigente. Comuníquese con Talento Humano / SST.`,
                alerta
            };
        }

        const dayOfWeek = new Date().getDay();
        const esFinDeSemana = (dayOfWeek === 0 || dayOfWeek === 6);

        // Validación legal: Personal Administrativo y Aprendices SENA tienen descanso obligatorio sábados y domingos (Ley 2101 / Ley 789)
        if (esFinDeSemana && (trabajador.tipo_personal === 'ADMINISTRACION' || trabajador.tipo_personal === 'APRENDIZ_SENA')) {
            const tieneAutorizacion = (db.autorizaciones_extras_patio || []).some(a =>
                Number(a.trabajador_id) === Number(trabajador.id) &&
                a.fecha_programada === today &&
                a.estado === 'APROBADO'
            );
            if (!tieneAutorizacion) {
                const alerta = {
                    id: nextId(db.incidencias_acceso),
                    fecha_hora: `${today} ${horaActual}`,
                    trabajador_nombre: `${trabajador.nombre_completo} (${trabajador.codigo_credencial})`,
                    documento: trabajador.documento,
                    zona_nombre: zona.nombre,
                    tipo_alerta: 'ACCESO_NO_LABORAL_FIN_SEMANA',
                    severidad: 'MEDIA',
                    detalle: `Intento de ingreso en fin de semana sin autorización para ${trabajador.tipo_personal}. Régimen oficial 42h (Ley 2101 / Ley 789).`,
                    estado_resolucion: 'PENDIENTE',
                    registrado_por: operador_nombre
                };
                db.incidencias_acceso.unshift(alerta);
                saveDb(db);
                return {
                    ok: false,
                    status: 403,
                    code: 'WEEKEND_NOT_AUTHORIZED',
                    error: `ACCESO NO LABORAL: ${trabajador.nombre_completo} pertenece a ${trabajador.departamento} (${trabajador.tipo_personal}) y no tiene jornada programada hoy. La jornada ordinaria de 42h es de Lunes a Viernes.`,
                    alerta
                };
            }
        }

        const estadoAsistencia = evaluateAttendanceStatus(horaActual, trabajador, db);
        const nuevoReg = {
            id: nextId(db.registros_acceso),
            codigo_movimiento: `ACC-${1000 + db.registros_acceso.length + 1}`,
            trabajador_id: trabajador.id,
            codigo_credencial: trabajador.codigo_credencial,
            documento: trabajador.documento,
            trabajador_nombre: trabajador.nombre_completo,
            departamento: trabajador.departamento,
            zona_id: zona.id,
            zona_nombre: zona.nombre,
            fecha: today,
            hora_entrada: horaActual,
            hora_salida: null,
            estado_asistencia: estadoAsistencia,
            estado_ciclo: 'EN_PLANTA',
            minutos_trabajados: null,
            horas_formateadas: 'En curso (En planta)',
            metodo_identificacion,
            registrado_por_email: operador_email,
            registrado_por_nombre: operador_nombre,
            observacion: observacion || `Entrada registrada en ${zona.nombre}.`
        };

        db.registros_acceso.unshift(nuevoReg);
        trabajador.ubicacion_actual = 'DENTRO_PLANTA';
        trabajador.ultima_puerta_id = zona.id;
        trabajador.ultima_entrada = `${today} ${horaActual}`;

        recordAuditLog(db, {
            usuario_email: operador_email,
            evento: 'ENTRADA_TRABAJADOR_REGISTRADA',
            modulo: 'porteria',
            permiso_evaluado: 'porteria:registrar',
            resultado: 'EXITO',
            ip,
            detalle: `ENTRADA de ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) a las ${horaActual} por ${zona.nombre} [${estadoAsistencia}].`
        });
        saveDb(db);

        if (mysqlDb.isMySqlActive()) {
            mysqlDb.createRegistroAccesoInDb(nuevoReg).catch(e => console.warn('MySQL createRegistroAcceso error:', e.message));
            mysqlDb.updateTrabajadorUbicacion(trabajador.id, 'DENTRO_PLANTA', `${today} ${horaActual}`, null).catch(e => console.warn('MySQL updateTrabajador error:', e.message));
        }

        return {
            ok: true,
            status: 201,
            mensaje: `🟢 ENTRADA AUTORIZADA: ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) ingresó a las ${horaActual} [${estadoAsistencia}].`,
            registro: nuevoReg,
            trabajador
        };
    }

    // 4. Procesar SALIDA (Check-Out)
    if (movUpper === 'SALIDA') {
        if (trabajador.ubicacion_actual !== 'DENTRO_PLANTA') {
            return {
                ok: false,
                status: 409,
                code: 'ALREADY_OUTSIDE',
                error: `El trabajador ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) ya figura FUERA DE PLANTA. No tiene una entrada abierta pendiente de salida.`
            };
        }

        // Buscar su registro abierto más reciente
        const regAbierto = db.registros_acceso.find(r =>
            Number(r.trabajador_id) === Number(trabajador.id) && r.estado_ciclo === 'EN_PLANTA'
        );

        let minutos = 480;
        if (regAbierto) {
            const minIn = timeToMinutes(regAbierto.hora_entrada);
            const minOut = timeToMinutes(horaActual);
            minutos = minOut >= minIn ? (minOut - minIn) : (24 * 60 - minIn + minOut);
            if (minutos < 1) minutos = 1;

            regAbierto.hora_salida = horaActual;
            regAbierto.estado_ciclo = 'FINALIZADO';
            regAbierto.minutos_trabajados = minutos;
            regAbierto.horas_formateadas = formatDurationMinutes(minutos);
            if (observacion) {
                regAbierto.observacion = `${regAbierto.observacion} | Salida: ${observacion}`;
            }
        }

        trabajador.ubicacion_actual = 'FUERA_PLANTA';
        trabajador.ultima_puerta_id = zona.id;

        recordAuditLog(db, {
            usuario_email: operador_email,
            evento: 'SALIDA_TRABAJADOR_REGISTRADA',
            modulo: 'porteria',
            permiso_evaluado: 'porteria:registrar',
            resultado: 'EXITO',
            ip,
            detalle: `SALIDA de ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) a las ${horaActual} por ${zona.nombre}. Tiempo laborado: ${formatDurationMinutes(minutos)}.`
        });
        saveDb(db);

        if (mysqlDb.isMySqlActive()) {
            if (regAbierto) {
                mysqlDb.updateRegistroAccesoSalidaInDb(regAbierto.id, horaActual, minutos, formatDurationMinutes(minutos), observacion).catch(e => console.warn('MySQL updateRegistroSalida error:', e.message));
            }
            mysqlDb.updateTrabajadorUbicacion(trabajador.id, 'FUERA_PLANTA', null, `${today} ${horaActual}`).catch(e => console.warn('MySQL updateTrabajador error:', e.message));
        }

        return {
            ok: true,
            status: 200,
            mensaje: `🔴 SALIDA REGISTRADA: ${trabajador.nombre_completo} (${trabajador.codigo_credencial}) salió a las ${horaActual}. Tiempo en planta: ${formatDurationMinutes(minutos)}.`,
            registro: regAbierto,
            trabajador
        };
    }

    return { ok: false, status: 400, error: 'Tipo de movimiento inválido (use ENTRADA o SALIDA).' };
}

// ============================================================================
// 3. MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN ESTRICTA EN BACKEND (IAM)
// ============================================================================
function cleanExpiredSessions(db) {
    const now = Date.now();
    if (!Array.isArray(db.sesiones_activas)) db.sesiones_activas = [];
    db.sesiones_activas.forEach(s => {
        if (s.activa && s.expira_en && now > s.expira_en) {
            s.activa = false;
        }
    });
}

function extractBearerToken(req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return req.headers['x-auth-token'] || null;
}

function authenticateRequest(req, db) {
    cleanExpiredSessions(db);
    const token = extractBearerToken(req);
    if (!token) {
        return { ok: false, status: 401, error: 'No autenticado: Token de sesión no proporcionado.' };
    }
    const payload = verifySignedToken(token);
    if (!payload || !payload.sid || !payload.uid) {
        return { ok: false, status: 401, error: 'Sesión inválida o firma criptográfica expirada.' };
    }
    const sesion = db.sesiones_activas.find(s => s.session_id === payload.sid && s.activa);
    if (!sesion) {
        return { ok: false, status: 401, error: 'La sesión fue cerrada o reemplazada por otra conexión.' };
    }
    const user = db.usuarios.find(u => Number(u.id) === Number(payload.uid));
    if (!user || !user.activo) {
        return { ok: false, status: 403, error: 'La cuenta de usuario ha sido desactivada por el Administrador.' };
    }

    sesion.ultima_actividad = new Date().toISOString();
    const resolved = resolveEffectivePermissions(user, db.roles_sistema);
    return {
        ok: true,
        user,
        sesion,
        permisos_efectivos: resolved
    };
}

/**
 * Verifica que el usuario esté autenticado Y posea el permiso granular requerido en el Backend.
 */
function authorizeAction(req, res, db, requiredPerm, modulo = 'sistema') {
    const ip = req.socket?.remoteAddress || '127.0.0.1';
    const auth = authenticateRequest(req, db);
    if (!auth.ok) {
        recordAuditLog(db, {
            evento: 'ACCESO_NO_AUTENTICADO_401',
            modulo,
            permiso_evaluado: requiredPerm,
            resultado: 'DENEGADO',
            ip,
            detalle: `${req.method} ${req.url} -> ${auth.error}`
        });
        saveDb(db);
        sendJson(res, auth.status, { error: auth.error, code: 'UNAUTHORIZED_401' });
        return null;
    }

    const { user, permisos_efectivos } = auth;
    if (requiredPerm && !permisos_efectivos.permisos_mapa[requiredPerm]) {
        recordAuditLog(db, {
            usuario_id: user.id,
            usuario_email: user.email,
            rol: permisos_efectivos.rol_codigo,
            evento: 'ACCESO_DENEGADO_403',
            modulo,
            permiso_evaluado: requiredPerm,
            resultado: 'DENEGADO',
            ip,
            detalle: `Operación bloqueada en Backend (${req.method} ${req.url}). El usuario carece del permiso [${requiredPerm}].`
        });
        saveDb(db);
        sendJson(res, 403, {
            error: `Acceso Denegado en Servidor (403): Tu cuenta (${user.email} — ${permisos_efectivos.rol_nombre}) no tiene autorizado el permiso [${requiredPerm}].`,
            code: 'FORBIDDEN_403',
            permiso_requerido: requiredPerm,
            rol_actual: permisos_efectivos.rol_codigo
        });
        return null;
    }

    return auth;
}

function sanitizeUserForResponse(user, customRoles) {
    const resolved = resolveEffectivePermissions(user, customRoles);
    return {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: resolved.rol_codigo,
        rol_nombre: resolved.rol_nombre,
        rol_color: resolved.rol_color,
        cargo: user.cargo || resolved.rol_nombre,
        max_sesiones_simultaneas: user.max_sesiones_simultaneas || 1,
        politica_concurrencia: user.politica_concurrencia || 'RECHAZAR_NUEVA',
        activo: Boolean(user.activo),
        permisos_individuales: user.permisos_individuales || {},
        permisos_lista: resolved.permisos_lista,
        permisos_mapa: resolved.permisos_mapa,
        desglose_permisos: resolved.desglose
    };
}

// ============================================================================
// 4. HELPERS HTTP Y SERVIDOR DE ARCHIVOS ESTÁTICOS
// ============================================================================
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token'
    });
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 2e6) req.destroy();
        });
        req.on('end', () => {
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch {
                reject(new Error('Cuerpo JSON inválido'));
            }
        });
        req.on('error', reject);
    });
}

function serveStaticFile(res, filePath) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Recurso no encontrado');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
}

// ============================================================================
// 5. ENRUTADOR PRINCIPAL DE LA API REST
// ============================================================================
async function handleRequest(req, res) {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 200, { ok: true });
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const ip = req.socket?.remoteAddress || '127.0.0.1';

    try {
        const db = readDb();
        const today = getTodayStr(0);

        // --------------------------------------------------------------------
        // A. ENDPOINTS PÚBLICOS (PORTAL INFORMATIVO Y TERMINAL KIOSCO)
        // --------------------------------------------------------------------
        if (req.method === 'GET' && pathname === '/api/public/bootstrap') {
            let resumenPlanta = {
                aforo_actual: db.trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA').length,
                aforo_maximo: db.configuracion_empresa.aforo_maximo_planta || 150,
                entradas_hoy: db.registros_acceso.filter(r => r.fecha === today).length,
                salidas_hoy: db.registros_acceso.filter(r => r.fecha === today && r.estado_ciclo === 'FINALIZADO').length,
                visitantes_en_planta: db.visitantes.filter(v => v.estado === 'EN_PLANTA').length,
                total_trabajadores_padron: db.trabajadores.length
            };
            let tardanzasHoy = db.registros_acceso.filter(r => r.fecha === today && String(r.estado_asistencia || '').startsWith('TARDANZA')).length;
            let ultimosMovimientos = (() => {
                const eventos = [];
                const regHoy = db.registros_acceso.filter(r => r.fecha === today);
                regHoy.forEach(r => {
                    const t = db.trabajadores.find(w => Number(w.id) === Number(r.trabajador_id)) || {};
                    const base = { nombre: r.trabajador_nombre, cargo: t.cargo || r.departamento, foto_url: t.foto_url || null };
                    eventos.push({ ...base, tipo: 'ENTRADA', hora: r.hora_entrada, estado: r.estado_asistencia });
                    if (r.hora_salida) eventos.push({ ...base, tipo: 'SALIDA', hora: r.hora_salida, estado: r.horas_formateadas });
                });
                return eventos.sort((a, b) => timeToMinutes(b.hora) - timeToMinutes(a.hora)).slice(0, 8);
            })();

            if (mysqlDb.isMySqlActive()) {
                try {
                    const myStats = await mysqlDb.getPublicBootstrapStatsFromDb();
                    resumenPlanta = myStats.resumen_planta;
                    tardanzasHoy = myStats.tardanzas_hoy;
                    ultimosMovimientos = myStats.ultimos_movimientos;
                } catch (e) {
                    console.warn('Error fetching MySQL bootstrap stats:', e.message);
                }
            }

            return sendJson(res, 200, {
                preset_activo: db.preset_activo || 'naranjo',
                config: db.configuracion_empresa,
                zonas: db.zonas_acceso,
                turnos: db.turnos_laborales,
                horarios_oficiales: db.horarios_oficiales || [],
                horario_hoy: getOfficialScheduleForDate(db),
                cargos: db.cargos || [],
                resumen_planta: resumenPlanta,
                puerta_unica: db.zonas_acceso.find(z => Number(z.id) === PUERTA_UNICA_ID) || db.zonas_acceso[0],
                ultimos_movimientos: ultimosMovimientos,
                tardanzas_hoy: tardanzasHoy,
                trabajadores_demo: db.trabajadores.map(t => ({
                    id: t.id,
                    codigo_credencial: t.codigo_credencial,
                    documento: t.documento,
                    nombre_completo: t.nombre_completo,
                    cargo: t.cargo,
                    departamento: t.departamento,
                    estado: t.estado,
                    ubicacion_actual: t.ubicacion_actual
                }))
            });
        }

        // Consulta pública de credencial / estado de acceso de trabajador
        if (req.method === 'GET' && pathname === '/api/public/consultar-credencial') {
            const q = String(parsedUrl.searchParams.get('identificador') || '').trim().toUpperCase();
            if (!q) {
                return sendJson(res, 400, { error: 'Ingresa tu Número de Documento (DNI) o Código de Credencial (ej. EMP-001).' });
            }
            const trab = db.trabajadores.find(t =>
                String(t.documento).toUpperCase() === q ||
                String(t.codigo_credencial).toUpperCase() === q
            );
            if (!trab) {
                return sendJson(res, 404, { error: `No se encontró ningún trabajador registrado con el identificador "${q}".` });
            }
            const turno = db.turnos_laborales.find(t => Number(t.id) === Number(trab.turno_id));
            const zonasNombres = db.zonas_acceso
                .filter(z => (trab.zonas_autorizadas || []).includes(z.id))
                .map(z => `${z.codigo}: ${z.nombre}`);
            const historialReciente = db.registros_acceso
                .filter(r => Number(r.trabajador_id) === Number(trab.id))
                .slice(0, 5);

            return sendJson(res, 200, {
                trabajador: trab,
                turno_asignado: turno || null,
                zonas_autorizadas_detalle: zonasNombres,
                historial_reciente: historialReciente
            });
        }

        // Identificación previa en Kiosco: muestra perfil, rol y validaciones SIN registrar
        if (req.method === 'GET' && pathname === '/api/public/kiosco/identificar') {
            const ident = String(parsedUrl.searchParams.get('identificador') || '').trim();
            if (!ident) {
                return sendJson(res, 400, { error: 'Digita tu número de Cédula de Ciudadanía.' });
            }
            const trab = findWorkerByIdent(db, ident);
            if (!trab) {
                return sendJson(res, 404, { code: 'WORKER_NOT_FOUND', error: `La cédula ${ident} no está registrada en el padrón de la empresa.` });
            }
            return sendJson(res, 200, buildKioskProfile(db, trab));
        }

        // Terminal Kiosco de Marcación Rápida — Puerta Única de Acceso
        if (req.method === 'POST' && pathname === '/api/public/kiosco/marcar') {
            const body = await parseBody(req);
            let tipo = String(body.tipo_movimiento || 'AUTO').toUpperCase();
            if (tipo === 'AUTO') {
                const trabAuto = findWorkerByIdent(db, body.identificador);
                tipo = trabAuto && trabAuto.ubicacion_actual === 'DENTRO_PLANTA' ? 'SALIDA' : 'ENTRADA';
            }
            const result = processWorkerAccessMovement(db, {
                identificador: body.identificador,
                tipo_movimiento: tipo,
                zona_id: body.zona_id || PUERTA_UNICA_ID,
                metodo_identificacion: body.metodo_identificacion || 'TERMINAL_KIOSCO_PIN',
                observacion: body.observacion || 'Marcación desde Terminal Kiosco Principal',
                operador_email: 'kiosco@recuperacionesnaranjo.com',
                operador_nombre: 'Terminal Kiosco Portería',
                ip
            });
            const trabResult = findWorkerByIdent(db, body.identificador);
            if (trabResult) {
                result.perfil = buildKioskProfile(db, trabResult);
            }
            result.tipo_movimiento = tipo;
            return sendJson(res, result.status, result);
        }

        // --------------------------------------------------------------------
        // B. AUTENTICACIÓN INDIVIDUAL Y CONTROL DE SESIONES SIMULTÁNEAS
        // --------------------------------------------------------------------
        if (req.method === 'POST' && pathname === '/api/auth/login') {
            cleanExpiredSessions(db);
            const { email, password, force_replace, dispositivo } = await parseBody(req);
            const cleanEmail = String(email || '').trim().toLowerCase();

            // Compatibilidad de dominios y alias entre base de datos MySQL y JSON
            const normalizedEmail = cleanEmail
                .replace('@sentinelpro.com', '@recuperacionesnaranjo.com')
                .replace('@reservapro.com', '@recuperacionesnaranjo.com');

            const EMAIL_ALIASES = {
                'vigilante@recuperacionesnaranjo.com': 'vigilancia@recuperacionesnaranjo.com',
                'vigilancia@recuperacionesnaranjo.com': 'vigilante@recuperacionesnaranjo.com',
                'jefepatio@recuperacionesnaranjo.com': 'jefe.patio@recuperacionesnaranjo.com',
                'jefe.patio@recuperacionesnaranjo.com': 'jefepatio@recuperacionesnaranjo.com',
                'contabilidad@recuperacionesnaranjo.com': 'rrhh@recuperacionesnaranjo.com',
                'rrhh@recuperacionesnaranjo.com': 'contabilidad@recuperacionesnaranjo.com'
            };
            const aliasEmail = EMAIL_ALIASES[cleanEmail] || EMAIL_ALIASES[normalizedEmail] || null;

            const user = db.usuarios.find(u =>
                String(u.email).toLowerCase() === cleanEmail ||
                String(u.email).toLowerCase() === normalizedEmail ||
                (aliasEmail && String(u.email).toLowerCase() === aliasEmail)
            );

            if (!user || !verifyPassword(password, user.password_hash)) {
                recordAuditLog(db, {
                    usuario_email: cleanEmail || 'desconocido',
                    evento: 'LOGIN_FALLIDO',
                    modulo: 'autenticacion',
                    resultado: 'DENEGADO',
                    ip,
                    detalle: `Credenciales inválidas para ${cleanEmail}.`
                });
                saveDb(db);
                return sendJson(res, 401, { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
            }

            if (!user.activo) {
                recordAuditLog(db, {
                    usuario_id: user.id,
                    usuario_email: user.email,
                    rol: user.rol,
                    evento: 'LOGIN_CUENTA_INACTIVA',
                    modulo: 'autenticacion',
                    resultado: 'DENEGADO',
                    ip,
                    detalle: 'Intento de acceso con cuenta de usuario inactiva.'
                });
                saveDb(db);
                return sendJson(res, 403, { error: 'Tu cuenta de usuario está desactivada. Contacta al Administrador de Seguridad.' });
            }

            const activeUserSessions = db.sesiones_activas.filter(s => Number(s.usuario_id) === Number(user.id) && s.activa);
            const maxSessions = Number(user.max_sesiones_simultaneas) || 1;
            const policy = user.politica_concurrencia || 'RECHAZAR_NUEVA';

            if (activeUserSessions.length >= maxSessions) {
                if (!force_replace && policy === 'RECHAZAR_NUEVA') {
                    recordAuditLog(db, {
                        usuario_id: user.id,
                        usuario_email: user.email,
                        rol: user.rol,
                        evento: 'SESION_SIMULTANEA_BLOQUEADA',
                        modulo: 'autenticacion',
                        resultado: 'DENEGADO',
                        ip,
                        detalle: `Límite de sesiones simultáneas alcanzado (${activeUserSessions.length}/${maxSessions}).`
                    });
                    saveDb(db);
                    return sendJson(res, 409, {
                        error: `Límite de sesiones simultáneas alcanzado (${activeUserSessions.length}/${maxSessions}) para ${user.email}. Ya existe una sesión activa. ¿Deseas cerrar la sesión anterior e iniciar aquí?`,
                        code: 'MAX_SESSIONS_REACHED',
                        sesiones_activas_usuario: activeUserSessions.length,
                        max_sesiones_permitidas: maxSessions
                    });
                }
                activeUserSessions.forEach(s => { s.activa = false; });
                recordAuditLog(db, {
                    usuario_id: user.id,
                    usuario_email: user.email,
                    rol: user.rol,
                    evento: 'SESION_PREVIA_REEMPLAZADA',
                    modulo: 'autenticacion',
                    resultado: 'EXITO',
                    ip,
                    detalle: `Se cerraron ${activeUserSessions.length} sesión(es) previa(s) por política de concurrencia.`
                });
            }

            const sessionId = crypto.randomUUID();
            const expiraEn = Date.now() + TOKEN_TTL_MS;
            const resolvedPerms = resolveEffectivePermissions(user, db.roles_sistema);

            const token = createSignedToken({
                sid: sessionId,
                uid: user.id,
                email: user.email,
                rol: resolvedPerms.rol_codigo,
                exp: expiraEn
            });

            const newSession = {
                session_id: sessionId,
                usuario_id: user.id,
                usuario_nombre: user.nombre_completo,
                usuario_email: user.email,
                rol: resolvedPerms.rol_codigo,
                ip,
                dispositivo: dispositivo || (req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 75) : 'Navegador Web'),
                creada_en: new Date().toISOString(),
                ultima_actividad: new Date().toISOString(),
                expira_en: expiraEn,
                activa: true
            };
            db.sesiones_activas.unshift(newSession);

            recordAuditLog(db, {
                usuario_id: user.id,
                usuario_email: user.email,
                rol: resolvedPerms.rol_codigo,
                evento: 'LOGIN_EXITOSO',
                modulo: 'autenticacion',
                resultado: 'EXITO',
                ip,
                detalle: `Inicio de sesión exitoso (${resolvedPerms.permisos_lista.length}/18 permisos activos).`
            });
            saveDb(db);

            if (mysqlDb.isMySqlActive()) {
                mysqlDb.updateUsuarioLoginTimestamp(user.id).catch(e => console.warn('MySQL login timestamp error:', e.message));
                mysqlDb.createSesionActivaInDb({
                    token: sessionId,
                    usuario_id: user.id,
                    usuario_email: user.email,
                    usuario_rol: resolvedPerms.rol_codigo,
                    usuario_cargo: user.cargo,
                    dispositivo: newSession.dispositivo,
                    ip
                }).catch(e => console.warn('MySQL createSesion error:', e.message));
            }

            return sendJson(res, 200, {
                mensaje: `Bienvenido, ${user.nombre_completo}`,
                token,
                session_id: sessionId,
                expira_en: expiraEn,
                usuario: sanitizeUserForResponse(user, db.roles_sistema)
            });
        }

        if (req.method === 'POST' && pathname === '/api/auth/logout') {
            const auth = authenticateRequest(req, db);
            if (auth.ok) {
                auth.sesion.activa = false;
                recordAuditLog(db, {
                    usuario_id: auth.user.id,
                    usuario_email: auth.user.email,
                    rol: auth.permisos_efectivos.rol_codigo,
                    evento: 'LOGOUT_USUARIO',
                    modulo: 'autenticacion',
                    resultado: 'EXITO',
                    ip,
                    detalle: `Cierre de sesión manual (SID: ${auth.sesion.session_id.slice(0, 8)}...).`
                });
                saveDb(db);
            }
            return sendJson(res, 200, { mensaje: 'Sesión cerrada correctamente.' });
        }

        if (req.method === 'GET' && pathname === '/api/auth/me') {
            const auth = authenticateRequest(req, db);
            if (!auth.ok) {
                return sendJson(res, auth.status, { error: auth.error });
            }
            return sendJson(res, 200, {
                usuario: sanitizeUserForResponse(auth.user, db.roles_sistema),
                sesion: auth.sesion
            });
        }

        // --------------------------------------------------------------------
        // C. MÓDULOS ESPECIALIZADOS RECUPERACIONES NARANJO (42H, PATIO, NÓMINA)
        // --------------------------------------------------------------------
        // Horarios oficiales de la empresa (42h L-V)
        if (req.method === 'GET' && pathname === '/api/public/horarios') {
            const horarioHoy = getOfficialScheduleForDate(db);
            return sendJson(res, 200, {
                empresa: db.configuracion_empresa.nombre_empresa,
                regimen: db.configuracion_empresa.regimen_laboral,
                jornada_semanal_horas: db.configuracion_empresa.jornada_semanal_horas || 42,
                horarios_semanales: db.horarios_oficiales || [],
                horario_hoy: horarioHoy
            });
        }

        // Monitoreo en Vivo de Cuadrilla de Patio y Operadores de Maquinaria
        if (req.method === 'GET' && pathname === '/api/patio/cuadrilla-en-vivo') {
            const auth = authenticateRequest(req, db);
            if (!auth.ok) {
                return sendJson(res, 401, { error: 'Autenticación requerida para ver la cuadrilla en vivo.' });
            }

            const hoy = getTodayStr(0);
            const scheduleHoy = getOfficialScheduleForDate(db);
            const horaActualStr = getCurrentTimeHHMM();
            const minActual = timeToMinutes(horaActualStr);
            const scheduledMin = timeToMinutes(scheduleHoy.entrada || '07:30');
            const esTardeAlerta = minActual > (scheduledMin + 15);

            // Filtrar trabajadores por categorías operativas
            const trabajadoresConEstado = db.trabajadores.map(t => {
                const regHoy = db.registros_acceso.find(r => Number(r.trabajador_id) === Number(t.id) && r.fecha === hoy);
                const enPlanta = t.ubicacion_actual === 'DENTRO_PLANTA';
                let estadoPresencia = 'AUSENTE';
                if (enPlanta) {
                    estadoPresencia = regHoy?.estado_asistencia || 'PRESENTE';
                } else if (regHoy && regHoy.estado_ciclo === 'FINALIZADO') {
                    estadoPresencia = 'SALIO';
                }

                return {
                    id: t.id,
                    codigo_credencial: t.codigo_credencial,
                    documento: t.documento,
                    nombre_completo: t.nombre_completo,
                    cargo: t.cargo,
                    departamento: t.departamento,
                    tipo_personal: t.tipo_personal,
                    es_puesto_critico: !!t.es_puesto_critico,
                    ubicacion_actual: t.ubicacion_actual,
                    hora_entrada: regHoy ? regHoy.hora_entrada : null,
                    hora_salida: regHoy ? regHoy.hora_salida : null,
                    estado_presencia: estadoPresencia,
                    foto_url: t.foto_url
                };
            });

            // Agrupación de Cuadrillas
            const maquinariaCritica = trabajadoresConEstado.filter(t => t.cargo.includes('Grúa Pulpo') || t.cargo.includes('Montacargas'));
            const mantenimiento = trabajadoresConEstado.filter(t => t.cargo.includes('Mecánico'));
            const cuadrillaPatio = trabajadoresConEstado.filter(t => t.tipo_personal === 'PATIO' && !t.cargo.includes('Grúa Pulpo') && !t.cargo.includes('Montacargas') && !t.cargo.includes('Mecánico'));
            const administracion = trabajadoresConEstado.filter(t => t.tipo_personal !== 'PATIO');

            // Detección de alerta crítica de maquinaria pesada: faltan después de 15 min de inicio de turno
            const maquinariaFaltante = maquinariaCritica.filter(t => t.ubicacion_actual !== 'DENTRO_PLANTA');
            const alertaMaquinariaCritica = esTardeAlerta && maquinariaFaltante.length > 0;

            const presentesPatio = trabajadoresConEstado.filter(t => t.tipo_personal === 'PATIO' && t.ubicacion_actual === 'DENTRO_PLANTA').length;
            const ausentesPatio = trabajadoresConEstado.filter(t => t.tipo_personal === 'PATIO' && t.ubicacion_actual !== 'DENTRO_PLANTA').length;

            return sendJson(res, 200, {
                fecha: hoy,
                hora_consulta: horaActualStr,
                horario_oficial_hoy: scheduleHoy,
                resumen: {
                    total_patio: trabajadoresConEstado.filter(t => t.tipo_personal === 'PATIO').length,
                    presentes_patio: presentesPatio,
                    ausentes_patio: ausentesPatio,
                    operadores_en_maquina: maquinariaCritica.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA').length,
                    total_maquinaria_critica: maquinariaCritica.length,
                    alerta_maquinaria_critica: alertaMaquinariaCritica,
                    maquinaria_faltante: maquinariaFaltante.map(m => `${m.cargo}: ${m.nombre_completo}`)
                },
                cuadrillas: {
                    maquinaria_critica: maquinariaCritica,
                    mantenimiento: mantenimiento,
                    cuadrilla_patio: cuadrillaPatio,
                    administracion: administracion
                },
                autorizaciones_extras_activas: db.autorizaciones_extras_patio || []
            });
        }

        // Autorización de jornada extraordinaria fin de semana (Jefe de Patio)
        if (req.method === 'POST' && pathname === '/api/patio/autorizar-extra') {
            const auth = authenticateRequest(req, db);
            if (!auth.ok) {
                return sendJson(res, 401, { error: 'Autenticación requerida para autorizar horas extras.' });
            }

            const body = await parseBody(req);
            const { trabajador_id, fecha_programada, dia, horas_estimadas, motivo } = body;
            const trab = db.trabajadores.find(t => Number(t.id) === Number(trabajador_id));
            if (!trab) {
                return sendJson(res, 404, { error: 'Trabajador no encontrado.' });
            }

            const nuevaAuth = {
                id: nextId(db.autorizaciones_extras_patio),
                trabajador_id: Number(trabajador_id),
                nombre_trabajador: `${trab.nombre_completo} (${trab.cargo})`,
                fecha_programada: fecha_programada || today,
                dia: dia || 'SÁBADO',
                horas_estimadas: Number(horas_estimadas) || 5.0,
                motivo: motivo || 'Jornada extraordinaria autorizada por Jefe de Patio.',
                autorizado_por: auth.user.nombre_completo,
                estado: 'APROBADO',
                creado_en: new Date().toISOString()
            };

            if (!Array.isArray(db.autorizaciones_extras_patio)) db.autorizaciones_extras_patio = [];
            db.autorizaciones_extras_patio.unshift(nuevaAuth);

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'AUTORIZACION_EXTRA_PATIO_CREADA',
                modulo: 'patio',
                resultado: 'EXITO',
                ip,
                detalle: `Autorizada jornada extra para ${trab.nombre_completo} el ${nuevaAuth.fecha_programada} (${nuevaAuth.horas_estimadas}h): ${nuevaAuth.motivo}`
            });
            saveDb(db);

            return sendJson(res, 201, {
                mensaje: `✅ Jornada extraordinaria autorizada con éxito para ${trab.nombre_completo}.`,
                autorizacion: nuevaAuth
            });
        }

        // Pre-Liquidación de Nómina 42 Horas Semanales (CST / Ley 2101)
        if (req.method === 'GET' && pathname === '/api/nomina/reporte-42h') {
            const auth = authenticateRequest(req, db);
            if (!auth.ok) {
                return sendJson(res, 401, { error: 'Autenticación requerida para consultar pre-nómina.' });
            }

            const formato = parsedUrl.searchParams.get('format') || 'json';

            // Agrupar registros por trabajador y calcular horas
            const reporte = db.trabajadores.map(trab => {
                const registros = db.registros_acceso.filter(r => Number(r.trabajador_id) === Number(trab.id));
                let totalMinutos = 0;
                let horasExtrasDiurnas = 0;
                let horasExtrasNocturnas = 0;
                let recargosNocturnos = 0;
                let horasDominicalesFestivas = 0;

                registros.forEach(r => {
                    const min = Number(r.minutos_trabajados) || 0;
                    totalMinutos += min;

                    // Si es fin de semana (Sábado/Domingo)
                    const f = new Date(r.fecha);
                    const d = f.getDay();
                    const horasReg = min / 60;
                    if (d === 6) {
                        horasExtrasDiurnas += horasReg; // Sábados para patio
                    } else if (d === 0) {
                        horasDominicalesFestivas += horasReg; // Domingos
                    } else if (horasReg > 8.5) {
                        horasExtrasDiurnas += (horasReg - 8.5);
                    }
                });

                const totalHorasLaboradas = Number((totalMinutos / 60).toFixed(2));
                const horasOrdinarias = Math.min(42.0, Number((totalHorasLaboradas - horasExtrasDiurnas - horasDominicalesFestivas).toFixed(2)));

                return {
                    trabajador_id: trab.id,
                    codigo_credencial: trab.codigo_credencial,
                    documento: trab.documento,
                    nombre_completo: trab.nombre_completo,
                    cargo: trab.cargo,
                    departamento: trab.departamento,
                    tipo_personal: trab.tipo_personal,
                    horas_ordinarias: Math.max(0, horasOrdinarias),
                    horas_extras_diurnas_hed: Number(horasExtrasDiurnas.toFixed(2)),
                    horas_extras_nocturnas_hen: Number(horasExtrasNocturnas.toFixed(2)),
                    recargo_nocturno_rn: Number(recargosNocturnos.toFixed(2)),
                    horas_dominicales_festivas_rdf: Number(horasDominicalesFestivas.toFixed(2)),
                    total_horas_liquidadas: totalHorasLaboradas,
                    cumplimiento_42h: totalHorasLaboradas >= 42 ? 'CUMPLIDO' : `${Math.round((totalHorasLaboradas / 42) * 100)}%`
                };
            });

            if (formato === 'csv') {
                let csv = 'CEDULA;CODIGO;TRABAJADOR;CARGO;DEPARTAMENTO;TIPO;HORAS_ORDINARIAS;HED_25;HEN_75;RN_35;RDF_75_100;TOTAL_HORAS;ESTADO_42H\n';
                reporte.forEach(item => {
                    csv += `"${item.documento}";"${item.codigo_credencial}";"${item.nombre_completo}";"${item.cargo}";"${item.departamento}";"${item.tipo_personal}";${item.horas_ordinarias};${item.horas_extras_diurnas_hed};${item.horas_extras_nocturnas_hen};${item.recargo_nocturno_rn};${item.horas_dominicales_festivas_rdf};${item.total_horas_liquidadas};"${item.cumplimiento_42h}"\n`;
                });
                res.writeHead(200, {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="PreNomina_42h_Recuperaciones_Naranjo.csv"'
                });
                return res.end(csv);
            }

            return sendJson(res, 200, {
                empresa: db.configuracion_empresa.nombre_empresa,
                nit: db.configuracion_empresa.nit_ruc,
                regimen: 'Ley 2101 / CST (42 Horas Semanales Ordinarias)',
                fecha_generacion: new Date().toISOString(),
                resumen_semanal: {
                    total_trabajadores: reporte.length,
                    total_horas_empresa: reporte.reduce((sum, r) => sum + r.total_horas_liquidadas, 0).toFixed(2),
                    total_hed: reporte.reduce((sum, r) => sum + r.horas_extras_diurnas_hed, 0).toFixed(2),
                    total_rdf: reporte.reduce((sum, r) => sum + r.horas_dominicales_festivas_rdf, 0).toFixed(2)
                },
                reporte
            });
        }

        // --------------------------------------------------------------------
        // D. PANEL DE ADMINISTRACIÓN Y OPERACIÓN (PROTEGIDO EN BACKEND)
        // --------------------------------------------------------------------
        if (req.method === 'GET' && pathname === '/api/admin/dashboard') {
            const auth = authenticateRequest(req, db);
            if (!auth.ok) {
                recordAuditLog(db, {
                    evento: 'ACCESO_NO_AUTENTICADO_401',
                    modulo: 'dashboard',
                    permiso_evaluado: 'dashboard:ver',
                    resultado: 'DENEGADO',
                    ip,
                    detalle: `${req.method} ${req.url} -> ${auth.error}`
                });
                saveDb(db);
                return sendJson(res, 401, { error: auth.error, code: 'UNAUTHORIZED_401' });
            }

            const perms = auth.permisos_efectivos.permisos_mapa;
            const hasAnyPanelAccess = Object.values(perms).some(Boolean);
            if (!hasAnyPanelAccess) {
                return sendJson(res, 403, { error: 'Tu usuario no tiene ningún permiso activo para acceder al panel.' });
            }

            const fechaFiltro = parsedUrl.searchParams.get('fecha') || today;
            const enPlantaList = db.trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA');
            const regHoy = db.registros_acceso.filter(r => r.fecha === today);
            const salidasHoy = regHoy.filter(r => r.estado_ciclo === 'FINALIZADO');
            const tardanzasHoy = regHoy.filter(r => r.estado_asistencia === 'TARDANZA');
            const visitantesEnPlanta = db.visitantes.filter(v => v.estado === 'EN_PLANTA');
            const alertasPendientes = db.incidencias_acceso.filter(a => a.estado_resolucion === 'PENDIENTE');

            return sendJson(res, 200, {
                fecha_actual: today,
                fecha_filtro: fechaFiltro,
                preset_activo: db.preset_activo || 'naranjo',
                sesion_actual: {
                    usuario: sanitizeUserForResponse(auth.user, db.roles_sistema),
                    session_id: auth.sesion.session_id
                },
                kpis: {
                    en_planta_ahora: enPlantaList.length,
                    aforo_maximo: db.configuracion_empresa.aforo_maximo_planta || 150,
                    entradas_hoy: regHoy.length,
                    salidas_hoy: salidasHoy.length,
                    puntuales_hoy: regHoy.length - tardanzasHoy.length,
                    tardanzas_hoy: tardanzasHoy.length,
                    visitantes_en_planta: visitantesEnPlanta.length,
                    alertas_pendientes: alertasPendientes.length,
                    total_trabajadores: db.trabajadores.length,
                    trabajadores_activos: db.trabajadores.filter(t => t.estado === 'ACTIVO').length
                },
                trabajadores_en_planta: enPlantaList,
                trabajadores: perms['trabajadores:ver'] || perms['porteria:ver'] ? db.trabajadores : [],
                registros_acceso: perms['asistencia:ver'] || perms['porteria:ver'] || perms['dashboard:ver'] ? db.registros_acceso : [],
                visitantes: perms['visitantes:ver'] ? db.visitantes : [],
                zonas_acceso: perms['zonas:ver'] || perms['porteria:ver'] ? db.zonas_acceso : [],
                turnos_laborales: perms['zonas:ver'] || perms['trabajadores:ver'] ? db.turnos_laborales : [],
                incidencias_acceso: perms['incidencias:ver'] ? db.incidencias_acceso : [],
                configuracion_empresa: db.configuracion_empresa,
                audit_logs: perms['seguridad:ver'] || perms['dashboard:ver'] ? (db.audit_logs || []).slice(0, 100) : []
            });
        }

        // Consola de Portería / Garita (Vigilante): Registrar Entrada o Salida de Trabajador
        if (req.method === 'POST' && pathname === '/api/admin/porteria/registrar') {
            const auth = authorizeAction(req, res, db, 'porteria:registrar', 'porteria');
            if (!auth) return;

            const body = await parseBody(req);
            const result = processWorkerAccessMovement(db, {
                identificador: body.identificador,
                tipo_movimiento: body.tipo_movimiento || 'ENTRADA',
                zona_id: body.zona_id || 1,
                hora_manual: body.hora_manual || null,
                metodo_identificacion: body.metodo_identificacion || 'TARJETA_RFID',
                observacion: body.observacion || '',
                operador_email: auth.user.email,
                operador_nombre: auth.user.nombre_completo,
                ip
            });

            return sendJson(res, result.status, result);
        }

        // Registrar Nuevo Trabajador en Padrón (RR.HH.)
        if (req.method === 'POST' && pathname === '/api/admin/trabajadores') {
            const auth = authorizeAction(req, res, db, 'trabajadores:crear', 'trabajadores');
            if (!auth) return;

            const body = await parseBody(req);
            if (!body.nombre_completo || !body.documento) {
                return sendJson(res, 400, { error: 'Nombre completo y Número de Documento son obligatorios.' });
            }

            const docClean = String(body.documento).trim();
            if (db.trabajadores.some(t => String(t.documento) === docClean)) {
                return sendJson(res, 409, { error: `Ya existe un trabajador registrado con el documento ${docClean}.` });
            }

            const id = nextId(db.trabajadores);
            const codigoCred = body.codigo_credencial || `EMP-${String(id).padStart(3, '0')}`;
            const nuevoTrabajador = {
                id,
                codigo_credencial: codigoCred,
                documento: docClean,
                nombre_completo: String(body.nombre_completo).trim(),
                cargo: body.cargo || 'Operador de Planta',
                departamento: body.departamento || 'Operaciones y Planta',
                telefono: body.telefono || '',
                email: body.email || '',
                turno_id: Number(body.turno_id) || 1,
                zonas_autorizadas: Array.isArray(body.zonas_autorizadas) && body.zonas_autorizadas.length
                    ? body.zonas_autorizadas.map(Number)
                    : [1, 2],
                placa_vehiculo: body.placa_vehiculo || '',
                estado: body.estado || 'ACTIVO',
                ubicacion_actual: 'FUERA_PLANTA',
                ultima_puerta_id: 1,
                ultima_entrada: 'Sin marcaciones previas'
            };

            db.trabajadores.push(nuevoTrabajador);
            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'ALTA_TRABAJADOR',
                modulo: 'trabajadores',
                permiso_evaluado: 'trabajadores:crear',
                resultado: 'EXITO',
                ip,
                detalle: `Alta de trabajador: ${nuevoTrabajador.nombre_completo} (${nuevoTrabajador.codigo_credencial} — Doc: ${nuevoTrabajador.documento}).`
            });
            saveDb(db);

            return sendJson(res, 201, {
                mensaje: `Trabajador ${nuevoTrabajador.nombre_completo} registrado con credencial ${nuevoTrabajador.codigo_credencial}.`,
                trabajador: nuevoTrabajador
            });
        }

        // Editar Trabajador, Turno, Zonas Autorizadas o Suspender/Activar Credencial
        if (req.method === 'PUT' && pathname.startsWith('/api/admin/trabajadores/')) {
            const auth = authorizeAction(req, res, db, 'trabajadores:editar', 'trabajadores');
            if (!auth) return;

            const id = Number(pathname.split('/')[4]);
            const trab = db.trabajadores.find(t => Number(t.id) === id);
            if (!trab) return sendJson(res, 404, { error: 'Trabajador no encontrado.' });

            const body = await parseBody(req);
            if (body.nombre_completo !== undefined) trab.nombre_completo = String(body.nombre_completo).trim();
            if (body.documento !== undefined) trab.documento = String(body.documento).trim();
            if (body.cargo !== undefined) trab.cargo = String(body.cargo).trim();
            if (body.departamento !== undefined) trab.departamento = String(body.departamento).trim();
            if (body.telefono !== undefined) trab.telefono = String(body.telefono).trim();
            if (body.turno_id !== undefined) trab.turno_id = Number(body.turno_id);
            if (Array.isArray(body.zonas_autorizadas)) trab.zonas_autorizadas = body.zonas_autorizadas.map(Number);
            if (body.placa_vehiculo !== undefined) trab.placa_vehiculo = String(body.placa_vehiculo).trim();
            if (body.estado !== undefined) trab.estado = body.estado;

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'EDICION_TRABAJADOR',
                modulo: 'trabajadores',
                permiso_evaluado: 'trabajadores:editar',
                resultado: 'EXITO',
                ip,
                detalle: `Actualizado trabajador ${trab.nombre_completo} (${trab.codigo_credencial}): Estado=${trab.estado}, Zonas=[${trab.zonas_autorizadas.join(',')}].`
            });
            saveDb(db);

            return sendJson(res, 200, {
                mensaje: `Datos y permisos físicos de ${trab.nombre_completo} actualizados.`,
                trabajador: trab
            });
        }

        // Control de Visitantes: Registrar Ingreso de Visitante / Contratista
        if (req.method === 'POST' && pathname === '/api/admin/visitantes') {
            const auth = authorizeAction(req, res, db, 'visitantes:registrar', 'visitantes');
            if (!auth) return;

            const body = await parseBody(req);
            if (!body.nombre_completo || !body.documento || !body.anfitrion_visitado) {
                return sendJson(res, 400, { error: 'Nombre del visitante, documento y persona visitada son obligatorios.' });
            }

            const id = nextId(db.visitantes);
            const gafeteVal = body.gafete_asignado || body.gafete || `VIS-${String(id).padStart(2, '0')}`;
            const nuevoVisitante = {
                id,
                gafete: gafeteVal,
                codigo_visita: gafeteVal,
                documento: String(body.documento).trim(),
                nombre_completo: String(body.nombre_completo).trim(),
                empresa_origen: body.empresa_origen || 'Particular / Contratista',
                anfitrion_visitado: body.anfitrion_visitado,
                zona_autorizada: body.zona_autorizada || 'Portería Principal Peatonal (Torniquete Norte)',
                motivo: body.motivo || 'Reunión / Gestión autorizada',
                fecha: today,
                hora_entrada: getCurrentTimeHHMM(),
                hora_salida: null,
                estado: 'EN_PLANTA',
                registrado_por: auth.user.nombre_completo
            };

            db.visitantes.unshift(nuevoVisitante);
            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'INGRESO_VISITANTE',
                modulo: 'visitantes',
                permiso_evaluado: 'visitantes:registrar',
                resultado: 'EXITO',
                ip,
                detalle: `Ingreso de visitante ${nuevoVisitante.nombre_completo} (${nuevoVisitante.empresa_origen}) con gafete ${nuevoVisitante.gafete}.`
            });
            saveDb(db);

            return sendJson(res, 201, {
                mensaje: `Visitante ${nuevoVisitante.nombre_completo} registrado con Gafete ${nuevoVisitante.gafete}.`,
                visitante: nuevoVisitante
            });
        }

        // Registrar Salida de Visitante
        if (req.method === 'PATCH' && pathname.startsWith('/api/admin/visitantes/') && pathname.endsWith('/salida')) {
            const auth = authorizeAction(req, res, db, 'visitantes:registrar', 'visitantes');
            if (!auth) return;

            const id = Number(pathname.split('/')[4]);
            const vis = db.visitantes.find(v => Number(v.id) === id);
            if (!vis) return sendJson(res, 404, { error: 'Registro de visitante no encontrado.' });

            vis.hora_salida = getCurrentTimeHHMM();
            vis.estado = 'SALIDA_REGISTRADA';

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'SALIDA_VISITANTE',
                modulo: 'visitantes',
                permiso_evaluado: 'visitantes:registrar',
                resultado: 'EXITO',
                ip,
                detalle: `Salida de visitante ${vis.nombre_completo} (Gafete ${vis.gafete} liberado a las ${vis.hora_salida}).`
            });
            saveDb(db);

            return sendJson(res, 200, {
                mensaje: `Salida registrada para ${vis.nombre_completo}. Gafete ${vis.gafete} liberado.`,
                visitante: vis
            });
        }

        // Crear / Editar Puerta o Zona Física de Control de Acceso
        if (req.method === 'POST' && pathname === '/api/admin/zonas') {
            const auth = authorizeAction(req, res, db, 'zonas:editar', 'zonas');
            if (!auth) return;

            const body = await parseBody(req);
            if (!body.nombre) return sendJson(res, 400, { error: 'El nombre de la puerta o zona es obligatorio.' });

            const id = nextId(db.zonas_acceso);
            const nuevaZona = {
                id,
                codigo: body.codigo || `PUERTA-0${id}`,
                nombre: String(body.nombre).trim(),
                tipo: body.tipo || 'PEATONAL',
                nivel_seguridad: body.nivel_seguridad || 'NIVEL 2 — OPERATIVO',
                ubicacion: body.ubicacion || 'Planta Central',
                estado: body.estado || 'OPERATIVA',
                requiere_autorizacion_especial: Boolean(body.requiere_autorizacion_especial)
            };
            db.zonas_acceso.push(nuevaZona);
            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'CREACION_ZONA_ACCESO',
                modulo: 'zonas',
                permiso_evaluado: 'zonas:editar',
                resultado: 'EXITO',
                ip,
                detalle: `Nueva puerta/zona creada: ${nuevaZona.codigo} - ${nuevaZona.nombre}.`
            });
            saveDb(db);
            return sendJson(res, 201, { mensaje: 'Punto de acceso creado correctamente.', zona: nuevaZona });
        }

        if (req.method === 'PUT' && pathname.startsWith('/api/admin/zonas/')) {
            const auth = authorizeAction(req, res, db, 'zonas:editar', 'zonas');
            if (!auth) return;

            const id = Number(pathname.split('/')[4]);
            const zona = db.zonas_acceso.find(z => Number(z.id) === id);
            if (!zona) return sendJson(res, 404, { error: 'Zona no encontrada.' });

            const body = await parseBody(req);
            if (body.nombre !== undefined) zona.nombre = body.nombre;
            if (body.nivel_seguridad !== undefined) zona.nivel_seguridad = body.nivel_seguridad;
            if (body.ubicacion !== undefined) zona.ubicacion = body.ubicacion;
            if (body.estado !== undefined) zona.estado = body.estado;

            saveDb(db);
            return sendJson(res, 200, { mensaje: `Estado de ${zona.nombre} actualizado a ${zona.estado}.`, zona });
        }

        // Resolver / Justificar Alerta o Incidencia de Portería
        if (req.method === 'PATCH' && pathname.startsWith('/api/admin/incidencias/')) {
            const auth = authorizeAction(req, res, db, 'incidencias:resolver', 'incidencias');
            if (!auth) return;

            const id = Number(pathname.split('/')[4]);
            const inc = db.incidencias_acceso.find(i => Number(i.id) === id);
            if (!inc) return sendJson(res, 404, { error: 'Alerta no encontrada.' });

            const body = await parseBody(req);
            inc.estado_resolucion = 'RESUELTA';
            if (body.nota_resolucion) {
                inc.detalle = `${inc.detalle} | Resolución (${auth.user.email}): ${body.nota_resolucion}`;
            }

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'INCIDENCIA_ACCESO_RESUELTA',
                modulo: 'incidencias',
                permiso_evaluado: 'incidencias:resolver',
                resultado: 'EXITO',
                ip,
                detalle: `Resuelta incidencia #${inc.id} (${inc.trabajador_nombre} en ${inc.zona_nombre}).`
            });
            saveDb(db);
            return sendJson(res, 200, { mensaje: 'Incidencia marcada como resuelta.', incidencia: inc });
        }

        // Configuración Corporativa de la Empresa
        if (req.method === 'PUT' && pathname === '/api/admin/configuracion') {
            const auth = authorizeAction(req, res, db, 'configuracion:editar', 'configuracion');
            if (!auth) return;

            const body = await parseBody(req);
            db.configuracion_empresa = {
                ...db.configuracion_empresa,
                ...body,
                aforo_maximo_planta: Number(body.aforo_maximo_planta ?? db.configuracion_empresa.aforo_maximo_planta),
                tolerancia_tardanza_min: Number(body.tolerancia_tardanza_min ?? db.configuracion_empresa.tolerancia_tardanza_min)
            };

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'ACTUALIZACION_CONFIG_EMPRESA',
                modulo: 'configuracion',
                permiso_evaluado: 'configuracion:editar',
                resultado: 'EXITO',
                ip,
                detalle: `Configuración corporativa actualizada (${db.configuracion_empresa.nombre_empresa}).`
            });
            saveDb(db);
            return sendJson(res, 200, { mensaje: 'Configuración corporativa actualizada.', config: db.configuracion_empresa });
        }

        // --------------------------------------------------------------------
        // D. ADMINISTRACIÓN DE SEGURIDAD E IDENTIDAD (IAM: USUARIOS, ROLES, PERMISOS INDIVIDUALES, SESIONES)
        // --------------------------------------------------------------------
        if (req.method === 'GET' && pathname === '/api/admin/seguridad/estado') {
            const auth = authorizeAction(req, res, db, 'seguridad:ver', 'seguridad');
            if (!auth) return;

            cleanExpiredSessions(db);
            return sendJson(res, 200, {
                catalogo_permisos: CATALOGO_PERMISOS,
                roles_sistema: db.roles_sistema || ROLES_SISTEMA,
                usuarios: db.usuarios.map(u => sanitizeUserForResponse(u, db.roles_sistema)),
                sesiones_activas: (db.sesiones_activas || []).filter(s => s.activa),
                audit_logs: (db.audit_logs || []).slice(0, 120)
            });
        }

        if (req.method === 'POST' && pathname === '/api/admin/seguridad/usuarios') {
            const auth = authorizeAction(req, res, db, 'seguridad:administrar', 'seguridad');
            if (!auth) return;

            const body = await parseBody(req);
            const email = String(body.email || '').trim().toLowerCase();
            if (!body.nombre_completo || !email || !body.password) {
                return sendJson(res, 400, { error: 'Nombre, correo y contraseña inicial son obligatorios.' });
            }
            if (db.usuarios.some(u => String(u.email).toLowerCase() === email)) {
                return sendJson(res, 409, { error: 'Ya existe un usuario registrado con ese correo electrónico.' });
            }

            const newUser = {
                id: nextId(db.usuarios),
                nombre_completo: String(body.nombre_completo).trim(),
                email,
                password_hash: hashPassword(body.password),
                rol: normalizeRoleCode(body.rol || 'VIGILANTE_PORTERIA'),
                cargo: body.cargo || 'Operador de Seguridad',
                max_sesiones_simultaneas: Math.max(1, Math.min(10, Number(body.max_sesiones_simultaneas) || 1)),
                politica_concurrencia: body.politica_concurrencia || 'RECHAZAR_NUEVA',
                activo: body.activo !== undefined ? Boolean(body.activo) : true,
                permisos_individuales: body.permisos_individuales || {},
                creado_en: new Date().toISOString()
            };

            db.usuarios.push(newUser);
            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'CREACION_USUARIO_IAM',
                modulo: 'seguridad',
                permiso_evaluado: 'seguridad:administrar',
                resultado: 'EXITO',
                ip,
                detalle: `Creado usuario ${newUser.email} con rol [${newUser.rol}] y máx ${newUser.max_sesiones_simultaneas} sesión(es).`
            });
            saveDb(db);

            return sendJson(res, 201, {
                mensaje: `Usuario ${newUser.nombre_completo} creado correctamente.`,
                usuario: sanitizeUserForResponse(newUser, db.roles_sistema)
            });
        }

        if (req.method === 'PUT' && pathname.startsWith('/api/admin/seguridad/usuarios/')) {
            const auth = authorizeAction(req, res, db, 'seguridad:administrar', 'seguridad');
            if (!auth) return;

            const targetId = Number(pathname.split('/')[5]);
            const targetUser = db.usuarios.find(u => Number(u.id) === targetId);
            if (!targetUser) return sendJson(res, 404, { error: 'Usuario no encontrado.' });

            const body = await parseBody(req);
            if (body.nombre_completo !== undefined) targetUser.nombre_completo = String(body.nombre_completo).trim();
            if (body.rol !== undefined) targetUser.rol = normalizeRoleCode(body.rol);
            if (body.cargo !== undefined) targetUser.cargo = body.cargo;
            if (body.max_sesiones_simultaneas !== undefined) {
                targetUser.max_sesiones_simultaneas = Math.max(1, Math.min(10, Number(body.max_sesiones_simultaneas) || 1));
            }
            if (body.politica_concurrencia !== undefined) {
                targetUser.politica_concurrencia = body.politica_concurrencia;
            }
            if (body.activo !== undefined) {
                targetUser.activo = Boolean(body.activo);
                if (!targetUser.activo) {
                    (db.sesiones_activas || []).forEach(s => {
                        if (Number(s.usuario_id) === targetId) s.activa = false;
                    });
                }
            }
            if (body.password && String(body.password).trim().length >= 4) {
                targetUser.password_hash = hashPassword(String(body.password).trim());
            }
            if (body.permisos_individuales && typeof body.permisos_individuales === 'object') {
                targetUser.permisos_individuales = body.permisos_individuales;
            }

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'ACTUALIZACION_USUARIO_IAM',
                modulo: 'seguridad',
                permiso_evaluado: 'seguridad:administrar',
                resultado: 'EXITO',
                ip,
                detalle: `Actualizado usuario ${targetUser.email} (Rol: ${targetUser.rol}, Activo: ${targetUser.activo}).`
            });
            saveDb(db);

            return sendJson(res, 200, {
                mensaje: `Configuración de acceso actualizada para ${targetUser.nombre_completo}.`,
                usuario: sanitizeUserForResponse(targetUser, db.roles_sistema)
            });
        }

        // Asignar / Revocar un Permiso Individual (ALLOW | DENY | INHERIT) en caliente
        if (req.method === 'POST' && pathname.match(/^\/api\/admin\/seguridad\/usuarios\/\d+\/permiso-individual$/)) {
            const auth = authorizeAction(req, res, db, 'seguridad:administrar', 'seguridad');
            if (!auth) return;

            const targetId = Number(pathname.split('/')[5]);
            const targetUser = db.usuarios.find(u => Number(u.id) === targetId);
            if (!targetUser) return sendJson(res, 404, { error: 'Usuario no encontrado.' });

            const { permiso_codigo, modo } = await parseBody(req);
            if (!CATALOGO_PERMISOS.some(p => p.codigo === permiso_codigo)) {
                return sendJson(res, 400, { error: `El permiso [${permiso_codigo}] no existe en el catálogo.` });
            }

            if (!targetUser.permisos_individuales) targetUser.permisos_individuales = {};
            if (modo === 'ALLOW' || modo === 'DENY') {
                targetUser.permisos_individuales[permiso_codigo] = modo;
            } else {
                delete targetUser.permisos_individuales[permiso_codigo];
            }

            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'CAMBIO_PERMISOS_USUARIO',
                modulo: 'seguridad',
                permiso_evaluado: 'seguridad:administrar',
                resultado: 'EXITO',
                ip,
                detalle: `Permiso individual [${permiso_codigo}] configurado en [${modo}] para ${targetUser.email}.`
            });
            saveDb(db);

            return sendJson(res, 200, {
                mensaje: `Permiso [${permiso_codigo}] actualizado (${modo}) para ${targetUser.nombre_completo}.`,
                usuario: sanitizeUserForResponse(targetUser, db.roles_sistema)
            });
        }

        // Revocar sesión activa remotamente
        if (req.method === 'DELETE' && pathname.startsWith('/api/admin/seguridad/sesiones/')) {
            const auth = authorizeAction(req, res, db, 'seguridad:administrar', 'seguridad');
            if (!auth) return;

            const sid = decodeURIComponent(pathname.split('/')[5] || '');
            const sesion = (db.sesiones_activas || []).find(s => s.session_id === sid && s.activa);
            if (!sesion) return sendJson(res, 404, { error: 'La sesión indicada ya no está activa.' });

            sesion.activa = false;
            recordAuditLog(db, {
                usuario_id: auth.user.id,
                usuario_email: auth.user.email,
                rol: auth.permisos_efectivos.rol_codigo,
                evento: 'SESION_REVOCADA',
                modulo: 'seguridad',
                permiso_evaluado: 'seguridad:administrar',
                resultado: 'EXITO',
                ip,
                detalle: `Sesión revocada forzosamente para ${sesion.usuario_email} (SID: ${sid.slice(0, 8)}...).`
            });
            saveDb(db);
            return sendJson(res, 200, { mensaje: `Sesión de ${sesion.usuario_email} cerrada inmediatamente.` });
        }

        // Cambiar Escenario Empresarial (Planta Industrial / Torre Corporativa / Complejo Hospitalario)
        if (req.method === 'POST' && pathname === '/api/admin/preset') {
            const { preset } = await parseBody(req);
            const builder = PRESETS[preset];
            if (!builder) return sendJson(res, 400, { error: 'Escenario corporativo no válido.' });

            const currentSessions = db.sesiones_activas || [];
            const currentUsers = db.usuarios || [];
            const currentLogs = db.audit_logs || [];
            const newDb = builder();
            newDb.sesiones_activas = currentSessions;
            if (currentUsers.length) newDb.usuarios = currentUsers;
            newDb.audit_logs = currentLogs;

            saveDb(newDb);
            return sendJson(res, 200, {
                mensaje: `Escenario corporativo cambiado a: ${newDb.configuracion_empresa.nombre_empresa}`,
                preset_key: preset,
                config: newDb.configuracion_empresa
            });
        }

        // --------------------------------------------------------------------
        // E. ARCHIVOS ESTÁTICOS
        // --------------------------------------------------------------------
        if (pathname === '/documentacion' || pathname === '/docs') {
            return serveStaticFile(res, path.join(DOCS_DIR, 'VISOR_DOCUMENTACION.html'));
        }
        if (pathname.startsWith('/docs/')) {
            const rel = pathname.replace('/docs/', '');
            return serveStaticFile(res, path.join(DOCS_DIR, rel));
        }

        const targetFile = pathname === '/' || pathname === '/admin'
            ? path.join(PUBLIC_DIR, 'index.html')
            : path.join(PUBLIC_DIR, pathname.replace(/^\/+/, ''));

        return serveStaticFile(res, targetFile);
    } catch (err) {
        return sendJson(res, 500, { error: err.message || 'Error interno del servidor' });
    }
}

async function startServer(port = PORT) {
    ensureDb();
    try {
        await mysqlDb.testConnection();
    } catch (e) {
        console.warn('⚠️  Advertencia: No se pudo verificar conexión inicial a MySQL:', e.message);
    }
    const server = http.createServer(handleRequest);
    return new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(port, () => {
            console.log(`======================================================================`);
            console.log(`🛡️  SentinelPro IAM — Control de Acceso de Trabajadores y Portería`);
            console.log(`🏢 Empresa: Recuperaciones Naranjo Recycling S.A.S. (Mamonal)`);
            console.log(`🗄️  Base de Datos: ${mysqlDb.isMySqlActive() ? '🟢 MySQL sentinelpro_iam (Puerto 3306 - Conectado)' : '🟡 Fallback Local JSON'}`);
            console.log(`🌐 Portal Corporativo, Kiosco y Panel Admin: http://localhost:${port}`);
            console.log(`======================================================================`);
            resolve(server);
        });
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { startServer, processWorkerAccessMovement, ensureDb };
