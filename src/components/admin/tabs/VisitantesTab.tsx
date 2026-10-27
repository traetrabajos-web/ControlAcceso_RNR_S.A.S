import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Truck,
  Plus,
  LogOut,
  CheckCircle2,
  Scale,
  Printer,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Visitante } from '../../../types';

export const VisitantesTab: React.FC = () => {
  const { visitantes, addVisitante, salidaVisitante } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Visitante | null>(null);
  const [exitWeighModal, setExitWeighModal] = useState<Visitante | null>(null);
  const [exitTaraKg, setExitTaraKg] = useState<number>(11500);

  const [form, setForm] = useState({
    nombre_completo: '',
    documento: '',
    empresa_origen: '',
    placa_vehiculo: '',
    motivo_visita: 'Descargue de chatarra ferrosa pesada en báscula',
    anfitrion_visitado: 'Jorge Eliécer Naranjo (Jefe de Patio)',
    gafete_asignado: 'VIS-03',
    zona_id: 2,
    zona_nombre: 'Báscula Camionera y Muelle de Pesaje',
    tipo_material: 'Chatarra Ferrosa Pesada (HMS 1/2)',
    peso_bruto_kg: 27500,
    peso_tara_kg: 0,
    induccion_sst: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisitante(form);
    setIsModalOpen(false);
    setForm({
      nombre_completo: '',
      documento: '',
      empresa_origen: '',
      placa_vehiculo: '',
      motivo_visita: 'Descargue de chatarra ferrosa pesada en báscula',
      anfitrion_visitado: 'Jorge Eliécer Naranjo (Jefe de Patio)',
      gafete_asignado: `VIS-${String(visitantes.length + 3).padStart(2, '0')}`,
      zona_id: 2,
      zona_nombre: 'Báscula Camionera y Muelle de Pesaje',
      tipo_material: 'Chatarra Ferrosa Pesada (HMS 1/2)',
      peso_bruto_kg: 28000,
      peso_tara_kg: 0,
      induccion_sst: true
    });
  };

  const handleConfirmExitWeight = () => {
    if (!exitWeighModal) return;
    salidaVisitante(exitWeighModal.id, exitTaraKg);
    setExitWeighModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🪪 Control de Visitantes, Contratistas y Báscula Camionera</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro metrológico de pesaje de chatarra industrial (Tara/Bruto/Neto), inducción SST y control vehicular.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Camión / Visitante</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Gafete / Visita</th>
                <th className="px-4 py-3">Conductor / Empresa</th>
                <th className="px-4 py-3">Placa Camión</th>
                <th className="px-4 py-3">Material Reciclable</th>
                <th className="px-4 py-3 text-right">Bruto (Kg)</th>
                <th className="px-4 py-3 text-right">Tara (Kg)</th>
                <th className="px-4 py-3 text-right">Neto Chatarra</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitantes.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-900 block">{v.codigo_visita}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Gafete: {v.gafete_asignado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{v.nombre_completo}</span>
                    <span className="text-[11px] text-slate-400">{v.empresa_origen}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {v.placa_vehiculo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {v.tipo_material || v.motivo_visita}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {v.peso_bruto_kg ? `${v.peso_bruto_kg.toLocaleString('es-CO')} kg` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {v.peso_tara_kg ? `${v.peso_tara_kg.toLocaleString('es-CO')} kg` : 'Pendiente'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {v.peso_neto_kg ? `${v.peso_neto_kg.toLocaleString('es-CO')} kg` : 'En patio'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.estado === 'DENTRO'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {v.estado === 'DENTRO' ? 'EN PLANTA' : 'CULMINADO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(v)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Ver Tiquete de Báscula"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {v.estado === 'DENTRO' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setExitWeighModal(v);
                            setExitTaraKg(11200);
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3" />
                          <span>Pesar Tara & Salida</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Despachado</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tiquete de Báscula Oficial */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Tiquete Oficial de Báscula Mamonal</span>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-sans font-bold text-slate-900 text-sm">RECUPERACIONES NARANJO RECYCLING</h4>
                <span className="text-slate-500 block text-[11px]">Báscula Electrónica 80 Toneladas</span>
                <span className="text-slate-400 block text-[10px]">Tiquete #{selectedTicket.codigo_visita}</span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Conductor:</span>
                  <strong>{selectedTicket.nombre_completo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cédula:</span>
                  <span>{selectedTicket.documento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transportadora:</span>
                  <span>{selectedTicket.empresa_origen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Placa Camión:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.placa_vehiculo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Material:</span>
                  <span>{selectedTicket.tipo_material || 'Chatarra Ferrosa'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ingreso:</span>
                  <span>{selectedTicket.fecha} {selectedTicket.hora_ingreso}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Salida:</span>
                  <span>{selectedTicket.hora_salida || 'En Patio'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>PESO BRUTO ENTRADA:</span>
                  <span>{(selectedTicket.peso_bruto_kg || 0).toLocaleString('es-CO')} KG</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PESO TARA SALIDA:</span>
                  <span>{(selectedTicket.peso_tara_kg || 0).toLocaleString('es-CO')} KG</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 text-sm pt-1 border-t border-slate-200">
                  <span>PESO NETO DESCARGADO:</span>
                  <span>{(selectedTicket.peso_neto_kg || 0).toLocaleString('es-CO')} KG</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400">
                Certificación metrológica SIC · Báscula Calibrada Sede Mamonal
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Tiquete</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Salida y Pesaje de Tara */}
      {exitWeighModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Pesaje de Tara y Salida de Vehículo</h3>
            <p className="text-slate-500">
              Registra el pesaje del camión vacío en la plataforma de báscula de salida.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Placa:</span>
                <strong>{exitWeighModal.placa_vehiculo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Peso Bruto Entrada:</span>
                <strong>{(exitWeighModal.peso_bruto_kg || 0).toLocaleString('es-CO')} kg</strong>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lectura de Tara en Báscula (Kg):
              </label>
              <input
                type="number"
                min="1000"
                max={exitWeighModal.peso_bruto_kg || 30000}
                value={exitTaraKg}
                onChange={e => setExitTaraKg(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-base font-bold"
              />
              <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                Neto Calculado: {Math.max(0, (exitWeighModal.peso_bruto_kg || 0) - exitTaraKg).toLocaleString('es-CO')} Kg de Chatarra
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExitWeighModal(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExitWeight}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs"
              >
                Confirmar Salida y Pesar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Visitor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Registrar Ingreso de Camión a Báscula</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Conductor / Transportador:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro Morales"
                  value={form.nombre_completo}
                  onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cédula Conductor:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 73981023"
                    value={form.documento}
                    onChange={e => setForm({ ...form, documento: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Placa Camión:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TKL-459"
                    value={form.placa_vehiculo}
                    onChange={e => setForm({ ...form, placa_vehiculo: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa Transportadora:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Transportes del Caribe"
                    value={form.empresa_origen}
                    onChange={e => setForm({ ...form, empresa_origen: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Material:</label>
                  <select
                    value={form.tipo_material}
                    onChange={e => setForm({ ...form, tipo_material: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Chatarra Ferrosa Pesada (HMS 1/2)">Chatarra Ferrosa Pesada (HMS 1/2)</option>
                    <option value="Acero Inoxidable 304/316">Acero Inoxidable 304/316</option>
                    <option value="Cobre de Primera (Milberry)">Cobre de Primera (Milberry)</option>
                    <option value="Aluminio Perfil / Carter">Aluminio Perfil / Carter</option>
                    <option value="Baterías Ácido-Plomo Industriales">Baterías Ácido-Plomo Industriales</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peso Bruto Entrada en Báscula (Kg):</label>
                <input
                  type="number"
                  required
                  min="2000"
                  max="60000"
                  value={form.peso_bruto_kg}
                  onChange={e => setForm({ ...form, peso_bruto_kg: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ind-sst"
                  checked={form.induccion_sst}
                  onChange={e => setForm({ ...form, induccion_sst: e.target.checked })}
                  className="rounded text-orange-600"
                />
                <label htmlFor="ind-sst" className="font-semibold text-slate-700 cursor-pointer">
                  Inducción de Seguridad Industrial SST en Portería Aprobada
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Registrar Pesaje & Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
