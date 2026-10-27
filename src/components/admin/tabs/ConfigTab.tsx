import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Settings, Save, RotateCcw, CheckCircle2 } from 'lucide-react';

export const ConfigTab: React.FC = () => {
  const { empresaConfig, updateEmpresaConfig, resetAllToPresets } = useApp();
  const [form, setForm] = useState(empresaConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmpresaConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">⚙️ Configuración Empresarial y Parámetros del Sistema</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Datos institucionales de la sede industrial Cartagena, márgenes de tolerancia de asistencia y aforo de planta.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuración actualizada y guardada correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Razón Social Oficial:</label>
            <input
              type="text"
              required
              value={form.nombre_empresa}
              onChange={e => setForm({ ...form, nombre_empresa: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">NIT / Identificación Tributaria:</label>
            <input
              type="text"
              required
              value={form.nit_ruc}
              onChange={e => setForm({ ...form, nit_ruc: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Slogan Corporativo / Descripción:</label>
          <input
            type="text"
            required
            value={form.slogan_corporativo}
            onChange={e => setForm({ ...form, slogan_corporativo: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dirección de Planta:</label>
            <input
              type="text"
              required
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Correo de Seguridad de Planta:</label>
            <input
              type="email"
              required
              value={form.email_seguridad}
              onChange={e => setForm({ ...form, email_seguridad: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tolerancia Tardanza (minutos):</label>
            <input
              type="number"
              min="0"
              max="60"
              required
              value={form.tolerancia_tardanza_min}
              onChange={e => setForm({ ...form, tolerancia_tardanza_min: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Aforo Máximo de Planta:</label>
            <input
              type="number"
              min="10"
              max="1000"
              required
              value={form.aforo_maximo_planta}
              onChange={e => setForm({ ...form, aforo_maximo_planta: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jornada Semanal Legal (horas):</label>
            <input
              type="number"
              readOnly
              value={form.jornada_semanal_horas}
              className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Fijado por Ley 2101 / CST</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restablecer toda la base de datos a los valores iniciales oficiales?')) {
                resetAllToPresets();
                setForm(empresaConfig);
              }
            }}
            className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Demostración</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </form>
    </div>
  );
};
