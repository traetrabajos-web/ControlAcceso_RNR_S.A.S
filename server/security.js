const crypto = require('node:crypto');

// Clave secreta del servidor para firma HMAC-SHA256 de tokens de sesión
const SERVER_SECRET = process.env.AUTH_SECRET || 'SentinelPro_Enterprise_IAM_HMAC_Secret_Key_2026_#9981';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas de vigencia por sesión

// ============================================================================
// 1. CATÁLOGO OFICIAL DE 18 PERMISOS GRANULARES (MÓDULO : OPERACIÓN)
// ============================================================================
const CATALOGO_PERMISOS = [
    // Módulo Dashboard y Aforo en Planta
    { codigo: 'dashboard:ver', modulo: 'Dashboard & Aforo', nombre: 'Ver Dashboard y Aforo en Planta', descripcion: 'Permite visualizar KPIs en vivo, personal actualmente dentro de la empresa, entradas/salidas del día y alertas.' },

    // Módulo Portería / Garita (Control de Entrada y Salida de Trabajadores)
    { codigo: 'porteria:ver', modulo: 'Consola de Portería', nombre: 'Abrir Consola de Portería y Garita', descripcion: 'Permite visualizar el monitor de acceso peatonal/vehicular y el personal actualmente en planta.' },
    { codigo: 'porteria:registrar', modulo: 'Consola de Portería', nombre: 'Registrar Entrada y Salida de Trabajadores', descripcion: 'Permite al Vigilante u operador fichar el ingreso (Check-In) y salida (Check-Out) de trabajadores por DNI/Credencial.' },

    // Módulo Historial de Asistencia y Horas Trabajadas
    { codigo: 'asistencia:ver', modulo: 'Historial Asistencia', nombre: 'Consultar Historial de Entradas y Salidas', descripcion: 'Permite consultar registros históricos de asistencia, puntualidad, tardanzas y horas trabajadas.' },
    { codigo: 'asistencia:exportar', modulo: 'Historial Asistencia', nombre: 'Exportar Reportes de Asistencia (CSV)', descripcion: 'Permite descargar reportes consolidados de marcaciones, horas laboradas y tardanzas para nómina.' },

    // Módulo Directorio de Trabajadores y Credenciales (RR.HH.)
    { codigo: 'trabajadores:ver', modulo: 'Trabajadores (RR.HH.)', nombre: 'Consultar Directorio de Trabajadores', descripcion: 'Permite ver la ficha de los trabajadores, su documento, cargo, departamento, turno y estado de autorización.' },
    { codigo: 'trabajadores:crear', modulo: 'Trabajadores (RR.HH.)', nombre: 'Registrar Nuevos Trabajadores', descripcion: 'Permite dar de alta nuevos trabajadores en el padrón y emitir su código de credencial (EMP-XXX).' },
    { codigo: 'trabajadores:editar', modulo: 'Trabajadores (RR.HH.)', nombre: 'Editar Trabajadores, Turnos y Zonas', descripcion: 'Permite modificar el turno asignado, zonas autorizadas o suspender/activar el acceso de un trabajador.' },

    // Módulo Control de Visitantes, Contratistas y Proveedores
    { codigo: 'visitantes:ver', modulo: 'Control Visitantes', nombre: 'Consultar Visitantes y Contratistas', descripcion: 'Permite visualizar los visitantes externos activos en la empresa y el historial de visitas.' },
    { codigo: 'visitantes:registrar', modulo: 'Control Visitantes', nombre: 'Registrar Entrada/Salida de Visitantes', descripcion: 'Permite registrar el ingreso de un visitante en garita, asignarle gafete temporal y marcar su salida.' },

    // Módulo Zonas Físicas, Puertas y Turnos Laborales
    { codigo: 'zonas:ver', modulo: 'Zonas y Turnos', nombre: 'Ver Puertas de Acceso y Turnos', descripcion: 'Permite consultar los puntos de control (puertas/torniquetes), niveles de seguridad y horarios de turnos.' },
    { codigo: 'zonas:editar', modulo: 'Zonas y Turnos', nombre: 'Administrar Puertas y Turnos Laborales', descripcion: 'Permite crear o modificar puntos de acceso físico, niveles de restricción y horarios de turnos.' },

    // Módulo Alertas e Incidencias Físicas de Portería
    { codigo: 'incidencias:ver', modulo: 'Alertas de Acceso', nombre: 'Ver Alertas de Accesos Denegados', descripcion: 'Permite consultar intentos de ingreso rechazados (trabajador suspendido, zona no autorizada, doble entrada).' },
    { codigo: 'incidencias:resolver', modulo: 'Alertas de Acceso', nombre: 'Justificar o Resolver Incidencias', descripcion: 'Permite autorizar excepciones o registrar observaciones sobre incidentes de acceso en planta.' },

    // Módulo Seguridad del Sistema (IAM: Usuarios, Roles, Permisos Individuales, Sesiones y Auditoría)
    { codigo: 'seguridad:ver', modulo: 'Seguridad IAM', nombre: 'Ver Usuarios, Sesiones y Bitácora IAM', descripcion: 'Permite auditar usuarios del sistema, matriz de permisos efectivos, sesiones activas y logs de seguridad.' },
    { codigo: 'seguridad:administrar', modulo: 'Seguridad IAM', nombre: 'Administrar Usuarios y Permisos Individuales', descripcion: 'Permite crear usuarios, asignar roles, conceder/revocar permisos individuales (ALLOW/DENY) y cerrar sesiones.' },

    // Módulo Configuración Corporativa
    { codigo: 'configuracion:ver', modulo: 'Configuración Empresa', nombre: 'Ver Configuración de la Empresa', descripcion: 'Permite consultar los datos institucionales, políticas de tolerancia y reglas de control de acceso.' },
    { codigo: 'configuracion:editar', modulo: 'Configuración Empresa', nombre: 'Modificar Configuración Corporativa', descripcion: 'Permite actualizar los parámetros generales de la empresa, sedes y reglas operativas.' }
];

