import React from 'react';
import { User, Role, AppNotification } from '../types';
import { View, APP_VERSION } from '../App';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth'; // <-- Corrigido aqui
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUser: User;
  realRole?: Role; // The actual role of the user (to check if they are really Admin)
  onSimulateRole?: (role: Role | null) => void;
  isSimulating?: boolean;
  onOpenFeedback: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onChangePassword: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  setActiveView, 
  currentUser, 
  realRole, 
  onSimulateRole, 
  isSimulating,
  onOpenFeedback,
  notifications,
  onMarkNotificationsRead,
  onChangePassword
}) => {
  const navItemClasses = "cursor-pointer py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2";
  const activeNavItemClasses = "bg-trimais-gold text-trimais-blue shadow-sm";
  const inactiveNavItemClasses = "text-white hover:bg-white/10";

  const handleLogout = () => {
    signOut(auth).catch(error => console.error("Logout error", error));
  };

  const getAreaDisplay = () => {
      if (currentUser.role !== Role.Gestor) return '';
      
      if (currentUser.allowedAreas && currentUser.allowedAreas.length > 1) {
          return '- Múltiplas Áreas';
      }
      if (currentUser.allowedAreas && currentUser.allowedAreas.length === 1) {
          return `- ${currentUser.allowedAreas[0]}`;
      }
      // Fallback for legacy data not yet normalized in view
      return currentUser.area ? `- ${currentUser.area}` : '';
  };
  
  return (
    <header className={`bg-trimais-blue shadow-md ${isSimulating ? 'border-t-4 border-amber-400' : ''}`}>
      <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          {/* Logo removed as requested */}
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
            Gestão de Tarefas <span className="text-trimais-gold hidden sm:inline">Trimais Places</span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-black/20 p-1 rounded-lg overflow-x-auto max-w-full scrollbar-hide">
            
            {/* 1. PAINEL (Dashboard) */}
            {currentUser.role !== Role.Monitor && (
                <button 
                onClick={() => setActiveView('dashboard')} 
                className={`${navItemClasses} ${activeView === 'dashboard' ? activeNavItemClasses : inactiveNavItemClasses}`}
                title="Painel Geral"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 14a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6zM4 12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0h6v1h-6v-1z" />
                </svg>
                Painel
                </button>
            )}

            {/* 2. MINHAS TAREFAS */}
            <button 
              onClick={() => setActiveView('myTasks')} 
              className={`${navItemClasses} ${activeView === 'myTasks' ? activeNavItemClasses : inactiveNavItemClasses}`}
              title="Lista de Tarefas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Minhas Tarefas
            </button>

            {/* 3. NOVA TAREFA */}
            <button 
              onClick={() => setActiveView('form')} 
              className={`${navItemClasses} ${activeView === 'form' ? activeNavItemClasses : inactiveNavItemClasses}`}
              title="Criar Nova Tarefa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Nova Tarefa
            </button>
            
            {/* 4. ADMIN */}
            {currentUser.role === Role.Admin && (
              <button 
                onClick={() => setActiveView('admin')} 
                className={`${navItemClasses} ${activeView === 'admin' ? activeNavItemClasses : inactiveNavItemClasses}`}
                title="Administração"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin
              </button>
            )}

            {/* 5. LIXEIRA */}
            <button 
              onClick={() => setActiveView('trash')} 
              className={`${navItemClasses} ${activeView === 'trash' ? activeNavItemClasses : inactiveNavItemClasses}`}
              title="Lixeira"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Lixeira</span>
            </button>
          </nav>
          <div className="flex items-center gap-3 pl-2 border-l border-white/20">
            
            <NotificationCenter 
              notifications={notifications} 
              onMarkAsRead={onMarkNotificationsRead} 
            />

            <button 
                onClick={onOpenFeedback}
                className="text-white hover:text-trimais-gold transition-colors p-1 relative group"
                title="Enviar Feedback"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                 <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Feedback</span>
            </button>

            <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2 justify-end">
                    <p className="text-white text-sm font-medium">{currentUser.name}</p>
                    <button 
                        onClick={onChangePassword}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-1.5 py-0.5 rounded transition-colors" 
                        title="Alterar Senha"
                    >
                        🔑
                    </button>
                </div>
                
                {/* ROLE SIMULATOR (Only for Real Admins) */}
                {realRole === Role.Admin && onSimulateRole ? (
                    <select 
                        value={currentUser.role} 
                        onChange={(e) => onSimulateRole(e.target.value === 'REAL' ? null : e.target.value as Role)}
                        className={`text-xs mt-0.5 p-0.5 rounded border-none focus:ring-0 cursor-pointer ${isSimulating ? 'bg-amber-400 text-black font-bold' : 'bg-transparent text-trimais-gold'}`}
                        title="Modo de Simulação: Visualize o app como outro perfil"
                    >
                        <option value="REAL">Ver como Admin (Real)</option>
                        <option value={Role.Diretor}>Ver como Diretor</option>
                        <option value={Role.Gestor}>Ver como Gestor</option>
                        <option value={Role.Monitor}>Ver como Monitor</option>
                    </select>
                ) : (
                    <p className="text-xs text-trimais-gold text-right">
                        {currentUser.role} {getAreaDisplay()}
                    </p>
                )}
                <p className="text-[10px] text-white/40 text-right mt-1">v{APP_VERSION}</p>
            </div>
            <button onClick={handleLogout} className="text-white hover:text-trimais-gold transition-colors p-1" title="Sair">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
