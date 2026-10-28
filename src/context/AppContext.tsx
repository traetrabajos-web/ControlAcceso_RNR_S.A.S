import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Trabajador,
  RegistroAcceso,
  HorarioOficial,
  ZonaAcceso,
  Visitante,
  IncidenciaAcceso,
  AutorizacionExtra,
  ConfiguracionEmpresa,
  UsuarioIAM,
  SesionActiva,
  AuditLog,
  MaquinariaPesada,
  MinutaGuardia,
  PermisoTrabajoCaliente,
  CalibracionBascula,
  PersonaRestringida
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_HORARIOS,
  INITIAL_ZONAS,
  INITIAL_MAQUINARIA,
  createInitialTrabajadores,
  createInitialRegistrosAcceso,
  createInitialVisitantes,
  createInitialPersonasRestringidas,
  createInitialIncidencias,
  createInitialAutorizaciones,
  INITIAL_USUARIOS_IAM,
  createInitialAuditLogs,
  createInitialMinutas,
  createInitialPermisosCaliente,
  INITIAL_CALIBRACION_BASCULA,
  getTodayStr
} from '../data/initialData';

import { getCurrentTimeHHMM, getScheduleForDate, evaluateAttendance, timeToMinutes, formatDurationMinutes } from '../utils/time';
import { playAudioCue } from '../utils/audio';

export interface PunchResult {
  ok: boolean;
  accion: 'ENTRADA' | 'SALIDA';
  trabajador?: Trabajador;
  mensaje: string;
  motivo_bloqueo?: string;
  estado_asistencia?: string;
  hora: string;
}

