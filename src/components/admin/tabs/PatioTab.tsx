import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  HardHat,
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Gauge,
  Activity,
  Layers,
  Flame,
  DollarSign
} from 'lucide-react';
import { MaquinariaPesada } from '../../../types';

export const PatioTab: React.FC = () => {
  const {
    trabajadores,
    autorizaciones,
    addAutorizacion,
    currentUser,
    maquinarias,
    updateMaquinaria
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(5);
  const [dia, setDia] = useState('SÁBADO');
  const [horas, setHoras] = useState(6);
  const [motivo, setMotivo] = useState('');

  const cuadrilla = trabajadores.filter(t => t.tipo_personal === 'PATIO');

  const handleCreateAutorizacion = (e: React.FormEvent) => {
    e.preventDefault();
    const w = trabajadores.find(t => t.id === Number(selectedWorkerId));
    if (!w) return;

    addAutorizacion({
      trabajador_id: w.id,
      nombre_trabajador: `${w.nombre_completo} (${w.cargo})`,
      dia,
      horas_estimadas: Number(horas),
      motivo: motivo || 'Mantenimiento preventivo u operación extraordinaria en patio',
      autorizado_por: currentUser?.nombre_completo || 'Jorge Eliécer Naranjo (Jefe de Patio)',
      costo_estimado_cop: Number(horas) * 23250
    });

    setIsModalOpen(false);
    setMotivo('');
  };

  const handleStatusChange = (m: MaquinariaPesada, newStatus: MaquinariaPesada['estado']) => {
    updateMaquinaria({ ...m, estado: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🚜 Mi Cuadrilla y Maquinaria Pesada en Vivo (Patio)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de operadores de grúas pulpo, montacargas, oxicorte y programación de horas extras.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Autorizar Jornada Extra Patio</span>
        </button>
      </div>

      {/* Heavy Machinery Telemetry Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-600" />
          <span>Estado Operativo de Maquinaria Pesada de Patio</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {maquinarias.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {m.codigo}
                  </span>
                  <select
                    value={m.estado}
                    onChange={(e) => handleStatusChange(m, e.target.value as MaquinariaPesada['estado'])}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                      m.estado === 'OPERATIVO'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : m.estado === 'EN_MANTENIMIENTO'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <option value="OPERATIVO">OPERATIVO</option>
                    <option value="EN_MANTENIMIENTO">MANTENIMIENTO</option>
                    <option value="DETENIDO">DETENIDO</option>
                  </select>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-2">{m.nombre}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{m.modelo}</p>
                <div className="text-xs font-medium text-slate-700 mt-2 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-orange-600" />
                  <span>Op: {m.operador_nombre}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    Horómetro:
                  </span>
                  <strong className="font-mono text-slate-900">{m.horometro_horas} h</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Próx. Servicio:</span>
                  <span className="font-mono">{m.proximo_mantenimiento_horas} h</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 truncate">{m.observaciones}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yard Crew Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <HardHat className="w-4 h-4 text-orange-600" />
          <span>Personal de Cuadrilla de Patio Mamonal ({cuadrilla.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuadrilla.map(t => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all ${
                t.ubicacion_actual === 'DENTRO_PLANTA'
                  ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-400/20'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {t.foto_url ? (
                    <img src={t.foto_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-base">
                      {t.nombre_completo.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{t.nombre_completo}</h4>
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                      <HardHat className="w-3.5 h-3.5 text-orange-600" />
                      {t.cargo}
                    </span>
                    {t.certificacion_maquinaria && (
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mt-0.5">
                        {t.certificacion_maquinaria}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  t.ubicacion_actual === 'DENTRO_PLANTA'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {t.ubicacion_actual === 'DENTRO_PLANTA' ? 'EN PATIO' : 'FUERA'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">CC {t.documento}</span>
                <div className="flex items-center gap-1.5">
                  {t.es_puesto_critico && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
                      PUESTO CRÍTICO
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    t.arl_vigente ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    ARL {t.arl_vigente ? 'OK' : 'Vencida'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekend Overtime Authorizations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Autorizaciones de Horas Extras en Fin de Semana (Patio y Mantenimiento)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Día Programado</th>
                <th className="px-4 py-3">Horas Est.</th>
                <th className="px-4 py-3">Costo Est. (COP)</th>
                <th className="px-4 py-3">Motivo / Tarea de Patio</th>
                <th className="px-4 py-3">Autorizado Por</th>
                <th className="px-4 py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {autorizaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No hay solicitudes de jornadas extraordinarias registradas.
                  </td>
                </tr>
              ) : (
                autorizaciones.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.nombre_trabajador}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{a.dia} ({a.fecha_programada})</td>
                    <td className="px-4 py-3 font-mono font-bold text-orange-600">{a.horas_estimadas} h</td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      ${(a.costo_estimado_cop || (a.horas_estimadas * 22500)).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{a.motivo}</td>
                    <td className="px-4 py-3 text-slate-500">{a.autorizado_por}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Authorize Overtime */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Autorizar Jornada Extraordinaria en Patio</h3>
            <form onSubmit={handleCreateAutorizacion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trabajador de Patio:</label>
                <select
                  value={selectedWorkerId}
                  onChange={e => setSelectedWorkerId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {cuadrilla.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nombre_completo} — {w.cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Día:</label>
                  <select
                    value={dia}
                    onChange={e => setDia(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="SÁBADO">SÁBADO</option>
                    <option value="DOMINGO">DOMINGO</option>
                    <option value="FESTIVO">FESTIVO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horas Estimadas:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={horas}
                    onChange={e => setHoras(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Operación:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Mantenimiento mayor preventivo al sistema hidráulico de la Grúa Pulpo #1"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Aprobar y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
