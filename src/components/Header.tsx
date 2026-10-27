import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, ShieldCheck, DoorOpen, AlertOctagon, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { mainView, setMainView, currentUser, empresaConfig, toggleEmergencyLockdown } = useApp();
  const [timeStr, setTimeStr] = useState<string>('--:--:--');
  const [dateStr, setDateStr] = useState<string>('Cargando fecha...');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      const d = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      setDateStr(d.charAt(0).toUpperCase() + d.slice(1));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Emergency Lockdown Alert Ribbon */}
      {empresaConfig.modo_bloqueo_emergencia && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>⚠️ ALERTA SST: MODO DE BLOQUEO PREVENTIVO DE PLANTA ACTIVADO — INGRESO RESTRINGIDO A TODAS LAS ÁREAS</span>
          </div>
          <button
            onClick={toggleEmergencyLockdown}
            className="px-2 py-0.5 bg-white text-rose-700 rounded text-[11px] font-bold hover:bg-rose-50"
          >
            Desactivar Bloqueo
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 lg:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Container */}
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-md p-1 px-2 shadow-xs flex items-center justify-center">
              <img
                src="/assets/logo-naranjo.png"
                alt="Recuperaciones Naranjo"
                className="h-8 md:h-9 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg text-white tracking-tight">RNR S.A.S.</span>
                <span className="text-xs text-orange-400 font-semibold hidden sm:inline-block">
                  · Sede Industrial Mamonal (Cartagena)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <DoorOpen className="w-3.5 h-3.5 text-orange-500" />
                  Garita Peatonal & Báscula
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Línea Activa (Ley 2101 / 42h)
                </span>
              </div>
            </div>
          </div>

          {/* Live Clock & Navigation */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden md:flex flex-col items-end leading-tight pr-3 border-r border-slate-800">
              <span className="text-xl font-bold font-mono tracking-wide text-white">{timeStr}</span>
              <span className="text-xs text-slate-400 capitalize">{dateStr}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainView('public')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  mainView === 'public'
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Kiosco de Acceso</span>
              </button>

              <button
                onClick={() => setMainView('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  mainView === 'admin'
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{currentUser ? `Consola (${currentUser.rol.replace('_', ' ')})` : 'Consola Supervisión'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