// ============================================================================
// 2. DEFINICIÓN DE ROLES BASE (RBAC)
// ============================================================================
const ROLES_SISTEMA = [
    {
        codigo: 'SUPER_ADMIN',
        nombre: 'Super Administrador General',
        descripcion: 'Control absoluto de la plataforma: Planta, Portería, RR.HH., Zonas, Configuración y Administración de Seguridad IAM.',
        color_badge: '#4f46e5',
        permisos_base: CATALOGO_PERMISOS.map(p => p.codigo) // 18/18 permisos
    },
    {
        codigo: 'VIGILANTE_PORTERIA',
        nombre: 'Vigilante / Oficial de Portería',
        descripcion: 'Encargado de garita y puntos de acceso: registra entradas y salidas de trabajadores, controla visitantes y verifica credenciales.',
        color_badge: '#0284c7',
        permisos_base: [
            'porteria:ver',
            'porteria:registrar',
            'visitantes:ver',
            'visitantes:registrar',
            'trabajadores:ver',
            'zonas:ver',
            'incidencias:ver'
        ]
    },
    {
        codigo: 'SUPERVISOR_RRHH',
        nombre: 'Supervisor de RR.HH. y Asistencia',
        descripcion: 'Gestiona el padrón de trabajadores, asignación de turnos, zonas autorizadas, justificación de tardanzas y reportes de asistencia.',
        color_badge: '#059669',
        permisos_base: [
            'dashboard:ver',
            'porteria:ver',
            'asistencia:ver',
            'asistencia:exportar',
            'trabajadores:ver',
            'trabajadores:crear',
            'trabajadores:editar',
            'visitantes:ver',
            'zonas:ver',
            'zonas:editar',
            'incidencias:ver',
            'incidencias:resolver',
            'configuracion:ver'
        ]
    },
    {
        codigo: 'AUDITOR_SEGURIDAD',
        nombre: 'Auditor de Seguridad e Inspector',
        descripcion: 'Acceso de supervisión e inspección en modo solo lectura sobre planta, historial de accesos, incidencias y bitácora IAM.',
        color_badge: '#d97706',
        permisos_base: [
            'dashboard:ver',
            'porteria:ver',
            'asistencia:ver',
            'asistencia:exportar',
            'trabajadores:ver',
            'visitantes:ver',
            'zonas:ver',
            'incidencias:ver',
            'seguridad:ver',
            'configuracion:ver'
        ]
    }
];

