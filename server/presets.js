/**
 * Semillas de Datos Empresariales Oficiales — Recuperaciones Naranjo Recycling S.A.S.
 * Sede Industrial Cartagena de Indias (Bolívar, Colombia).
 *
 * Parametrización Total:
 * - Padrón completo con Cédulas de Ciudadanía colombianas (CC).
 * - Estructura de Cargos de Patio (Jefe de Patio, 2 Grúas Pulpo, 1 Montacargas, Mecánico, Ayudantes, Oxigenistas)
 *   y Administración (Contadores, Auxiliar Contable, Auxiliares Administrativos, Aprendices SENA).
 * - Tabla Oficial de Horarios (42 Horas Semanales L-V - Ley 2101 / CST).
 * - Zonificación de Planta (Portería, Báscula, Patio de Chatarra, Taller y Oficinas).
 */

const {
    CATALOGO_PERMISOS,
    ROLES_SISTEMA,
    hashPassword
} = require('./security');

function getTodayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function buildSecuritySeeds() {
    const nowIso = new Date().toISOString();
    return {
        permisos_catalogo: CATALOGO_PERMISOS,
        roles_sistema: {
            ...ROLES_SISTEMA,
            JEFE_PATIO: {
                nombre: 'Jefe de Patio y Cuadrillas',
                descripcion: 'Supervisión en vivo de cuadrillas de patio, operadores de maquinaria pesada y autorización de jornadas extraordinarias.',
                color: '#ea580c',
                permisos: [
                    'dashboard:ver',
                    'asistencia:ver',
                    'trabajadores:ver',
                    'zonas:ver',
                    'incidencias:ver'
                ]
            }
        },
        usuarios: [
            {
                id: 1,
                nombre_completo: 'Ing. Carlos Naranjo (Director General)',
                email: 'admin@recuperacionesnaranjo.com',
                password_hash: hashPassword('admin123'),
                rol: 'SUPER_ADMIN',
                cargo: 'Director General y Seguridad de Planta',
                max_sesiones_simultaneas: 3,
                politica_concurrencia: 'CERRAR_ANTERIOR',
                activo: true,
                permisos_individuales: {},
                creado_en: nowIso
            },
            {
                id: 2,
                nombre_completo: 'Sgto. Roberto Vargas (Vigilante Garita Principal)',
                email: 'vigilante@recuperacionesnaranjo.com',
                password_hash: hashPassword('vigi123'),
                rol: 'VIGILANTE_PORTERIA',
                cargo: 'Oficial de Seguridad en Garita Peatonal y Báscula',
                max_sesiones_simultaneas: 1,
                politica_concurrencia: 'CERRAR_ANTERIOR',
                activo: true,
                permisos_individuales: {
                    'trabajadores:crear': 'DENY',
                    'seguridad:ver': 'DENY'
                },
                creado_en: nowIso
            },
            {
                id: 3,
                nombre_completo: 'Jorge Eliécer Naranjo (Jefe General de Patio)',
                email: 'jefepatio@recuperacionesnaranjo.com',
                password_hash: hashPassword('patio123'),
                rol: 'JEFE_PATIO',
                cargo: 'Jefe General de Patio y Cuadrillas',
                max_sesiones_simultaneas: 2,
                politica_concurrencia: 'CERRAR_ANTERIOR',
                activo: true,
                permisos_individuales: {
                    'asistencia:ver': 'ALLOW',
                    'trabajadores:ver': 'ALLOW'
                },
                creado_en: nowIso
            },
            {
                id: 4,
                nombre_completo: 'Dra. Beatriz Morales (Contadora & RRHH)',
                email: 'contabilidad@recuperacionesnaranjo.com',
                password_hash: hashPassword('conta123'),
                rol: 'SUPERVISOR_RRHH',
                cargo: 'Directora Contable y Gestión de Talento Humano',
                max_sesiones_simultaneas: 2,
                politica_concurrencia: 'CERRAR_ANTERIOR',
                activo: true,
                permisos_individuales: {
                    'seguridad:usuarios_editar': 'DENY'
                },
                creado_en: nowIso
            }
        ]
    };
}

