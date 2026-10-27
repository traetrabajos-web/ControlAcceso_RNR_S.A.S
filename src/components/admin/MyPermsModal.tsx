import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MyPermsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();

  if (!isOpen || !currentUser) return null;

  const permissionsList = [
    { code: 'dashboard:ver', desc: 'Visualizar tablero general de accesos y aforo en tiempo real' },
    { code: 'asistencia:ver', desc: 'Consultar bitácora y registros de asistencia' },
    { code: 'asistencia:marcar', desc: 'Registrar entradas y salidas de trabajadores' },
    { code: 'asistencia:exportar', desc: 'Descargar reportes en formato CSV de nómina y asistencia' },
    { code: 'trabajadores:ver', desc: 'Ver padrón de trabajadores y puestos de maquinaria' },
    { code: 'trabajadores:crear', desc: 'Registrar nuevos empleados en el sistema' },
    { code: 'trabajadores:editar', desc: 'Modificar cargos, estados y coberturas ARL' },
    { code: 'trabajadores:eliminar', desc: 'Remover trabajadores del padrón' },
    { code: 'visitantes:ver', desc: 'Consultar registro de contratistas y camiones de chatarra' },
    { code: 'visitantes:crear', desc: 'Registrar ingreso y pesaje de nuevos visitantes' },
    { code: 'zonas:ver', desc: 'Consultar configuración de puertas y turnos 42h' },
    { code: 'incidencias:ver', desc: 'Monitorear alertas de seguridad y bloqueos' },
    { code: 'seguridad:ver', desc: 'Inspeccionar usuarios IAM, sesiones y auditoría' },
    { code: 'configuracion:ver', desc: 'Consultar y actualizar parámetros de empresa' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-base">Permisos Activos de la Sesión</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block text-sm">{currentUser.nombre_completo}</span>
            <span className="text-slate-500">{currentUser.email}</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded text-[10px]">
                ROL: {currentUser.rol}
              </span>
              <span className="text-slate-400">· {currentUser.cargo}</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
              Matriz de Permisos Efectivos:
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {permissionsList.map(p => {
                const isSuperAdmin = currentUser.rol === 'SUPER_ADMIN';
                const isAllowed = isSuperAdmin || currentUser.permisos_individuales[p.code] === 'ALLOW' || (
                  currentUser.rol === 'VIGILANTE_PORTERIA' && ['dashboard:ver', 'asistencia:ver', 'asistencia:marcar', 'visitantes:ver', 'visitantes:crear'].includes(p.code)
                ) || (
                  currentUser.rol === 'JEFE_PATIO' && ['dashboard:ver', 'asistencia:ver', 'trabajadores:ver', 'zonas:ver', 'incidencias:ver'].includes(p.code)
                ) || (
                  currentUser.rol === 'SUPERVISOR_RRHH' && ['dashboard:ver', 'asistencia:ver', 'asistencia:exportar', 'trabajadores:ver', 'trabajadores:crear', 'trabajadores:editar'].includes(p.code)
                );

                return (
                  <div key={p.code} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-mono font-bold text-slate-800 block text-[11px]">{p.code}</span>
                      <span className="text-slate-500 text-[11px]">{p.desc}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 ${
                      isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isAllowed ? 'PERMITIDO' : 'DENEGADO'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