function normalizeRoleCode(rol) {
    if (!rol) return 'VIGILANTE_PORTERIA';
    const upper = String(rol).toUpperCase().trim();
    if (upper === 'ADMIN' || upper === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (upper === 'VIGILANTE' || upper === 'VIGILANTE_PORTERIA' || upper === 'RECEPCIONISTA') return 'VIGILANTE_PORTERIA';
    if (upper === 'RRHH' || upper === 'SUPERVISOR_RRHH') return 'SUPERVISOR_RRHH';
    if (upper === 'AUDITOR' || upper === 'AUDITOR_SEGURIDAD' || upper === 'SUPERVISOR_AUDITOR') return 'AUDITOR_SEGURIDAD';
    return upper;
}

// ============================================================================
// 3. HASHING CRIPTOGRÁFICO DE CONTRASEÑAS (SCRYPT + SALT + TIMING-SAFE)
// ============================================================================
function hashPassword(plainPassword, existingSalt = null) {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    try {
        const derivedKey = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
        return `scrypt$${salt}$${derivedKey}`;
    } catch (e) {
        const fallback = crypto.createHmac('sha256', salt).update(String(plainPassword)).digest('hex');
        return `sha256$${salt}$${fallback}`;
    }
}

function verifyPassword(plainPassword, storedHash) {
    if (!storedHash || !plainPassword) return false;
    const strHash = String(storedHash);
    if (strHash.startsWith('scrypt$')) {
        const parts = strHash.split('$');
        if (parts.length !== 3) return false;
        const [, salt, originalHex] = parts;
        try {
            const candidateHex = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
            const a = Buffer.from(originalHex, 'hex');
            const b = Buffer.from(candidateHex, 'hex');
            if (a.length !== b.length) return false;
            return crypto.timingSafeEqual(a, b);
        } catch (e) {
            // Si la memoria del sistema está bajo presión, intentar con fallback controlado
            console.error('Aviso scryptSync (memoria SO):', e.message);
            return false;
        }
    } else if (strHash.startsWith('sha256$')) {
        const parts = strHash.split('$');
        if (parts.length !== 3) return false;
        const [, salt, originalHex] = parts;
        const candidateHex = crypto.createHmac('sha256', salt).update(String(plainPassword)).digest('hex');
        return candidateHex === originalHex;
    }
    return false;
}

// ============================================================================
// 4. TOKENS DE SESIÓN FIRMADOS (HMAC-SHA256)
// ============================================================================
function createSignedToken(payloadObj) {
    const payloadBase64 = Buffer.from(JSON.stringify(payloadObj), 'utf-8').toString('base64url');
    const signature = crypto
        .createHmac('sha256', SERVER_SECRET)
        .update(payloadBase64)
        .digest('base64url');
    return `${payloadBase64}.${signature}`;
}

function verifySignedToken(tokenStr) {
    if (!tokenStr || typeof tokenStr !== 'string' || !tokenStr.includes('.')) {
        return null;
    }
    const [payloadBase64, signature] = tokenStr.split('.');
    const expectedSig = crypto
        .createHmac('sha256', SERVER_SECRET)
        .update(payloadBase64)
        .digest('base64url');

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
    }
    try {
        const data = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
        if (data.exp && Date.now() > data.exp) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

// ============================================================================
// 5. MOTOR DE RESOLUCIÓN DE PERMISOS INDIVIDUALES (ROL BASE + ALLOW / DENY)
// ============================================================================
/**
 * Calcula los permisos efectivos de un usuario combinando:
 * 1) Permisos heredados de su Rol Base (RBAC)
 * 2) Sobrescrituras individuales (ALLOW = conceder explícitamente, DENY = revocar explícitamente)
 */
function resolveEffectivePermissions(user, customRoles = ROLES_SISTEMA) {
    const roleCode = normalizeRoleCode(user.rol);
    const roleDef = (customRoles || ROLES_SISTEMA).find(r => r.codigo === roleCode) || ROLES_SISTEMA[1];
    const baseSet = new Set(roleDef.permisos_base || []);
    const overrides = user.permisos_individuales || {};

    const effectiveMap = {};
    const effectiveList = [];
    const detailedBreakdown = [];

    for (const perm of CATALOGO_PERMISOS) {
        const code = perm.codigo;
        const overrideState = overrides[code] || 'INHERIT'; // 'ALLOW' | 'DENY' | 'INHERIT'
        const roleHasIt = baseSet.has(code);

        let granted = roleHasIt;
        let origen = roleHasIt ? 'ROL_BASE' : 'NO_ASIGNADO';

        if (overrideState === 'ALLOW') {
            granted = true;
            origen = 'OVERRIDE_INDIVIDUAL_ALLOW';
        } else if (overrideState === 'DENY') {
            granted = false;
            origen = 'OVERRIDE_INDIVIDUAL_DENY';
        }

        effectiveMap[code] = granted;
        if (granted) effectiveList.push(code);

        detailedBreakdown.push({
            codigo: code,
            modulo: perm.modulo,
            nombre: perm.nombre,
            descripcion: perm.descripcion,
            heredado_del_rol: roleHasIt,
            override_individual: overrideState,
            concedido_efectivo: granted,
            origen_resolucion: origen
        });
    }

    return {
        rol_codigo: roleCode,
        rol_nombre: roleDef.nombre,
        rol_color: roleDef.color_badge,
        permisos_lista: effectiveList,
        permisos_mapa: effectiveMap,
        desglose: detailedBreakdown
    };
}

// ============================================================================
// 6. BITÁCORA DE AUDITORÍA DE SEGURIDAD (AUDIT LOGS)
// ============================================================================
function recordAuditLog(db, entry) {
    if (!db.audit_logs) db.audit_logs = [];
    const nextId = db.audit_logs.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const logItem = {
        id: nextId,
        fecha_hora: new Date().toISOString(),
        usuario_id: entry.usuario_id || null,
        usuario_email: entry.usuario_email || 'anónimo',
        rol: entry.rol || 'SIN_SESION',
        evento: entry.evento || 'EVENTO_SISTEMA',
        modulo: entry.modulo || 'seguridad',
        permiso_evaluado: entry.permiso_evaluado || null,
        resultado: entry.resultado || 'EXITO', // 'EXITO' | 'DENEGADO' | 'ALERTA'
        ip: entry.ip || '127.0.0.1',
        detalle: entry.detalle || ''
    };
    db.audit_logs.unshift(logItem);
    if (db.audit_logs.length > 500) {
        db.audit_logs = db.audit_logs.slice(0, 500);
    }
    return logItem;
}

module.exports = {
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
};
