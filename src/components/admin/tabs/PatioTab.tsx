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
  DollarSign,
  ShieldCheck,
  FileText,
  X,
  Printer
} from 'lucide-react';
import { MaquinariaPesada, PermisoTrabajoCaliente } from '../../../types';

export const PatioTab: React.FC = () => {
  const {
    trabajadores,
    autorizaciones,
    addAutorizacion,
    currentUser,
    maquinarias,
    updateMaquinaria,
    permisosCaliente,
    addPermisoCaliente,
    updatePermisoCalienteEstado
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(5);
  const [dia, setDia] = useState('SÁBADO');
  const [horas, setHoras] = useState(6);
  const [motivo, setMotivo] = useState('');

  // Hot Work Permit state
  const [isPtcModalOpen, setIsPtcModalOpen] = useState(false);
  const [ptcForm, setPtcForm] = useState({
    trabajador_nombre: 'Gustavo Adolfo Zúñiga (Oxigenista)',
    supervisor_autoriza: currentUser?.nombre_completo || 'Jorge Eliécer Naranjo (Jefe de Patio)',
    area_especifica: 'Bahía 1 - Desguace de Estructuras Pesadas',
    tarea: 'Corte por oxicorte de vigas IPE para carga en prensa cizalla',
    hora_inicio: '08:30',
    hora_fin: '13:00',
    extintor_verificado: true,
    lineas_gases_revisadas: true,
    area_libre_combustibles: true,
    estado: 'ACTIVO' as PermisoTrabajoCaliente['estado']
  });

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

  const handleCreatePtc = (e: React.FormEvent) => {
    e.preventDefault();
    addPermisoCaliente(ptcForm);
    setIsPtcModalOpen(false);
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
            Monitoreo en tiempo real de operadores de grúas pulpo, montacargas, permisos de oxicorte y programación de horas extras.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPtcModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Emitir Permiso Oxicorte (PTC)</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Autorizar Jornada Extra Patio</span>
          </button>
        </div>
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
                  <strong className="font-mono text-slate-900 tabular-nums">{m.horometro_horas} h</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Próx. Servicio:</span>
                  <span className="font-mono tabular-nums">{m.proximo_mantenimiento_horas} h</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 truncate">{m.observaciones}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW SECTION: Permisos de Trabajo Seguro en Caliente (PTC - Oxicorte & Soldadura) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Permisos de Trabajo Seguro en Caliente (PTC — Oxicorte y Soldadura)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Protocolo obligatorio SST Riesgo V · Resolución 0312 / CST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Operario / Oxigenista</th>
                <th className="px-3 py-2.5">Ubicación & Tarea</th>
                <th className="px-3 py-2.5">Horario Autorizado</th>
                <th className="px-3 py-2.5">Checklist SST</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permisosCaliente.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{p.codigo_permiso}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-900">{p.trabajador_nombre}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <span className="font-semibold block">{p.area_especifica}</span>
                    <span className="text-[11px] text-slate-400">{p.tarea}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-700">
                    {p.hora_inicio} – {p.hora_fin}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                      <span>✓ Extintor</span>
                      <span>·</span>
                      <span>✓ Gases</span>
                      <span>·</span>
                      <span>✓ Radio 15m</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.estado === 'ACTIVO'
                        ? 'bg-amber-100 text-amber-800'
                        : p.estado === 'CULMINADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {p.estado === 'ACTIVO' && (
                      <button
                        type="button"
                        onClick={() => updatePermisoCalienteEstado(p.id, 'CULMINADO')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold border border-emerald-200 transition-colors"
                      >
                        Cerrar Permiso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {t.ubicacion_actual === 'DENTRO_PLANTA' ? 'EN PATIO' : 'FUERA'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">CC {t.documento}</span>
                <span className="font-medium text-slate-700">ARL: {t.arl_vigente ? 'Vigente' : 'Inactiva'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authorized Overtime Shifts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600" />
          <span>Jornadas y Horas Extras Autorizadas de Patio</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {autorizaciones.map(a => (
            <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{a.nombre_trabajador}</span>
                <span className="text-slate-500 text-[11px]">{a.motivo}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  {a.dia} ({a.horas_estimadas}h)
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  ${(a.costo_estimado_cop || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Emitir Permiso en Caliente (PTC) */}
      {isPtcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Emitir Permiso de Trabajo en Caliente (PTC)</span>
              </div>
              <button onClick={() => setIsPtcModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePtc} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operario / Oxigenista:</label>
                <select
                  value={ptcForm.trabajador_nombre}
                  onChange={e => setPtcForm({ ...ptcForm, trabajador_nombre: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Gustavo Adolfo Zúñiga (Oxigenista)">Gustavo Adolfo Zúñiga (Oxigenista)</option>
                  <option value="Héctor Fabio Marín (Mecánico de Planta)">Héctor Fabio Marín (Mecánico de Planta)</option>
                  <option value="Wilfrido Mendoza Polo (Operador Grúa)">Wilfrido Mendoza Polo (Operador Grúa)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Área Específica de Trabajo:</label>
                <input
                  type="text"
                  required
                  value={ptcForm.area_especifica}
                  onChange={e => setPtcForm({ ...ptcForm, area_especifica: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción de la Tarea:</label>
                <input
                  type="text"
                  required
                  value={ptcForm.tarea}
                  onChange={e => setPtcForm({ ...ptcForm, tarea: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hora Inicio:</label>
                  <input
                    type="time"
                    required
                    value={ptcForm.hora_inicio}
                    onChange={e => setPtcForm({ ...ptcForm, hora_inicio: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hora Fin:</label>
                  <input
                    type="time"
                    required
                    value={ptcForm.hora_fin}
                    onChange={e => setPtcForm({ ...ptcForm, hora_fin: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2 text-slate-800">
                <span className="font-bold text-[11px] text-orange-950 block">Checklist Obligatorio de Seguridad SST:</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={ptcForm.extintor_verificado}
                    onChange={e => setPtcForm({ ...ptcForm, extintor_verificado: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Extintor PQS 20 lbs presurizado e inspeccionado en el punto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={ptcForm.lineas_gases_revisadas}
                    onChange={e => setPtcForm({ ...ptcForm, lineas_gases_revisadas: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Mangueras, manómetros y válvulas arrestallamas sin fugas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={ptcForm.area_libre_combustibles}
                    onChange={e => setPtcForm({ ...ptcForm, area_libre_combustibles: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Radio de 15 metros despejado de combustibles o grasas</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPtcModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Emitir y Firmar PTC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Autorizar Horas Extras Patio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Autorizar Jornada Extraordinaria de Patio</h3>
            <form onSubmit={handleCreateAutorizacion} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trabajador de Patio:</label>
                <select
                  value={selectedWorkerId}
                  onChange={e => setSelectedWorkerId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
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
                  <label className="block font-semibold text-slate-700 mb-1">Día Programado:</label>
                  <select
                    value={dia}
                    onChange={e => setDia(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="SÁBADO">Sábado</option>
                    <option value="DOMINGO">Domingo</option>
                    <option value="FESTIVO">Día Festivo</option>
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
