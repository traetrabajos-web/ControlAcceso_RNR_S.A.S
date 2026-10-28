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
  BookOpen,
  Plus,
  Printer,
  FileSpreadsheet,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { Trabajador, MinutaGuardia } from '../../../types';

export const PorteriaTab: React.FC = () => {
  const { trabajadores, zonas, registros, guardPunch, minutas, addMinuta, currentUser, setAdminTab, visitantes } = useApp();

  const [selectedZonaId, setSelectedZonaId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Trabajador | null>(null);
  const [obs, setObs] = useState('');
  const [eppChecked, setEppChecked] = useState(true);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Minutas state
  const [isMinutaModalOpen, setIsMinutaModalOpen] = useState(false);
  const [minutaForm, setMinutaForm] = useState({
    vigilante_nombre: currentUser?.nombre_completo || 'Víctor Hugo Carmona (Guarda Garita 1)',
    tipo_evento: 'INSPECCION_PERIMETRAL' as MinutaGuardia['tipo_evento'],
    descripcion: '',
    prioridad: 'NORMAL' as MinutaGuardia['prioridad']
  });

  // Official ARL Sheet Modal
  const [isArlSheetOpen, setIsArlSheetOpen] = useState(false);

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

  const handleAddMinuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minutaForm.descripcion.trim()) return;
    addMinuta(minutaForm);
    setIsMinutaModalOpen(false);
    setMinutaForm({
      vigilante_nombre: currentUser?.nombre_completo || 'Víctor Hugo Carmona (Guarda Garita 1)',
      tipo_evento: 'INSPECCION_PERIMETRAL',
      descripcion: '',
      prioridad: 'NORMAL'
    });
  };

  const recentMovements = registros.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🚧 Consola de Portería, Garita y Libro de Minutas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Puesto de mando para el oficial de seguridad: fichajes asistidos, verificación SST y bitácora de novedades en vivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdminTab('visitantes')}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>Visitantes ({visitantes.filter(v => v.estado === 'DENTRO').length} en sede)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsArlSheetOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-orange-400" />
            <span>Planilla ARL Sura / Mintrabajo</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMinutaModalOpen(true)}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Novedad en Minuta</span>
          </button>
        </div>
      </div>


      {/* Main Two-Column Layout */}
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
              Buscar Trabajador (Cédula, Credencial o Nombre):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: 73189450 o Mendoza..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Buscar
              </button>
            </div>

            {/* Quick Autocomplete Results */}
            {searchTerm && !selectedWorker && (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
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

              {/* EPP Verification */}
              {selectedWorker.tipo_personal === 'PATIO' && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-orange-600" />
                    <span>Verificación de EPP en Portería</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEppChecked(!eppChecked)}
                    className="flex items-center gap-1 font-bold text-slate-800 cursor-pointer"
                  >
                    {eppChecked ? <CheckSquare className="w-4 h-4 text-orange-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    <span>{eppChecked ? 'Conforme' : 'Incompleto'}</span>
                  </button>
                </div>
              )}

              {/* Observation Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observación del Vigilante (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ingresa con autorización de gerencia o herramienta externa..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => executeAction('ENTRADA')}
                  disabled={selectedWorker.ubicacion_actual === 'DENTRO_PLANTA'}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    selectedWorker.ubicacion_actual === 'DENTRO_PLANTA'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Registrar Entrada</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeAction('SALIDA')}
                  disabled={selectedWorker.ubicacion_actual !== 'DENTRO_PLANTA'}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    selectedWorker.ubicacion_actual !== 'DENTRO_PLANTA'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Registrar Salida</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Movements Feed (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Últimos Movimientos en Portería</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{recentMovements.length} eventos recientes</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {recentMovements.map(r => (
              <div
                key={r.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    r.hora_salida ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {r.hora_salida ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{r.trabajador_nombre}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {r.departamento} · CC {r.documento}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800 block">
                    {r.hora_salida || r.hora_entrada}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    r.estado_asistencia === 'PUNTUAL'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}>
                    {r.estado_asistencia}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW SECTION: Libro de Minutas y Novedades de Portería en Vivo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Libro de Minutas y Registro de Novedades de Seguridad Física
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Bitácora legal de eventos · Garita Peatonal & Báscula Mamonal
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {minutas.map(m => (
            <div key={m.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                    m.prioridad === 'CRITICA'
                      ? 'bg-rose-100 text-rose-800'
                      : m.prioridad === 'ALTA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.tipo_evento.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-900">{m.vigilante_nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>{m.fecha}</span>
                  <span>·</span>
                  <span className="font-bold text-slate-700">{m.hora}</span>
                </div>
              </div>
              <p className="text-slate-700 text-xs pl-0.5">{m.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Registrar Novedad en Minuta */}
      {isMinutaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <span>Asentar Novedad en Minuta de Portería</span>
              </div>
              <button onClick={() => setIsMinutaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMinuta} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vigilante a Cargo:</label>
                <input
                  type="text"
                  required
                  value={minutaForm.vigilante_nombre}
                  onChange={e => setMinutaForm({ ...minutaForm, vigilante_nombre: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Evento:</label>
                  <select
                    value={minutaForm.tipo_evento}
                    onChange={e => setMinutaForm({ ...minutaForm, tipo_evento: e.target.value as MinutaGuardia['tipo_evento'] })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="INSPECCION_PERIMETRAL">Inspección Perimetral</option>
                    <option value="RELEVO_TURNO">Relevo de Turno</option>
                    <option value="INGRESO_VEHICULAR">Ingreso Vehicular</option>
                    <option value="NOVEDAD_SST">Novedad EPP / SST</option>
                    <option value="MANTENIMIENTO">Mantenimiento Garita</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridad:</label>
                  <select
                    value={minutaForm.prioridad}
                    onChange={e => setMinutaForm({ ...minutaForm, prioridad: e.target.value as MinutaGuardia['prioridad'] })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Detallada de los Hechos:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalla lo sucedido en garita, placas, personas involucradas y medidas adoptadas..."
                  value={minutaForm.descripcion}
                  onChange={e => setMinutaForm({ ...minutaForm, descripcion: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMinutaModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Asentar en Minuta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Planilla Oficial ARL Sura / Mintrabajo */}
      {isArlSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">Planilla Oficial de Control de Asistencia y ARL (SST Mamonal)</h3>
              </div>
              <button onClick={() => setIsArlSheetOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-sans font-bold text-slate-900 text-base">RECUPERACIONES NARANJO RECYCLING S.A.S.</h4>
                <p className="text-slate-500 text-xs">NIT 901.884.219-5 · Sede Industrial Mamonal Km 7, Cartagena</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Control Laboral Oficial según Ley 2101 / CST y Cobertura ARL Sura Riesgo V</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">Documento</th>
                      <th className="p-2">Trabajador</th>
                      <th className="p-2">Cargo</th>
                      <th className="p-2">Entrada</th>
                      <th className="p-2">Salida</th>
                      <th className="p-2">ARL Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trabajadores.map(w => {
                      const reg = registros.find(r => Number(r.trabajador_id) === Number(w.id));
                      return (
                        <tr key={w.id}>
                          <td className="p-2">{w.documento}</td>
                          <td className="p-2 font-bold font-sans">{w.nombre_completo}</td>
                          <td className="p-2">{w.cargo}</td>
                          <td className="p-2 font-bold text-emerald-700">{reg?.hora_entrada || '—'}</td>
                          <td className="p-2 font-bold text-blue-700">{reg?.hora_salida || '—'}</td>
                          <td className="p-2 font-bold text-slate-800">{w.arl_vigente ? 'VIGENTE' : 'VENCIDA'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-slate-500 text-[11px]">
                <span>Oficial de Seguridad: Víctor Hugo Carmona</span>
                <span>Firma Director SST: ___________________________</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span>Imprimir Planilla Oficial</span>
              </button>
              <button
                type="button"
                onClick={() => setIsArlSheetOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
