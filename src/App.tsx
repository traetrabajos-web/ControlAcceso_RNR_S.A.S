import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { KioskView } from './components/kiosk/KioskView';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminWorkspace } from './components/admin/AdminWorkspace';

export const App: React.FC = () => {
  const { mainView, currentUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      <div className="flex-1">
        {mainView === 'public' ? (
          <KioskView />
        ) : currentUser ? (
          <AdminWorkspace />
        ) : (
          <AdminLogin />
        )}
      </div>
    </div>
  );
};
