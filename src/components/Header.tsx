import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  ShieldCheck,
  DoorOpen,
  AlertOctagon,
  Lock,
  Volume2,
  VolumeX,
  Sun,
  Radio,
  ArrowLeft
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    mainView,
    setMainView,
    currentUser,
    empresaConfig,
    toggleEmergencyLockdown,
    turnstileState,
    isSolarMode,
    toggleSolarMode,
    isAudioMuted,
    toggleAudioMuted,
    setIntercomOpen
  } = useApp();

  const [timeStr, setTimeStr] = useState<string>('--:--:--');
  const [dateStr, setDateStr] = useState<string>('Cargando fecha...');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      const d = now.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setDateStr(d.toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Emergency Lockdown Ribbon if triggered */}
      {empresaConfig.modo_bloqueo_emergencia && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>ALERTA SST: EVACUACIÓN ACTIVA — MOLINETES Y PUERTAS PERIMETRALES LIBERADOS EN MODO ESCAPE</span>
          </div>
          <button
            onClick={toggleEmergencyLockdown}
            className="px-2.5 py-0.5 bg-white text-rose-700 rounded text-[11px] font-bold hover:bg-rose-50 transition-colors"
          >
            Desactivar Bloqueo
          </button>
        </div>
      )}

      {/* Industrial Header */}
      <header className={`sticky top-0 z-40 border-b transition-colors shadow-sm ${
        isSolarMode
          ? 'bg-black text-amber-300 border-amber-500/50'
          : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white rounded p-1 flex items-center justify-center shrink-0">
              <img
                src="/assets/logo-naranjo.png"
                alt="Recuperaciones Naranjo"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight whitespace-nowrap">
                  RNR S.A.S.
                </span>
                <span className="text-xs text-orange-400 font-medium hidden sm:inline whitespace-nowrap">
                  · Sede Industrial Mamonal Km 7
                </span>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {mainView === 'public'
                  ? 'Terminal Kiosco Peatonal · Garita de Control #1'
                  : 'Consola de Supervisión y Control Operativo'}
              </span>
            </div>
          </div>

          {/* Center Hardware / Telemetry Toolbar (In Kiosk Mode) */}
          {mainView === 'public' ? (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
              {/* Turnstile Indicator */}
              <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700 font-mono">
                <span className={`w-2 h-2 rounded-full ${
                  turnstileState === 'UNLOCKED'
                    ? 'bg-emerald-400'
                    : turnstileState === 'EMERGENCY'
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}></span>
                <span className="font-semibold text-slate-300">
                  {turnstileState === 'UNLOCKED'
                    ? 'Molinete: ABIERTO'
                    : turnstileState === 'EMERGENCY'
                    ? 'Molinete: LIBRE SST'
                    : 'Molinete 1: EN ESPERA'}
                </span>
              </div>

              {/* Intercom to Guard */}
              <button
                type="button"
                onClick={() => setIntercomOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                title="Llamar al vigilante en portería"
              >
                <Radio className="w-3.5 h-3.5 text-orange-400" />
                <span>Intercomunicador</span>
              </button>

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={toggleAudioMuted}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                title={isAudioMuted ? 'Activar sonido de confirmación' : 'Silenciar altavoz'}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Solar High Contrast Mode Toggle */}
              <button
                type="button"
                onClick={toggleSolarMode}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  isSolarMode ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Modo alto contraste para luz solar directa"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Solar</span>
              </button>

              {/* Local Storage / Offline Resilience Telemetry */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 text-[11px] font-mono" title="Trazabilidad local persistente para contingencia por pérdida de red en Mamonal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400 hidden xl:inline font-sans">Red:</span>
                <span className="text-emerald-400 font-semibold">LOCAL OK</span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span>Control de Acceso Integral · Personal & Visitantes</span>
            </div>
          )}

          {/* Right: Clock & SEPARATE Administrative Portal Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Clock */}
            <div className="hidden sm:flex flex-col items-end leading-none font-mono">
              <span className="text-sm font-bold tracking-tight text-white tabular-nums">
                {timeStr}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{dateStr}</span>
            </div>

            {/* DECOUPLED Access Button: Kiosk vs Administrative Console */}
            {mainView === 'public' ? (
              <button
                type="button"
                onClick={() => setMainView('admin')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-xs"
                title="Portal exclusivo para Supervisores, Jefes de Área y Administradores"
              >
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span className="whitespace-nowrap">Consola Supervisores</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMainView('public')}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Regresar a la pantalla táctil de garita para trabajadores"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Abrir Terminal Kiosco</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
