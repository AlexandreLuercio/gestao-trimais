import React, { useState, useMemo } from 'react';
import { User, Role, Area, SystemFeedback } from '../types';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onInviteUser: (inviteData: any) => Promise<string | null>;
  onUpdateUser?: (userId: string, data: Partial<User>) => void;
  onToggleUserBlock?: (user: User) => void;
  feedbacks?: SystemFeedback[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, currentUser, onInviteUser, onToggleUserBlock, feedbacks = [] }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.Gestor);

  const safeUsers = users || [];
  const visibleUsers = useMemo(() => safeUsers.filter(u => u.status !== 'Excluido'), [safeUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    await onInviteUser({ email, allowedAreas: [], role, invitedBy: currentUser.uid, name });
    setName(''); setEmail(''); 
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full space-y-8">
      <div className="flex justify-between items-center border-b pb-4"><h3 className="text-2xl font-bold text-trimais-blue">Administração de Equipe</h3></div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
          <h4 className="font-bold mb-4 text-trimais-blue uppercase text-sm tracking-wider">Convidar Novo Integrante</h4>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome Completo" className="border p-2 rounded focus:ring-2 ring-trimais-gold outline-none" required />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail Corporativo" className="border p-2 rounded focus:ring-2 ring-trimais-gold outline-none" required />
              <select value={role} onChange={e => setRole(e.target.value as Role)} className="border p-2 rounded focus:ring-2 ring-trimais-gold outline-none">
                  <option value={Role.Gestor}>Gestor</option>
                  <option value={Role.Monitor}>Monitor</option>
                  <option value={Role.Diretor}>Diretor</option>
              </select>
              <button type="submit" className="bg-trimais-blue text-white py-2 rounded font-bold hover:bg-blue-900 transition-colors shadow-md">Convidar</button>
          </form>
      </div>

      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Função</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {visibleUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                              <div className="font-bold text-gray-800">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.role}</td>
                          <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {u.status}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <button onClick={() => onToggleUserBlock?.(u)} className="text-trimais-blue hover:text-red-600 font-bold text-xs uppercase underline">
                                  {u.status === 'Bloqueado' ? 'Desbloquear' : 'Bloquear'}
                              </button>
                          </td>
                      </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Nenhum usuário registrado.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default AdminPanel;
