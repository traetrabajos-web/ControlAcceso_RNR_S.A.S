import React, { useState, useEffect } from 'react';
import { Radio, Mic, MicOff, PhoneOff, UserCheck, ShieldAlert, X } from 'lucide-react';

interface IntercomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntercomModal: React.FC<IntercomModalProps> = ({ isOpen, onClose }) => {
  const [seconds, setSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [guardResponse, setGuardResponse] = useState<string>('Conectando con Garita Principal...');

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      setGuardResponse('Conectando con Garita Principal...');
      return;
    }

    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    const msgTimer1 = setTimeout(() => {
      setGuardResponse('«Garita 1, Víctor Carmona en línea. Lo escucho, ¿cuál es su novedad en el molinete?»');
    }, 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(msgTimer1);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        {/* Header */}
        <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Intercomunicador de Seguridad
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Call Visualizer */}
        <div className="p-6 text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto rounded-full bg-slate-800 border-2 border-orange-500/80 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-600/20 flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-orange-400" />
            </div>
            {/* Audio transmission pulse rings */}
            <div className="absolute inset-0 rounded-full border border-orange-400/40 animate-ping"></div>
          </div>

          <div>
            <h4 className="font-bold text-base text-white">Garita Principal #1</h4>
            <span className="text-xs text-orange-400 font-medium block">
              Víctor Hugo Carmona · Vigilante de Turno
            </span>
            <span className="font-mono text-xs text-slate-400 mt-1 block tabular-nums">
              Tiempo en llamada: {formatSecs(seconds)}
            </span>
          </div>

          {/* Guard audio transcription speech bubble */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-200 italic min-h-[50px] flex items-center justify-center text-center">
            {guardResponse}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setIsMicMuted(m => !m)}
              className={`p-3 rounded-full border transition-colors ${
                isMicMuted
                  ? 'bg-rose-950 border-rose-500 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-colors"
              title="Finalizar intercomunicación"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
          Canal UHF Encriptado · Seguridad Física Recuperaciones Naranjo Mamonal
        </div>
      </div>
    </div>
  );
};
