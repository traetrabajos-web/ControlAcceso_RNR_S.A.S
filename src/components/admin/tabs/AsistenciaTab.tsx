import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Download, Search, Filter, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const AsistenciaTab: React.FC = () => {
  const { registros } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [timeRange, setTimeRange] = useState<'HOY' | 'SEMANA' | 'TODOS'>('TODOS');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    return registros.filter(r => {
      const matchSearch =
        r.trabajador_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.documento.includes(searchTerm) ||
        r.codigo_movimiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.zona_nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'PUNTUAL' && r.estado_asistencia === 'PUNTUAL') ||
        (statusFilter === 'TARDANZA' && r.estado_asistencia.includes('TARDANZA')) ||
        (statusFilter === 'EXTRAORDINARIA' && r.estado_asistencia === 'EXTRAORDINARIA');

      const matchTime =
        timeRange === 'TODOS' ||
        (timeRange === 'HOY' && r.fecha === todayStr) ||
        (timeRange === 'SEMANA');

      return matchSearch && matchStatus && matchTime;
    });
  }, [registros, searchTerm, statusFilter, timeRange, todayStr]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filtered.length;
    const puntuales = filtered.filter(r => r.estado_asistencia === 'PUNTUAL').length;
    const tardanzas = filtered.filter(r => r.estado_asistencia.includes('TARDANZA')).length;
    const totalHoras = filtered.reduce((acc, r) => acc + ((r.minutos_trabajados || 0) / 60), 0);
    const puntualidadPct = total > 0 ? Math.round((puntuales / total) * 100) : 100;
    const enTurno = filtered.filter(r => r.estado_ciclo === 'EN_PLANTA').length;

    return { total, puntuales, tardanzas, totalHoras: totalHoras.toFixed(1), puntualidadPct, enTurno };
  }, [filtered]);

  const exportCsv = () => {
    const headers = [
      'Codigo Movimiento',
      'Fecha',
      'Documento',
      'Credencial',
      'Trabajador',
      'Departamento',
      'Puerta',
      'Hora Entrada',
      'Hora Salida',
      'Estado Asistencia',
      'Ciclo',
      'Duracion',
      'Metodo',
      'Observacion'
    ];

    const rows = filtered.map(r => [
      `"${r.codigo_movimiento}"`,
      `"${r.fecha}"`,
      `"${r.documento}"`,
      `"${r.codigo_credencial}"`,
      `"${r.trabajador_nombre}"`,
      `"${r.departamento}"`,
      `"${r.zona_nombre}"`,
      `"${r.hora_entrada || ''}"`,
      `"${r.hora_salida || ''}"`,
      `"${r.estado_asistencia || ''}"`,
      `"${r.estado_ciclo}"`,
      `"${r.horas_formateadas}"`,
      `"${r.metodo_identificacion}"`,
      `"${r.observacion || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_asistencia_recuperaciones_naranjo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">📋 Historial Completo de Asistencia</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoría cronológica de registros con cálculo de horas laboradas, estados de puntualidad y trazabilidad de acceso.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-orange-400" />
          <span>Descargar Reporte CSV</span>
        </button>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Marcaciones Filtradas</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics.enTurno} actualmente en turno</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Horas Registradas</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1">{metrics.totalHoras} h</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Jornada 42h acumulada</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Índice de Puntualidad</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.puntualidadPct}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics.puntuales} ingresos a tiempo</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Llegadas Tarde</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{metrics.tardanzas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">&gt; 10 min de tolerancia</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por trabajador, CC, código o puerta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Quick Date Range Buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTimeRange('HOY')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              timeRange === 'HOY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('SEMANA')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              timeRange === 'SEMANA'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Esta Semana
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('TODOS')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              timeRange === 'TODOS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todo el Histórico
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Puntualidad:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PUNTUAL">Puntual</option>
            <option value="TARDANZA">Tardanza</option>
            <option value="EXTRAORDINARIA">Extraordinaria</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3">Salida</th>
                <th className="px-4 py-3">Puntualidad</th>
                <th className="px-4 py-3">Tiempo Total</th>
                <th className="px-4 py-3">Puerta & Método</th>
                <th className="px-4 py-3">Estado Ciclo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron registros de asistencia con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">{r.codigo_movimiento}</td>
                    <td className="px-4 py-3 text-slate-700">{r.fecha}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{r.trabajador_nombre}</span>
                      <span className="text-[11px] text-slate-400">CC {r.documento} · {r.departamento}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{r.hora_entrada}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{r.hora_salida || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.estado_asistencia === 'PUNTUAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.estado_asistencia.includes('TARDANZA')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {r.estado_asistencia}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{r.horas_formateadas}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{r.zona_nombre.split('(')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.metodo_identificacion}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.estado_ciclo === 'EN_PLANTA'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.estado_ciclo === 'EN_PLANTA' ? 'En Turno' : 'Cerrado'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
