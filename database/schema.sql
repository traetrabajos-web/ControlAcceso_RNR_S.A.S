-- ============================================================================
-- BASE DE DATOS RELACIONAL: SISTEMA INTEGRAL DE CONTROL DE ACCESO, ASISTENCIA 42H
-- Y GESTIÓN DE PORTERÍA INDUSTRIAL (SENTINELPRO ACCESS & IAM)
-- ============================================================================
-- EMPRESA: Recuperaciones Naranjo Recycling S.A.S.
-- SEDE: Zona Industrial Mamonal / Cartagena de Indias, Bolívar, Colombia
-- NIT: 901.884.219-5
-- RÉGIMEN LABORAL: Ley 2101 de 2021 / Código Sustantivo del Trabajo (Colombia)
-- JORNADA SEMANAL: 42.0 Horas Ordinarias (Lunes a Viernes)
-- CARGOS OPERATIVOS PATIO: Jefe de Patio, 2 Operadores Grúa Pulpo, 1 Montacargas,
--                          Mecánico de Planta, Ayudantes de Patio y Oxigenistas.
-- CARGOS ADMINISTRATIVOS:  Contador General, Auxiliar Contable, Auxiliares Administrativos
--                          y Aprendices SENA.
-- COMPATIBILIDAD: MySQL 8.0+ / MariaDB 10.5+ / PostgreSQL (ANSI SQL Compliant)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `sentinelpro_iam` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sentinelpro_iam`;

-- Desactivar temporalmente revisión de llaves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `sesiones_activas`;
DROP TABLE IF EXISTS `usuario_permisos_individuales`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `rol_permisos`;
DROP TABLE IF EXISTS `roles_sistema`;
DROP TABLE IF EXISTS `permisos_catalogo`;
DROP TABLE IF EXISTS `pesajes_bascula`;
DROP TABLE IF EXISTS `vehiculos_camiones_chatarra`;
DROP TABLE IF EXISTS `visitantes`;
DROP TABLE IF EXISTS `incidencias_acceso`;
DROP TABLE IF EXISTS `autorizaciones_extras_patio`;
DROP TABLE IF EXISTS `jornadas_liquidadas_diarias`;
DROP TABLE IF EXISTS `marcas_crudo_lector`;
DROP TABLE IF EXISTS `registros_acceso`;
DROP TABLE IF EXISTS `trabajador_zonas_autorizadas`;
DROP TABLE IF EXISTS `trabajadores`;
DROP TABLE IF EXISTS `dispositivos_kiosco`;
DROP TABLE IF EXISTS `zonas_acceso`;
DROP TABLE IF EXISTS `cargos`;
DROP TABLE IF EXISTS `departamentos`;
DROP TABLE IF EXISTS `conceptos_recargos_ley2101`;
DROP TABLE IF EXISTS `turnos_laborales`;
DROP TABLE IF EXISTS `configuracion_empresa`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. CONFIGURACIÓN CORPORATIVA Y HORARIOS OFICIALES (42 HORAS)
-- ============================================================================

CREATE TABLE `configuracion_empresa` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre_empresa` VARCHAR(150) NOT NULL DEFAULT 'Recuperaciones Naranjo Recycling S.A.S.',
    `nit_ruc` VARCHAR(30) NOT NULL DEFAULT '901.884.219-5',
    `rubro_empresa` VARCHAR(150) NOT NULL DEFAULT 'Reciclaje de Metales, Chatarra Industrial, Oxicorte y Desintegración',
    `slogan_corporativo` VARCHAR(255) DEFAULT 'Líderes en Reciclaje Sostenible y Economía Circular en el Caribe',
    `direccion` VARCHAR(200) NOT NULL DEFAULT 'Zona Industrial Mamonal Km 7, Cartagena de Indias, Bolívar',
    `ciudad` VARCHAR(100) NOT NULL DEFAULT 'Cartagena de Indias',
    `departamento_pais` VARCHAR(100) NOT NULL DEFAULT 'Bolívar, Colombia',
    `telefono_central` VARCHAR(50) DEFAULT '+57 (605) 669-8200',
    `email_seguridad` VARCHAR(100) DEFAULT 'seguridad.planta@recuperacionesnaranjo.com',
    `color_primario` VARCHAR(20) DEFAULT '#ea580c',
    `color_secundario` VARCHAR(20) DEFAULT '#0f172a',
    `tolerancia_tardanza_min` INT NOT NULL DEFAULT 10 COMMENT 'Minutos de gracia oficial para marcación de entrada',
    `aforo_maximo_planta` INT NOT NULL DEFAULT 150 COMMENT 'Aforo de seguridad para evacuación SST y ARL',
    `jornada_semanal_horas` DECIMAL(4,1) NOT NULL DEFAULT 42.0 COMMENT 'Jornada semanal Ley 2101 de 2021',
    `regimen_laboral` VARCHAR(80) NOT NULL DEFAULT 'COLOMBIA_LEY_2101_CST',
    `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Parámetros maestros y directrices laborales de la empresa';

CREATE TABLE `turnos_laborales` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dia` VARCHAR(25) NOT NULL COMMENT 'Lunes, Martes, ..., Domingo',
    `codigo_dia` INT NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
    `hora_entrada` TIME NOT NULL,
    `inicio_almuerzo` TIME NOT NULL,
    `fin_almuerzo` TIME NOT NULL,
    `duracion_almuerzo_min` INT NOT NULL COMMENT 'Minutos descontados de descanso',
    `hora_salida` TIME NOT NULL,
    `horas_ordinarias` DECIMAL(4,2) NOT NULL COMMENT 'Horas netas de trabajo que computan para las 42h',
    `aplica_administracion` BOOLEAN NOT NULL DEFAULT TRUE,
    `aplica_patio` BOOLEAN NOT NULL DEFAULT TRUE,
    `es_jornada_extra` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si el día genera recargo extraordinario',
    `descripcion_regla` VARCHAR(255) NULL,
    CONSTRAINT `chk_codigo_dia` CHECK (`codigo_dia` BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Distribución de las 42 horas semanales por día (Memorando Oficial)';

CREATE TABLE `conceptos_recargos_ley2101` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(20) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `factor_multiplicador` DECIMAL(5,4) NOT NULL COMMENT 'Factor sobre valor hora ordinaria',
    `porcentaje_recargo` DECIMAL(5,2) NOT NULL COMMENT '25%, 35%, 75%, 100%',
    `franja_inicio` TIME NULL,
    `franja_fin` TIME NULL,
    `aplica_festivos` BOOLEAN DEFAULT FALSE,
    `descripcion` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo de recargos conforme al Código Sustantivo del Trabajo de Colombia';

-- ============================================================================
-- 2. ESTRUCTURA ORGANIZACIONAL, CARGOS Y ZONAS FÍSICAS DE PLANTA
-- ============================================================================

CREATE TABLE `departamentos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(30) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `responsable_nombre` VARCHAR(120) NULL,
    `ubicacion_planta` VARCHAR(120) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Áreas funcionales de la empresa';

CREATE TABLE `cargos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `departamento_id` INT NOT NULL,
    `codigo` VARCHAR(30) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo_personal` ENUM('PATIO', 'ADMINISTRACION', 'APRENDIZ_SENA') NOT NULL DEFAULT 'PATIO',
    `es_puesto_critico` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si es crítico genera alerta de ausencia a los 15 min',
    `descripcion_funciones` TEXT NULL,
    `requiere_epp_especial` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Puestos de trabajo y niveles de criticidad operativa';

CREATE TABLE `zonas_acceso` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(20) NOT NULL UNIQUE,
    `nombre` VARCHAR(120) NOT NULL,
    `tipo` ENUM('PEATONAL', 'VEHICULAR_PESADO', 'OPERACIONAL_CRITICA', 'TECNICO', 'ADMINISTRATIVO') NOT NULL,
    `nivel_seguridad` VARCHAR(60) NOT NULL DEFAULT 'CONTROL_ESTRICTO',
    `ubicacion` VARCHAR(150) NULL,
    `aforo_maximo` INT NOT NULL DEFAULT 50,
    `estado` ENUM('OPERATIVA', 'MANTENIMIENTO', 'BLOQUEADA_EMERGENCIA') NOT NULL DEFAULT 'OPERATIVA',
    `descripcion` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Zonas físicas delimitadas en la sede de Cartagena';

CREATE TABLE `dispositivos_kiosco` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `zona_id` INT NOT NULL,
    `codigo_dispositivo` VARCHAR(50) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo_hardware` ENUM('KIOSCO_TACTIL', 'LECTOR_BARRAS_PDF417', 'BASCULA_DIGITAL', 'TABLET_SUPERVISOR') NOT NULL,
    `ip_asignada` VARCHAR(45) NOT NULL,
    `mac_address` VARCHAR(30) NULL,
    `ubicacion_garita` VARCHAR(100) NOT NULL,
    `modo_offline_habilitado` BOOLEAN NOT NULL DEFAULT TRUE,
    `estado_conexion` ENUM('ONLINE', 'OFFLINE', 'ERROR_SINCRONIZACION') NOT NULL DEFAULT 'ONLINE',
    `ultimo_ping` DATETIME NULL,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_acceso`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Terminales táctiles y periféricos en garita y patio';

-- ============================================================================
-- 3. PADRÓN MAESTRO DE TRABAJADORES Y PERMISOS DE ZONA FÍSICA
-- ============================================================================

CREATE TABLE `trabajadores` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo_credencial` VARCHAR(30) NOT NULL UNIQUE,
    `documento` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Cédula de Ciudadanía Colombiana (CC)',
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `nombre_completo` VARCHAR(160) NOT NULL,
    `cargo_id` INT NOT NULL,
    `cargo` VARCHAR(100) NOT NULL,
    `departamento` VARCHAR(100) NOT NULL,
    `tipo_personal` ENUM('PATIO', 'ADMINISTRACION', 'APRENDIZ_SENA') NOT NULL DEFAULT 'PATIO',
    `es_puesto_critico` BOOLEAN NOT NULL DEFAULT FALSE,
    `turno_id` INT NOT NULL DEFAULT 1,
    `telefono` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `contacto_emergencia` VARCHAR(150) NULL,
    `rh_grupo_sanguineo` VARCHAR(10) DEFAULT 'O+',
    `arl_vigente` BOOLEAN NOT NULL DEFAULT TRUE,
    `fecha_afiliacion_arl` DATE NULL,
    `eps_salud` VARCHAR(100) DEFAULT 'Coomeva / Sura',
    `estado` ENUM('ACTIVO', 'SUSPENDIDO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `ubicacion_actual` ENUM('DENTRO_PLANTA', 'FUERA_PLANTA') NOT NULL DEFAULT 'FUERA_PLANTA',
    `ultima_entrada` DATETIME NULL,
    `ultima_salida` DATETIME NULL,
    `foto_url` VARCHAR(255) NULL,
    `observaciones` TEXT NULL,
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`cargo_id`) REFERENCES `cargos`(`id`) ON DELETE RESTRICT,
    INDEX `idx_trabajador_documento` (`documento`),
    INDEX `idx_trabajador_credencial` (`codigo_credencial`),
    INDEX `idx_trabajador_estado` (`estado`),
    INDEX `idx_trabajador_ubicacion` (`ubicacion_actual`),
    INDEX `idx_trabajador_tipo` (`tipo_personal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Maestro de colaboradores de Recuperaciones Naranjo';

CREATE TABLE `trabajador_zonas_autorizadas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trabajador_id` INT NOT NULL,
    `zona_id` INT NOT NULL,
    `nivel_permiso` ENUM('PERMITIDO', 'DENEGADO_RESTRINGIDO', 'SUPERVISADO') NOT NULL DEFAULT 'PERMITIDO',
    `asignado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `asignado_por` VARCHAR(100) DEFAULT 'SISTEMA_ADMIN',
    UNIQUE KEY `uk_trabajador_zona` (`trabajador_id`, `zona_id`),
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_acceso`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permisos físicos de ingreso a zonas específicas por trabajador';

-- ============================================================================
-- 4. CONTROL DE ASISTENCIA, FICHAJES EN KIOSCO Y JORNADAS LABORALES
-- ============================================================================

CREATE TABLE `registros_acceso` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo_movimiento` VARCHAR(40) NOT NULL UNIQUE,
    `trabajador_id` INT NOT NULL,
    `codigo_credencial` VARCHAR(30) NOT NULL,
    `documento` VARCHAR(30) NOT NULL COMMENT 'Cédula física digitada o leída',
    `trabajador_nombre` VARCHAR(160) NOT NULL,
    `departamento` VARCHAR(100) NOT NULL,
    `zona_id` INT NOT NULL,
    `zona_nombre` VARCHAR(120) NOT NULL,
    `dispositivo_id` INT NULL,
    `fecha` DATE NOT NULL,
    `hora_entrada` TIME NOT NULL,
    `hora_salida` TIME NULL,
    `estado_asistencia` ENUM('PUNTUAL', 'TARDANZA', 'EXTRAORDINARIA', 'SALIDA_ANTICIPADA') NOT NULL DEFAULT 'PUNTUAL',
    `minutos_tardanza` INT NOT NULL DEFAULT 0,
    `estado_ciclo` ENUM('EN_PLANTA', 'FINALIZADO') NOT NULL DEFAULT 'EN_PLANTA',
    `minutos_trabajados` INT NULL,
    `horas_formateadas` VARCHAR(50) NULL,
    `metodo_identificacion` ENUM('TERMINAL_KIOSCO_PIN', 'CODIGO_BARRAS_CC', 'TARJETA_RFID', 'MANUAL_VIGILANTE') NOT NULL DEFAULT 'TERMINAL_KIOSCO_PIN',
    `es_modo_offline` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Verdadero si se capturó sin conexión y se sincronizó luego',
    `anti_passback_violado` BOOLEAN NOT NULL DEFAULT FALSE,
    `registrado_por_email` VARCHAR(100) DEFAULT 'kiosco.porteria@recuperacionesnaranjo.com',
    `registrado_por_nombre` VARCHAR(100) DEFAULT 'Terminal Garita Principal',
    `observacion` TEXT NULL,
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_acceso`(`id`) ON DELETE RESTRICT,
    INDEX `idx_registros_fecha` (`fecha`),
    INDEX `idx_registros_doc` (`documento`),
    INDEX `idx_registros_ciclo` (`estado_ciclo`),
    INDEX `idx_registros_trabajador_fecha` (`trabajador_id`, `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Registros de fichajes de entrada y salida con cómputo de horas';

CREATE TABLE `marcas_crudo_lector` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `dispositivo_id` INT NULL,
    `payload_crudo` VARCHAR(255) NOT NULL,
    `tipo_lectura` ENUM('PIN_TECLADO', 'SCAN_PDF417', 'PROXIMITY_RFID') NOT NULL,
    `timestamp_captura` DATETIME(3) NOT NULL,
    `sincronizado` BOOLEAN NOT NULL DEFAULT TRUE,
    `procesado_exito` BOOLEAN NOT NULL DEFAULT TRUE,
    `codigo_error` VARCHAR(50) NULL,
    `ip_origen` VARCHAR(45) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bitácora de bajo nivel para resiliencia offline en garita';

CREATE TABLE `autorizaciones_extras_patio` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trabajador_id` INT NOT NULL,
    `nombre_trabajador` VARCHAR(160) NOT NULL,
    `fecha_programada` DATE NOT NULL,
    `dia` VARCHAR(25) NOT NULL,
    `tipo_jornada` ENUM('SABADO_MANTENIMIENTO', 'DOMINGO_DESINTEGRACION', 'FESTIVO_CARGUE_BUQUE', 'EXTENSION_ENTRESEMANA') NOT NULL DEFAULT 'SABADO_MANTENIMIENTO',
    `horas_estimadas` DECIMAL(4,2) NOT NULL,
    `motivo` TEXT NOT NULL,
    `autorizado_por` VARCHAR(120) NOT NULL COMMENT 'Jefe de Patio o Gerente de Operaciones',
    `autorizado_por_email` VARCHAR(100) NOT NULL,
    `estado` ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO', 'EJECUTADO') NOT NULL DEFAULT 'APROBADO',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE CASCADE,
    INDEX `idx_autoriza_fecha` (`fecha_programada`),
    INDEX `idx_autoriza_trabajador` (`trabajador_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Autorizaciones firmadas para jornadas de fin de semana y extras de patio';

CREATE TABLE `jornadas_liquidadas_diarias` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `trabajador_id` INT NOT NULL,
    `registro_acceso_id` INT NULL,
    `fecha` DATE NOT NULL,
    `dia_semana` VARCHAR(20) NOT NULL,
    `hora_entrada_real` TIME NOT NULL,
    `hora_salida_real` TIME NOT NULL,
    `minutos_almuerzo_descontados` INT NOT NULL DEFAULT 60,
    `horas_ordinarias_hod` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Horas estándar (máx 7.0 lun, 8.5 mar/vie, 9.0 mié/jue)',
    `horas_extras_diurnas_hed` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Excedente diurno o sábados (+25%)',
    `horas_extras_nocturnas_hen` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Extras entre 21:00 y 06:00 (+75%)',
    `recargo_nocturno_rn` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Ordinarias nocturnas (+35%)',
    `horas_dominical_festivo_rdf` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Domingos y festivos (+75%/100%)',
    `total_horas_computadas` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    `es_sabado` BOOLEAN NOT NULL DEFAULT FALSE,
    `es_domingo_festivo` BOOLEAN NOT NULL DEFAULT FALSE,
    `estado_liquidacion` ENUM('PRELIQUIDADO', 'APROBADO_RRHH', 'EXPORTADO_CONTABILIDAD') NOT NULL DEFAULT 'PRELIQUIDADO',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`registro_acceso_id`) REFERENCES `registros_acceso`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `uk_trabajador_jornada_fecha` (`trabajador_id`, `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Motor de pre-liquidación diaria de nómina según Ley 2101 / CST';

-- ============================================================================
-- 5. CONTROL DE BÁSCULA, CAMIONES DE CHATARRA Y VISITANTES
-- ============================================================================

CREATE TABLE `vehiculos_camiones_chatarra` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `placa` VARCHAR(15) NOT NULL UNIQUE,
    `tipo_vehiculo` ENUM('TRACTOMULA', 'VOLQUETA_DOBLETROQUE', 'CAMION_SENCILLO', 'FURGON', 'PARTICULAR') NOT NULL,
    `empresa_transportadora` VARCHAR(150) NOT NULL,
    `conductor_cedula` VARCHAR(30) NOT NULL,
    `conductor_nombre` VARCHAR(150) NOT NULL,
    `conductor_telefono` VARCHAR(30) NULL,
    `soat_vigente` BOOLEAN NOT NULL DEFAULT TRUE,
    `tecnomecanica_vigente` BOOLEAN NOT NULL DEFAULT TRUE,
    `estado` ENUM('ACTIVO', 'LISTA_NEGRA', 'RESTRINGIDO') NOT NULL DEFAULT 'ACTIVO',
    `observaciones` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Padrón de camiones de carga pesada y proveedores de chatarra';

CREATE TABLE `pesajes_bascula` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `numero_tiquete` VARCHAR(30) NOT NULL UNIQUE,
    `vehiculo_id` INT NOT NULL,
    `conductor_nombre` VARCHAR(150) NOT NULL,
    `conductor_documento` VARCHAR(30) NOT NULL,
    `empresa_cliente_proveedor` VARCHAR(150) NOT NULL,
    `tipo_operacion` ENUM('COMPRA_CHATARRA', 'VENTA_EXPORTACION', 'TRASLADO_INTERNO') NOT NULL,
    `tipo_material` VARCHAR(100) NOT NULL COMMENT 'Chatarra Gruesa, Acero Estructural, Aluminio, Cobre, Baterías',
    `peso_bruto_kg` DECIMAL(10,2) NOT NULL,
    `peso_tara_kg` DECIMAL(10,2) NULL,
    `peso_neto_kg` DECIMAL(10,2) NULL,
    `fecha_entrada` DATE NOT NULL,
    `hora_entrada` TIME NOT NULL,
    `hora_salida` TIME NULL,
    `operador_bascula` VARCHAR(100) NOT NULL,
    `estado` ENUM('PESAJE_INICIAL', 'COMPLETADO_DESCARGADO', 'ANULADO') NOT NULL DEFAULT 'PESAJE_INICIAL',
    `observacion` TEXT NULL,
    FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos_camiones_chatarra`(`id`) ON DELETE RESTRICT,
    INDEX `idx_pesajes_fecha` (`fecha_entrada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Control de pesaje en báscula camionera de garita';

CREATE TABLE `visitantes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo_visita` VARCHAR(30) NOT NULL UNIQUE,
    `nombre_completo` VARCHAR(120) NOT NULL,
    `documento` VARCHAR(30) NOT NULL,
    `empresa_origen` VARCHAR(120) NOT NULL,
    `placa_vehiculo` VARCHAR(20) NULL,
    `motivo_visita` TEXT NOT NULL,
    `anfitrion_visitado` VARCHAR(120) NOT NULL,
    `gafete_asignado` VARCHAR(30) NOT NULL,
    `zona_id` INT NOT NULL,
    `zona_nombre` VARCHAR(120) NOT NULL,
    `fecha` DATE NOT NULL,
    `hora_ingreso` TIME NOT NULL,
    `hora_salida` TIME NULL,
    `arl_verificada` BOOLEAN NOT NULL DEFAULT TRUE,
    `estado` ENUM('DENTRO', 'SALIO', 'CANCELADO') NOT NULL DEFAULT 'DENTRO',
    `registrado_por_email` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_acceso`(`id`) ON DELETE RESTRICT,
    INDEX `idx_visitantes_fecha` (`fecha`),
    INDEX `idx_visitantes_doc` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bitácora de contratistas, clientes y visitantes en portería';

CREATE TABLE `incidencias_acceso` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `fecha_hora` DATETIME NOT NULL,
    `trabajador_nombre` VARCHAR(120) NOT NULL,
    `documento` VARCHAR(30) NOT NULL,
    `zona_nombre` VARCHAR(120) NOT NULL,
    `tipo_alerta` VARCHAR(60) NOT NULL COMMENT 'CREDENCIAL_SUSPENDIDA, ZONA_NO_AUTORIZADA, AUSENCIA_MAQUINARIA_15MIN',
    `severidad` ENUM('CRITICA', 'ALTA', 'MEDIA', 'BAJA') NOT NULL DEFAULT 'MEDIA',
    `detalle` TEXT NOT NULL,
    `estado_resolucion` ENUM('PENDIENTE', 'REVISADO_JEFE_PATIO', 'JUSTIFICADO', 'CERRADO') NOT NULL DEFAULT 'PENDIENTE',
    `registrado_por` VARCHAR(100) NOT NULL,
    `resuelto_por` VARCHAR(100) NULL,
    `fecha_resolucion` DATETIME NULL,
    INDEX `idx_incidencias_fecha` (`fecha_hora`),
    INDEX `idx_incidencias_severidad` (`severidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Alertas de seguridad industrial, bloqueos e incidentes en garita';

-- ============================================================================
-- 6. SEGURIDAD, CONTROL DE ACCESO (IAM), ROLES, PERMISOS Y SESIONES
-- ============================================================================

CREATE TABLE `permisos_catalogo` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(60) NOT NULL UNIQUE,
    `modulo` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `nivel_riesgo` ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO') NOT NULL DEFAULT 'MEDIO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo exhaustivo de permisos del sistema';

CREATE TABLE `roles_sistema` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(40) NOT NULL UNIQUE,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `es_rol_sistema` BOOLEAN NOT NULL DEFAULT TRUE,
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Roles oficiales predeterminados del sistema';

CREATE TABLE `rol_permisos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rol_id` INT NOT NULL,
    `permiso_id` INT NOT NULL,
    UNIQUE KEY `uk_rol_permiso` (`rol_id`, `permiso_id`),
    FOREIGN KEY (`rol_id`) REFERENCES `roles_sistema`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permiso_id`) REFERENCES `permisos_catalogo`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Matriz N:M de asignación de permisos a roles';

CREATE TABLE `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre_completo` VARCHAR(120) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Derivación criptográfica scrypt / Argon2 / bcrypt',
    `rol_id` INT NOT NULL,
    `rol` VARCHAR(50) NOT NULL,
    `cargo` VARCHAR(100) NOT NULL,
    `max_sesiones_simultaneas` INT NOT NULL DEFAULT 1,
    `politica_concurrencia` ENUM('RECHAZAR_NUEVA', 'CERRAR_ANTERIOR', 'PERMITIR_DUPLICADAS') NOT NULL DEFAULT 'CERRAR_ANTERIOR',
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    `bloqueado_por_intentos` BOOLEAN NOT NULL DEFAULT FALSE,
    `intentos_fallidos` INT NOT NULL DEFAULT 0,
    `ultimo_login` DATETIME NULL,
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `actualizado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`rol_id`) REFERENCES `roles_sistema`(`id`) ON DELETE RESTRICT,
    INDEX `idx_usuarios_email` (`email`),
    INDEX `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cuentas de usuario con acceso al panel administrativo y portería';

CREATE TABLE `usuario_permisos_individuales` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `permiso_codigo` VARCHAR(60) NOT NULL,
    `accion` ENUM('ALLOW', 'DENY') NOT NULL,
    `motivo_excepcion` VARCHAR(255) NULL,
    `otorgado_por` VARCHAR(100) NOT NULL DEFAULT 'SUPER_ADMIN',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_usuario_permiso_codigo` (`usuario_id`, `permiso_codigo`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sobreescrituras explícitas de permisos (ALLOW/DENY) por usuario';

CREATE TABLE `sesiones_activas` (
    `token` VARCHAR(255) PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `usuario_email` VARCHAR(100) NOT NULL,
    `usuario_rol` VARCHAR(50) NOT NULL,
    `usuario_cargo` VARCHAR(100) NOT NULL,
    `dispositivo` VARCHAR(150) NULL,
    `ip` VARCHAR(60) NOT NULL,
    `inicio_sesion` DATETIME NOT NULL,
    `ultimo_acceso` DATETIME NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    INDEX `idx_sesiones_usuario` (`usuario_id`),
    INDEX `idx_sesiones_activa` (`activa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Control de sesiones activas concurrentes y tokens HMAC';

CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `evento` VARCHAR(60) NOT NULL,
    `modulo` VARCHAR(50) NOT NULL,
    `permiso_evaluado` VARCHAR(60) NULL,
    `resultado` ENUM('EXITO', 'DENEGADO', 'ADVERTENCIA', 'ERROR') NOT NULL DEFAULT 'EXITO',
    `usuario_email` VARCHAR(100) NULL,
    `ip` VARCHAR(60) NULL,
    `detalle` TEXT NOT NULL,
    INDEX `idx_audit_timestamp` (`timestamp`),
    INDEX `idx_audit_usuario` (`usuario_email`),
    INDEX `idx_audit_modulo` (`modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bitácora inmutable de auditoría forense y seguridad';

-- ============================================================================
-- 7. VISTAS ANALÍTICAS Y OPERATIVAS DE PLANTA (VIEWS)
-- ============================================================================

-- Vista 1: Cuadrilla en vivo para el Jefe de Patio (operadores de maquinaria y presentes)
CREATE OR REPLACE VIEW `vw_cuadrilla_en_vivo` AS
SELECT 
    t.id AS trabajador_id,
    t.documento,
    t.codigo_credencial,
    t.nombre_completo,
    c.nombre AS cargo_nombre,
    c.tipo_personal,
    c.es_puesto_critico,
    d.nombre AS departamento_nombre,
    t.ubicacion_actual,
    t.estado AS estado_trabajador,
    t.arl_vigente,
    ra.hora_entrada,
    ra.estado_asistencia,
    ra.minutos_tardanza,
    CASE 
        WHEN t.ubicacion_actual = 'DENTRO_PLANTA' AND ra.estado_asistencia = 'PUNTUAL' THEN 'PRESENTE_PUNTUAL'
        WHEN t.ubicacion_actual = 'DENTRO_PLANTA' AND ra.estado_asistencia = 'TARDANZA' THEN 'PRESENTE_CON_TARDANZA'
        WHEN t.ubicacion_actual = 'FUERA_PLANTA' THEN 'AUSENTE'
        ELSE 'DESCONOCIDO'
    END AS semaforo_asistencia
FROM `trabajadores` t
INNER JOIN `cargos` c ON t.cargo_id = c.id
INNER JOIN `departamentos` d ON c.departamento_id = d.id
LEFT JOIN `registros_acceso` ra ON t.id = ra.trabajador_id 
    AND ra.fecha = CURDATE() 
    AND ra.estado_ciclo = 'EN_PLANTA';

-- Vista 2: Pre-liquidación consolidada con cómputo de recargos 42h (Ley 2101)
CREATE OR REPLACE VIEW `vw_preliquidacion_quincenal_42h` AS
SELECT 
    t.id AS trabajador_id,
    t.documento,
    t.nombre_completo,
    t.cargo,
    t.tipo_personal,
    COUNT(DISTINCT j.fecha) AS dias_laborados,
    COALESCE(SUM(j.horas_ordinarias_hod), 0.00) AS total_horas_ordinarias,
    COALESCE(SUM(j.horas_extras_diurnas_hed), 0.00) AS total_hed_25,
    COALESCE(SUM(j.horas_extras_nocturnas_hen), 0.00) AS total_hen_75,
    COALESCE(SUM(j.recargo_nocturno_rn), 0.00) AS total_rn_35,
    COALESCE(SUM(j.horas_dominical_festivo_rdf), 0.00) AS total_rdf_75,
    COALESCE(SUM(j.total_horas_computadas), 0.00) AS gran_total_horas
FROM `trabajadores` t
LEFT JOIN `jornadas_liquidadas_diarias` j ON t.id = j.trabajador_id
GROUP BY t.id, t.documento, t.nombre_completo, t.cargo, t.tipo_personal;

-- Vista 3: Aforo en tiempo real para planes de emergencia y ARL
CREATE OR REPLACE VIEW `vw_aforo_actual_planta` AS
SELECT 
    (SELECT COUNT(*) FROM `trabajadores` WHERE `ubicacion_actual` = 'DENTRO_PLANTA') AS trabajadores_dentro,
    (SELECT COUNT(*) FROM `visitantes` WHERE `estado` = 'DENTRO' AND `fecha` = CURDATE()) AS visitantes_dentro,
    (SELECT COUNT(*) FROM `pesajes_bascula` WHERE `estado` = 'PESAJE_INICIAL' AND `fecha_entrada` = CURDATE()) AS camiones_en_patio,
    ((SELECT COUNT(*) FROM `trabajadores` WHERE `ubicacion_actual` = 'DENTRO_PLANTA') + 
     (SELECT COUNT(*) FROM `visitantes` WHERE `estado` = 'DENTRO' AND `fecha` = CURDATE())) AS aforo_humano_total,
    (SELECT aforo_maximo_planta FROM `configuracion_empresa` LIMIT 1) AS capacidad_maxima_autorizada;

-- ============================================================================
-- 8. DISPARADORES AUTOMÁTICOS (TRIGGERS)
-- ============================================================================

DELIMITER $$

-- Trigger 1: Actualiza estado del trabajador a DENTRO_PLANTA al registrar entrada
CREATE TRIGGER `trg_actualizar_entrada_trabajador`
AFTER INSERT ON `registros_acceso`
FOR EACH ROW
BEGIN
    UPDATE `trabajadores` 
    SET `ubicacion_actual` = 'DENTRO_PLANTA',
        `ultima_entrada` = CONCAT(NEW.fecha, ' ', NEW.hora_entrada)
    WHERE `id` = NEW.trabajador_id;
END$$

-- Trigger 2: Actualiza estado del trabajador a FUERA_PLANTA al registrar salida
CREATE TRIGGER `trg_actualizar_salida_trabajador`
AFTER UPDATE ON `registros_acceso`
FOR EACH ROW
BEGIN
    IF NEW.hora_salida IS NOT NULL AND OLD.hora_salida IS NULL THEN
        UPDATE `trabajadores` 
        SET `ubicacion_actual` = 'FUERA_PLANTA',
            `ultima_salida` = CONCAT(NEW.fecha, ' ', NEW.hora_salida)
        WHERE `id` = NEW.trabajador_id;
    END IF;
END$$

-- Trigger 3: Trazabilidad automática de auditoría al insertar nuevo usuario
CREATE TRIGGER `trg_auditoria_nuevo_usuario`
AFTER INSERT ON `usuarios`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`evento`, `modulo`, `resultado`, `usuario_email`, `detalle`)
    VALUES ('USUARIO_CREADO', 'IAM', 'EXITO', 'SYSTEM', 
            CONCAT('Se creó la cuenta de usuario: ', NEW.email, ' con rol ', NEW.rol));
END$$

DELIMITER ;

-- ============================================================================
-- 9. DATOS SEMILLA OFICIALES (SEEDS): RECUPERACIONES NARANJO RECYCLING S.A.S.
-- ============================================================================

-- Inserción 1: Configuración de la empresa
INSERT INTO `configuracion_empresa` 
(`id`, `nombre_empresa`, `nit_ruc`, `rubro_empresa`, `direccion`, `ciudad`, `departamento_pais`, `telefono_central`, `email_seguridad`, `tolerancia_tardanza_min`, `aforo_maximo_planta`, `jornada_semanal_horas`, `regimen_laboral`)
VALUES 
(1, 'Recuperaciones Naranjo Recycling S.A.S.', '901.884.219-5', 'Reciclaje de Metales, Chatarra Industrial, Oxicorte y Desintegración', 'Zona Industrial Mamonal Km 7, Cartagena de Indias, Bolívar', 'Cartagena de Indias', 'Bolívar, Colombia', '+57 (605) 669-8200', 'seguridad.planta@recuperacionesnaranjo.com', 10, 150, 42.0, 'COLOMBIA_LEY_2101_CST');

-- Inserción 2: Turnos laborales oficiales de 42 Horas Semanales (Lunes a Viernes)
INSERT INTO `turnos_laborales` 
(`dia`, `codigo_dia`, `hora_entrada`, `inicio_almuerzo`, `fin_almuerzo`, `duracion_almuerzo_min`, `hora_salida`, `horas_ordinarias`, `aplica_administracion`, `aplica_patio`, `es_jornada_extra`, `descripcion_regla`)
VALUES
('Lunes', 1, '08:00:00', '12:00:00', '13:30:00', 90, '16:30:00', 7.00, TRUE, TRUE, FALSE, 'Entrada 8:00 AM, Almuerzo 1.5h, Salida 4:30 PM (7.0h ordinarias)'),
('Martes', 2, '07:30:00', '12:00:00', '13:00:00', 60, '17:00:00', 8.50, TRUE, TRUE, FALSE, 'Entrada 7:30 AM, Almuerzo 1.0h, Salida 5:00 PM (8.5h ordinarias)'),
('Miércoles', 3, '07:30:00', '12:00:00', '13:00:00', 60, '17:30:00', 9.00, TRUE, TRUE, FALSE, 'Entrada 7:30 AM, Almuerzo 1.0h, Salida 5:30 PM (9.0h ordinarias)'),
('Jueves', 4, '07:30:00', '12:00:00', '13:00:00', 60, '17:30:00', 9.00, TRUE, TRUE, FALSE, 'Entrada 7:30 AM, Almuerzo 1.0h, Salida 5:30 PM (9.0h ordinarias)'),
('Viernes', 5, '07:30:00', '12:00:00', '13:00:00', 60, '17:00:00', 8.50, TRUE, TRUE, FALSE, 'Entrada 7:30 AM, Almuerzo 1.0h, Salida 5:00 PM (8.5h ordinarias)'),
('Sábado', 6, '07:00:00', '12:00:00', '12:30:00', 30, '13:00:00', 5.50, FALSE, TRUE, TRUE, 'Jornada Extraordinaria Patio (Mantenimiento y Clasificación - HED +25%)'),
('Domingo', 0, '07:00:00', '12:00:00', '12:30:00', 30, '13:00:00', 5.50, FALSE, TRUE, TRUE, 'Jornada Extraordinaria Patio (Cargue Urgente Buque - RDF +75%/100%)');

-- Inserción 3: Conceptos de recargos legales
INSERT INTO `conceptos_recargos_ley2101` 
(`codigo`, `nombre`, `factor_multiplicador`, `porcentaje_recargo`, `franja_inicio`, `franja_fin`, `aplica_festivos`, `descripcion`)
VALUES
('HOD', 'Hora Ordinaria Diurna', 1.0000, 0.00, '06:00:00', '21:00:00', FALSE, 'Hora de trabajo estándar dentro de las 42h semanales'),
('HED', 'Hora Extra Diurna', 1.2500, 25.00, '06:00:00', '21:00:00', FALSE, 'Excedente diurno diario o jornadas de sábado patio (+25%)'),
('HEN', 'Hora Extra Nocturna', 1.7500, 75.00, '21:00:00', '06:00:00', FALSE, 'Hora extra laborada en período nocturno (+75%)'),
('RN', 'Recargo Nocturno Ordinario', 0.3500, 35.00, '21:00:00', '06:00:00', FALSE, 'Recargo por hora ordinaria laborada de noche (+35%)'),
('RDF', 'Recargo Dominical o Festivo', 1.7500, 75.00, '00:00:00', '23:59:59', TRUE, 'Trabajo en domingos o festivos oficiales (+75%)');

-- Inserción 4: Departamentos de la empresa
INSERT INTO `departamentos` (`id`, `codigo`, `nombre`, `descripcion`, `responsable_nombre`, `ubicacion_planta`)
VALUES
(1, 'DEP-PATIO', 'Patio de Operaciones y Chatarra', 'Clasificación, prensado, oxicorte y cargue de materiales metálicos', 'Manuel Ricardo Naranjo', 'Explanada Principal Patio'),
(2, 'DEP-MANT', 'Mantenimiento y Taller Mecánico', 'Servicio preventivo e hidráulico a pulpos, prensas y montacargas', 'Álvaro Javier Morales', 'Hangar de Mantenimiento'),
(3, 'DEP-PORT', 'Portería, Control de Acceso y Báscula', 'Seguridad perimetral, pesaje de camiones y validación de personal', 'Carlos Alberto Gómez', 'Garita Principal Acceso'),
(4, 'DEP-ADMIN', 'Administración y Contabilidad', 'Dirección financiera, compras, nómina, contabilidad y soporte SENA', 'Claudia Patricia Herrera', 'Edificio Administrativo Piso 2');

-- Inserción 5: Cargos oficiales parametrizados
INSERT INTO `cargos` (`id`, `departamento_id`, `codigo`, `nombre`, `tipo_personal`, `es_puesto_critico`, `descripcion_funciones`)
VALUES
(1, 1, 'CARG-JEF-PAT', 'Jefe de Patio', 'PATIO', TRUE, 'Lidera la cuadrilla, asigna máquinas, aprueba horas extras y controla seguridad'),
(2, 1, 'CARG-OP-PULP1', 'Operador Grúa Pulpo #1', 'PATIO', TRUE, 'Opera grúa electromagnética/hidráulica de alimentación a prensa'),
(3, 1, 'CARG-OP-PULP2', 'Operador Grúa Pulpo #2', 'PATIO', TRUE, 'Opera grúa de acopio pesado y cargue de camiones de chatarra'),
(4, 1, 'CARG-OP-MONT', 'Operador de Montacargas', 'PATIO', TRUE, 'Moviliza pallets de no ferrosos (cobre, bronce, baterías, aluminio)'),
(5, 2, 'CARG-MEC-PLAN', 'Mecánico de Planta', 'PATIO', TRUE, 'Mantenimiento técnico de maquinaria pesada y soldadura'),
(6, 1, 'CARG-AYU-PAT', 'Ayudante de Patio', 'PATIO', FALSE, 'Clasificación manual, separación de metales y apoyo a estiba'),
(7, 1, 'CARG-OXI-CLAS', 'Oxigenista / Clasificador', 'PATIO', TRUE, 'Corte con soplete de estructuras pesadas, tuberías y vigas navales'),
(8, 3, 'CARG-OP-BASC', 'Operador Báscula / Garita', 'PATIO', TRUE, 'Control de pesaje vehicular y verificación de identidad'),
(9, 4, 'CARG-CONT-GEN', 'Contador General', 'ADMINISTRACION', FALSE, 'Gestión contable, impuestos, pre-liquidación de nómina 42h'),
(10, 4, 'CARG-AUX-CONT', 'Auxiliar Contable', 'ADMINISTRACION', FALSE, 'Registro de facturas de compra de chatarra y conciliación'),
(11, 4, 'CARG-AUX-ADM', 'Auxiliar Administrativo', 'ADMINISTRACION', FALSE, 'Recepción, archivo y compras de suministros'),
(12, 4, 'CARG-AUX-SENA', 'Auxiliar SENA (Aprendiz)', 'APRENDIZ_SENA', FALSE, 'Etapa productiva formativa, apoyo documental y contable');

-- Inserción 6: Zonas de acceso físico
INSERT INTO `zonas_acceso` (`id`, `codigo`, `nombre`, `tipo`, `nivel_seguridad`, `ubicacion`, `aforo_maximo`, `estado`)
VALUES
(1, 'ZON-01', 'Garita Principal y Báscula Camionera', 'PEATONAL', 'CONTROL_ESTRICTO', 'Puerta Principal Acceso Mamonal', 30, 'OPERATIVA'),
(2, 'ZON-02', 'Patio de Chatarra y Desintegración', 'OPERACIONAL_CRITICA', 'EPP_OBLIGATORIO_CASCO_BOTAS', 'Explanada Central de Operaciones', 80, 'OPERATIVA'),
(3, 'ZON-03', 'Taller Mecánico, Hidráulica y Oxicorte', 'TECNICO', 'SOLO_PERSONAL_AUTORIZADO', 'Costado Occidental Planta', 25, 'OPERATIVA'),
(4, 'ZON-04', 'Edificio de Oficinas Administrativas', 'ADMINISTRATIVO', 'ACCESO_OFICINAS', 'Edificio Administrativo 2do Piso', 40, 'OPERATIVA'),
(5, 'ZON-05', 'Zona de Pesaje y Báscula de Camiones', 'VEHICULAR_PESADO', 'CONTROL_BASCULA', 'Báscula Toledo Entrada Vehicular', 15, 'OPERATIVA');

-- Inserción 7: Dispositivos terminales (Kioscos y básculas)
INSERT INTO `dispositivos_kiosco` 
(`id`, `zona_id`, `codigo_dispositivo`, `nombre`, `tipo_hardware`, `ip_asignada`, `ubicacion_garita`, `modo_offline_habilitado`, `estado_conexion`)
VALUES
(1, 1, 'KIOSCO-GARITA-01', 'Kiosco Táctil Pantalla Gigante Portería', 'KIOSCO_TACTIL', '192.168.10.50', 'Garita Peatonal Entrada', TRUE, 'ONLINE'),
(2, 1, 'SCAN-GARITA-01', 'Lector Láser Código de Barras PDF417', 'LECTOR_BARRAS_PDF417', '192.168.10.51', 'Ventanilla Vigilante Garita', TRUE, 'ONLINE'),
(3, 5, 'BASCULA-TOLEDO-01', 'Báscula Camionera Electrónica 80 Ton', 'BASCULA_DIGITAL', '192.168.10.60', 'Plataforma de Pesaje Mamonal', FALSE, 'ONLINE'),
(4, 2, 'TABLET-PATIO-01', 'Tablet Industrial Android Jefe de Patio', 'TABLET_SUPERVISOR', '192.168.10.75', 'Patio de Maniobras', TRUE, 'ONLINE');

-- Inserción 8: Padrón de 14 Trabajadores Reales de Recuperaciones Naranjo
INSERT INTO `trabajadores` 
(`id`, `codigo_credencial`, `documento`, `nombres`, `apellidos`, `nombre_completo`, `cargo_id`, `cargo`, `departamento`, `tipo_personal`, `es_puesto_critico`, `telefono`, `email`, `arl_vigente`, `estado`, `ubicacion_actual`, `foto_url`)
VALUES
(1, 'RN-PAT-001', '73189450', 'Manuel Ricardo', 'Naranjo Castro', 'Manuel Ricardo Naranjo', 1, 'Jefe de Patio', 'Patio de Operaciones', 'PATIO', TRUE, '+57 315 789 4512', 'jefe.patio@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(2, 'RN-PAT-002', '1047412890', 'Jadinson', 'Pérez Moreno', 'Jadinson Pérez', 2, 'Operador Grúa Pulpo #1', 'Patio de Operaciones', 'PATIO', TRUE, '+57 300 456 7812', 'jadinson.perez@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
(3, 'RN-PAT-003', '73201844', 'Emiro', 'Torres Berrío', 'Emiro Torres', 3, 'Operador Grúa Pulpo #2', 'Patio de Operaciones', 'PATIO', TRUE, '+57 311 654 9823', 'emiro.torres@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
(4, 'RN-PAT-004', '1050893412', 'Everth', 'Zúñiga Castillo', 'Everth Zúñiga', 4, 'Operador de Montacargas', 'Patio de Operaciones', 'PATIO', TRUE, '+57 320 123 4567', 'everth.zuniga@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
(5, 'RN-PAT-005', '9283741', 'Álvaro Javier', 'Morales Gómez', 'Álvaro Morales', 5, 'Mecánico de Planta', 'Mantenimiento y Taller Mecánico', 'PATIO', TRUE, '+57 314 987 6543', 'alvaro.morales@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(6, 'RN-PAT-006', '1047518902', 'Brayan David', 'Herrera Díaz', 'Brayan Herrera', 6, 'Ayudante de Patio', 'Patio de Operaciones', 'PATIO', FALSE, '+57 301 234 5678', 'brayan.herrera@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
(7, 'RN-PAT-007', '1048220199', 'Yonier', 'Mosquera Ramos', 'Yonier Mosquera', 6, 'Ayudante de Patio', 'Patio de Operaciones', 'PATIO', FALSE, '+57 317 890 1234', 'yonier.mosquera@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'),
(8, 'RN-PAT-008', '73550182', 'Deivis', 'Arrieta Julio', 'Deivis Arrieta', 6, 'Ayudante de Patio', 'Patio de Operaciones', 'PATIO', FALSE, '+57 318 456 7890', 'deivis.arrieta@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'),
(9, 'RN-PAT-009', '1047399812', 'Wilmer', 'Sánchez Mercado', 'Wilmer Sánchez', 7, 'Oxigenista / Clasificador', 'Patio de Operaciones', 'PATIO', TRUE, '+57 312 345 6789', 'wilmer.sanchez@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150'),
(10, 'RN-ADM-001', '45512890', 'Claudia Patricia', 'Herrera Pardo', 'Claudia Herrera', 9, 'Contador General', 'Administración y Contabilidad', 'ADMINISTRACION', FALSE, '+57 310 987 1234', 'claudia.herrera@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
(11, 'RN-ADM-002', '1047481903', 'Lina Marcela', 'Osorio Mendoza', 'Lina Osorio', 10, 'Auxiliar Contable', 'Administración y Contabilidad', 'ADMINISTRACION', FALSE, '+57 302 345 6789', 'lina.osorio@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
(12, 'RN-ADM-003', '1048392011', 'Kelly Johanna', 'Vásquez Meza', 'Kelly Vásquez', 11, 'Auxiliar Administrativo', 'Administración y Contabilidad', 'ADMINISTRACION', FALSE, '+57 316 789 0123', 'kelly.vasquez@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150'),
(13, 'RN-SENA-001', '1051203948', 'Juan Sebastián', 'Montes Peña', 'Juan Montes', 12, 'Auxiliar SENA (Aprendiz)', 'Administración y Contabilidad', 'APRENDIZ_SENA', FALSE, '+57 305 678 9012', 'aprendiz.sena@recuperacionesnaranjo.com', TRUE, 'ACTIVO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
(14, 'RN-SENA-002', '1052849201', 'Esteban Camilo', 'Vargas Polo', 'Esteban Vargas', 12, 'Auxiliar SENA (Aprendiz)', 'Administración y Contabilidad', 'APRENDIZ_SENA', FALSE, '+57 313 890 1234', 'esteban.vargas@recuperacionesnaranjo.com', FALSE, 'SUSPENDIDO', 'FUERA_PLANTA', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150');

-- Inserción 9: Asignación de Zonas Autorizadas por Trabajador
INSERT INTO `trabajador_zonas_autorizadas` (`trabajador_id`, `zona_id`, `nivel_permiso`) VALUES
(1, 1, 'PERMITIDO'), (1, 2, 'PERMITIDO'), (1, 3, 'PERMITIDO'), (1, 4, 'PERMITIDO'), (1, 5, 'PERMITIDO'), -- Jefe Patio acceso total
(2, 1, 'PERMITIDO'), (2, 2, 'PERMITIDO'), (2, 5, 'PERMITIDO'), -- Pulpo 1
(3, 1, 'PERMITIDO'), (3, 2, 'PERMITIDO'), (3, 5, 'PERMITIDO'), -- Pulpo 2
(4, 1, 'PERMITIDO'), (4, 2, 'PERMITIDO'), (4, 3, 'PERMITIDO'), (4, 5, 'PERMITIDO'), -- Montacargas
(5, 1, 'PERMITIDO'), (5, 2, 'PERMITIDO'), (5, 3, 'PERMITIDO'), (5, 5, 'PERMITIDO'), -- Mecánico
(6, 1, 'PERMITIDO'), (6, 2, 'PERMITIDO'), -- Ayudante
(7, 1, 'PERMITIDO'), (7, 2, 'PERMITIDO'), -- Ayudante
(8, 1, 'PERMITIDO'), (8, 2, 'PERMITIDO'), -- Ayudante
(9, 1, 'PERMITIDO'), (9, 2, 'PERMITIDO'), (9, 3, 'PERMITIDO'), -- Oxigenista
(10, 1, 'PERMITIDO'), (10, 4, 'PERMITIDO'), -- Contador
(11, 1, 'PERMITIDO'), (11, 4, 'PERMITIDO'), -- Aux Contable
(12, 1, 'PERMITIDO'), (12, 4, 'PERMITIDO'), -- Aux Admin
(13, 1, 'PERMITIDO'), (13, 4, 'PERMITIDO'), -- SENA 1
(14, 1, 'DENEGADO_RESTRINGIDO'); -- SENA 2 Suspendido

-- Inserción 10: Catálogo de los 18 Permisos de Seguridad del Sistema
INSERT INTO `permisos_catalogo` (`id`, `codigo`, `modulo`, `descripcion`, `nivel_riesgo`) VALUES
(1, 'KIOSCO_MARCAR', 'KIOSCO', 'Permite registrar entrada o salida en el terminal táctil con Cédula', 'BAJO'),
(2, 'KIOSCO_VER_ESTADO', 'KIOSCO', 'Consulta en pantalla de la foto y estado de la marcación', 'BAJO'),
(3, 'PORTERIA_VER_HISTORIAL', 'PORTERIA', 'Visualización de la bitácora de accesos del día en garita', 'MEDIO'),
(4, 'PORTERIA_REGISTRAR_VISITA', 'PORTERIA', 'Registro de visitantes, contratistas y proveedores con gafete', 'MEDIO'),
(5, 'PORTERIA_MONITOR_ESPEJO', 'PORTERIA', 'Cotejo visual de la foto oficial al momento del fichaje en garita', 'MEDIO'),
(6, 'BASCULA_REGISTRAR_PESAJE', 'BASCULA', 'Registro de camiones de carga pesada y pesaje de chatarra', 'ALTO'),
(7, 'PATIO_VER_CUADRILLA', 'PATIO', 'Monitoreo en vivo de trabajadores en planta (semáforo de asistencia)', 'MEDIO'),
(8, 'PATIO_AUTORIZAR_EXTRAS', 'PATIO', 'Autorización de jornadas extraordinarias de sábados, domingos y festivos', 'ALTO'),
(9, 'PATIO_RECIBIR_ALERTAS', 'PATIO', 'Recepción de alertas automáticas ante ausencia de maquinaria pesada a los 15 min', 'MEDIO'),
(10, 'NOMINA_VER_PRELIQUIDACION', 'NOMINA', 'Consulta del reporte consolidado de horas ordinarias y extras 42h (Ley 2101)', 'ALTO'),
(11, 'NOMINA_EXPORTAR_EXCEL', 'NOMINA', 'Exportación de novedades y horas calculadas para SIIGO / World Office', 'ALTO'),
(12, 'TRABAJADORES_CREAR', 'TRABAJADORES', 'Alta de nuevos operarios y asignación de Cédula y cargo', 'ALTO'),
(13, 'TRABAJADORES_EDITAR', 'TRABAJADORES', 'Modificación de cargos, teléfonos, correos y ARL de colaboradores', 'MEDIO'),
(14, 'TRABAJADORES_SUSPENDER', 'TRABAJADORES', 'Bloqueo temporal o permanente de credencial para acceso en garita', 'CRITICO'),
(15, 'SEGURIDAD_CONFIG_IAM', 'IAM', 'Gestión de roles, permisos granulares y políticas de contraseñas', 'CRITICO'),
(16, 'SEGURIDAD_REVOCAR_SESION', 'IAM', 'Terminación forzada de sesiones activas concurrentes', 'ALTO'),
(17, 'SEGURIDAD_VER_AUDITORIA', 'IAM', 'Inspección de la bitácora forense e inmutable de eventos', 'MEDIO'),
(18, 'SISTEMA_PARAMETROS_EMPRESA', 'ADMIN', 'Configuración de horarios 42h, aforo, tolerancia y datos de empresa', 'CRITICO');

-- Inserción 11: Roles Predeterminados del Sistema
INSERT INTO `roles_sistema` (`id`, `codigo`, `nombre`, `descripcion`) VALUES
(1, 'SUPER_ADMIN', 'Administrador General', 'Control total y sin restricciones sobre todos los módulos del sistema'),
(2, 'JEFE_PATIO', 'Jefe de Patio', 'Supervisión en vivo de cuadrilla, alertas de máquinas y aprobación de extras'),
(3, 'VIGILANTE_PORTERIA', 'Vigilante de Garita', 'Monitoreo espejo en garita, registro de camiones en báscula y visitantes'),
(4, 'SUPERVISOR_RRHH', 'Supervisor de Nómina y RR.HH.', 'Auditoría de asistencia, control de Ley 2101 (42h) y exportación a Siigo'),
(5, 'AUDITOR_SEGURIDAD', 'Auditor de Seguridad y SST', 'Inspección de aforo de planta, control ARL y bitácoras de auditoría');

-- Inserción 12: Mapeo Rol - Permisos
-- SUPER_ADMIN: Permisos 1 al 18
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`)
SELECT 1, id FROM `permisos_catalogo`;

-- JEFE_PATIO: Permisos 1, 2, 7, 8, 9, 10
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`) VALUES
(2, 1), (2, 2), (2, 7), (2, 8), (2, 9), (2, 10);

-- VIGILANTE_PORTERIA: Permisos 1, 2, 3, 4, 5, 6
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6);

-- SUPERVISOR_RRHH: Permisos 1, 2, 3, 7, 10, 11, 12, 13, 14
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`) VALUES
(4, 1), (4, 2), (4, 3), (4, 7), (4, 10), (4, 11), (4, 12), (4, 13), (4, 14);

-- AUDITOR_SEGURIDAD: Permisos 3, 5, 7, 17
INSERT INTO `rol_permisos` (`rol_id`, `permiso_id`) VALUES
(5, 3), (5, 5), (5, 7), (5, 17);

-- Inserción 13: Usuarios Administrativos Oficiales (Password: scrypt hash)
INSERT INTO `usuarios` 
(`id`, `nombre_completo`, `email`, `password_hash`, `rol_id`, `rol`, `cargo`, `max_sesiones_simultaneas`, `politica_concurrencia`, `activo`)
VALUES
(1, 'Administrador General Naranjo', 'admin@recuperacionesnaranjo.com', '69a101fef4507b9a52862a98f16b2a0c:556fe4fe4ca90351d4511d7fc1285223f03b573679c5c829e710aeeb2799341498642ca024479e001ae4f3a7452d580ee4f7c20c0a9ee7ee5e49339e7351659e', 1, 'SUPER_ADMIN', 'Director de Seguridad de la Información', 2, 'CERRAR_ANTERIOR', TRUE),
(2, 'Manuel Ricardo Naranjo', 'jefe.patio@recuperacionesnaranjo.com', '12d1b8c2d58f50c00684f88e404b9c1d:1b5c2a1e3d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a', 2, 'JEFE_PATIO', 'Jefe de Operaciones y Patio', 1, 'CERRAR_ANTERIOR', TRUE),
(3, 'Carlos Alberto Gómez', 'vigilancia@recuperacionesnaranjo.com', 'fa59812cc4b21950e304bf0e415b8d2e:2c6d3b2f4e5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b', 3, 'VIGILANTE_PORTERIA', 'Operador de Garita y Báscula', 2, 'CERRAR_ANTERIOR', TRUE),
(4, 'Claudia Patricia Herrera', 'rrhh@recuperacionesnaranjo.com', '98a12bc4d5e6f7a8b9c0d1e2f3a4b5c6:3d7e4c3a5f6b7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0c', 4, 'SUPERVISOR_RRHH', 'Directora de Recursos Humanos y Nómina', 2, 'CERRAR_ANTERIOR', TRUE);

-- Inserción 14: Permisos Individuales (Overrides de ejemplo)
INSERT INTO `usuario_permisos_individuales` (`usuario_id`, `permiso_codigo`, `accion`, `motivo_excepcion`, `otorgado_por`)
VALUES
(2, 'NOMINA_EXPORTAR_EXCEL', 'ALLOW', 'Habilitación especial para que Jefe de Patio descargue su reporte quincenal', 'SUPER_ADMIN'),
(3, 'TRABAJADORES_EDITAR', 'DENY', 'Vigilante no puede alterar datos maestros de trabajadores', 'SUPER_ADMIN');

-- Inserción 15: Registros de Acceso de Prueba Históricos
INSERT INTO `registros_acceso` 
(`codigo_movimiento`, `trabajador_id`, `codigo_credencial`, `documento`, `trabajador_nombre`, `departamento`, `zona_id`, `zona_nombre`, `fecha`, `hora_entrada`, `hora_salida`, `estado_asistencia`, `minutos_tardanza`, `estado_ciclo`, `minutos_trabajados`, `horas_formateadas`, `metodo_identificacion`)
VALUES
('MOV-20261023-001', 1, 'RN-PAT-001', '73189450', 'Manuel Ricardo Naranjo', 'Patio de Operaciones', 1, 'Garita Principal y Báscula Camionera', CURDATE(), '07:25:00', NULL, 'PUNTUAL', 0, 'EN_PLANTA', NULL, NULL, 'TERMINAL_KIOSCO_PIN'),
('MOV-20261023-002', 2, 'RN-PAT-002', '1047412890', 'Jadinson Pérez', 'Patio de Operaciones', 1, 'Garita Principal y Báscula Camionera', CURDATE(), '07:28:00', NULL, 'PUNTUAL', 0, 'EN_PLANTA', NULL, NULL, 'TERMINAL_KIOSCO_PIN'),
('MOV-20261023-003', 3, 'RN-PAT-003', '73201844', 'Emiro Torres', 'Patio de Operaciones', 1, 'Garita Principal y Báscula Camionera', CURDATE(), '07:35:00', NULL, 'PUNTUAL', 5, 'EN_PLANTA', NULL, NULL, 'TERMINAL_KIOSCO_PIN'),
('MOV-20261023-004', 4, 'RN-PAT-004', '1050893412', 'Everth Zúñiga', 'Patio de Operaciones', 1, 'Garita Principal y Báscula Camionera', CURDATE(), '07:44:00', NULL, 'TARDANZA', 14, 'EN_PLANTA', NULL, NULL, 'TERMINAL_KIOSCO_PIN'),
('MOV-20261023-005', 5, 'RN-PAT-005', '9283741', 'Álvaro Morales', 'Mantenimiento y Taller Mecánico', 1, 'Garita Principal y Báscula Camionera', CURDATE(), '07:29:00', NULL, 'PUNTUAL', 0, 'EN_PLANTA', NULL, NULL, 'TERMINAL_KIOSCO_PIN');

-- Actualizar ubicación de los presentes en la tabla trabajadores
UPDATE `trabajadores` SET `ubicacion_actual` = 'DENTRO_PLANTA' WHERE `id` IN (1, 2, 3, 4, 5);

-- Inserción 16: Vehículos y Pesajes en Báscula de Prueba
INSERT INTO `vehiculos_camiones_chatarra` (`id`, `placa`, `tipo_vehiculo`, `empresa_transportadora`, `conductor_cedula`, `conductor_nombre`, `conductor_telefono`)
VALUES
(1, 'WFI-892', 'VOLQUETA_DOBLETROQUE', 'Transportes y Cargas del Caribe S.A.S.', '1047234891', 'Jorge Eliécer Castro', '+57 312 456 7890'),
(2, 'TTX-410', 'TRACTOMULA', 'Logística Industrial Cartagena S.A.', '73190822', 'Mario Alberto Mendoza', '+57 315 678 1234');

INSERT INTO `pesajes_bascula` 
(`numero_tiquete`, `vehiculo_id`, `conductor_nombre`, `conductor_documento`, `empresa_cliente_proveedor`, `tipo_operacion`, `tipo_material`, `peso_bruto_kg`, `peso_tara_kg`, `peso_neto_kg`, `fecha_entrada`, `hora_entrada`, `hora_salida`, `operador_bascula`, `estado`)
VALUES
('TIQ-20261023-001', 1, 'Jorge Eliécer Castro', '1047234891', 'Siderúrgica del Norte S.A.S.', 'COMPRA_CHATARRA', 'Chatarra Gruesa Estructural', 28540.00, 12200.00, 16340.00, CURDATE(), '08:15:00', '09:05:00', 'Carlos Alberto Gómez', 'COMPLETADO_DESCARGADO'),
('TIQ-20261023-002', 2, 'Mario Alberto Mendoza', '73190822', 'Metalúrgica Mamonal Ltda.', 'COMPRA_CHATARRA', 'Vigas Navales y Tubería 8 pulg', 34200.00, NULL, NULL, CURDATE(), '09:40:00', NULL, 'Carlos Alberto Gómez', 'PESAJE_INICIAL');

-- Inserción 17: Visitantes y Contratistas de Prueba
INSERT INTO `visitantes` 
(`codigo_visita`, `nombre_completo`, `documento`, `empresa_origen`, `placa_vehiculo`, `motivo_visita`, `anfitrion_visitado`, `gafete_asignado`, `zona_id`, `zona_nombre`, `fecha`, `hora_ingreso`, `hora_salida`, `arl_verificada`, `estado`, `registrado_por_email`)
VALUES
('VIS-20261023-01', 'Ing. Gabriel Eduardo Silva', '79845120', 'Oxígenos y Gases Industriales del Caribe', 'GHK-789', 'Mantenimiento a cilindros de oxígeno y acetileno', 'Álvaro Morales', 'GAFETE-PROV-01', 3, 'Taller Mecánico, Hidráulica y Oxicorte', CURDATE(), '08:30:00', NULL, TRUE, 'DENTRO', 'vigilancia@recuperacionesnaranjo.com');

-- Inserción 18: Incidencias de Acceso
INSERT INTO `incidencias_acceso` 
(`fecha_hora`, `trabajador_nombre`, `documento`, `zona_nombre`, `tipo_alerta`, `severidad`, `detalle`, `estado_resolucion`, `registrado_por`)
VALUES
(NOW(), 'Esteban Vargas', '1052849201', 'Garita Principal y Báscula Camionera', 'CREDENCIAL_SUSPENDIDA', 'ALTA', 'Aprendiz SENA con credencial SUSPENDIDA intentó marcar en garita a las 07:15 AM. Se negó el acceso.', 'PENDIENTE', 'KIOSCO-GARITA-01');

-- Inserción 19: Bitácora de Auditoría
INSERT INTO `audit_logs` 
(`timestamp`, `evento`, `modulo`, `permiso_evaluado`, `resultado`, `usuario_email`, `ip`, `detalle`)
VALUES
(NOW() - INTERVAL 2 HOUR, 'INICIO_SESION', 'IAM', 'PUBLICO', 'EXITO', 'admin@recuperacionesnaranjo.com', '192.168.10.15', 'Inicio de sesión exitoso mediante credencial maestra con scrypt'),
(NOW() - INTERVAL 90 MINUTE, 'CONSULTA_CUADRILLA', 'PATIO', 'PATIO_VER_CUADRILLA', 'EXITO', 'jefe.patio@recuperacionesnaranjo.com', '192.168.10.75', 'Jefe de Patio monitoreó el estado de llegada de los operadores de Pulpo y Montacargas'),
(NOW() - INTERVAL 45 MINUTE, 'REGISTRO_PESAJE', 'BASCULA', 'BASCULA_REGISTRAR_PESAJE', 'EXITO', 'vigilancia@recuperacionesnaranjo.com', '192.168.10.50', 'Registro de pesaje bruto para camión WFI-892 (28,540 kg)');

-- ============================================================================
-- FIN DEL SCRIPT SQL MAESTRO
-- ============================================================================
