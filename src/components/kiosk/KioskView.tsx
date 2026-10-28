import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getScheduleForDate, getCurrentTimeHHMM, timeToMinutes } from '../../utils/time';
import { CredentialModal } from './CredentialModal';
import { PassReceiptModal } from './PassReceiptModal';
import { IntercomModal } from './IntercomModal';
import { VisitorSelfRegisterModal } from './VisitorSelfRegisterModal';
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Delete,
  ShieldCheck,
  Search,
  HardHat,
  ArrowRight,
  Scan,
  Keyboard,
  ShieldAlert,
  FileCheck2,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Radio,
  Eye,
  Footprints,
  Sparkles,
  Laptop
} from 'lucide-react';
import { Trabajador } from '../../types';


export const KioskView: React.FC = () => {
  const {
    trabajadores,
    registros,
    visitantes,
    horarios,
    kioskIdentify,
    kioskPunch,
    salidaVisitante,
    empresaConfig,
    turnstileState,
    isSolarMode,
    intercomOpen,
    setIntercomOpen
  } = useApp();

  const [inputMode, setInputMode] = useState<'KEYPAD' | 'SCANNER'>('KEYPAD');
  const [typedId, setTypedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // EPP specific items for Risk V plant entry
  const [eppCasco, setEppCasco] = useState(true);
  const [eppBotas, setEppBotas] = useState(true);
  const [eppGafas, setEppGafas] = useState(true);
  const [eppChaleco, setEppChaleco] = useState(true);

  const eppAllValid = useMemo(() => {
    return eppCasco && eppBotas && eppGafas && eppChaleco;
  }, [eppCasco, eppBotas, eppGafas, eppChaleco]);

  const [punchFeedback, setPunchFeedback] = useState<{
    ok: boolean;
    mensaje: string;
    hora: string;
    accion: 'ENTRADA' | 'SALIDA';
    trabajador?: Trabajador;
  } | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [feedFilter, setFeedFilter] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS');
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVisitorRegisterModalOpen, setIsVisitorRegisterModalOpen] = useState(false);

  // Today's schedule
  const todaySchedule = useMemo(() => getScheduleForDate(horarios), [horarios]);


  // KPIs
  const personalDentro = useMemo(
    () => trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA').length,
    [trabajadores]
  );
  const entradasHoy = useMemo(
    () => registros.filter(r => r.hora_entrada).length,
    [registros]
  );
  const salidasHoy = useMemo(
    () => registros.filter(r => r.hora_salida !== null).length,
    [registros]
  );
  const tardanzasHoy = useMemo(
    () => registros.filter(r => r.estado_asistencia && r.estado_asistencia.includes('TARDANZA')).length,
    [registros]
  );
  const visitantesDentro = useMemo(
    () => visitantes.filter(v => v.estado === 'DENTRO').length,
    [visitantes]
  );

  // Worker identified by input
  const identifiedData = useMemo(() => {
    if (!typedId.trim()) return null;
    return kioskIdentify(typedId.trim());
  }, [typedId, kioskIdentify]);

  // Visitor identified by input if not a registered worker
  const identifiedVisitor = useMemo(() => {
    if (!typedId.trim() || identifiedData?.trabajador) return null;
    return (
      visitantes.find(
        v =>
          v.documento === typedId.trim() ||
          v.gafete_asignado.toUpperCase() === typedId.trim().toUpperCase()
      ) || null
    );
  }, [typedId, identifiedData, visitantes]);

  // Keypad actions
  const handleKeypadPress = (key: string) => {
    if (punchFeedback) {
      setPunchFeedback(null);
      setCountdown(null);
    }
    if (key === 'CLEAR') {
      setTypedId('');
    } else if (key === 'BACK') {
      setTypedId(prev => prev.slice(0, -1));
    } else if (key === 'OK') {
      executePunch();
    } else if (typedId.length < 15) {
      setTypedId(prev => prev + key);
    }
  };

  const handleSimulatedScan = (doc: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setTypedId(doc);
      setIsScanning(false);
    }, 400);
  };

  const executePunch = () => {
    if (!typedId.trim()) return;
    const result = kioskPunch(typedId.trim(), eppAllValid);
    setPunchFeedback({
      ok: result.ok,
      mensaje: result.mensaje,
      hora: result.hora,
      accion: result.accion,
      trabajador: result.trabajador
    });
    setCountdown(6);
  };

  // Auto-reset countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setPunchFeedback(null);
      setTypedId('');
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Filtered movements feed
  const filteredFeed = useMemo(() => {
    return registros.filter(r => {
      if (feedFilter === 'ENTRADA') return !r.hora_salida;
      if (feedFilter === 'SALIDA') return !!r.hora_salida;
      return true;
    });
  }, [registros, feedFilter]);

  // Progress of work hours today
  const shiftProgress = useMemo(() => {
    const startMin = timeToMinutes(todaySchedule.entrada || '07:30');
    const endMin = timeToMinutes(todaySchedule.salida || '17:00');
    const nowMin = timeToMinutes(getCurrentTimeHHMM());
    if (nowMin < startMin) return 0;
    if (nowMin > endMin) return 100;
    return Math.round(((nowMin - startMin) / (endMin - startMin)) * 100);
  }, [todaySchedule]);

  return (
    <main className={`min-h-[calc(100vh-65px)] px-4 lg:px-6 py-6 space-y-6 transition-colors ${
      isSolarMode ? 'bg-black text-amber-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 5 Real-Time KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 max-w-7xl mx-auto">
        <div className={`rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
          isSolarMode ? 'bg-slate-900 border-amber-500/40' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className={`block text-2xl font-bold leading-none font-mono tabular-nums ${isSolarMode ? 'text-amber-300' : 'text-slate-900'}`}>
              {personalDentro}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Personal en planta</span>
          </div>
        </div>

        <div className={`rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
          isSolarMode ? 'bg-slate-900 border-amber-500/40' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-emerald-600 leading-none font-mono tabular-nums">
              {entradasHoy}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Entradas de hoy</span>
          </div>
        </div>

        <div className={`rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
          isSolarMode ? 'bg-slate-900 border-amber-500/40' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-blue-600 leading-none font-mono tabular-nums">
              {salidasHoy}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Salidas de hoy</span>
          </div>
        </div>

        <div className={`rounded-xl p-4 border shadow-xs flex items-center gap-3.5 ${
          isSolarMode ? 'bg-slate-900 border-amber-500/40' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-amber-600 leading-none font-mono tabular-nums">
              {tardanzasHoy}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Llegadas tarde</span>
          </div>
        </div>

        <div className={`rounded-xl p-4 border shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1 ${
          isSolarMode ? 'bg-slate-900 border-amber-500/40' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-purple-600 leading-none font-mono tabular-nums">
              {visitantesDentro}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Visitantes en sede</span>
          </div>
        </div>
      </section>

      {/* Main Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        {/* Left Column: Interactive Kiosk Terminal (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Main Card: Input & Mode Switcher */}
          <div className={`rounded-2xl border shadow-sm p-6 sm:p-7 ${
            isSolarMode ? 'bg-slate-950 border-amber-500/60' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Terminal Kiosco Peatonal · Garita #1</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identificación biométrica, cédula colombiana (CC) y verificación SST en Mamonal Km 7
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputMode('KEYPAD')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      inputMode === 'KEYPAD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Teclado Cédula</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('SCANNER')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      inputMode === 'SCANNER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Lector RFID</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCredentialModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
                  title="Ver padrón de credenciales"
                >
                  <Search className="w-3.5 h-3.5 text-orange-500" />
                  <span className="hidden sm:inline">Padrón CC</span>
                </button>
              </div>
            </div>

            {/* Turnstile / Molinete Physical Visual Barrier Status */}
            <div className="mt-4">
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                turnstileState === 'UNLOCKED'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                  : turnstileState === 'EMERGENCY'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    turnstileState === 'UNLOCKED' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-orange-400'
                  }`}>
                    {turnstileState === 'UNLOCKED' ? <Unlock className="w-5 h-5 animate-bounce" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      {turnstileState === 'UNLOCKED'
                        ? '🟢 MOLINETE 1 DESBLOQUEADO · PASO HABILITADO'
                        : turnstileState === 'EMERGENCY'
                        ? '🚨 MODO EVACUACIÓN ACTIVO · MOLINETE LIBERADO'
                        : '🔒 MOLINETE 1 CERRADO · EN ESPERA DE MARCACIÓN'}
                    </h4>
                    <p className={`text-[11px] ${turnstileState === 'UNLOCKED' ? 'text-emerald-800 font-semibold' : 'text-slate-400'}`}>
                      {turnstileState === 'UNLOCKED'
                        ? 'Tiene 5 segundos para cruzar el torniquete de ingreso a planta.'
                        : 'Digita tu cédula o acerca tu tarjeta RFID al lector para desbloquear.'}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                  <Footprints className="w-4 h-4 text-orange-400" />
                  <span>Garita #1 Mamonal</span>
                </div>
              </div>
            </div>

            {/* Shift hours progress banner */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  <strong>Jornada 42h ({todaySchedule.dia}):</strong> {todaySchedule.entrada} – {todaySchedule.salida}
                  {todaySchedule.inicio_almuerzo && ` · Almuerzo ${todaySchedule.inicio_almuerzo}–${todaySchedule.fin_almuerzo}`}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] text-slate-500 font-mono">Turno: {shiftProgress}%</span>
                <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-600 h-full rounded-full" style={{ width: `${shiftProgress}%` }}></div>
                </div>
              </div>
            </div>

            {/* Quick Self-Service Banner for Visitors & Contractors */}
            <div className="mt-4 p-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-orange-950 uppercase tracking-wide">
                    ¿Eres Visitante, Proveedor o Contratista?
                  </h4>
                  <p className="text-[11px] text-orange-800 font-medium">
                    Auto-registra tu entrada aquí para obtener tu pase digital y abrir el molinete al instante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVisitorRegisterModalOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/20 transition-all shrink-0 cursor-pointer"
              >
                <span>Registrar Ingreso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input Mode 1: Numeric Touch Keypad */}
            {inputMode === 'KEYPAD' && (

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="kiosk-cedula-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Número de Documento / Cédula Colombiana (CC)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="kiosk-cedula-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="Digita tu número de cédula..."
                      value={typedId}
                      onChange={(e) => {
                        setTypedId(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''));
                        if (punchFeedback) setPunchFeedback(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') executePunch();
                      }}
                      className="w-full pl-4 pr-24 py-3.5 bg-slate-50 border-2 border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl text-xl sm:text-2xl font-mono tracking-widest text-slate-900 focus:outline-none transition-all shadow-inner tabular-nums"
                    />
                    {typedId && (
                      <button
                        type="button"
                        onClick={() => handleKeypadPress('CLEAR')}
                        className="absolute right-14 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                        title="Limpiar"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <span className={`absolute right-3 text-[11px] font-bold px-2 py-1 rounded-md ${
                      identifiedData?.trabajador
                        ? 'bg-emerald-100 text-emerald-800'
                        : typedId
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {identifiedData?.trabajador ? 'Verificado' : typedId ? 'Buscando' : 'Esperando'}
                    </span>
                  </div>
                </div>

                {/* Heavy Duty Touch Keypad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="h-16 bg-slate-100 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-900 text-2xl font-bold font-mono rounded-xl border border-slate-300 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none tabular-nums"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('CLEAR')}
                    className="h-16 bg-rose-50 hover:bg-rose-500 hover:text-white active:scale-95 text-rose-700 text-base font-bold rounded-xl border border-rose-200 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                    title="Limpiar"
                  >
                    LIMPIAR
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-16 bg-slate-100 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-900 text-2xl font-bold font-mono rounded-xl border border-slate-300 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none tabular-nums"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('BACK')}
                    className="h-16 bg-slate-200 hover:bg-slate-600 hover:text-white active:scale-95 text-slate-700 rounded-xl border border-slate-300 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                    title="Borrar dígito"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Mode 2: RFID Badge Scanner Simulation */}
            {inputMode === 'SCANNER' && (
              <div className="mt-5 space-y-4">
                <div className="p-6 bg-slate-900 rounded-xl text-center text-white relative overflow-hidden space-y-3">
                  {/* Laser Scanning Beam animation */}
                  <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-orange-500 bg-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden">
                    <Scan className="w-12 h-12 text-orange-400" />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">SENSOR RFID / BARCODE</span>
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-red-500 shadow-md shadow-red-500/80 animate-bounce"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Escáner Óptico y RFID Activo</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                      Haz clic en cualquiera de las credenciales para simular el acercamiento de la tarjeta física:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {trabajadores.slice(0, 6).map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSimulatedScan(w.documento)}
                      className="p-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl text-left transition-all group"
                    >
                      <span className="font-bold text-slate-900 block truncate group-hover:text-orange-700">
                        {w.nombre_completo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">CC {w.documento}</span>
                      <span className="text-[10px] text-orange-600 font-semibold">{w.cargo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Button */}
            <div className="mt-5 max-w-md mx-auto">
              <button
                type="button"
                onClick={executePunch}
                disabled={!typedId.trim()}
                className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                  typedId.trim()
                    ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer active:scale-98 shadow-orange-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Confirmar y Fichar Movimiento</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-click test simulation bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Simulación rápida:</span>
              <button
                type="button"
                onClick={() => setTypedId('73189450')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-800 rounded-md transition-colors font-mono"
              >
                73189450 (Jefe Patio)
              </button>
              <button
                type="button"
                onClick={() => setTypedId('73204911')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-800 rounded-md transition-colors font-mono"
              >
                73204911 (Grúa Pulpo #1)
              </button>
              <button
                type="button"
                onClick={() => setTypedId('1051892301')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition-colors font-mono"
              >
                1051892301 (Suspendido)
              </button>
              <button
                type="button"
                onClick={() => setTypedId('73198004')}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors font-mono"
              >
                73198004 (Visitante)
              </button>
              <button
                type="button"
                onClick={() => setTypedId('19827364')}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md transition-colors font-mono font-bold"
                title="Probar persona con veto activo en lista de exclusión"
              >
                19827364 (Veto Seguridad)
              </button>
            </div>
          </div>


          {/* Card 2: Dynamic Worker Status Card */}
          <div className={`rounded-2xl border shadow-sm p-6 ${
            isSolarMode ? 'bg-slate-950 border-amber-500/60' : 'bg-white border-slate-200'
          }`}>
            {punchFeedback ? (
              <div className={`rounded-xl p-6 border ${
                punchFeedback.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
              } text-center space-y-3 animate-in fade-in zoom-in-95`}>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                  punchFeedback.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {punchFeedback.ok ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold">
                  {punchFeedback.ok ? 'Marcación Aprobada y Registrada' : 'Acceso Denegado por Seguridad'}
                </h3>
                <p className="text-sm font-medium">{punchFeedback.mensaje}</p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-xs">
                  <span className="font-semibold text-slate-700">Hora: {punchFeedback.hora}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700">Acción: {punchFeedback.accion}</span>
                  {punchFeedback.ok && punchFeedback.trabajador && (
                    <button
                      type="button"
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="ml-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Ver Comprobante Digital</span>
                    </button>
                  )}
                </div>

                {countdown !== null && (
                  <p className="text-xs text-slate-500 pt-2">
                    Esta pantalla se restablecerá automáticamente en <strong className="text-slate-800 font-bold">{countdown} segundos</strong>
                  </p>
                )}
              </div>
            ) : identifiedData?.trabajador ? (
              <div className="space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    {identifiedData.trabajador.foto_url ? (
                      <img
                        src={identifiedData.trabajador.foto_url}
                        alt={identifiedData.trabajador.nombre_completo}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-2xl shrink-0">
                        {identifiedData.trabajador.nombre_completo.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <h3 className="text-lg font-bold text-slate-900">{identifiedData.trabajador.nombre_completo}</h3>
                        {identifiedData.trabajador.es_puesto_critico && (
                          <span className="text-[11px] text-rose-700 font-bold tracking-wide">
                            · Puesto Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                        <HardHat className="w-4 h-4 text-orange-600" />
                        {identifiedData.trabajador.cargo} · {identifiedData.trabajador.departamento}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 justify-center sm:justify-start font-mono">
                        <span className="font-semibold text-slate-700">
                          {identifiedData.trabajador.codigo_credencial}
                        </span>
                        <span>· CC {identifiedData.trabajador.documento}</span>
                        {identifiedData.trabajador.rh && <span>· RH {identifiedData.trabajador.rh}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className={`text-xs font-bold block ${
                      identifiedData.trabajador.ubicacion_actual === 'DENTRO_PLANTA'
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}>
                      {identifiedData.trabajador.ubicacion_actual === 'DENTRO_PLANTA' ? '● Dentro de Planta' : '○ Fuera de Planta'}
                    </span>
                    {identifiedData.minutos_en_planta !== null && (
                      <span className="block text-xs text-slate-500 font-mono mt-1 tabular-nums">
                        Laborado hoy: {Math.floor(identifiedData.minutos_en_planta / 60)}h {identifiedData.minutos_en_planta % 60}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive EPP Verification Checklist for Yard Workers */}
                {identifiedData.accion_sugerida === 'ENTRADA' && identifiedData.trabajador.tipo_personal === 'PATIO' && (
                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-orange-950 flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-orange-600" />
                        <span>Inspección SST de Elementos de Protección Personal (EPP Obligatorio - Riesgo V)</span>
                      </span>
                      <span className={`text-[11px] font-bold ${eppAllValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {eppAllValid ? '✓ EPP Conforme' : '✗ EPP Incompleto'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEppCasco(c => !c)}
                        className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                          eppCasco ? 'bg-white border-emerald-400 text-emerald-900 shadow-xs' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">Casco Barbuquejo</div>
                        <div>{eppCasco ? '✓ Verificado' : '✗ Falta Casco'}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEppBotas(b => !b)}
                        className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                          eppBotas ? 'bg-white border-emerald-400 text-emerald-900 shadow-xs' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">Botas Puntera</div>
                        <div>{eppBotas ? '✓ Verificado' : '✗ Falta Botas'}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEppGafas(g => !g)}
                        className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                          eppGafas ? 'bg-white border-emerald-400 text-emerald-900 shadow-xs' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">Gafas Seguridad</div>
                        <div>{eppGafas ? '✓ Verificado' : '✗ Falta Gafas'}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEppChaleco(c => !c)}
                        className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                          eppChaleco ? 'bg-white border-emerald-400 text-emerald-900 shadow-xs' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">Chaleco Reflectivo</div>
                        <div>{eppChaleco ? '✓ Verificado' : '✗ Falta Chaleco'}</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Validations Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Validaciones Automáticas de Seguridad
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {identifiedData.validaciones.map((v) => (
                      <div
                        key={v.codigo}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                          v.ok ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        {v.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={`font-semibold ${v.ok ? 'text-emerald-900' : 'text-rose-900'}`}>{v.etiqueta}</span>
                          <p className={`text-[11px] ${v.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{v.detalle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={executePunch}
                    className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      identifiedData.accion_sugerida === 'ENTRADA'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                    }`}
                  >
                    {identifiedData.accion_sugerida === 'ENTRADA' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Confirmar y Desbloquear Molinete (ENTRADA)</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5" />
                        <span>Confirmar y Desbloquear Molinete (SALIDA)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : identifiedVisitor ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shrink-0">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                      Visitante Identificado
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{identifiedVisitor.nombre_completo}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      CC {identifiedVisitor.documento} · {identifiedVisitor.empresa_origen}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gafete / Pase:</span>
                    <span className="font-mono font-bold text-slate-900">{identifiedVisitor.gafete_asignado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Persona Visitada:</span>
                    <span className="font-semibold text-slate-900">{identifiedVisitor.anfitrion_visitado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hora de Ingreso:</span>
                    <span className="font-mono font-semibold text-slate-900">{identifiedVisitor.fecha} a las {identifiedVisitor.hora_ingreso}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado de Permanencia:</span>
                    <span className={`font-bold font-mono ${identifiedVisitor.estado === 'DENTRO' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {identifiedVisitor.estado === 'DENTRO' ? 'PRESENTE EN SEDE' : 'SALIDA YA REGISTRADA'}
                    </span>
                  </div>
                </div>

                {identifiedVisitor.equipos_ingresados && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-start gap-2.5">
                    <Laptop className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 block">Declaración de Equipos al Ingreso:</span>
                      <span className="text-amber-800 font-medium block">{identifiedVisitor.equipos_ingresados}</span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">
                        Al salir, el oficial de seguridad en garita inspeccionará físicamente estos artículos.
                      </span>
                    </div>
                  </div>
                )}


                {identifiedVisitor.estado === 'DENTRO' ? (
                  <button
                    type="button"
                    onClick={() => {
                      salidaVisitante(identifiedVisitor.id);
                      setPunchFeedback({
                        ok: true,
                        mensaje: `Salida de visitante autorizada: ${identifiedVisitor.nombre_completo}. ¡Gracias por visitarnos!`,
                        hora: getCurrentTimeHHMM(),
                        accion: 'SALIDA'
                      });
                      setCountdown(6);
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Confirmar Salida de Visitante y Desbloquear Molinete</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-600">
                    Este visitante ya registró su salida previamente a las {identifiedVisitor.hora_salida}.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">Esperando Identificación de Personal o Visitante</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ingresa tu número de documento en el teclado numérico o escanea tu credencial para registrar tu entrada o salida.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Movement Feed (5 cols) */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className={`rounded-2xl border shadow-sm p-5 space-y-3 ${
            isSolarMode ? 'bg-slate-950 border-amber-500/60' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Movimientos en Vivo</h3>
                <p className="text-[11px] text-slate-500">Últimos registros en Garita Mamonal</p>
              </div>

              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFeedFilter('TODOS')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    feedFilter === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('ENTRADA')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    feedFilter === 'ENTRADA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entradas
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('SALIDA')}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    feedFilter === 'SALIDA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salidas
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredFeed.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No hay movimientos registrados para este filtro.
                </div>
              ) : (
                filteredFeed.slice(0, 12).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        m.hora_salida ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {m.hora_salida ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{m.trabajador_nombre}</span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {m.departamento} · CC {m.documento}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-800 block">
                        {m.hora_salida || m.hora_entrada}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        m.estado_asistencia === 'PUNTUAL'
                          ? 'text-emerald-700'
                          : m.estado_asistencia.includes('TARDANZA')
                          ? 'text-amber-700'
                          : 'text-purple-700'
                      }`}>
                        {m.estado_asistencia}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Credential Modal */}
      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSelectWorkerForKiosk={(doc) => setTypedId(doc)}
      />

      {/* Pass Receipt Modal */}
      {punchFeedback && punchFeedback.trabajador && (
        <PassReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          trabajador={punchFeedback.trabajador}
          tipoAccion={punchFeedback.accion}
          hora={punchFeedback.hora}
          fecha={new Date().toISOString().slice(0, 10)}
          estadoAsistencia={punchFeedback.ok ? 'PUNTUAL' : 'RECHAZADO'}
        />
      )}

      {/* Intercom 2-Way Security Modal */}
      <IntercomModal
        isOpen={intercomOpen}
        onClose={() => setIntercomOpen(false)}
      />

      {/* Visitor Self-Registration Modal */}
      <VisitorSelfRegisterModal
        isOpen={isVisitorRegisterModalOpen}
        onClose={() => setIsVisitorRegisterModalOpen(false)}
        onSuccess={(visitorName, badgeCode) => {
          setPunchFeedback({
            ok: true,
            mensaje: `¡Bienvenido(a), ${visitorName}! Ingreso autorizado con gafete ${badgeCode}. Molinete desbloqueado.`,
            hora: getCurrentTimeHHMM(),
            accion: 'ENTRADA'
          });
          setCountdown(8);
        }}
      />
    </main>

  );
};
