import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { User } from '../types'; // Importa o tipo User

interface SidebarProps {
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const { addNotification } = useContext(AuthContext); // Usando addNotification do contexto

  const handleAdminRoute = (path: string) => {
    if (currentUser?.role !== 'admin') {
      addNotification('Você não tem permissão para acessar esta área.', 'error');
      return '#'; // Retorna uma URL inválida para não navegar
    }
    return path;
  };

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-3xl font-bold text-trimais-blue">TRIMAIS</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7-7 7 7M19 10v10a1 1 0 001 1h3m-7 0a1 1 0 01-1 1H9a1 1 0 01-1-1v-4a1 1 0 011-1h2l-2 7h2m2-7h2l-2 7h2m2-7h2l-2 7z" /></svg>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/mytasks"
          className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span>Minhas Tarefas</span>
        </Link>
        {currentUser?.role === 'admin' && (
          <>
            <Link
              to={handleAdminRoute("/admin")}
              className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Admin Panel</span>
            </Link>
            <Link
              to={handleAdminRoute("/users")}
              className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354c.334-.334.69-.624 1.069-.86C13.912 3.1 14.909 3 16 3a4 4 0 014 4c0 1.09-1.006 2.094-1.57 2.659C18.173 10.16 17 11 15 12h-3m-6 0v2m-6-2h6m6 0v2m-3 4H6a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 00-2-2h-3m-3 0V9a2 2 0 012-2h2a2 2 0 012 2v3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <span>Usuários</span>
            </Link>
            <Link
              to={handleAdminRoute("/trash")}
              className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Lixeira</span>
            </Link>
          </>
        )}
        <Link
          to="/profile"
          className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span>Perfil</span>
        </Link>
        <Link
          to="/settings"
          className="flex items-center space-x-2 py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Configurações</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-700 text-sm">
        <p className="font-semibold">{currentUser.email}</p>
        <p className="text-gray-400 capitalize">{currentUser.role}</p>
      </div>
    </div>
  );
};

export default Sidebar;
