import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { calculateWorkerWeeklySummary } from '../../../utils/time';
import {
  FileText,
  Download,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  DollarSign,
  Printer,
  X
} from 'lucide-react';
import { Trabajador } from '../../../types';

export const NominaTab: React.FC = () => {
  const { trabajadores, registros, horarios } = useApp();
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<Trabajador | null>(null);

  const summaries = useMemo(() => {
    return trabajadores.map(t => calculateWorkerWeeklySummary(t, registros, horarios));
  }, [trabajadores, registros, horarios]);

  const exportCsv = () => {
    const headers = [
      'Documento',
      'Credencial',
      'Nombre',
      'Cargo',
      'Departamento',
      'Tipo Personal',
      'Dias Laborados',
      'Horas Ordinarias (max 42h)',
      'Horas Extras Diurnas (+25%)',
      'Horas Extras Nocturnas (+75%)',
      'Horas Festivas/Dominicales (+75%)',
      'Total Horas Formateadas',
      'Salario Base Hora (COP)',
      'Total Liquidado Estimado (COP)',
      'Cumplimiento 42h'
    ];

    const rows = summaries.map(s => {
      const baseHour = s.trabajador.salario_base_hora || 14000;
      const totalEstimado =
        (s.horasOrdinarias * baseHour) +
        (s.horasExtrasDiurnas * baseHour * 1.25) +
        (s.horasExtrasNocturnas * baseHour * 1.75) +
        (s.horasDominicalesFestivas * baseHour * 1.75);

      return [
        `"${s.trabajador.documento}"`,
        `"${s.trabajador.codigo_credencial}"`,
        `"${s.trabajador.nombre_completo}"`,
        `"${s.trabajador.cargo}"`,
        `"${s.trabajador.departamento}"`,
        `"${s.trabajador.tipo_personal}"`,
        s.diasLaborados,
        s.horasOrdinarias,
        s.horasExtrasDiurnas,
        s.horasExtrasNocturnas,
        s.horasDominicalesFestivas,
        `"${s.horasTotalesStr}"`,
        baseHour,
        Math.round(totalEstimado),
        s.estadoCumplimiento
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_nomina_42h_recuperaciones_naranjo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedSummary = useMemo(() => {
    if (!selectedWorkerDetail) return null;
    return summaries.find(s => s.trabajador.id === selectedWorkerDetail.id) || null;
  }, [selectedWorkerDetail, summaries]);

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">📑 Liquidación de Nómina y Jornada 42h (Ley 2101 / CST)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo de jornadas ordinarias (42 horas semanales) y consolidación de horas extras según la normativa laboral colombiana.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-orange-400" />
          <span>Exportar Liquidación CSV</span>
        </button>
      </div>

      {/* Info Banner about Ley 2101 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 text-xs text-orange-950">
        <Scale className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Aplicación de la Ley 2101 de 2021 (Jornada Máxima Legal de 42 Horas en Colombia):</strong>
          <span className="text-orange-900/90 leading-relaxed block mt-0.5">
            En Recuperaciones Naranjo Cartagena, la jornada ordinaria se distribuye de lunes a viernes: Lunes 7.0 horas (08:00–16:30 con 1.5h de almuerzo); Martes a Jueves 8.5–9.0 horas (07:30–17:30); Viernes 8.5 horas (07:30–17:00), totalizando exactamente 42 horas semanales. Las labores en fines de semana o fuera de estos horarios generan Horas Extras Diurnas (+25%), Horas Extras Nocturnas (+75%) o Recargo Dominical/Festivo (+75%) según el CST.
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Cargo / Área</th>
                <th className="px-4 py-3 text-center">Días</th>
                <th className="px-4 py-3 text-right">Ord. (42h)</th>
                <th className="px-4 py-3 text-right">HED (+25%)</th>
                <th className="px-4 py-3 text-right">HEN (+75%)</th>
                <th className="px-4 py-3 text-right">HDF (+75%)</th>
                <th className="px-4 py-3 text-right">Total Horas</th>
                <th className="px-4 py-3 text-center">Cumplimiento</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map(s => (
                <tr key={s.trabajador.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{s.trabajador.nombre_completo}</span>
                    <span className="text-[11px] font-mono text-slate-500">CC {s.trabajador.documento}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-medium text-slate-800 block">{s.trabajador.cargo}</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                      {s.trabajador.tipo_personal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{s.diasLaborados}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                    {s.horasOrdinarias} h
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-orange-600 font-medium">
                    {s.horasExtrasDiurnas > 0 ? `${s.horasExtrasDiurnas} h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-600 font-medium">
                    {s.horasExtrasNocturnas > 0 ? `${s.horasExtrasNocturnas} h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600 font-medium">
                    {s.horasDominicalesFestivas > 0 ? `${s.horasDominicalesFestivas} h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {s.horasTotalesStr}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.estadoCumplimiento === 'CUMPLE_42H'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.estadoCumplimiento === 'EN_CURSO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.estadoCumplimiento === 'CUMPLE_42H' && <CheckCircle2 className="w-3 h-3" />}
                      {s.estadoCumplimiento === 'EN_CURSO' && <Clock className="w-3 h-3" />}
                      {s.estadoCumplimiento === 'INCOMPLETO' && <AlertCircle className="w-3 h-3" />}
                      {s.estadoCumplimiento.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedWorkerDetail(s.trabajador)}
                      className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Ver desglose individual"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Worker Timesheet Modal */}
      {selectedWorkerDetail && selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm">Ficha de Asistencia y Liquidación 42h</h3>
              </div>
              <button onClick={() => setSelectedWorkerDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedWorkerDetail.nombre_completo}</h4>
                  <span className="text-slate-500 font-medium">{selectedWorkerDetail.cargo} · {selectedWorkerDetail.departamento}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    CC {selectedWorkerDetail.documento} · Credencial: {selectedWorkerDetail.codigo_credencial}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Salario Base Hora:</span>
                  <strong className="text-sm font-mono text-slate-900">
                    ${(selectedWorkerDetail.salario_base_hora || 14000).toLocaleString('es-CO')}
                  </strong>
                </div>
              </div>

              {/* Hours Breakdown Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 block">Horas Ordinarias (42h):</span>
                  <strong className="text-lg font-mono text-emerald-950 font-bold">{selectedSummary.horasOrdinarias} h</strong>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    ${Math.round(selectedSummary.horasOrdinarias * (selectedWorkerDetail.salario_base_hora || 14000)).toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <span className="text-[11px] text-orange-800 block">Horas Extras Diurnas (+25%):</span>
                  <strong className="text-lg font-mono text-orange-950 font-bold">{selectedSummary.horasExtrasDiurnas} h</strong>
                  <span className="text-[10px] text-orange-700 block mt-0.5">
                    ${Math.round(selectedSummary.horasExtrasDiurnas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.25).toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-[11px] text-indigo-800 block">Horas Extras Nocturnas (+75%):</span>
                  <strong className="text-lg font-mono text-indigo-950 font-bold">{selectedSummary.horasExtrasNocturnas} h</strong>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">
                    ${Math.round(selectedSummary.horasExtrasNocturnas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.75).toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 block">Dominicales / Festivas (+75%):</span>
                  <strong className="text-lg font-mono text-rose-950 font-bold">{selectedSummary.horasDominicalesFestivas} h</strong>
                  <span className="text-[10px] text-rose-700 block mt-0.5">
                    ${Math.round(selectedSummary.horasDominicalesFestivas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.75).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">Total Devengado Estimado de la Semana:</span>
                  <span className="text-[10px] text-slate-400 font-mono">Total horas: {selectedSummary.horasTotalesStr}</span>
                </div>
                <div className="text-xl font-bold font-mono text-orange-400">
                  ${Math.round(
                    (selectedSummary.horasOrdinarias * (selectedWorkerDetail.salario_base_hora || 14000)) +
                    (selectedSummary.horasExtrasDiurnas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.25) +
                    (selectedSummary.horasExtrasNocturnas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.75) +
                    (selectedSummary.horasDominicalesFestivas * (selectedWorkerDetail.salario_base_hora || 14000) * 1.75)
                  ).toLocaleString('es-CO')} COP
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedWorkerDetail(null)}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors"
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
