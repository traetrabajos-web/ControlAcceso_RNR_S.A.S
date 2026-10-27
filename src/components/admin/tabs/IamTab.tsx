import React from 'react';
import { useApp } from '../../../context/AppContext';
import { ShieldCheck, UserCheck, Key, Laptop, Trash2, List } from 'lucide-react';

export const IamTab: React.FC = () => {
  const { usuarios, activeSessions, revokeSession, auditLogs } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">🛡️ Control de Acceso y Gestión de Identidades (IAM)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Administración de cuentas con privilegios, sesiones concurrentes activas y pista de auditoría forense.
        </p>
      </div>

      {/* Users Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-orange-600" />
          <span>Usuarios del Sistema y Perfiles de Autorización</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usuarios.map(u => (
            <div key={u.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{u.nombre_completo}</h4>
                  <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {u.rol}
                </span>
              </div>
              <p className="text-xs text-slate-600">{u.cargo}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Máx. Sesiones: <strong className="text-slate-800">{u.max_sesiones_simultaneas}</strong></span>
                <span>Política: <strong className="text-slate-800">{u.politica_concurrencia}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Sesiones Concurrente Activas ({activeSessions.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">ID Sesión</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">IP Origen</th>
                <th className="px-4 py-3">Iniciado En</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No hay sesiones activas registradas en memoria.
                  </td>
                </tr>
              ) : (
                activeSessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{s.id.slice(0, 16)}...</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{s.nombre}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{s.email}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-700">{s.rol}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{s.ip}</td>
                    <td className="px-4 py-3 text-slate-600">{s.iniciado_en}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => revokeSession(s.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Registro de Auditoría de Seguridad (Audit Trail)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                      {log.evento}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 uppercase font-semibold text-[10px]">{log.modulo}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">{log.usuario_email}</td>
                  <td className="px-4 py-2.5 text-slate-700 max-w-sm">{log.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
