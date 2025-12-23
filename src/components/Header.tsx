
import React from 'react';
import { User, Role, AppNotification, APP_VERSION } from '../types';
import { auth } from '../firebase/config';
import * as FirebaseAuth from 'firebase/auth';
const { signOut } = FirebaseAuth as any;

interface HeaderProps {
  activeView: string;
  setActiveView: (view: any) => void;
  currentUser: User;
  realRole?: Role; 
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
  const handleLogout = () => signOut(auth);

  return (
    <header className="bg-trimais-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Trimais Places</h1>
          <nav className="hidden md:flex gap-2">
            <button onClick={() => setActiveView('dashboard')} className={`px-3 py-1 rounded ${activeView === 'dashboard' ? 'bg-trimais-gold text-trimais-blue font-bold' : 'hover:bg-white/10'}`}>Painel</button>
            <button onClick={() => setActiveView('myTasks')} className={`px-3 py-1 rounded ${activeView === 'myTasks' ? 'bg-trimais-gold text-trimais-blue font-bold' : 'hover:bg-white/10'}`}>Minhas Tarefas</button>
            <button onClick={() => setActiveView('form')} className={`px-3 py-1 rounded ${activeView === 'form' ? 'bg-trimais-gold text-trimais-blue font-bold' : 'hover:bg-white/10'}`}>Nova Tarefa</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{currentUser.name}</p>
            <p className="text-[10px] text-trimais-gold">{currentUser.role} - v{APP_VERSION}</p>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full">Sair</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
