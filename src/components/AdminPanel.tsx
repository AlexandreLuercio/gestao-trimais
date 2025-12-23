
import React from 'react';
import { User } from '../types';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onInviteUser: (d: any) => Promise<any>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-trimais-blue mb-4">Gestão de Equipe ({users.length})</h2>
      <p className="text-gray-500 italic">Módulo de administração em carregamento...</p>
    </div>
  );
};

export default AdminPanel;
