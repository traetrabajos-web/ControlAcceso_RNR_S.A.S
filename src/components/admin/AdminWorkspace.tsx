import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DashboardTab } from './tabs/DashboardTab';
import { PorteriaTab } from './tabs/PorteriaTab';
import { AsistenciaTab } from './tabs/AsistenciaTab';
import { TrabajadoresTab } from './tabs/TrabajadoresTab';
import { VisitantesTab } from './tabs/VisitantesTab';
import { ZonasTab } from './tabs/ZonasTab';
import { AlertasTab } from './tabs/AlertasTab';
import { IamTab } from './tabs/IamTab';
import { ConfigTab } from './tabs/ConfigTab';
import { MyPermsModal } from './MyPermsModal';
import {
  LayoutDashboard,
  DoorOpen,
  ClipboardList,
  Users,
  UserCheck,
  ShieldAlert,
  BellRing,
  Lock,
  Settings,
  LogOut,
  Key,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[];
}

export const AdminWorkspace: React.FC = () => {
  const { currentUser, logout, adminTab, setAdminTab, incidencias, visitantes, trabajadores, login } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [test403Alert, setTest403Alert] = useState(false);

  const pendingAlerts = useMemo(() => incidencias.filter(a => a.estado_resolucion === 'PENDIENTE').length, [incidencias]);
  const visitorsInside = useMemo(() => visitantes.filter(v => v.estado === 'DENTRO').length, [visitantes]);
  const workersInside = useMemo(() => trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA').length, [trabajadores]);

  const navGroups: NavGroup[] = [
    {
      title: 'Monitoreo en Tiempo Real',
      items: [
        { id: 'dashboard', label: 'Tablero de Control', icon: LayoutDashboard, badge: `${workersInside} dentro` },
        { id: 'porteria', label: 'Portería & Garita', icon: DoorOpen }
      ]
    },
    {
      title: 'Personal de la Empresa',
      items: [
        { id: 'trabajadores', label: 'Directorio de Personal', icon: Users, badge: trabajadores.length },
        { id: 'asistencia', label: 'Historial de Marcaciones', icon: ClipboardList }
      ]
    },
    {
      title: 'Control de Visitantes',
      items: [
        { id: 'visitantes', label: 'Registro de Visitantes', icon: UserCheck, badge: visitorsInside > 0 ? `${visitorsInside} en sede` : undefined }
      ]
    },
    {
      title: 'Seguridad & Configuración',
      items: [
        { id: 'zonas', label: 'Puntos de Acceso & Zonas', icon: ShieldAlert },
        { id: 'alertas', label: 'Incidencias de Acceso', icon: BellRing, badge: pendingAlerts > 0 ? pendingAlerts : undefined },
        { id: 'iam', label: 'Usuarios & Supervisores', icon: Lock },
        { id: 'config', label: 'Configuración de Acceso', icon: Settings }
      ]
    }
  ];

  const currentTabMeta = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find(i => i.id === adminTab);
      if (match) {
        return { category: group.title, label: match.label };
      }
    }
    return { category: 'Consola', label: 'Módulo' };
  }, [adminTab, navGroups]);

  const handleSelectTab = (id: string) => {
    setAdminTab(id);
    setMobileMenuOpen(false);
  };

  const quickSwitchRole = (email: string, pass: string) => {
    login(email, pass);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col md:flex-row bg-slate-100">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-3 flex items-center justify-between border-b border-slate-800">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800 text-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs font-semibold">Menú de Control</span>
        </button>
        <span className="text-xs font-bold text-orange-400">
          {currentTabMeta.label}
        </span>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 flex flex-col transition-all duration-200 ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        {/* User Identity Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm">
              {currentUser?.nombre_completo.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-xs text-white truncate">
                {currentUser?.nombre_completo || 'Usuario del Sistema'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {currentUser?.cargo || 'Control de Acceso'}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-orange-400 font-semibold font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>{currentUser?.rol}</span>
            </span>
            <button
              onClick={() => setIsPermsModalOpen(true)}
              className="text-slate-400 hover:text-white underline hover:no-underline text-[10px]"
            >
              Mis Permisos
            </button>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {group.title}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all ${
                      active
                        ? 'bg-orange-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                          active
                            ? 'bg-orange-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sesión Activa</span>
          </div>
          <button
            onClick={logout}
            className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 font-medium"
            title="Cerrar sesión segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Workspace Breadcrumbs & Role Switcher */}
        <div className="mb-4 pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>{currentTabMeta.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{currentTabMeta.label}</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-slate-500 font-semibold hidden lg:inline">
              Cambio Rápido de Rol:
            </span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-200/60 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => quickSwitchRole('admin@recuperacionesnaranjo.com', 'admin123')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  currentUser?.rol === 'SUPER_ADMIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Super Administrador de Acceso"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => quickSwitchRole('vigilante@recuperacionesnaranjo.com', 'vigi123')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  currentUser?.rol === 'VIGILANTE_PORTERIA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Vigilante de Garita y Control"
              >
                Vigilante
              </button>
              <button
                type="button"
                onClick={() => quickSwitchRole('contabilidad@recuperacionesnaranjo.com', 'conta123')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  currentUser?.rol === 'SUPERVISOR_RRHH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Talento Humano y Supervisión"
              >
                Talento Humano
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setTest403Alert(true);
                setTimeout(() => setTest403Alert(false), 4000);
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold transition-colors"
            >
              Test 403
            </button>
          </div>
        </div>

        {/* 403 Test Toast */}
        {test403Alert && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>🛡️ Simulación RBAC 403: El módulo solicitado requiere privilegios de SUPER_ADMIN o autorización explícita.</span>
            <button onClick={() => setTest403Alert(false)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Content */}
        {adminTab === 'dashboard' && <DashboardTab />}
        {adminTab === 'porteria' && <PorteriaTab />}
        {adminTab === 'asistencia' && <AsistenciaTab />}
        {adminTab === 'trabajadores' && <TrabajadoresTab />}
        {adminTab === 'visitantes' && <VisitantesTab />}
        {adminTab === 'zonas' && <ZonasTab />}
        {adminTab === 'alertas' && <AlertasTab />}
        {adminTab === 'iam' && <IamTab />}
        {adminTab === 'config' && <ConfigTab />}
      </main>

      {/* Permissions Modal */}
      <MyPermsModal isOpen={isPermsModalOpen} onClose={() => setIsPermsModalOpen(false)} />
    </div>
  );
};
