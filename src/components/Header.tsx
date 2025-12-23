import React from 'react';
import { auth } from '../firebase/config';
import { LogOut, CheckCircle } from 'lucide-react';

const Header: React.FC = () => {
  const handleLogout = () => auth.signOut();

  return (
    <header className="bg-[#003366] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-[#d4af37] w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">TrIA - Gestão de Operações</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-blue-100">
              {auth.currentUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
