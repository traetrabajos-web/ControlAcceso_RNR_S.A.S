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
  Check,
  Download,
  Ban,
  Plus,
  Trash2,
  Power,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { IncidenciaAcceso, PersonaRestringida } from '../../../types';

export const AlertasTab: React.FC = () => {
  const {
    incidencias,
    resolveIncidencia,
    personasRestringidas,
    addPersonaRestringida,
    removePersonaRestringida,
    togglePersonaRestringida,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'INCIDENTES' | 'RESTRICCIONES'>('INCIDENTES');
  const [filterSeveridad, setFilterSeveridad] = useState('TODAS');
  const [filterEstado, setFilterEstado] = useState('TODAS');
  const [resolvingIncidencia, setResolvingIncidencia] = useState<IncidenciaAcceso | null>(null);
  const [resolucionNota, setResolucionNota] = useState('');

  // New restriction modal
  const [isNewRestrOpen, setIsNewRestrOpen] = useState(false);
  const [restrForm, setRestrForm] = useState({
    documento: '',
    nombre_completo: '',
    tipo_persona: 'VISITANTE_VETADO' as PersonaRestringida['tipo_persona'],
    motivo: '',
    severidad: 'BLOQUEO_TOTAL' as PersonaRestringida['severidad']
  });

  const filteredIncidencias = useMemo(() => {
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

  const handleCreateRestriction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restrForm.documento.trim() || !restrForm.nombre_completo.trim() || !restrForm.motivo.trim()) return;

    addPersonaRestringida({
      documento: restrForm.documento.trim(),
      nombre_completo: restrForm.nombre_completo.trim(),
      tipo_persona: restrForm.tipo_persona,
      motivo: restrForm.motivo.trim(),
      severidad: restrForm.severidad,
      registrado_por: currentUser?.email || 'seguridad@recuperacionesnaranjo.com'
    });

    setIsNewRestrOpen(false);
    setRestrForm({
      documento: '',
      nombre_completo: '',
      tipo_persona: 'VISITANTE_VETADO',
      motivo: '',
      severidad: 'BLOQUEO_TOTAL'
    });
  };

  // CSV Export for incidents
  const exportIncidenciasCsv = () => {
    const headers = [
      'ID Incidencia',
      'Fecha y Hora',
      'Involucrado',
      'Documento',
      'Punto de Control',
      'Tipo de Alerta',
      'Severidad',
      'Detalle del Evento',
      'Estado',
      'Nota Resolucion'
    ];

    const rows = filteredIncidencias.map(inc => [
      `"${inc.id}"`,
      `"${inc.fecha_hora}"`,
      `"${inc.trabajador_nombre}"`,
      `"${inc.documento}"`,
      `"${inc.zona_nombre}"`,
      `"${inc.tipo_alerta}"`,
      `"${inc.severidad}"`,
      `"${inc.detalle}"`,
      `"${inc.estado_resolucion}"`,
      `"${inc.resolucion_nota || 'Sin resolucion'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_incidentes_acceso_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Subnav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-600" />
            <span>Centro de Seguridad, Alertas y Restricciones de Acceso</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de accesos bloqueados, incidentes de seguridad y administración de lista de exclusión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'INCIDENTES' ? (
            <button
              type="button"
              onClick={exportIncidenciasCsv}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Exportar Incidentes CSV</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsNewRestrOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Persona a Lista de Veto</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('INCIDENTES')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'INCIDENTES'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Bitácora de Incidentes ({incidencias.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('RESTRICCIONES')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'RESTRICCIONES'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Lista de Veto & Restricción de Personas ({personasRestringidas.length})</span>
        </button>
      </div>

      {/* VIEW 1: INCIDENTS LOG */}
      {activeSubTab === 'INCIDENTES' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">Severidad:</span>
                <select
                  value={filterSeveridad}
                  onChange={e => setFilterSeveridad(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
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
                  className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
                >
                  <option value="TODAS">Todos ({incidencias.length})</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="RESUELTO">Resueltos</option>
                </select>
              </div>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              Mostrando {filteredIncidencias.length} de {incidencias.length} incidentes
            </span>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
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
                  {filteredIncidencias.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No hay incidentes de seguridad con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidencias.map(inc => (
                      <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{inc.fecha_hora}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{inc.trabajador_nombre}</span>
                          <span className="text-[11px] text-slate-400 font-mono">CC {inc.documento}</span>
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
        </div>
      )}

      {/* VIEW 2: PERSONAS RESTRINGIDAS / LISTA DE EXCLUSIÓN */}
      {activeSubTab === 'RESTRICCIONES' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-start gap-3">
            <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Política de Exclusión y Veto Preventivo:</span>
              <p className="mt-0.5 text-rose-800">
                Las cédulas registradas en esta lista tienen <strong>bloqueo automático e inmediato</strong> en los terminales Kiosco y porterías.
                Cualquier intento de fichaje de estas personas dispara una alerta crítica y mantiene asegurado el molinete.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-3">Documento / Cédula</th>
                    <th className="px-4 py-3">Nombre Completo</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Severidad</th>
                    <th className="px-4 py-3">Motivo de la Restricción</th>
                    <th className="px-4 py-3">Fecha Registro</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personasRestringidas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No hay personas registradas en la lista de exclusión.
                      </td>
                    </tr>
                  ) : (
                    personasRestringidas.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-rose-700">
                          CC {p.documento}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {p.nombre_completo}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                            {p.tipo_persona}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {p.severidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-sm">
                          {p.motivo}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {p.fecha_registro}
                        </td>
                        <td className="px-4 py-3">
                          {p.activo ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                              VETO ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              INACTIVO
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => togglePersonaRestringida(p.id)}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                              p.activo
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title={p.activo ? 'Desactivar veto temporalmente' : 'Reactivar veto'}
                          >
                            {p.activo ? 'Suspender' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removePersonaRestringida(p.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded text-[11px] font-bold transition-colors"
                            title="Eliminar de la lista de veto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Incident Resolution */}
      {resolvingIncidencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Gestionar y Solventar Incidente</h3>
              <button onClick={() => setResolvingIncidencia(null)} className="text-slate-400 hover:text-slate-700">
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

      {/* Modal: New Restriction */}
      {isNewRestrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Registrar Persona en Lista de Veto</h3>
              </div>
              <button onClick={() => setIsNewRestrOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRestriction} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de Cédula / Documento: *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 19827364"
                  value={restrForm.documento}
                  onChange={e => setRestrForm({ ...restrForm, documento: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo: *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ernesto Barreto Paternina"
                  value={restrForm.nombre_completo}
                  onChange={e => setRestrForm({ ...restrForm, nombre_completo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Involucrado:</label>
                  <select
                    value={restrForm.tipo_persona}
                    onChange={e => setRestrForm({ ...restrForm, tipo_persona: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="EX_EMPLEADO">Ex Empleado</option>
                    <option value="CONTRATISTA_SANCIONADO">Contratista Sancionado</option>
                    <option value="VISITANTE_VETADO">Visitante Vetado</option>
                    <option value="INVESTIGACION_JUDICIAL">Investigación Judicial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severidad:</label>
                  <select
                    value={restrForm.severidad}
                    onChange={e => setRestrForm({ ...restrForm, severidad: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="BLOQUEO_TOTAL">Bloqueo Total</option>
                    <option value="REQUERIMIENTO_POLICIA">Requerimiento Policía</option>
                    <option value="ALERTA_INTERROGATORIO">Alerta Interrogatorio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo Detallado de la Restricción: *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Terminación con justa causa por falta grave al reglamento de seguridad patrimonial."
                  value={restrForm.motivo}
                  onChange={e => setRestrForm({ ...restrForm, motivo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRestrOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Registrar en Lista de Veto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
