import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  X,
  MessageSquare,
  Check
} from 'lucide-react';
import { IncidenciaAcceso } from '../../../types';

export const AlertasTab: React.FC = () => {
  const { incidencias, resolveIncidencia } = useApp();
  const [filterSeveridad, setFilterSeveridad] = useState('TODAS');
  const [filterEstado, setFilterEstado] = useState('TODAS');
  const [resolvingIncidencia, setResolvingIncidencia] = useState<IncidenciaAcceso | null>(null);
  const [resolucionNota, setResolucionNota] = useState('');

  const filtered = useMemo(() => {
    return incidencias.filter(inc => {
      const matchSev = filterSeveridad === 'TODAS' || inc.severidad === filterSeveridad;
      const matchEst = filterEstado === 'TODAS' || inc.estado_resolucion === filterEstado;
      return matchSev && matchEst;
    });
  }, [incidencias, filterSeveridad, filterEstado]);

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncidencia) return;
    resolveIncidencia(resolvingIncidencia.id, resolucionNota);
    setResolvingIncidencia(null);
    setResolucionNota('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">🚨 Centro de Alertas, SST e Incidentes de Seguridad</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Bitácora en tiempo real de accesos no autorizados, bloqueos por ARL, vencimientos de credenciales y fallas de EPP.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Severidad:</span>
            <select
              value={filterSeveridad}
              onChange={e => setFilterSeveridad(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="TODAS">Todas las severidades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Estado:</span>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="TODAS">Todos ({incidencias.length})</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="RESUELTO">Resueltos</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Mostrando {filtered.length} de {incidencias.length} incidentes
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Involucrado</th>
                <th className="px-4 py-3">Tipo de Alerta</th>
                <th className="px-4 py-3">Severidad</th>
                <th className="px-4 py-3">Detalle del Evento</th>
                <th className="px-4 py-3">Punto de Control</th>
                <th className="px-4 py-3 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No hay incidentes de seguridad con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{inc.fecha_hora}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{inc.trabajador_nombre}</span>
                      <span className="text-[11px] text-slate-400">CC {inc.documento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                        {inc.tipo_alerta}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.severidad === 'ALTA' || inc.severidad === 'CRITICA'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.severidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-sm">
                      <p>{inc.detalle}</p>
                      {inc.resolucion_nota && (
                        <p className="text-[10px] text-emerald-800 mt-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                          <strong>Acción tomada:</strong> {inc.resolucion_nota} (por {inc.resuelto_por || 'SST'})
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inc.zona_nombre.split('(')[0]}</td>
                    <td className="px-4 py-3 text-right">
                      {inc.estado_resolucion === 'PENDIENTE' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingIncidencia(inc);
                            setResolucionNota('');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold transition-colors"
                        >
                          Resolver
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Resuelto
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingIncidencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Gestionar y Solventar Incidente</h3>
              <button onClick={() => setResolvingIncidencia(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="font-bold text-slate-800 block">{resolvingIncidencia.trabajador_nombre}</span>
              <p className="text-slate-600 text-[11px]">{resolvingIncidencia.detalle}</p>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Acción Correctiva o Preventiva Aplicada:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Se coordinó verificación de soporte ARL con talento humano y se autorizó ingreso al puesto."
                  value={resolucionNota}
                  onChange={e => setResolucionNota(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncidencia(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Marcar como Resuelto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
