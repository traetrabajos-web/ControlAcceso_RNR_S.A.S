import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  Truck,
  HardHat,
  AlertOctagon,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer
} from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const {
    trabajadores,
    registros,
    visitantes,
    empresaConfig,
    quickExitWorker,
    toggleEmergencyLockdown
  } = useApp();

  const [isEvacuationModalOpen, setIsEvacuationModalOpen] = useState(false);
  const [evacuationChecklist, setEvacuationChecklist] = useState<Record<number, boolean>>({});

  const enPlanta = trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA');
  const entradasHoy = registros.filter(r => r.hora_entrada).length;
  const salidasHoy = registros.filter(r => r.hora_salida !== null).length;
  const tardanzasHoy = registros.filter(r => r.estado_asistencia && r.estado_asistencia.includes('TARDANZA')).length;
  const visitantesEnPlanta = visitantes.filter(v => v.estado === 'DENTRO');

  const totalOcupacion = enPlanta.length + visitantesEnPlanta.length;
  const aforoMax = empresaConfig.aforo_maximo_planta || 150;
  const aforoPct = Math.min(100, Math.round((totalOcupacion / aforoMax) * 100));

  // Area distribution calculations
  const enPatio = enPlanta.filter(t => t.tipo_personal === 'PATIO').length;
  const enAdmin = enPlanta.filter(t => t.tipo_personal === 'ADMINISTRACION' || t.tipo_personal === 'APRENDIZ_SENA').length;
  const enBascula = visitantesEnPlanta.length;

  // Toggle roll call in emergency modal
  const toggleCheck = (id: number) => {
    setEvacuationChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const evacCheckedCount = Object.values(evacuationChecklist).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header & Emergency Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">📊 Tablero de Control de Acceso y Aforo en Tiempo Real</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en vivo de presencia física, aforo perimetral y seguridad industrial en Sede Cartagena.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEvacuationModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-orange-400" />
            <span>Lista de Evacuación SST ({totalOcupacion})</span>
          </button>

          <button
            type="button"
            onClick={toggleEmergencyLockdown}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ${
              empresaConfig.modo_bloqueo_emergencia
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{empresaConfig.modo_bloqueo_emergencia ? 'Desactivar Bloqueo' : 'Cierre Preventivo Garita'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Total en Planta</span>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalOcupacion}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {aforoPct}% de aforo máx ({aforoMax} personas)
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Entradas de Hoy</span>
            <LogIn className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{entradasHoy}</div>
          <div className="text-[11px] text-slate-400 mt-1">Fichajes matutinos</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Salidas de Hoy</span>
            <LogOut className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{salidasHoy}</div>
          <div className="text-[11px] text-slate-400 mt-1">Jornadas finalizadas</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Tardanzas Detectadas</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{tardanzasHoy}</div>
          <div className="text-[11px] text-slate-400 mt-1">&gt; {empresaConfig.tolerancia_tardanza_min} min de tolerancia</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Vehículos / Chatarra</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{visitantesEnPlanta.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">En pesaje / báscula</div>
        </div>
      </div>

      {/* Visual Analytics & Capacity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plant Aforo Capacity & Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Capacidad y Aforo de Planta Mamonal</h3>
            <span className="text-xs font-mono font-bold text-slate-700">{totalOcupacion} / {aforoMax}</span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  aforoPct > 85 ? 'bg-rose-500' : aforoPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${aforoPct}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>0 (Vacío)</span>
              <span>75 (Normal)</span>
              <span>150 (Capacidad Máxima)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Distribución por Zonas:</span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                <span className="block font-bold text-orange-950 text-base">{enPatio}</span>
                <span className="text-[10px] text-orange-800 font-medium">Patio & Grúas</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <span className="block font-bold text-blue-950 text-base">{enAdmin}</span>
                <span className="text-[10px] text-blue-800 font-medium">Edif. Administrativo</span>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                <span className="block font-bold text-purple-950 text-base">{enBascula}</span>
                <span className="text-[10px] text-purple-800 font-medium">Báscula Camionera</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Ingress Activity Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Curva de Flujo Horario de Ingresos</h3>
            <span className="text-[11px] text-slate-400">Pico: 07:00 – 08:00 AM</span>
          </div>

          {/* Pure SVG Bar/Line Ingress Chart */}
          <div className="pt-2">
            <div className="h-32 flex items-end justify-between gap-2 px-2 pt-4 pb-2 border-b border-slate-200">
              {[
                { hour: '06h', count: 1, height: '15%' },
                { hour: '07h', count: 11, height: '95%' },
                { hour: '08h', count: 2, height: '25%' },
                { hour: '09h', count: 1, height: '15%' },
                { hour: '10h', count: 0, height: '5%' },
                { hour: '11h', count: 1, height: '15%' },
                { hour: '12h', count: 0, height: '5%' },
                { hour: '13h', count: 2, height: '25%' },
                { hour: '14h', count: 1, height: '15%' },
                { hour: '15h', count: 0, height: '5%' },
                { hour: '16h', count: 0, height: '5%' },
                { hour: '17h', count: 0, height: '5%' }
              ].map(bar => (
                <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-sm transition-all"
                    style={{ height: bar.height }}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-mono">{bar.hour}</span>

                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-10 font-mono">
                    {bar.count} ingresos
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Concentración máxima en horario oficial de ingreso (07:30 Lunes a Viernes).
            </p>
          </div>
        </div>
      </div>

      {/* Table: Active Personnel in Plant */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>📍 Personal Actualmente Dentro de la Empresa</span>
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {enPlanta.length} trabajadores
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Credencial</th>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Cargo y Departamento</th>
                <th className="px-4 py-3">Hora de Ingreso</th>
                <th className="px-4 py-3">Estado ARL</th>
                <th className="px-4 py-3 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enPlanta.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No hay trabajadores registrados dentro de planta en este momento.
                  </td>
                </tr>
              ) : (
                enPlanta.map(t => {
                  const reg = registros.find(r => Number(r.trabajador_id) === Number(t.id) && r.estado_ciclo === 'EN_PLANTA');
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{t.codigo_credencial}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{t.nombre_completo}</span>
                          {t.es_puesto_critico && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold">
                              Crítico
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">CC {t.documento}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <HardHat className="w-3.5 h-3.5 text-orange-500" />
                          <span>{t.cargo}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{t.departamento}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {reg ? reg.hora_entrada : (t.ultima_entrada?.split(' ')[1] || '07:30')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.arl_vigente ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.arl_vigente ? 'Vigente' : 'Vencida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => quickExitWorker(t.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                        >
                          Marcar Salida
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Evacuation Roll Call Modal */}
      {isEvacuationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base">Plan de Evacuación SST — Censo de Personal en Planta</h3>
              </div>
              <button onClick={() => setIsEvacuationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-orange-50 border-b border-orange-200 flex items-center justify-between text-xs text-orange-950">
              <span>Punto de Encuentro: <strong>Garita Peatonal Principal Vía Mamonal</strong></span>
              <span className="font-bold">Verificados en punto seguro: {evacCheckedCount} / {totalOcupacion}</span>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {enPlanta.map(w => (
                  <div
                    key={w.id}
                    onClick={() => toggleCheck(w.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      evacuationChecklist[w.id] ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        evacuationChecklist[w.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {evacuationChecklist[w.id] && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <span>{w.nombre_completo}</span>
                        <span className="text-[11px] text-slate-500 block font-normal">{w.cargo} · CC {w.documento}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{w.telefono}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Hoja de Evacuación</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEvacuationModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Cerrar Censo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
