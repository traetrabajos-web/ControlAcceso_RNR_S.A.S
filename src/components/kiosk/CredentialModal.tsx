import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Search, ShieldCheck, AlertCircle, CheckCircle2, User, HardHat } from 'lucide-react';
import { Trabajador } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkerForKiosk?: (doc: string) => void;
}

export const CredentialModal: React.FC<Props> = ({ isOpen, onClose, onSelectWorkerForKiosk }) => {
  const { trabajadores, zonas } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Trabajador | null>(null);

  if (!isOpen) return null;

  const filtered = trabajadores.filter(t =>
    t.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.documento.includes(searchTerm) ||
    t.codigo_credencial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-lg">Consulta y Verificación de Credencial</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cédula, código credencial, nombre o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              autoFocus
            />
          </div>

          {/* List or Selected Worker Card */}
          {selectedWorker ? (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selectedWorker.foto_url ? (
                    <img
                      src={selectedWorker.foto_url}
                      alt={selectedWorker.nombre_completo}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xl">
                      {selectedWorker.nombre_completo.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{selectedWorker.nombre_completo}</h4>
                    <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <HardHat className="w-4 h-4 text-orange-600" />
                      {selectedWorker.cargo} · {selectedWorker.departamento}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                        {selectedWorker.codigo_credencial}
                      </span>
                      <span className="text-xs text-slate-500">C.C. {selectedWorker.documento}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Cambiar
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Estado Laboral</span>
                  <span className={`inline-flex items-center gap-1 font-semibold mt-0.5 ${
                    selectedWorker.estado === 'ACTIVO' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedWorker.estado === 'ACTIVO' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {selectedWorker.estado}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Cobertura ARL</span>
                  <span className={`inline-flex items-center gap-1 font-semibold mt-0.5 ${
                    selectedWorker.arl_vigente ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedWorker.arl_vigente ? 'Al día (Vigente)' : 'Vencida / Sin soporte'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Ubicación Actual</span>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded mt-0.5 ${
                    selectedWorker.ubicacion_actual === 'DENTRO_PLANTA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedWorker.ubicacion_actual === 'DENTRO_PLANTA' ? '📍 DENTRO DE PLANTA' : 'FUERA DE PLANTA'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs font-medium block mb-1.5">Puertas y Zonas Autorizadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWorker.zonas_autorizadas.map(zid => {
                    const z = zonas.find(item => item.id === zid);
                    return (
                      <span key={zid} className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                        🚪 {z ? z.nombre.split('(')[0] : `Zona ${zid}`}
                      </span>
                    );
                  })}
                </div>
              </div>

              {onSelectWorkerForKiosk && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectWorkerForKiosk(selectedWorker.documento);
                      onClose();
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
                  >
                    Usar en Kiosco de Marcación ➔
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No se encontraron trabajadores con ese criterio.
                </div>
              ) : (
                filtered.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    className="w-full text-left p-3 hover:bg-orange-50/50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {w.foto_url ? (
                          <img src={w.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{w.nombre_completo}</div>
                        <div className="text-xs text-slate-500">{w.cargo} · CC {w.documento}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-slate-600 block">{w.codigo_credencial}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        w.ubicacion_actual === 'DENTRO_PLANTA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {w.ubicacion_actual === 'DENTRO_PLANTA' ? 'EN PLANTA' : 'FUERA'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
