import React from 'react';
import { X, CheckCircle2, ShieldCheck, Printer, Calendar, Clock, HardHat, QrCode } from 'lucide-react';
import { Trabajador } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trabajador: Trabajador;
  tipoAccion: 'ENTRADA' | 'SALIDA';
  hora: string;
  fecha: string;
  estadoAsistencia: string;
}

export const PassReceiptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trabajador,
  tipoAccion,
  hora,
  fecha,
  estadoAsistencia
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header receipt */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <h4 className="font-bold text-sm">Comprobante Oficial de Marcación</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt body formatted like an industrial access ticket */}
        <div className="p-6 space-y-4 text-xs font-mono">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <span className="font-bold text-sm text-slate-900 block font-sans">
              RECUPERACIONES NARANJO RECYCLING S.A.S.
            </span>
            <span className="text-slate-500 text-[11px] block mt-0.5">NIT 901.884.219-5 · Mamonal Km 7</span>
            <span className="text-slate-500 text-[10px] block">Cartagena de Indias, Bolívar</span>
          </div>

          <div className="flex items-center justify-between py-1 bg-slate-100 px-3 rounded-lg text-slate-800 font-bold">
            <span>MOVIMIENTO:</span>
            <span className={tipoAccion === 'ENTRADA' ? 'text-emerald-700' : 'text-blue-700'}>
              {tipoAccion === 'ENTRADA' ? '▶ INGRESO A PLANTA' : '◀ SALIDA DE PLANTA'}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Colaborador:</span>
              <strong className="text-slate-900 text-right">{trabajador.nombre_completo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cédula:</span>
              <span>{trabajador.documento}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credencial:</span>
              <span>{trabajador.codigo_credencial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cargo:</span>
              <span className="text-right">{trabajador.cargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Área:</span>
              <span>{trabajador.departamento}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha / Hora:</span>
              <span className="font-bold text-slate-900">{fecha} {hora}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Puntualidad:</span>
              <span className="font-semibold text-emerald-700">{estadoAsistencia}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Punto de Control:</span>
              <span>Portería Principal Mamonal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jornada Legal:</span>
              <span>42h Semanales (Ley 2101)</span>
            </div>
          </div>

          {/* QR code simulation */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1">
            <div className="w-24 h-24 mx-auto bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-2">
              <QrCode className="w-16 h-16 text-slate-800" />
              <span className="text-[8px] font-mono text-slate-500 mt-0.5">{trabajador.codigo_credencial}-{hora.replace(':', '')}</span>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Código QR criptográfico de verificación garita
            </span>
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
