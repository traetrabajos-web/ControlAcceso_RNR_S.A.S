import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DashboardTab } from './tabs/DashboardTab';
import { PatioTab } from './tabs/PatioTab';
import { NominaTab } from './tabs/NominaTab';
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
  Tractor,
  FileSpreadsheet,
  ShieldAlert,
  ClipboardList,
  Users,
  Truck,
  DoorOpen,
  BellRing,
  Lock,
  Settings,
  LogOut,
  Key,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { currentUser, logout, adminTab, setAdminTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [test403Alert, setTest403Alert] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Aforo', icon: LayoutDashboard },
    { id: 'patio', label: 'Mi Cuadrilla en Vivo (Patio)', icon: Tractor },
    { id: 'nomina', label: 'Nómina y Horas 42h (CST)', icon: FileSpreadsheet },
    { id: 'porteria', label: 'Consola de Portería', icon: DoorOpen },
    { id: 'asistencia', label: 'Historial de Asistencia', icon: ClipboardList },
    { id: 'trabajadores', label: 'Padrón de Trabajadores', icon: Users },
    { id: 'visitantes', label: 'Control de Visitantes', icon: Truck },
    { id: 'zonas', label: 'Puertas y Turnos 42h', icon: ShieldAlert },
    { id: 'alertas', label: 'Alertas de Acceso', icon: BellRing },
    { id: 'iam', label: 'Control de Acceso (IAM)', icon: Lock },
    { id: 'config', label: 'Configuración Empresa', icon: Settings }
  ];

  const handleSelectTab = (id: string) => {
    setAdminTab(id);
    setMobileMenuOpen(false);
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
          <span className="text-xs font-semibold">Menú Consola</span>
        </button>

        <span className="text-xs font-mono font-bold bg-orange-600 px-2 py-0.5 rounded text-white">
          {currentUser?.rol.replace('_', ' ')}
        </span>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col z-30`}
      >
        {/* User Badge */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {currentUser?.nombre_completo.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs text-white truncate">{currentUser?.nombre_completo}</h4>
            <span className="inline-block text-[10px] bg-slate-800 text-orange-400 font-bold px-1.5 py-0.2 rounded mt-0.5">
              {currentUser?.rol}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-xs">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setIsPermsModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-orange-400" />
            <span>Ver Mis Permisos</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold transition-colors border border-rose-900/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Status bar */}
        <div className="bg-white rounded-xl p-3 mb-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span><strong>Sesión Activa:</strong> {currentUser?.email}</span>
            <span className="text-slate-300">|</span>
            <span><strong>Rol:</strong> {currentUser?.rol}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setTest403Alert(true);
              setTimeout(() => setTest403Alert(false), 4000);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold text-[11px] transition-colors"
          >
            🧪 Probar Simulación 403 Forbidden
          </button>
        </div>

        {/* 403 Test Toast */}
        {test403Alert && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>🛡️ Simulación RBAC 403: El módulo solicitado requiere privilegios SUPER_ADMIN o autorización explícita.</span>
            <button onClick={() => setTest403Alert(false)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Content */}
        {adminTab === 'dashboard' && <DashboardTab />}
        {adminTab === 'patio' && <PatioTab />}
        {adminTab === 'nomina' && <NominaTab />}
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
