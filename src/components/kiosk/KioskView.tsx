import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getScheduleForDate, getCurrentTimeHHMM, timeToMinutes } from '../../utils/time';
import { CredentialModal } from './CredentialModal';
import { PassReceiptModal } from './PassReceiptModal';
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  Truck,
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
  Square
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
    setMainView,
    empresaConfig
  } = useApp();

  const [inputMode, setInputMode] = useState<'KEYPAD' | 'SCANNER'>('KEYPAD');
  const [typedId, setTypedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [eppChecked, setEppChecked] = useState(true);

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
    const result = kioskPunch(typedId.trim(), eppChecked);
    setPunchFeedback({
      ok: result.ok,
      mensaje: result.mensaje,
      hora: result.hora,
      accion: result.accion,
      trabajador: result.trabajador
    });
    setCountdown(7);
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
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* 5 Real-Time KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{personalDentro}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Personal en planta</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{entradasHoy}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Entradas de hoy</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{salidasHoy}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Salidas de hoy</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{tardanzasHoy}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Llegadas tarde</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{visitantesDentro}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 block">Visitantes / Camiones</span>
          </div>
        </div>
      </section>

      {/* Main Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Kiosk Terminal (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Main Card: Input & Mode Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Terminal Kiosco Peatonal</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control biométrico y de identificación en Garita Vía Mamonal Km 7
                </p>
              </div>

              {/* Mode Switcher Tabs */}
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
                  <span>Escáner RFID</span>
                </button>
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
                <span className="text-[11px] text-slate-500 font-mono">Progreso turno: {shiftProgress}%</span>
                <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-600 h-full rounded-full" style={{ width: `${shiftProgress}%` }}></div>
                </div>
              </div>
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
                      className="w-full pl-4 pr-24 py-3.5 bg-slate-50 border-2 border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl text-xl sm:text-2xl font-mono tracking-widest text-slate-900 focus:outline-none transition-all shadow-inner"
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

                {/* Touch Keypad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="h-14 sm:h-16 bg-slate-100 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-800 text-2xl font-bold font-mono rounded-xl border border-slate-200 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('CLEAR')}
                    className="h-14 sm:h-16 bg-rose-50 hover:bg-rose-500 hover:text-white active:scale-95 text-rose-700 text-lg font-bold rounded-xl border border-rose-200 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                    title="Limpiar"
                  >
                    C
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-14 sm:h-16 bg-slate-100 hover:bg-orange-500 hover:text-white active:scale-95 text-slate-800 text-2xl font-bold font-mono rounded-xl border border-slate-200 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('BACK')}
                    className="h-14 sm:h-16 bg-slate-200 hover:bg-slate-600 hover:text-white active:scale-95 text-slate-700 rounded-xl border border-slate-300 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
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
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">SENSOR RFID / QR</span>
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-red-500 shadow-md shadow-red-500/80 animate-bounce"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Escáner de Proximidad Activo</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                      Haz clic en cualquiera de las credenciales de colaboradores para simular el acercamiento de la tarjeta física al lector:
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

            {/* Quick 1-click test pills */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Acceso rápido de prueba:</span>
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
            </div>
          </div>

          {/* Card 2: Dynamic Worker Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <div className="bg-white/90 border border-slate-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-700">
                    Hora: {punchFeedback.hora} · Acción: {punchFeedback.accion}
                  </div>
                  {punchFeedback.ok && punchFeedback.trabajador && (
                    <button
                      type="button"
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
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
                          <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold uppercase">
                            Puesto Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                        <HardHat className="w-4 h-4 text-orange-600" />
                        {identifiedData.trabajador.cargo} · {identifiedData.trabajador.departamento}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 justify-center sm:justify-start">
                        <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {identifiedData.trabajador.codigo_credencial}
                        </span>
                        <span>CC {identifiedData.trabajador.documento}</span>
                        {identifiedData.trabajador.rh && <span>· RH {identifiedData.trabajador.rh}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      identifiedData.trabajador.ubicacion_actual === 'DENTRO_PLANTA'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {identifiedData.trabajador.ubicacion_actual === 'DENTRO_PLANTA' ? '📍 DENTRO DE PLANTA' : 'FUERA DE PLANTA'}
                    </span>
                    {identifiedData.minutos_en_planta !== null && (
                      <span className="block text-xs text-slate-500 mt-1">
                        Laborado hoy: {Math.floor(identifiedData.minutos_en_planta / 60)}h {identifiedData.minutos_en_planta % 60}m
                      </span>
                    )}
                  </div>
                </div>

                {/* EPP Verification Checklist */}
                {identifiedData.accion_sugerida === 'ENTRADA' && identifiedData.trabajador.tipo_personal === 'PATIO' && (
                  <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-orange-900 flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-orange-600" />
                        <span>Verificación SST de Elementos de Protección Personal (EPP Obligatorio)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEppChecked(!eppChecked)}
                        className="flex items-center gap-1.5 text-xs text-orange-800 font-bold hover:underline cursor-pointer"
                      >
                        {eppChecked ? <CheckSquare className="w-4 h-4 text-orange-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        <span>{eppChecked ? 'EPP Verificado' : 'Sin EPP'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-orange-800/80">
                      Requisito de ingreso: Casco de seguridad, botas punta de acero, chaleco reflectivo y gafas de protección.
                    </p>
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
                    className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                      identifiedData.accion_sugerida === 'ENTRADA'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                    }`}
                  >
                    {identifiedData.accion_sugerida === 'ENTRADA' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Confirmar y Registrar ENTRADA a Planta</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5" />
                        <span>Confirmar y Registrar SALIDA de Planta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-700 text-base">Terminal en Espera de Identificación</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Acerca tu credencial al sensor RFID o ingresa tu número de cédula para fichar tu asistencia.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Movements Feed (5 cols) */}
        <aside className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Movimientos de Hoy</h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En vivo
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              {(['TODOS', 'ENTRADA', 'SALIDA'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFeedFilter(tab)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    feedFilter === tab ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'TODOS' ? 'Todos' : tab === 'ENTRADA' ? 'Entradas' : 'Salidas'}
                </button>
              ))}
            </div>
          </div>

          {/* Movement items */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[580px] pr-1">
            {filteredFeed.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No hay movimientos registrados para este filtro.
              </div>
            ) : (
              filteredFeed.map(r => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                      r.hora_salida ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {r.hora_salida ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">{r.trabajador_nombre}</span>
                      <span className="text-[11px] text-slate-500">{r.departamento}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-800 text-xs block">
                      {r.hora_salida ? r.hora_salida : r.hora_entrada}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      r.hora_salida
                        ? 'bg-blue-100 text-blue-800'
                        : r.estado_asistencia === 'PUNTUAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.hora_salida ? 'SALIDA' : r.estado_asistencia}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Footer Links */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsCredentialModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Consultar Credencial</span>
            </button>
            <button
              type="button"
              onClick={() => setMainView('admin')}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Consola Supervisión</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Credential Search Modal */}
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
    </main>
  );
};
