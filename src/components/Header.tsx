import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, CheckCircle, LayoutDashboard, ClipboardList, Shield, Trash2, Bell, UserCircle, MessageSquare } from 'lucide-react';
import { User, Role, AppNotification } from '../types';
import { View } from '../App';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUser: User;
  notifications: AppNotification[];
  realRole: Role;
  onSimulateRole: (role: Role | null) => void;
  isSimulating: boolean;
  onOpenFeedback: () => void;
  onChangePassword: () => void;
  onMarkNotificationsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  setActiveView, 
  currentUser, 
  realRole,
  onSimulateRole,
  isSimulating,
  onOpenFeedback,
  onChangePassword
}) => {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'form', label: 'Nova Ocorrência', icon: CheckCircle },
    { id: 'myTasks', label: 'Minhas Tarefas', icon: ClipboardList },
  ];

  // Adiciona itens de Admin se o usuário tiver permissão
  if (currentUser.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Painel Admin', icon: Shield });
    navItems.push({ id: 'trash', label: 'Lixeira', icon: Trash2 });
  }

  return (
    <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
              <CheckCircle className="text-[#003366] w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden md:block">
              TrIA <span className="text-[#d4af37] font-light">Places</span>
            </span>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === item.id 
                    ? 'bg-[#d4af37] text-[#003366] shadow-inner' 
                    : 'hover:bg-[#002244] text-blue-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Ações do Usuário */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-[#d4af37] uppercase">{currentUser.role}</span>
              <span className="text-[10px] text-blue-200">{currentUser.email}</span>
            </div>

            <div className="flex items-center gap-2 border-l border-blue-800 pl-4">
              <button
