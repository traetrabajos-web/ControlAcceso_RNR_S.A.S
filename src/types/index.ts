export type UbicacionPlanta = 'DENTRO_PLANTA' | 'FUERA_PLANTA';
export type EstadoTrabajador = 'ACTIVO' | 'SUSPENDIDO' | 'VACACIONES' | 'RETIRADO';
export type TipoPersonal = 'PATIO' | 'ADMINISTRACION' | 'APRENDIZ_SENA';

export interface EPPChecklist {
  casco: boolean;
  botas_seguridad: boolean;
  chaleco_reflectivo: boolean;
  gafas_proteccion: boolean;
  guantes_carnaza: boolean;
}

export interface Trabajador {
  id: number;
  codigo_credencial: string;
  documento: string;
  nombre_completo: string;
  cargo_id: number;
  cargo: string;
  departamento: string;
  tipo_personal: TipoPersonal;
  es_puesto_critico: boolean;
  turno_id: number;
  telefono: string;
  email: string;
  zonas_autorizadas: number[];
  estado: EstadoTrabajador;
  arl_vigente: boolean;
  ubicacion_actual: UbicacionPlanta;
  ultima_entrada: string | null;
  foto_url?: string;
  // Professional enterprise fields
  eps?: string;
  rh?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  certificacion_maquinaria?: string;
  salario_base_hora?: number;
  epp_verificado?: boolean;
}

export interface RegistroAcceso {
  id: number;
  codigo_movimiento: string;
  trabajador_id: number;
  codigo_credencial: string;
  documento: string;
  trabajador_nombre: string;
  departamento: string;
  zona_id: number;
  zona_nombre: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  estado_asistencia: string;
  estado_ciclo: 'EN_PLANTA' | 'COMPLETADO';
  minutos_trabajados: number | null;
  horas_formateadas: string;
  metodo_identificacion: string;
  registrado_por_email: string;
  registrado_por_nombre: string;
  observacion?: string;
  epp_cumplido?: boolean;
}

export interface HorarioOficial {
  dia: string;
  codigo_dia: number;
  entrada: string;
  inicio_almuerzo?: string;
  fin_almuerzo?: string;
  duracion_almuerzo_min?: number;
  salida: string;
  horas_ordinarias: number;
  aplica_administracion: boolean;
  aplica_patio: boolean;
  es_jornada_extra?: boolean;
}

export interface ZonaAcceso {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  nivel_seguridad: string;
  ubicacion: string;
  aforo_maximo: number;
  estado: 'OPERATIVA' | 'MANTENIMIENTO' | 'CERRADA';
  aforo_actual?: number;
}

export interface Cargo {
  id: number;
  nombre: string;
  departamento: string;
  tipo: TipoPersonal;
  puesto_critico: boolean;
}

export interface Visitante {
  id: number;
  codigo_visita: string;
  nombre_completo: string;
  documento: string;
  empresa_origen: string;
  placa_vehiculo: string;
  motivo_visita: string;
  anfitrion_visitado: string;
  gafete_asignado: string;
  zona_id: number;
  zona_nombre: string;
  fecha: string;
  hora_ingreso: string;
  hora_salida: string | null;
  estado: 'DENTRO' | 'SALIO';
  registrado_por_email: string;
  // Weigh scale & manifest details
  tipo_material?: string;
  peso_bruto_kg?: number;
  peso_tara_kg?: number;
  peso_neto_kg?: number;
  induccion_sst?: boolean;
}

export interface MaquinariaPesada {
  id: number;
  codigo: string;
  nombre: string;
  modelo: string;
  tipo: 'GRUA_PULPO' | 'MONTACARGAS' | 'PRENSA_CIZALLA' | 'EQUIPO_OXICORTE';
  operador_asignado_id: number;
  operador_nombre: string;
  estado: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'DETENIDO' | 'INSPECCION';
  horometro_horas: number;
  proximo_mantenimiento_horas: number;
  observaciones: string;
}

export interface IncidenciaAcceso {
  id: number;
  fecha_hora: string;
  trabajador_nombre: string;
  documento: string;
  zona_nombre: string;
  tipo_alerta: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  detalle: string;
  estado_resolucion: 'PENDIENTE' | 'RESUELTO';
  registrado_por: string;
  resolucion_nota?: string;
  resuelto_por?: string;
}

export interface AutorizacionExtra {
  id: number;
  trabajador_id: number;
  nombre_trabajador: string;
  fecha_programada: string;
  dia: string;
  horas_estimadas: number;
  motivo: string;
  autorizado_por: string;
  estado: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  costo_estimado_cop?: number;
}

export interface ConfiguracionEmpresa {
  id: number;
  nombre_empresa: string;
  nit_ruc: string;
  rubro_empresa: string;
  slogan_corporativo: string;
  direccion: string;
  telefono_central: string;
  email_seguridad: string;
  color_primario: string;
  color_secundario: string;
  tolerancia_tardanza_min: number;
  aforo_maximo_planta: number;
  jornada_semanal_horas: number;
  regimen_laboral: string;
  modo_bloqueo_emergencia?: boolean;
  telefono_emergencia_sst?: string;
  arl_proveedor?: string;
}

export interface UsuarioIAM {
  id: number;
  nombre_completo: string;
  email: string;
  rol: 'SUPER_ADMIN' | 'VIGILANTE_PORTERIA' | 'JEFE_PATIO' | 'SUPERVISOR_RRHH';
  cargo: string;
  max_sesiones_simultaneas: number;
  politica_concurrencia: string;
  activo: boolean;
  permisos_individuales: Record<string, 'ALLOW' | 'DENY'>;
  creado_en: string;
}

export interface SesionActiva {
  id: string;
  usuario_id: number;
  email: string;
  nombre: string;
  rol: string;
  ip: string;
  dispositivo: string;
  iniciado_en: string;
  ultima_actividad: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  evento: string;
  modulo: string;
  usuario_email: string;
  ip: string;
  detalle: string;
}
