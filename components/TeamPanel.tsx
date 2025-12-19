import React, { useState, useMemo } from 'react';
import { User, Role, Area } from '../types';

interface TeamPanelProps {
  users: User[];
  currentUser: User;
  onInviteUser: (inviteData: { email: string; whatsapp?: string; allowedAreas: Area[]; role: Role; invitedBy: string }) => Promise<string | null>;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ users, currentUser, onInviteUser }) => {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<Role>(Role.Gestor);

  const teamMembers = useMemo(() => 
    (users || []).filter(user => 
        user.uid !== currentUser.uid && 
        (user.allowedAreas || []).some(area => (currentUser.allowedAreas || []).includes(area))
    ), [users, currentUser]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await onInviteUser({ 
      email, 
      whatsapp, 
      allowedAreas: currentUser.allowedAreas || [], 
      role, 
      invitedBy: currentUser.uid 
    });
    setEmail(''); 
    setWhatsapp('');
    alert("Convite enviado com sucesso!");
  };
  
  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full space-y-8">
      <h3 className="text-2xl font-bold text-trimais-blue">Gerenciar Equipe</h3>
      <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail Corporativo" className="border p-2 rounded-lg" required />
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp (Opcional)" className="border p-2 rounded-lg" />
          <button type="submit" className="bg-trimais-blue text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors">Convidar Colaborador</button>
      </form>
      <div className="bg-white border rounded-lg overflow-hidden">
        <h4 className="font-bold p-4 bg-gray-50 border-b text-trimais-blue uppercase text-xs tracking-widest">Membros na sua Área</h4>
        <ul className="divide-y">
            {teamMembers.map(u => (
                <li key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                        <p className="font-bold text-gray-800">{u.name || 'Pendente'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className="text-xs bg-trimais-gold/10 text-trimais-blue px-2 py-1 rounded font-bold uppercase">{u.role}</span>
                </li>
            ))}
            {teamMembers.length === 0 && (
                <li className="p-10 text-center text-gray-400 italic text-sm">Nenhum membro da equipe encontrado para suas áreas.</li>
            )}
        </ul>
      </div>
    </div>
  );
};

export default TeamPanel;