interface AppContextType {
  mainView: 'public' | 'admin';
  setMainView: (v: 'public' | 'admin') => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  currentUser: UsuarioIAM | null;
  activeSessions: SesionActiva[];
  trabajadores: Trabajador[];
  registros: RegistroAcceso[];
  zonas: ZonaAcceso[];
  horarios: HorarioOficial[];
  visitantes: Visitante[];
  incidencias: IncidenciaAcceso[];
  personasRestringidas: PersonaRestringida[];
  addPersonaRestringida: (p: Omit<PersonaRestringida, 'id' | 'fecha_registro' | 'activo'>) => void;
  removePersonaRestringida: (id: number) => void;
  togglePersonaRestringida: (id: number) => void;
  autorizaciones: AutorizacionExtra[];
  maquinarias: MaquinariaPesada[];
  usuarios: UsuarioIAM[];
  auditLogs: AuditLog[];
  empresaConfig: ConfiguracionEmpresa;
  minutas: MinutaGuardia[];
  addMinuta: (m: Omit<MinutaGuardia, 'id' | 'fecha' | 'hora'>) => void;
  permisosCaliente: PermisoTrabajoCaliente[];
  addPermisoCaliente: (p: Omit<PermisoTrabajoCaliente, 'id' | 'codigo_permiso' | 'fecha'>) => void;
  updatePermisoCalienteEstado: (id: number, estado: PermisoTrabajoCaliente['estado']) => void;
  calibracionBascula: CalibracionBascula;
  updateCalibracionBascula: (c: Partial<CalibracionBascula>) => void;
  turnstileState: 'LOCKED' | 'UNLOCKED' | 'EMERGENCY';
  isSolarMode: boolean;
  toggleSolarMode: () => void;
  isAudioMuted: boolean;
  toggleAudioMuted: () => void;
  intercomOpen: boolean;
  setIntercomOpen: (open: boolean) => void;
  login: (email: string, pass: string, force?: boolean) => { ok: boolean; conflict?: boolean; error?: string };
  logout: () => void;
  quickLoginAs: (email: string) => void;
  kioskIdentify: (ident: string) => {
    trabajador: Trabajador | null;
    accion_sugerida: 'ENTRADA' | 'SALIDA';
    puede_marcar: boolean;
    motivo_bloqueo: string | null;
    registro_abierto: RegistroAcceso | null;
    minutos_en_planta: number | null;
    validaciones: { codigo: string; etiqueta: string; ok: boolean; detalle: string }[];
  } | null;
  kioskPunch: (ident: string, bypassEPP?: boolean) => PunchResult;
  guardPunch: (trabajadorId: number, tipo: 'ENTRADA' | 'SALIDA', zonaId: number, obs?: string, eppVerified?: boolean) => PunchResult;
  quickExitWorker: (trabajadorId: number) => void;
  addWorker: (w: Omit<Trabajador, 'id'>) => void;
  updateWorker: (w: Trabajador) => void;
  deleteWorker: (id: number) => void;
  addVisitante: (v: Omit<Visitante, 'id' | 'codigo_visita' | 'fecha' | 'hora_ingreso' | 'hora_salida' | 'estado' | 'registrado_por_email'>) => void;
  salidaVisitante: (id: number, pesoTara?: number) => void;
  addAutorizacion: (a: Omit<AutorizacionExtra, 'id' | 'fecha_programada' | 'estado'>) => void;
  updateMaquinaria: (m: MaquinariaPesada) => void;
  resolveIncidencia: (id: number, nota?: string) => void;
  toggleEmergencyLockdown: () => void;
  updateEmpresaConfig: (cfg: Partial<ConfiguracionEmpresa>) => void;
  revokeSession: (id: string) => void;
  updateUserPermissions: (userId: number, perms: Record<string, 'ALLOW' | 'DENY'>) => void;
  resetAllToPresets: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'rnr_sistema_acceso_state_v3';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mainView, setMainView] = useState<'public' | 'admin'>('public');
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  const [currentUser, setCurrentUser] = useState<UsuarioIAM | null>(null);
  const [activeSessions, setActiveSessions] = useState<SesionActiva[]>([]);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_trabajadores`);
    return saved ? JSON.parse(saved) : createInitialTrabajadores();
  });

  const [registros, setRegistros] = useState<RegistroAcceso[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_registros`);
    return saved ? JSON.parse(saved) : createInitialRegistrosAcceso();
  });

  const [zonas] = useState<ZonaAcceso[]>(INITIAL_ZONAS);
  const [horarios] = useState<HorarioOficial[]>(INITIAL_HORARIOS);

  const [maquinarias, setMaquinarias] = useState<MaquinariaPesada[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_maquinaria`);
    return saved ? JSON.parse(saved) : INITIAL_MAQUINARIA;
  });

  const [visitantes, setVisitantes] = useState<Visitante[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_visitantes`);
    return saved ? JSON.parse(saved) : createInitialVisitantes();
  });

  const [personasRestringidas, setPersonasRestringidas] = useState<PersonaRestringida[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_personas_restringidas`);
    return saved ? JSON.parse(saved) : createInitialPersonasRestringidas();
  });

  const [incidencias, setIncidencias] = useState<IncidenciaAcceso[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_incidencias`);
    return saved ? JSON.parse(saved) : createInitialIncidencias();
  });


  const [autorizaciones, setAutorizaciones] = useState<AutorizacionExtra[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_autorizaciones`);
    return saved ? JSON.parse(saved) : createInitialAutorizaciones();
  });

  const [usuarios, setUsuarios] = useState<UsuarioIAM[]>(INITIAL_USUARIOS_IAM);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : createInitialAuditLogs();
  });

  const [empresaConfig, setEmpresaConfig] = useState<ConfiguracionEmpresa>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_config`);
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [minutas, setMinutas] = useState<MinutaGuardia[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_minutas`);
    return saved ? JSON.parse(saved) : createInitialMinutas();
  });

  const [permisosCaliente, setPermisosCaliente] = useState<PermisoTrabajoCaliente[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_permisos`);
    return saved ? JSON.parse(saved) : createInitialPermisosCaliente();
  });

  const [calibracionBascula, setCalibracionBascula] = useState<CalibracionBascula>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_calibracion`);
    return saved ? JSON.parse(saved) : INITIAL_CALIBRACION_BASCULA;
  });

  const [turnstileState, setTurnstileState] = useState<'LOCKED' | 'UNLOCKED' | 'EMERGENCY'>('LOCKED');
  const [isSolarMode, setIsSolarMode] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [intercomOpen, setIntercomOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_trabajadores`, JSON.stringify(trabajadores));
  }, [trabajadores]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_registros`, JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_visitantes`, JSON.stringify(visitantes));
  }, [visitantes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_personas_restringidas`, JSON.stringify(personasRestringidas));
  }, [personasRestringidas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_maquinaria`, JSON.stringify(maquinarias));
  }, [maquinarias]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_incidencias`, JSON.stringify(incidencias));
  }, [incidencias]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_autorizaciones`, JSON.stringify(autorizaciones));
  }, [autorizaciones]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(empresaConfig));
  }, [empresaConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_minutas`, JSON.stringify(minutas));
  }, [minutas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_permisos`, JSON.stringify(permisosCaliente));
  }, [permisosCaliente]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_calibracion`, JSON.stringify(calibracionBascula));
  }, [calibracionBascula]);

  const addAudit = (evento: string, modulo: string, userEmail: string, detalle: string) => {
    const newLog: AuditLog = {
      id: auditLogs.length + 1,
      timestamp: `${getTodayStr(0)} ${getCurrentTimeHHMM()}:00`,
      evento,
      modulo,
      usuario_email: userEmail,
      ip: '10.0.1.25',
      detalle
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (email: string, pass: string, force = false) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = usuarios.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { ok: false, error: 'Credenciales inválidas: usuario no encontrado en IAM.' };
    }

    const expectedPass =
      user.rol === 'SUPER_ADMIN' ? 'admin123' :
      user.rol === 'VIGILANTE_PORTERIA' ? 'vigi123' :
      user.rol === 'JEFE_PATIO' ? 'patio123' : 'conta123';

    if (pass !== expectedPass && pass !== '123456') {
      return { ok: false, error: 'Contraseña de seguridad incorrecta. Verifica tu clave.' };
    }

    const existing = activeSessions.filter(s => s.usuario_id === user.id);
    if (existing.length >= user.max_sesiones_simultaneas && !force) {
      return {
        ok: false,
        conflict: true,
        error: `Límite de concurrencia alcanzado (${user.max_sesiones_simultaneas} sesión/es activa/s). ¿Deseas revocar la anterior e iniciar aquí?`
      };
    }

    const newSession: SesionActiva = {
      id: `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      usuario_id: user.id,
      email: user.email,
      nombre: user.nombre_completo,
      rol: user.rol,
      ip: '10.0.1.25',
      dispositivo: 'Navegador Web / AI Studio Workstation',
      iniciado_en: `${getTodayStr(0)} ${getCurrentTimeHHMM()}`,
      ultima_actividad: `${getTodayStr(0)} ${getCurrentTimeHHMM()}`
    };

    if (force) {
      setActiveSessions(prev => [...prev.filter(s => s.usuario_id !== user.id), newSession]);
    } else {
      setActiveSessions(prev => [...prev, newSession]);
    }

    setCurrentUser(user);
    addAudit('LOGIN_EXITOSO', 'seguridad', user.email, `Inicio de sesión exitoso [${user.rol}]`);
    return { ok: true };
  };

  const quickLoginAs = (email: string) => {
    const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      const newSession: SesionActiva = {
        id: `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        usuario_id: user.id,
        email: user.email,
        nombre: user.nombre_completo,
        rol: user.rol,
        ip: '10.0.1.25',
        dispositivo: 'Navegador Web / AI Studio Workstation',
        iniciado_en: `${getTodayStr(0)} ${getCurrentTimeHHMM()}`,
        ultima_actividad: `${getTodayStr(0)} ${getCurrentTimeHHMM()}`
      };
      setActiveSessions(prev => [...prev.filter(s => s.usuario_id !== user.id), newSession]);
      setCurrentUser(user);
      setMainView('admin');
      addAudit('LOGIN_RAPIDO', 'seguridad', user.email, `Acceso rápido de desarrollo como [${user.rol}]`);
    }
  };

  const logout = () => {
    if (currentUser) {
      addAudit('LOGOUT', 'seguridad', currentUser.email, 'Cierre de sesión ordenado.');
      setActiveSessions(prev => prev.filter(s => s.usuario_id !== currentUser.id));
    }
    setCurrentUser(null);
  };

  const kioskIdentify = (ident: string) => {
    const clean = ident.trim().toUpperCase();
    if (!clean) return null;

    const t = trabajadores.find(w =>
      w.documento.toUpperCase() === clean ||
      w.codigo_credencial.toUpperCase() === clean ||
      String(w.id) === clean
    );
    if (!t) return null;

    const today = getTodayStr(0);
    const dayOfWeek = new Date().getDay();
    const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
    const horario = getScheduleForDate(horarios);
    const dentro = t.ubicacion_actual === 'DENTRO_PLANTA';
    const accion: 'ENTRADA' | 'SALIDA' = dentro ? 'SALIDA' : 'ENTRADA';

    const regAbierto = registros.find(r =>
      Number(r.trabajador_id) === Number(t.id) && r.estado_ciclo === 'EN_PLANTA'
    ) || null;

    let minutosEnPlanta: number | null = null;
    if (regAbierto && regAbierto.hora_entrada) {
      const minIn = timeToMinutes(regAbierto.hora_entrada);
      const minNow = timeToMinutes(getCurrentTimeHHMM());
      minutosEnPlanta = Math.max(0, minNow - minIn);
    }

    const autorizadoFinde = autorizaciones.some(a =>
      Number(a.trabajador_id) === Number(t.id) && a.fecha_programada === today && a.estado === 'APROBADO'
    );
    const jornadaHabilitada = !esFinDeSemana || t.tipo_personal === 'PATIO' || autorizadoFinde;

    const validaciones = [
      {
        codigo: 'LOCKDOWN',
        etiqueta: 'Estado de Planta',
        ok: !empresaConfig.modo_bloqueo_emergencia,
        detalle: empresaConfig.modo_bloqueo_emergencia
          ? 'Planta en Bloqueo Preventivo de Emergencia SST'
          : 'Operación y accesos normales'
      },
      {
        codigo: 'ESTADO',
        etiqueta: 'Credencial activa',
        ok: t.estado === 'ACTIVO',
        detalle: t.estado === 'ACTIVO' ? 'Habilitado en el padrón laboral' : `Estado laboral: ${t.estado}`
      },
      {
        codigo: 'ARL',
        etiqueta: 'Afiliación ARL al día',
        ok: t.arl_vigente,
        detalle: t.arl_vigente ? 'Cobertura SST de Riesgo V al día' : 'ARL vencida o sin soporte documental'
      },
      {
        codigo: 'JORNADA',
        etiqueta: 'Jornada oficial 42h',
        ok: accion === 'SALIDA' || jornadaHabilitada,
        detalle: esFinDeSemana
          ? (jornadaHabilitada ? 'Turno extraordinario aprobado para patio' : 'Personal administrativo no labora fines de semana')
          : `${horario.dia}: ${horario.entrada} – ${horario.salida} (${horario.horas_ordinarias}h)`
      },
      {
        codigo: 'EPP',
        etiqueta: 'Inspección EPP Patio',
        ok: t.tipo_personal !== 'PATIO' || t.epp_verificado !== false,
        detalle: t.tipo_personal === 'PATIO'
          ? (t.epp_verificado !== false ? 'Casco, botas puntera y chaleco verificados' : 'Falta verificación de EPP obligatorio')
          : 'Personal administrativo (EPP no requerido en oficinas)'
      },
      {
        codigo: 'ANTIPASSBACK',
        etiqueta: 'Control anti-passback',
        ok: true,
        detalle: dentro ? `Dentro de planta desde ${regAbierto?.hora_entrada || t.ultima_entrada?.split(' ')[1] || '07:30'}: corresponde SALIDA` : 'Fuera de planta: corresponde ENTRADA'
      }
    ];

    const bloqueante = accion === 'ENTRADA' ? validaciones.find(v => !v.ok) : null;

    return {
      trabajador: t,
      accion_sugerida: accion,
      puede_marcar: !bloqueante,
      motivo_bloqueo: bloqueante ? `${bloqueante.etiqueta}: ${bloqueante.detalle}` : null,
      registro_abierto: regAbierto,
      minutos_en_planta: minutosEnPlanta,
      validaciones
    };
  };

  const kioskPunch = (ident: string, _bypassEPP = false): PunchResult => {
    const cleanIdent = ident.trim();
    const nowTime = getCurrentTimeHHMM();
    const today = getTodayStr(0);

    // 1. Check emergency lockdown
    if (empresaConfig.modo_bloqueo_emergencia) {
      playAudioCue(false);
      return {
        ok: false,
        accion: 'ENTRADA',
        mensaje: '🚨 PLANTA EN CIERRE PREVENTIVO DE EMERGENCIA: Los accesos y molinetes están bloqueados por protocolo de seguridad SST.',
        hora: nowTime
      };
    }

    // 2. Check blacklist / restricted access
    const restricted = personasRestringidas.find(p => p.activo && p.documento === cleanIdent);
    if (restricted) {
      playAudioCue(false);
      setTurnstileState('LOCKED');
      const newIncidencia: IncidenciaAcceso = {
        id: incidencias.length + 1,
        fecha_hora: `${today} ${nowTime}`,
        trabajador_nombre: `${restricted.nombre_completo} [VETO DE SEGURIDAD]`,
        documento: restricted.documento,
        zona_nombre: 'Portería Principal Peatonal (Garita Vía Mamonal)',
        tipo_alerta: 'ACCESO_NO_AUTORIZADO',
        severidad: 'CRITICA',
        detalle: `⛔ BLOQUEO DE SEGURIDAD: Persona con veto activo intentó ingresar al sistema. Motivo: ${restricted.motivo}. Severidad: ${restricted.severidad}`,
        estado_resolucion: 'PENDIENTE',
        registrado_por: 'Terminal Kiosco Garita'
      };
      setIncidencias(prev => [newIncidencia, ...prev]);
      addAudit('ACCESO_RESTRINGIDO_BLOQUEADO', 'seguridad', 'kiosco@recuperacionesnaranjo.com', `Acceso denegado por veto a ${restricted.nombre_completo} (CC ${restricted.documento})`);

      return {
        ok: false,
        accion: 'ENTRADA',
        mensaje: `⛔ ACCESO DENEGADO: Cédula ${restricted.documento} con RESTRICCIÓN DE SEGURIDAD ACTIVA (${restricted.motivo}). Diríjase a la Garita de Vigilancia.`,
        hora: nowTime
      };
    }

    const info = kioskIdentify(ident);
    if (!info || !info.trabajador) {
      playAudioCue(false);
      return {
        ok: false,
        accion: 'ENTRADA',
        mensaje: 'Cédula o credencial no encontrada en el padrón de la empresa.',
        hora: nowTime
      };
    }

    const { trabajador: t, accion_sugerida: accion, puede_marcar, motivo_bloqueo } = info;


    if (!puede_marcar && accion === 'ENTRADA') {
      playAudioCue(false);
      const newIncidencia: IncidenciaAcceso = {
        id: incidencias.length + 1,
        fecha_hora: `${today} ${nowTime}`,
        trabajador_nombre: `${t.nombre_completo} (${t.codigo_credencial})`,
        documento: t.documento,
        zona_nombre: 'Portería Principal Peatonal (Garita Vía Mamonal)',
        tipo_alerta: t.estado !== 'ACTIVO' ? 'CREDENCIAL_BLOQUEADO' : (!t.arl_vigente ? 'ARL_VENCIDA' : 'ACCESO_NO_AUTORIZADO'),
        severidad: 'ALTA',
        detalle: `Intento de ENTRADA bloqueado en Kiosco: ${motivo_bloqueo}`,
        estado_resolucion: 'PENDIENTE',
        registrado_por: 'Terminal Kiosco Garita'
      };
      setIncidencias(prev => [newIncidencia, ...prev]);
      addAudit('ACCESO_DENEGADO', 'kiosco', 'kiosco@recuperacionesnaranjo.com', `Acceso denegado a ${t.nombre_completo}: ${motivo_bloqueo}`);

      return {
        ok: false,
        accion,
        trabajador: t,
        mensaje: `Acceso no autorizado: ${motivo_bloqueo}`,
        motivo_bloqueo: motivo_bloqueo || undefined,
        hora: nowTime
      };
    }

    if (accion === 'ENTRADA') {
      const schedule = getScheduleForDate(horarios);
      const estadoAsistencia = evaluateAttendance(nowTime, empresaConfig.tolerancia_tardanza_min, schedule);

      const newReg: RegistroAcceso = {
        id: registros.length + 1,
        codigo_movimiento: `ACC-${1000 + registros.length + 1}`,
        trabajador_id: t.id,
        codigo_credencial: t.codigo_credencial,
        documento: t.documento,
        trabajador_nombre: t.nombre_completo,
        departamento: t.departamento,
        zona_id: 1,
        zona_nombre: 'Portería Principal Peatonal (Garita Vía Mamonal)',
        fecha: today,
        hora_entrada: nowTime,
        hora_salida: null,
        estado_asistencia: estadoAsistencia,
        estado_ciclo: 'EN_PLANTA',
        minutos_trabajados: null,
        horas_formateadas: 'En curso (En planta)',
        metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
        registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
        registrado_por_nombre: 'Terminal Kiosco Garita',
        observacion: 'Entrada registrada en pantalla táctil con verificación SST.',
        epp_cumplido: t.tipo_personal !== 'PATIO' || t.epp_verificado !== false
      };

      setRegistros(prev => [newReg, ...prev]);
      setTrabajadores(prev =>
        prev.map(w =>
          w.id === t.id
            ? { ...w, ubicacion_actual: 'DENTRO_PLANTA', ultima_entrada: `${today} ${nowTime}` }
            : w
        )
      );

      if (!isAudioMuted) playAudioCue(true);
      setTurnstileState('UNLOCKED');
      setTimeout(() => {
        setTurnstileState('LOCKED');
      }, 5000);

      addAudit('ENTRADA_REGISTRADA', 'kiosco', 'kiosco@recuperacionesnaranjo.com', `Entrada exitosa de ${t.nombre_completo} [${estadoAsistencia}]`);

      return {
        ok: true,
        accion: 'ENTRADA',
        trabajador: { ...t, ubicacion_actual: 'DENTRO_PLANTA', ultima_entrada: `${today} ${nowTime}` },
        mensaje: `¡Bienvenido(a), ${t.nombre_completo}! Entrada registrada correctamente. Molinete desbloqueado.`,
        estado_asistencia: estadoAsistencia,
        hora: nowTime
      };
    } else {
      // SALIDA
      const openReg = registros.find(r => Number(r.trabajador_id) === Number(t.id) && r.estado_ciclo === 'EN_PLANTA');
      let minTrabajados = 480;
      if (openReg && openReg.hora_entrada) {
        const inM = timeToMinutes(openReg.hora_entrada);
        const outM = timeToMinutes(nowTime);
        minTrabajados = Math.max(1, outM - inM);
      }

      const durStr = formatDurationMinutes(minTrabajados);

      if (openReg) {
        setRegistros(prev =>
          prev.map(r =>
            r.id === openReg.id
              ? {
                  ...r,
                  hora_salida: nowTime,
                  estado_ciclo: 'COMPLETADO',
                  minutos_trabajados: minTrabajados,
                  horas_formateadas: durStr
                }
              : r
          )
        );
      } else {
        const newReg: RegistroAcceso = {
          id: registros.length + 1,
          codigo_movimiento: `ACC-${1000 + registros.length + 1}`,
          trabajador_id: t.id,
          codigo_credencial: t.codigo_credencial,
          documento: t.documento,
          trabajador_nombre: t.nombre_completo,
          departamento: t.departamento,
          zona_id: 1,
          zona_nombre: 'Portería Principal Peatonal (Garita Vía Mamonal)',
          fecha: today,
          hora_entrada: '07:30',
          hora_salida: nowTime,
          estado_asistencia: 'PUNTUAL',
          estado_ciclo: 'COMPLETADO',
          minutos_trabajados: minTrabajados,
          horas_formateadas: durStr,
          metodo_identificacion: 'TERMINAL_KIOSCO_PIN',
          registrado_por_email: 'kiosco@recuperacionesnaranjo.com',
          registrado_por_nombre: 'Terminal Kiosco Garita'
        };
        setRegistros(prev => [newReg, ...prev]);
      }

      setTrabajadores(prev =>
        prev.map(w =>
          w.id === t.id
            ? { ...w, ubicacion_actual: 'FUERA_PLANTA' }
            : w
        )
      );

      if (!isAudioMuted) playAudioCue(true);
      setTurnstileState('UNLOCKED');
      setTimeout(() => {
        setTurnstileState('LOCKED');
      }, 5000);

      addAudit('SALIDA_REGISTRADA', 'kiosco', 'kiosco@recuperacionesnaranjo.com', `Salida exitosa de ${t.nombre_completo} (${durStr} trabajadas)`);

      return {
        ok: true,
        accion: 'SALIDA',
        trabajador: { ...t, ubicacion_actual: 'FUERA_PLANTA' },
        mensaje: `¡Hasta pronto, ${t.nombre_completo}! Salida registrada. Tiempo laborado hoy: ${durStr}. Molinete desbloqueado.`,
        hora: nowTime
      };
    }
  };

  const guardPunch = (trabajadorId: number, tipo: 'ENTRADA' | 'SALIDA', zonaId: number, obs?: string, eppVerified = true): PunchResult => {
    const t = trabajadores.find(w => w.id === trabajadorId);
    if (!t) {
      return { ok: false, accion: tipo, mensaje: 'Trabajador no encontrado en base de datos', hora: getCurrentTimeHHMM() };
    }
    const targetZona = zonas.find(z => z.id === zonaId) || zonas[0];
    const nowTime = getCurrentTimeHHMM();
    const today = getTodayStr(0);

    if (tipo === 'ENTRADA') {
      if (empresaConfig.modo_bloqueo_emergencia) {
        return {
          ok: false,
          accion: tipo,
          mensaje: '🚨 PLANTA EN CIERRE PREVENTIVO: Accesos bloqueados por protocolo SST.',
          hora: nowTime
        };
      }

      const restricted = personasRestringidas.find(p => p.activo && p.documento === t.documento);
      if (restricted) {
        return {
          ok: false,
          accion: tipo,
          mensaje: `⛔ ACCESO DENEGADO POR SEGURIDAD: Cédula ${t.documento} tiene restricción activa (${restricted.motivo}).`,
          hora: nowTime
        };
      }

      const schedule = getScheduleForDate(horarios);
      const estadoAsistencia = evaluateAttendance(nowTime, empresaConfig.tolerancia_tardanza_min, schedule);

      const newReg: RegistroAcceso = {
        id: registros.length + 1,
        codigo_movimiento: `ACC-${1000 + registros.length + 1}`,
        trabajador_id: t.id,
        codigo_credencial: t.codigo_credencial,
        documento: t.documento,
        trabajador_nombre: t.nombre_completo,
        departamento: t.departamento,
        zona_id: targetZona.id,
        zona_nombre: targetZona.nombre,
        fecha: today,
        hora_entrada: nowTime,
        hora_salida: null,
        estado_asistencia: estadoAsistencia,
        estado_ciclo: 'EN_PLANTA',
        minutos_trabajados: null,
        horas_formateadas: 'En curso (En planta)',
        metodo_identificacion: 'CONSOLA_PORTERIA',
        registrado_por_email: currentUser?.email || 'vigilante@recuperacionesnaranjo.com',
        registrado_por_nombre: currentUser?.nombre_completo || 'Vigilante de Garita',
        observacion: obs || 'Fichaje presencial en punto de control de garita',
        epp_cumplido: eppVerified
      };

      setRegistros(prev => [newReg, ...prev]);
      setTrabajadores(prev =>
        prev.map(w =>
          w.id === t.id
            ? { ...w, ubicacion_actual: 'DENTRO_PLANTA', ultima_entrada: `${today} ${nowTime}`, epp_verificado: eppVerified }
            : w
        )
      );

      playAudioCue(true);
      addAudit('ENTRADA_GARITA', 'porteria', currentUser?.email || 'vigilante', `Entrada de ${t.nombre_completo} autorizada en ${targetZona.nombre}`);

      return {
        ok: true,
        accion: 'ENTRADA',
        trabajador: t,
        mensaje: `Entrada registrada para ${t.nombre_completo}.`,
        estado_asistencia: estadoAsistencia,
        hora: nowTime
      };
    } else {
      const openReg = registros.find(r => Number(r.trabajador_id) === Number(t.id) && r.estado_ciclo === 'EN_PLANTA');
      let minTrabajados = 480;
      if (openReg && openReg.hora_entrada) {
        const inM = timeToMinutes(openReg.hora_entrada);
        const outM = timeToMinutes(nowTime);
        minTrabajados = Math.max(1, outM - inM);
      }
      const durStr = formatDurationMinutes(minTrabajados);

      if (openReg) {
        setRegistros(prev =>
          prev.map(r =>
            r.id === openReg.id
              ? {
                  ...r,
                  hora_salida: nowTime,
                  estado_ciclo: 'COMPLETADO',
                  minutos_trabajados: minTrabajados,
                  horas_formateadas: durStr,
                  observacion: obs ? `${r.observacion || ''} | ${obs}` : r.observacion
                }
              : r
          )
        );
      }

      setTrabajadores(prev =>
        prev.map(w =>
          w.id === t.id
            ? { ...w, ubicacion_actual: 'FUERA_PLANTA' }
            : w
        )
      );

      playAudioCue(true);
      addAudit('SALIDA_GARITA', 'porteria', currentUser?.email || 'vigilante', `Salida de ${t.nombre_completo} registrada en ${targetZona.nombre}`);

      return {
        ok: true,
        accion: 'SALIDA',
        trabajador: t,
        mensaje: `Salida registrada para ${t.nombre_completo}.`,
        hora: nowTime
      };
    }
  };

  const quickExitWorker = (trabajadorId: number) => {
    guardPunch(trabajadorId, 'SALIDA', 1, 'Salida rápida desde Dashboard de Aforo Mamonal');
  };

  const addWorker = (w: Omit<Trabajador, 'id'>) => {
    const newId = trabajadores.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const worker: Trabajador = {
      ...w,
      id: newId,
      ubicacion_actual: 'FUERA_PLANTA',
      ultima_entrada: null
    };
    setTrabajadores(prev => [worker, ...prev]);
    addAudit('TRABAJADOR_CREADO', 'rrhh', currentUser?.email || 'admin', `Trabajador registrado: ${worker.nombre_completo} (CC ${worker.documento})`);
  };

  const updateWorker = (w: Trabajador) => {
    setTrabajadores(prev => prev.map(item => (item.id === w.id ? w : item)));
    addAudit('TRABAJADOR_EDITADO', 'rrhh', currentUser?.email || 'admin', `Ficha actualizada: ${w.nombre_completo}`);
  };

  const deleteWorker = (id: number) => {
    const t = trabajadores.find(w => w.id === id);
    setTrabajadores(prev => prev.filter(w => w.id !== id));
    addAudit('TRABAJADOR_ELIMINADO', 'rrhh', currentUser?.email || 'admin', `Trabajador desincorporado ID ${id}: ${t?.nombre_completo}`);
  };

  const addVisitante = (v: Omit<Visitante, 'id' | 'codigo_visita' | 'fecha' | 'hora_ingreso' | 'hora_salida' | 'estado' | 'registrado_por_email'>) => {
    const nowTime = getCurrentTimeHHMM();
    const today = getTodayStr(0);
    const newVis: Visitante = {
      ...v,
      id: visitantes.length + 1,
      codigo_visita: `VIS-${String(visitantes.length + 1).padStart(3, '0')}`,
      fecha: today,
      hora_ingreso: nowTime,
      hora_salida: null,
      estado: 'DENTRO',
      registrado_por_email: currentUser?.email || 'vigilante@recuperacionesnaranjo.com'
    };
    setVisitantes(prev => [newVis, ...prev]);
    addAudit('VISITANTE_INGRESADO', 'porteria', currentUser?.email || 'vigilante', `Ingreso de visitante autorizado: ${newVis.nombre_completo} (${newVis.empresa_origen}) - Gafete ${newVis.gafete_asignado}`);
  };

  const salidaVisitante = (id: number) => {
    const nowTime = getCurrentTimeHHMM();
    setVisitantes(prev =>
      prev.map(v => {
        if (v.id === id) {
          return {
            ...v,
            hora_salida: nowTime,
            estado: 'SALIO'
          };
        }
        return v;
      })
    );
    addAudit('VISITANTE_SALIDA', 'porteria', currentUser?.email || 'vigilante', `Salida registrada para visitante ID ${id}`);
  };

  const addPersonaRestringida = (p: Omit<PersonaRestringida, 'id' | 'fecha_registro' | 'activo'>) => {
    const newId = personasRestringidas.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const entry: PersonaRestringida = {
      ...p,
      id: newId,
      fecha_registro: getTodayStr(0),
      activo: true
    };
    setPersonasRestringidas(prev => [entry, ...prev]);
    addAudit('RESTRICCION_CREADA', 'seguridad', currentUser?.email || 'admin', `Persona agregada a lista de veto: ${entry.nombre_completo} (CC ${entry.documento})`);
  };

  const removePersonaRestringida = (id: number) => {
    const target = personasRestringidas.find(p => p.id === id);
    setPersonasRestringidas(prev => prev.filter(p => p.id !== id));
    addAudit('RESTRICCION_ELIMINADA', 'seguridad', currentUser?.email || 'admin', `Persona removida de lista de veto: ${target?.nombre_completo}`);
  };

  const togglePersonaRestringida = (id: number) => {
    setPersonasRestringidas(prev =>
      prev.map(p => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
  };

  const addAutorizacion = (a: Omit<AutorizacionExtra, 'id' | 'fecha_programada' | 'estado'>) => {

    const newAuto: AutorizacionExtra = {
      ...a,
      id: autorizaciones.length + 1,
      fecha_programada: getTodayStr(0),
      estado: 'APROBADO',
      costo_estimado_cop: (a.horas_estimadas || 6) * 22500
    };
    setAutorizaciones(prev => [newAuto, ...prev]);
    addAudit('EXTRA_AUTORIZADA', 'patio', currentUser?.email || 'jefepatio', `Jornada extraordinaria autorizada para ${newAuto.nombre_trabajador} (${newAuto.horas_estimadas}h)`);
  };

  const updateMaquinaria = (m: MaquinariaPesada) => {
    setMaquinarias(prev => prev.map(item => (item.id === m.id ? m : item)));
    addAudit('MAQUINARIA_ACTUALIZADA', 'patio', currentUser?.email || 'jefepatio', `Estado actualizado para ${m.nombre} (${m.estado})`);
  };

  const resolveIncidencia = (id: number, nota?: string) => {
    setIncidencias(prev =>
      prev.map(inc =>
        inc.id === id
          ? {
              ...inc,
              estado_resolucion: 'RESUELTO',
              resolucion_nota: nota || 'Inspección de seguridad realizada y solventada.',
              resuelto_por: currentUser?.nombre_completo || 'Oficial SST'
            }
          : inc
      )
    );
    addAudit('INCIDENCIA_RESUELTA', 'seguridad', currentUser?.email || 'admin', `Alerta de seguridad ID ${id} resuelta.`);
  };

  const toggleEmergencyLockdown = () => {
    setEmpresaConfig(prev => {
      const nextState = !prev.modo_bloqueo_emergencia;
      setTurnstileState(nextState ? 'EMERGENCY' : 'LOCKED');
      addAudit('BLOQUEO_EMERGENCIA', 'seguridad', currentUser?.email || 'admin', nextState ? 'ACTIVACIÓN DE BLOQUEO PREVENTIVO DE PLANTA' : 'DESACTIVACIÓN DE BLOQUEO DE PLANTA');
      return { ...prev, modo_bloqueo_emergencia: nextState };
    });
  };

  const toggleSolarMode = () => setIsSolarMode(prev => !prev);
  const toggleAudioMuted = () => setIsAudioMuted(prev => !prev);

  const addMinuta = (m: Omit<MinutaGuardia, 'id' | 'fecha' | 'hora'>) => {
    const today = getTodayStr(0);
    const nowTime = `${getCurrentTimeHHMM()}:00`;
    const newEntry: MinutaGuardia = {
      id: minutas.length + 1,
      fecha: today,
      hora: nowTime,
      ...m
    };
    setMinutas(prev => [newEntry, ...prev]);
    addAudit('MINUTA_REGISTRADA', 'porteria', currentUser?.email || 'vigilante@recuperacionesnaranjo.com', `Novedad de portería: ${m.tipo_evento}`);
  };

  const addPermisoCaliente = (p: Omit<PermisoTrabajoCaliente, 'id' | 'codigo_permiso' | 'fecha'>) => {
    const today = getTodayStr(0);
    const newPermiso: PermisoTrabajoCaliente = {
      id: permisosCaliente.length + 1,
      codigo_permiso: `PTC-2026-${String(90 + permisosCaliente.length).padStart(3, '0')}`,
      fecha: today,
      ...p
    };
    setPermisosCaliente(prev => [newPermiso, ...prev]);
    addAudit('PERMISO_CALIENTE_CREADO', 'patio', currentUser?.email || 'jefepatio@recuperacionesnaranjo.com', `Permiso de trabajo en caliente emitido: ${newPermiso.codigo_permiso}`);
  };

  const updatePermisoCalienteEstado = (id: number, estado: PermisoTrabajoCaliente['estado']) => {
    setPermisosCaliente(prev =>
      prev.map(p => (p.id === id ? { ...p, estado } : p))
    );
  };

  const updateCalibracionBascula = (c: Partial<CalibracionBascula>) => {
    setCalibracionBascula(prev => ({ ...prev, ...c }));
    addAudit('BASCULA_CALIBRACION', 'bascula', currentUser?.email || 'admin', 'Certificación metrológica de báscula actualizada.');
  };

  const updateEmpresaConfig = (cfg: Partial<ConfiguracionEmpresa>) => {
    setEmpresaConfig(prev => ({ ...prev, ...cfg }));
    addAudit('CONFIG_ACTUALIZADA', 'config', currentUser?.email || 'admin', 'Parámetros empresariales actualizados.');
  };

  const revokeSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    addAudit('SESION_REVOCADA', 'seguridad', currentUser?.email || 'admin', `Sesión revocada ID ${id}`);
  };

  const updateUserPermissions = (userId: number, perms: Record<string, 'ALLOW' | 'DENY'>) => {
    setUsuarios(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, permisos_individuales: perms }
          : u
      )
    );
    addAudit('PERMISOS_MODIFICADOS', 'iam', currentUser?.email || 'admin', `Permisos actualizados para usuario ID ${userId}`);
  };

  const resetAllToPresets = () => {
    localStorage.removeItem(`${STORAGE_KEY}_trabajadores`);
    localStorage.removeItem(`${STORAGE_KEY}_registros`);
    localStorage.removeItem(`${STORAGE_KEY}_visitantes`);
    localStorage.removeItem(`${STORAGE_KEY}_maquinaria`);
    localStorage.removeItem(`${STORAGE_KEY}_incidencias`);
    localStorage.removeItem(`${STORAGE_KEY}_autorizaciones`);
    localStorage.removeItem(`${STORAGE_KEY}_config`);
    localStorage.removeItem(`${STORAGE_KEY}_audit`);
    localStorage.removeItem(`${STORAGE_KEY}_minutas`);
    localStorage.removeItem(`${STORAGE_KEY}_permisos`);
    localStorage.removeItem(`${STORAGE_KEY}_calibracion`);
    localStorage.removeItem(`${STORAGE_KEY}_personas_restringidas`);

    setTrabajadores(createInitialTrabajadores());
    setRegistros(createInitialRegistrosAcceso());
    setVisitantes(createInitialVisitantes());
    setPersonasRestringidas(createInitialPersonasRestringidas());
    setMaquinarias(INITIAL_MAQUINARIA);
    setIncidencias(createInitialIncidencias());
    setAutorizaciones(createInitialAutorizaciones());
    setEmpresaConfig(INITIAL_CONFIG);
    setAuditLogs(createInitialAuditLogs());
    setMinutas(createInitialMinutas());
    setPermisosCaliente(createInitialPermisosCaliente());
    setCalibracionBascula(INITIAL_CALIBRACION_BASCULA);
    setActiveSessions([]);
  };

  return (
    <AppContext.Provider
      value={{
        mainView,
        setMainView,
        adminTab,
        setAdminTab,
        currentUser,
        activeSessions,
        trabajadores,
        registros,
        zonas,
        horarios,
        visitantes,
        personasRestringidas,
        addPersonaRestringida,
        removePersonaRestringida,
        togglePersonaRestringida,
        incidencias,
        autorizaciones,
        maquinarias,
        usuarios,
        auditLogs,
        empresaConfig,
        minutas,
        addMinuta,
        permisosCaliente,
        addPermisoCaliente,
        updatePermisoCalienteEstado,
        calibracionBascula,
        updateCalibracionBascula,
        turnstileState,
        isSolarMode,
        toggleSolarMode,
        isAudioMuted,
        toggleAudioMuted,
        intercomOpen,
        setIntercomOpen,
        login,
        logout,
        quickLoginAs,
        kioskIdentify,
        kioskPunch,
        guardPunch,
        quickExitWorker,
        addWorker,
        updateWorker,
        deleteWorker,
        addVisitante,
        salidaVisitante,
        addAutorizacion,
        updateMaquinaria,
        resolveIncidencia,
        toggleEmergencyLockdown,
        updateEmpresaConfig,
        revokeSession,
        updateUserPermissions,
        resetAllToPresets
      }}

    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
