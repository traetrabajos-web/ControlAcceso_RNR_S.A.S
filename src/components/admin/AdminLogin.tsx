import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login, quickLoginAs } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const handleSubmit = (force = false) => {
    setErrorMessage(null);
    const res = login(email, password, force);
    if (!res.ok) {
      if (res.conflict) {
        setHasConflict(true);
      }
      setErrorMessage(res.error || 'Error al iniciar sesión');
    } else {
      setHasConflict(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-100 text-orange-600 mb-2 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ingreso al Sistema de Seguridad</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Acceso restringido para personal autorizado de Recuperaciones Naranjo Recycling S.A.S.
          </p>
        </div>

        {/* Error / Conflict Alert */}
        {errorMessage && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            hasConflict ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {hasConflict && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors shadow-xs"
              >
                🔄 Cerrar sesión anterior e ingresar aquí
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="usuario@recuperacionesnaranjo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
          >
            Entrar al Panel de Control
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Acceso Rápido por Perfil (Entorno de Desarrollo)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickLoginAs('admin@recuperacionesnaranjo.com')}
              className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-left transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">Super Admin</span>
                <span className="text-[10px] text-slate-500">Director General</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('vigilante@recuperacionesnaranjo.com')}
              className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">Vigilante</span>
                <span className="text-[10px] text-slate-500">Garita / Portería</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('jefepatio@recuperacionesnaranjo.com')}
              className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">Jefe de Patio</span>
                <span className="text-[10px] text-slate-500">Cuadrilla & Grúas</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('contabilidad@recuperacionesnaranjo.com')}
              className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">Contabilidad</span>
                <span className="text-[10px] text-slate-500">Nómina & 42h</span>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          🛡️ Autenticación con derivación <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">scrypt</code> y tokens firmados <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">HMAC-SHA256</code>
        </div>
      </div>
    </div>
  );
};
