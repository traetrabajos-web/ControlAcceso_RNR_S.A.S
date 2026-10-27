import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  DoorOpen,
  Search,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HardHat,
  CheckSquare,
  Square,
  Clock,
  User
} from 'lucide-react';
import { Trabajador } from '../../../types';

export const PorteriaTab: React.FC = () => {
  const { trabajadores, zonas, registros, guardPunch } = useApp();
  const [selectedZonaId, setSelectedZonaId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Trabajador | null>(null);
  const [obs, setObs] = useState('');
  const [eppChecked, setEppChecked] = useState(true);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSearch = () => {
    const clean = searchTerm.trim().toUpperCase();
    if (!clean) return;
    const found = trabajadores.find(t =>
      t.documento.toUpperCase() === clean ||
      t.codigo_credencial.toUpperCase() === clean ||
      t.nombre_completo.toUpperCase().includes(clean)
    );
    setSelectedWorker(found || null);
    if (!found) {
      setFeedback({ ok: false, msg: 'Trabajador no encontrado en el padrón.' });
    } else {
      setFeedback(null);
    }
  };

  const handleSelectFromList = (w: Trabajador) => {
    setSelectedWorker(w);
    setSearchTerm(w.nombre_completo);
    setFeedback(null);
  };

  const executeAction = (tipo: 'ENTRADA' | 'SALIDA') => {
    if (!selectedWorker) return;
    const res = guardPunch(selectedWorker.id, tipo, selectedZonaId, obs, eppChecked);
    setFeedback({ ok: res.ok, msg: res.mensaje });
    setSelectedWorker(prev => (prev ? { ...prev, ubicacion_actual: tipo === 'ENTRADA' ? 'DENTRO_PLANTA' : 'FUERA_PLANTA' } : null));
    setObs('');
  };

  const recentMovements = registros.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">🚧 Consola de Portería, Garita y Control de Acceso</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Operación manual para el oficial de garita con verificación SST de EPP y registro de accesos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Worker preview (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-orange-600" />
            <span>Fichar Movimiento en Punto de Control</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Punto de Control Físico / Garita:
            </label>
            <select
              value={selectedZonaId}
              onChange={(e) => setSelectedZonaId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
            >
              {zonas.map(z => (
                <option key={z.id} value={z.id}>
                  {z.codigo} — {z.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Buscar Cédula, Código RFID o Nombre:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: 73189450, EMP-001 o Jorge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>

            {/* Quick Suggestions */}
            {searchTerm.trim().length > 1 && !selectedWorker && (
              <div className="mt-1 border border-slate-200 rounded-lg bg-white shadow-md max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {trabajadores
                  .filter(w =>
                    w.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    w.documento.includes(searchTerm)
                  )
                  .slice(0, 4)
                  .map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectFromList(w)}
                      className="w-full p-2 text-left hover:bg-orange-50 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">{w.nombre_completo}</span>
                      <span className="text-slate-400 font-mono text-[11px]">CC {w.documento}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {selectedWorker && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                {selectedWorker.foto_url ? (
                  <img src={selectedWorker.foto_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-300" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                    {selectedWorker.nombre_completo.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedWorker.nombre_completo}</h4>
                  <span className="text-xs text-slate-600 block">{selectedWorker.cargo} · {selectedWorker.departamento}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      {selectedWorker.codigo_credencial}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedWorker.ubicacion_actual === 'DENTRO_PLANTA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedWorker.ubicacion_actual === 'DENTRO_PLANTA' ? 'EN PLANTA' : 'FUERA'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedWorker.arl_vigente ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      ARL: {selectedWorker.arl_vigente ? 'Vigente' : 'Vencida'}
                    </span>
                  </div>
                </div>
              </div>

              {/* EPP Verification in Guard Console */}
              {selectedWorker.tipo_personal === 'PATIO' && (
                <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded-lg flex items-center justify-between text-xs text-orange-950">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <HardHat className="w-4 h-4 text-orange-600" />
                    <span>Verificación de Casco, Botas puntera y Chaleco:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEppChecked(!eppChecked)}
                    className="flex items-center gap-1 text-orange-800 font-bold"
                  >
                    {eppChecked ? <CheckSquare className="w-4 h-4 text-orange-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    <span>{eppChecked ? 'Aprobado' : 'Pendiente'}</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observación de Garita (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ingreso con caja de herramientas o pase vehicular..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => executeAction('ENTRADA')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Marcar Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => executeAction('SALIDA')}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Marcar Salida</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Gate Activity (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Últimos Movimientos en Puntos de Control</span>
            </h3>
            <span className="text-[11px] text-slate-400">Garita Mamonal</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {recentMovements.map(r => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                    r.hora_salida ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {r.hora_salida ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">{r.trabajador_nombre}</span>
                    <span className="text-[11px] text-slate-400">{r.zona_nombre.split('(')[0]}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800 block">
                    {r.hora_salida ? r.hora_salida : r.hora_entrada}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {r.hora_salida ? 'Salida' : r.estado_asistencia}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