const PRESETS = {
    naranjo: () => {
        const sec = buildSecuritySeeds();
        const today = getTodayStr(0);

        return {
            preset_activo: 'naranjo',

            // 1. Configuración Oficial de la Empresa
            configuracion_empresa: {
                id: 1,
                nombre_empresa: 'Recuperaciones Naranjo Recycling S.A.S.',
                nit_ruc: '901.884.219-5',
                rubro_empresa: 'Reciclaje y Procesamiento de Metales y Chatarra Industrial',
                slogan_corporativo: 'Control Integral de Acceso, Asistencia 42h y Cuadrillas — Cartagena de Indias',
                direccion: 'Zona Industrial Mamonal Km 7, Cartagena de Indias (Bolívar, Colombia)',
                telefono_central: '+57 (605) 668 5200',
                email_seguridad: 'seguridad@recuperacionesnaranjo.com',
                color_primario: '#ea580c',
                color_secundario: '#0f172a',
                tolerancia_tardanza_min: 10,
                aforo_maximo_planta: 150,
                jornada_semanal_horas: 42,
                regimen_laboral: 'COLOMBIA_LEY_2101_CST'
            },

            // 2. Tabla Oficial de Horarios de Trabajo (42 Horas Lunes a Viernes)
            horarios_oficiales: [
                {
                    dia: 'Lunes',
                    codigo_dia: 1,
                    entrada: '08:00',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:30',
                    duracion_almuerzo_min: 90,
                    salida: '16:30',
                    horas_ordinarias: 7.0,
                    aplica_administracion: true,
                    aplica_patio: true
                },
                {
                    dia: 'Martes',
                    codigo_dia: 2,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '17:00',
                    horas_ordinarias: 8.5,
                    aplica_administracion: true,
                    aplica_patio: true
                },
                {
                    dia: 'Miércoles',
                    codigo_dia: 3,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '17:30',
                    horas_ordinarias: 9.0,
                    aplica_administracion: true,
                    aplica_patio: true
                },
                {
                    dia: 'Jueves',
                    codigo_dia: 4,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '17:30',
                    horas_ordinarias: 9.0,
                    aplica_administracion: true,
                    aplica_patio: true
                },
                {
                    dia: 'Viernes',
                    codigo_dia: 5,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '17:00',
                    horas_ordinarias: 8.5,
                    aplica_administracion: true,
                    aplica_patio: true
                },
                {
                    dia: 'Sábado',
                    codigo_dia: 6,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '13:00',
                    horas_ordinarias: 0.0,
                    aplica_administracion: false,
                    aplica_patio: true,
                    es_jornada_extra: true
                },
                {
                    dia: 'Domingo',
                    codigo_dia: 0,
                    entrada: '07:30',
                    inicio_almuerzo: '12:00',
                    fin_almuerzo: '13:00',
                    duracion_almuerzo_min: 60,
                    salida: '13:00',
                    horas_ordinarias: 0.0,
                    aplica_administracion: false,
                    aplica_patio: true,
                    es_jornada_extra: true
                }
            ],

            // 3. Turnos Laborales del Sistema
            turnos_laborales: [
                {
                    id: 1,
                    codigo: 'TURNO-42H-NARANJO',
                    nombre: 'Jornada Ordinaria Oficial 42h (Lunes 8:00–16:30 / Mar-Vie 7:30–17:00/17:30)',
                    hora_entrada: '07:30',
                    hora_salida: '17:00',
                    tolerancia_minutos: 10,
                    activo: true
                },
                {
                    id: 2,
                    codigo: 'TURNO-PATIO-EXTRAS',
                    nombre: 'Jornada Extraordinaria Patio (Sábados, Domingos y Festivos)',
                    hora_entrada: '07:30',
                    hora_salida: '13:00',
                    tolerancia_minutos: 10,
                    activo: true
                }
            ],

            // 4. Zonificación Física de la Planta Cartagena
            zonas_acceso: [
                {
                    id: 1,
                    codigo: 'PUERTA-01',
                    nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    tipo: 'PEATONAL',
                    nivel_seguridad: 'NIVEL 1 — GENERAL',
                    ubicacion: 'Garita de Entrada Principal — Vía Mamonal',
                    aforo_maximo: 150,
                    estado: 'OPERATIVA'
                },
                {
                    id: 2,
                    codigo: 'PUERTA-02',
                    nombre: 'Báscula Camionera y Acceso Vehicular',
                    tipo: 'VEHICULAR_PESADO',
                    nivel_seguridad: 'NIVEL 2 — OPERATIVO',
                    ubicacion: 'Báscula de Pesaje Chatarra y Muelle de Carga',
                    aforo_maximo: 20,
                    estado: 'OPERATIVA'
                },
                {
                    id: 3,
                    codigo: 'PUERTA-03',
                    nombre: 'Patio de Chatarra y Acopio Pesado (Zona Crítica)',
                    tipo: 'OPERACIONAL_CRITICA',
                    nivel_seguridad: 'NIVEL 3 — ALTO RIESGO EPP OBLIGATORIO',
                    ubicacion: 'Área de Prensas, Oxicorte y Operación Grúas Pulpo',
                    aforo_maximo: 45,
                    estado: 'OPERATIVA'
                },
                {
                    id: 4,
                    codigo: 'PUERTA-04',
                    nombre: 'Taller Mecánico y Mantenimiento de Maquinaria',
                    tipo: 'TECNICO',
                    nivel_seguridad: 'NIVEL 2 — TECNICO AUTORIZADO',
                    ubicacion: 'Bahía de Mantenimiento Pulpos y Montacargas',
                    aforo_maximo: 10,
                    estado: 'OPERATIVA'
                },
                {
                    id: 5,
                    codigo: 'PUERTA-05',
                    nombre: 'Edificio Administrativo y Contabilidad',
                    tipo: 'ADMINISTRATIVO',
                    nivel_seguridad: 'NIVEL 1 — ADMINISTRACION',
                    ubicacion: 'Segundo Piso — Oficinas Gerenciales y RRHH',
                    aforo_maximo: 25,
                    estado: 'OPERATIVA'
                }
            ],

            // 5. Catálogo Oficial de Cargos
            cargos: [
                { id: 1, nombre: 'Jefe de Patio', departamento: 'Patio y Operaciones', tipo: 'PATIO', puesto_critico: true },
                { id: 2, nombre: 'Operador Grúa Pulpo #1', departamento: 'Maquinaria Pesada', tipo: 'PATIO', puesto_critico: true },
                { id: 3, nombre: 'Operador Grúa Pulpo #2', departamento: 'Maquinaria Pesada', tipo: 'PATIO', puesto_critico: true },
                { id: 4, nombre: 'Operador de Montacargas', departamento: 'Maquinaria Pesada', tipo: 'PATIO', puesto_critico: true },
                { id: 5, nombre: 'Mecánico de Planta', departamento: 'Mantenimiento', tipo: 'PATIO', puesto_critico: true },
                { id: 6, nombre: 'Ayudante de Patio', departamento: 'Patio y Clasificación', tipo: 'PATIO', puesto_critico: false },
                { id: 7, nombre: 'Oxigenista / Clasificador', departamento: 'Oxicorte y Desguace', tipo: 'PATIO', puesto_critico: true },
                { id: 8, nombre: 'Operador Báscula / Garita', departamento: 'Seguridad y Pesaje', tipo: 'PATIO', puesto_critico: true },
                { id: 9, nombre: 'Contador General', departamento: 'Administración y Finanzas', tipo: 'ADMINISTRACION', puesto_critico: false },
                { id: 10, nombre: 'Auxiliar Contable', departamento: 'Administración y Finanzas', tipo: 'ADMINISTRACION', puesto_critico: false },
                { id: 11, nombre: 'Auxiliar Administrativo', departamento: 'Administración', tipo: 'ADMINISTRACION', puesto_critico: false },
                { id: 12, nombre: 'Auxiliar SENA (Aprendiz)', departamento: 'Talento Humano / SENA', tipo: 'APRENDIZ_SENA', puesto_critico: false }
            ],

            // 6. Padrón Oficial de Trabajadores con Cédulas de Ciudadanía
            trabajadores: [
                {
                    id: 1,
                    codigo_credencial: 'EMP-001',
                    documento: '73189450',
                    nombre_completo: 'Jorge Eliécer Naranjo',
                    cargo_id: 1,
                    cargo: 'Jefe de Patio',
                    departamento: 'Patio y Operaciones',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3104589921',
                    email: 'jorge.naranjo@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2, 3, 4, 5],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:15`,
                    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 2,
                    codigo_credencial: 'EMP-002',
                    documento: '73204911',
                    nombre_completo: 'Manuel Antonio Herrera',
                    cargo_id: 2,
                    cargo: 'Operador Grúa Pulpo #1',
                    departamento: 'Maquinaria Pesada',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3017765412',
                    email: 'mherrera@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2, 3],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:22`,
                    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 3,
                    codigo_credencial: 'EMP-003',
                    documento: '1047412890',
                    nombre_completo: 'Wilfrido Mendoza Polo',
                    cargo_id: 3,
                    cargo: 'Operador Grúa Pulpo #2',
                    departamento: 'Maquinaria Pesada',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3145620981',
                    email: 'wmendoza@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2, 3],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:28`,
                    foto_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 4,
                    codigo_credencial: 'EMP-004',
                    documento: '73155823',
                    nombre_completo: 'Carlos Mario Berrío',
                    cargo_id: 4,
                    cargo: 'Operador de Montacargas',
                    departamento: 'Maquinaria Pesada',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3128901243',
                    email: 'cberrio@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2, 3, 4],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:25`,
                    foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 5,
                    codigo_credencial: 'EMP-005',
                    documento: '91438902',
                    nombre_completo: 'Pedro Pablo Caicedo',
                    cargo_id: 5,
                    cargo: 'Mecánico de Planta',
                    departamento: 'Mantenimiento',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3187219904',
                    email: 'pcaicedo@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2, 3, 4],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:18`,
                    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 6,
                    codigo_credencial: 'EMP-006',
                    documento: '1048220199',
                    nombre_completo: 'Everaldo Ballestas',
                    cargo_id: 6,
                    cargo: 'Ayudante de Patio',
                    departamento: 'Patio y Clasificación',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3004518722',
                    email: 'eballestas@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 3],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:29`,
                    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 7,
                    codigo_credencial: 'EMP-007',
                    documento: '1050893412',
                    nombre_completo: 'Luis Fernando Puello',
                    cargo_id: 6,
                    cargo: 'Ayudante de Patio',
                    departamento: 'Patio y Clasificación',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3023419082',
                    email: 'lpuello@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 3],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'FUERA_PLANTA',
                    ultima_entrada: null,
                    foto_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 8,
                    codigo_credencial: 'EMP-008',
                    documento: '73561209',
                    nombre_completo: 'Gustavo Adolfo Zúñiga',
                    cargo_id: 7,
                    cargo: 'Oxigenista / Clasificador',
                    departamento: 'Oxicorte y Desguace',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3139824410',
                    email: 'gzuniga@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 3],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:24`,
                    foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 9,
                    codigo_credencial: 'EMP-009',
                    documento: '73120485',
                    nombre_completo: 'Roberto Vargas',
                    cargo_id: 8,
                    cargo: 'Operador Báscula / Garita',
                    departamento: 'Seguridad y Pesaje',
                    tipo_personal: 'PATIO',
                    es_puesto_critico: true,
                    turno_id: 1,
                    telefono: '3116548701',
                    email: 'rvargas@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 2],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:05`,
                    foto_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 10,
                    codigo_credencial: 'EMP-010',
                    documento: '45512903',
                    nombre_completo: 'Beatriz Morales',
                    cargo_id: 9,
                    cargo: 'Contador General',
                    departamento: 'Administración y Finanzas',
                    tipo_personal: 'ADMINISTRACION',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3156782290',
                    email: 'bmorales@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 5],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:26`,
                    foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 11,
                    codigo_credencial: 'EMP-011',
                    documento: '1047399820',
                    nombre_completo: 'Diana Marcela Torres',
                    cargo_id: 10,
                    cargo: 'Auxiliar Contable',
                    departamento: 'Administración y Finanzas',
                    tipo_personal: 'ADMINISTRACION',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3012904415',
                    email: 'dtorres@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 5],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:29`,
                    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 12,
                    codigo_credencial: 'EMP-012',
                    documento: '32890451',
                    nombre_completo: 'Martha Mercado',
                    cargo_id: 11,
                    cargo: 'Auxiliar Administrativo',
                    departamento: 'Administración',
                    tipo_personal: 'ADMINISTRACION',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3167812901',
                    email: 'mmercado@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 5],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:32`,
                    foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 13,
                    codigo_credencial: 'EMP-013',
                    documento: '1143419082',
                    nombre_completo: 'Kevin Castillo',
                    cargo_id: 12,
                    cargo: 'Auxiliar SENA (Etapa Productiva)',
                    departamento: 'Talento Humano / SENA',
                    tipo_personal: 'APRENDIZ_SENA',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3046719920',
                    email: 'kcastillo@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 5],
                    estado: 'ACTIVO',
                    arl_vigente: true,
                    ubicacion_actual: 'DENTRO_PLANTA',
                    ultima_entrada: `${today} 07:28`,
                    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
                },
                {
                    id: 14,
                    codigo_credencial: 'EMP-014',
                    documento: '1051892301',
                    nombre_completo: 'Estefany Salazar',
                    cargo_id: 12,
                    cargo: 'Auxiliar SENA (Etapa Lectiva)',
                    departamento: 'Talento Humano / SENA',
                    tipo_personal: 'APRENDIZ_SENA',
                    es_puesto_critico: false,
                    turno_id: 1,
                    telefono: '3009817723',
                    email: 'esalazar@recuperacionesnaranjo.com',
                    zonas_autorizadas: [1, 5],
                    estado: 'SUSPENDIDO',
                    arl_vigente: false,
                    ubicacion_actual: 'FUERA_PLANTA',
                    ultima_entrada: null,
                    foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'
                }
            ],

            // 7. Registros de Acceso Iniciales
            registros_acceso: [
                {
                    id: 1,
                    codigo_movimiento: 'ACC-1001',
                    trabajador_id: 1,
                    codigo_credencial: 'EMP-001',
                    documento: '73189450',
                    trabajador_nombre: 'Jorge Eliécer Naranjo',
                    departamento: 'Patio y Operaciones',
                    zona_id: 1,
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    fecha: today,
                    hora_entrada: '07:15',
                    hora_salida: null,
                    estado_asistencia: 'PUNTUAL',
                    estado_ciclo: 'EN_PLANTA',
                    minutos_trabajados: null,
                    horas_formateadas: 'En curso (En planta)',
                    metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
                    registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
                    registrado_por_nombre: 'Terminal Kiosco Portería',
                    observacion: 'Entrada registrada en garita principal.'
                },
                {
                    id: 2,
                    codigo_movimiento: 'ACC-1002',
                    trabajador_id: 2,
                    codigo_credencial: 'EMP-002',
                    documento: '73204911',
                    trabajador_nombre: 'Manuel Antonio Herrera',
                    departamento: 'Maquinaria Pesada',
                    zona_id: 1,
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    fecha: today,
                    hora_entrada: '07:22',
                    hora_salida: null,
                    estado_asistencia: 'PUNTUAL',
                    estado_ciclo: 'EN_PLANTA',
                    minutos_trabajados: null,
                    horas_formateadas: 'En curso (En planta)',
                    metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
                    registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
                    registrado_por_nombre: 'Terminal Kiosco Portería',
                    observacion: 'Entrada puntual a operación Grúa Pulpo #1.'
                },
                {
                    id: 3,
                    codigo_movimiento: 'ACC-1003',
                    trabajador_id: 3,
                    codigo_credencial: 'EMP-003',
                    documento: '1047412890',
                    trabajador_nombre: 'Wilfrido Mendoza Polo',
                    departamento: 'Maquinaria Pesada',
                    zona_id: 1,
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    fecha: today,
                    hora_entrada: '07:28',
                    hora_salida: null,
                    estado_asistencia: 'PUNTUAL',
                    estado_ciclo: 'EN_PLANTA',
                    minutos_trabajados: null,
                    horas_formateadas: 'En curso (En planta)',
                    metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
                    registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
                    registrado_por_nombre: 'Terminal Kiosco Portería',
                    observacion: 'Entrada puntual a operación Grúa Pulpo #2.'
                },
                {
                    id: 4,
                    codigo_movimiento: 'ACC-1004',
                    trabajador_id: 4,
                    codigo_credencial: 'EMP-004',
                    documento: '73155823',
                    trabajador_nombre: 'Carlos Mario Berrío',
                    departamento: 'Maquinaria Pesada',
                    zona_id: 1,
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    fecha: today,
                    hora_entrada: '07:25',
                    hora_salida: null,
                    estado_asistencia: 'PUNTUAL',
                    estado_ciclo: 'EN_PLANTA',
                    minutos_trabajados: null,
                    horas_formateadas: 'En curso (En planta)',
                    metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
                    registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
                    registrado_por_nombre: 'Terminal Kiosco Portería',
                    observacion: 'Entrada puntual a operación Montacargas.'
                },
                {
                    id: 5,
                    codigo_movimiento: 'ACC-1005',
                    trabajador_id: 5,
                    codigo_credencial: 'EMP-005',
                    documento: '91438902',
                    trabajador_nombre: 'Pedro Pablo Caicedo',
                    departamento: 'Mantenimiento',
                    zona_id: 1,
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    fecha: today,
                    hora_entrada: '07:18',
                    hora_salida: null,
                    estado_asistencia: 'PUNTUAL',
                    estado_ciclo: 'EN_PLANTA',
                    minutos_trabajados: null,
                    horas_formateadas: 'En curso (En planta)',
                    metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
                    registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
                    registrado_por_nombre: 'Terminal Kiosco Portería',
                    observacion: 'Entrada mecánica y mantenimiento de maquinaria.'
                }
            ],

            // 8. Control de Visitantes y Camiones de Chatarra
            visitantes: [
                {
                    id: 1,
                    codigo_visita: 'VIS-001',
                    nombre_completo: 'Gustavo Adolfo Buelvas',
                    documento: '73198004',
                    empresa_origen: 'Transportes y Cargas del Caribe S.A.S.',
                    placa_vehiculo: 'WHL-892',
                    motivo_visita: 'Entrega de chatarra ferrosa pesada en báscula',
                    anfitrion_visitado: 'Jorge Eliécer Naranjo (Jefe de Patio)',
                    gafete_asignado: 'VIS-01',
                    zona_id: 2,
                    zona_nombre: 'Báscula Camionera y Acceso Vehicular',
                    fecha: today,
                    hora_ingreso: '07:40',
                    hora_salida: null,
                    estado: 'DENTRO',
                    registrado_por_email: 'vigilante@recuperacionesnaranjo.com'
                }
            ],

            // 9. Incidencias de Acceso
            incidencias_acceso: [
                {
                    id: 1,
                    fecha_hora: `${today} 07:35`,
                    trabajador_nombre: 'Estefany Salazar (EMP-014)',
                    documento: '1051892301',
                    zona_nombre: 'Portería Principal Peatonal (Kiosco Táctil Cédula)',
                    tipo_alerta: 'CREDENCIAL_SUSPENDIDO',
                    severidad: 'ALTA',
                    detalle: 'Intento de ENTRADA bloqueado: el trabajador tiene estado [SUSPENDIDO] por vencimiento de convenio formativo SENA.',
                    estado_resolucion: 'PENDIENTE',
                    registrado_por: 'Terminal Kiosco Portería'
                }
            ],

            // 10. Autorizaciones de Jornadas Extraordinarias en Fin de Semana (Patio)
            autorizaciones_extras_patio: [
                {
                    id: 1,
                    trabajador_id: 5,
                    nombre_trabajador: 'Pedro Pablo Caicedo (Mecánico de Planta)',
                    fecha_programada: today,
                    dia: 'SÁBADO',
                    horas_estimadas: 6.0,
                    motivo: 'Mantenimiento mayor preventivo al sistema hidráulico de la Grúa Pulpo #1',
                    autorizado_por: 'Jorge Eliécer Naranjo (Jefe de Patio)',
                    estado: 'APROBADO'
                }
            ],

            sesiones_activas: [],

            audit_logs: [
                {
                    id: 1,
                    timestamp: `${today}T12:00:00.000Z`,
                    evento: 'SISTEMA_INICIADO',
                    modulo: 'sistema',
                    usuario_email: 'sistema@recuperacionesnaranjo.com',
                    ip: '127.0.0.1',
                    detalle: 'Servidor Recuperaciones Naranjo iniciado en sede Cartagena con configuración oficial 42h (Ley 2101).'
                }
            ],

            ...sec
        };
    }
};

module.exports = {
    PRESETS,
    getTodayStr
};
