
import React, { useState, useMemo } from 'react';
import { User, Role, Area, SystemFeedback, UserStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmModal from './ConfirmModal';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onInviteUser: (inviteData: { email: string; whatsapp?: string; allowedAreas: Area[]; role: Role; invitedBy: string; name: string }) => Promise<string | null>;
  onUpdateUser?: (userId: string, data: Partial<User>) => void;
  onRequestDeleteUser?: (userId: string) => void;
  onToggleUserBlock?: (user: User) => void;
  feedbacks?: SystemFeedback[];
  onToggleFeedbackRead?: (id: string, currentStatus: boolean) => void;
  onReplyFeedback?: (id: string, text: string) => void;
  onDeleteFeedback?: (id: string) => void;
  onResetCounters?: () => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, currentUser, onInviteUser, onUpdateUser, onRequestDeleteUser, onToggleUserBlock, feedbacks = [], onToggleFeedbackRead, onReplyFeedback, onDeleteFeedback, onResetCounters }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'feedback'>('users');
  
  // Feedback Filters
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState<'all' | 'unread'>('unread');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  
  // Feedback Chat State
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<Role>(Role.Gestor);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CREATED USER MODAL STATE
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{name: string, email: string, whatsapp?: string} | null>(null);

  // EDIT USER MODAL STATE
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editRole, setEditRole] = useState<Role>(Role.Gestor);
  const [editAreas, setEditAreas] = useState<Area[]>([]);

  // PROMOTE SUCCESSOR MODAL STATE (For Last Admin)
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [pendingSelfAction, setPendingSelfAction] = useState<'block' | 'delete' | null>(null);
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string>('');

  // --- REFACTORED CONFIRMATION STATE ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  // User Action State
  const [pendingAction, setPendingAction] = useState<{
      type: 'block' | 'delete';
      targetUser: User;
  } | null>(null);

  // Feedback Action State
  const [pendingFeedbackDeleteId, setPendingFeedbackDeleteId] = useState<string | null>(null);

  // Calculate Total Active Admins for Safety Checks
  const activeAdminsCount = useMemo(() => {
      return (users || []).filter(u => u.role === Role.Admin && u.status === 'Ativo').length;
  }, [users]);

  // VISUAL FILTER: Hide Deleted Users from the list
  const visibleUsers = useMemo(() => {
      return users.filter(u => u.status !== 'Excluido');
  }, [users]);

  // Filtered Feedbacks
  const filteredFeedbacks = useMemo(() => {
      let filtered = [...feedbacks];
      if (feedbackFilterStatus === 'unread') {
          filtered = filtered.filter(f => !f.isRead);
      }
      if (feedbackSearch) {
          const lower = feedbackSearch.toLowerCase();
          filtered = filtered.filter(f => 
              f.content.toLowerCase().includes(lower) || 
              f.userName.toLowerCase().includes(lower) ||
              f.userRole.toLowerCase().includes(lower)
          );
      }
      return filtered;
  }, [feedbacks, feedbackFilterStatus, feedbackSearch]);

  // List of eligible successors (Active users who are NOT the current user)
  const eligibleSuccessors = useMemo(() => {
      return visibleUsers.filter(u => u.id !== currentUser.id && u.status === 'Ativo');
  }, [visibleUsers, currentUser.id]);

  const toggleArea = (area: Area, isEditMode = false) => {
      if (isEditMode) {
          setEditAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
      } else {
          setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !name) {
      alert('Por favor, preencha os campos obrigatórios (Nome, Email e Perfil).');
      return;
    }

    if (role === Role.Gestor && selectedAreas.length === 0) {
        alert('Para cadastrar um Gestor, selecione ao menos uma Área de Responsabilidade.');
        return;
    }
    
    setIsSubmitting(true);
    
    const areasToAssign = role === Role.Gestor ? selectedAreas : [Area.Administrativo]; 

    const successId = await onInviteUser({ 
        email, 
        whatsapp, 
        allowedAreas: areasToAssign, 
        role, 
        invitedBy: currentUser.uid,
        name: name 
    });

    if (successId) {
        setCreatedUserInfo({ name, email, whatsapp });
        setShowCreatedModal(true);
        
        // Clear form
        setName('');
        setEmail('');
        setWhatsapp('');
        setRole(Role.Gestor);
        setSelectedAreas([]);
    }
    
    setIsSubmitting(false);
  };

  // --- ACTIONS HANDLERS (STATE BASED) ---

  const handleEditClick = (user: User, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingUser(user);
      setEditName(user.name);
      setEditWhatsapp(user.whatsapp || '');
      setEditRole(user.role);
      setEditAreas(user.allowedAreas || []);
  };

  const handleBlockClick = (targetUser: User, e: React.MouseEvent) => {
      e.stopPropagation();
      
      const isSelf = targetUser.uid === currentUser.uid;

      if (isSelf && targetUser.role === Role.Admin && targetUser.status === 'Ativo') {
          if (activeAdminsCount <= 1) {
              setPendingSelfAction('block');
              setShowPromoteModal(true);
              return;
          }
      }

      setPendingAction({ type: 'block', targetUser });
      setIsConfirmOpen(true);
  };

  const handleDeleteClick = (targetUser: User, e: React.MouseEvent) => {
      e.stopPropagation();

      const isSelf = targetUser.uid === currentUser.uid;

      if (isSelf && targetUser.role === Role.Admin && targetUser.status !== 'Excluido') {
            if (activeAdminsCount <= 1) {
                setPendingSelfAction('delete');
                setShowPromoteModal(true);
                return;
            }
      }

      setPendingAction({ type: 'delete', targetUser });
      setIsConfirmOpen(true);
  };

  const handleFeedbackDeleteClick = (feedbackId: string) => {
      setPendingFeedbackDeleteId(feedbackId);
      setIsConfirmOpen(true);
  };

  const handleResetCountersClick = () => {
      setIsResetConfirmOpen(true);
  };

  const handleConfirmAction = () => {
      // 1. Handle Feedback Deletion
      if (pendingFeedbackDeleteId) {
          if (onDeleteFeedback) onDeleteFeedback(pendingFeedbackDeleteId);
          setPendingFeedbackDeleteId(null);
          setIsConfirmOpen(false);
          return;
      }

      // 2. Handle User Action
      if (!pendingAction) return;

      const { type, targetUser } = pendingAction;

      console.log(`Executing ${type} on user ${targetUser.id}`);

      if (type === 'delete') {
          if (onRequestDeleteUser) {
              onRequestDeleteUser(targetUser.id);
          } else {
              console.error("No Delete Handler found in AdminPanel");
          }
      } else if (type === 'block') {
          if (onToggleUserBlock) {
              onToggleUserBlock(targetUser);
          }
      }

      setIsConfirmOpen(false);
      setPendingAction(null);
  };

  const handleConfirmReset = async () => {
      if (onResetCounters) {
          await onResetCounters();
      }
      setIsResetConfirmOpen(false);
  };

  const handlePromoteAndProceed = async () => {
      if (!selectedSuccessorId) {
          alert("Por favor, selecione um usuário para promover.");
          return;
      }
      if (!onUpdateUser) return;

      try {
          const successor = users.find(u => u.id === selectedSuccessorId);
          await onUpdateUser(selectedSuccessorId, { role: Role.Admin });
          
          if (successor) {
              console.log(`${successor.name} promovido a Administrador.`);
          }
      } catch (e) {
          alert("Erro ao promover usuário. Ação cancelada.");
          return;
      }

      if (pendingSelfAction === 'block') {
          if (onToggleUserBlock) await onToggleUserBlock(currentUser);
      } else if (pendingSelfAction === 'delete') {
          if (onRequestDeleteUser) await onRequestDeleteUser(currentUser.id);
      }

      setShowPromoteModal(false);
      setPendingSelfAction(null);
  };

  const handleSaveEdit = () => {
      if (!editingUser || !onUpdateUser) return;
      
      if (editingUser.role === Role.Admin && editRole !== Role.Admin && editingUser.status === 'Ativo') {
           if (activeAdminsCount <= 1) {
               alert("🚫 AÇÃO NEGADA\n\nVocê não pode remover o perfil de Administrador deste usuário pois ele é o único Admin ativo.");
               return;
           }
      }

      const updates: Partial<User> = {
          name: editName,
          whatsapp: editWhatsapp,
          role: editRole,
          allowedAreas: (editRole === Role.Gestor || editRole === Role.Admin) ? editAreas : []
      };
      onUpdateUser(editingUser.id, updates);
      setEditingUser(null);
  };
  
  const toggleChat = (id: string) => {
      setOpenChats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendReply = (id: string) => {
      const text = replyTexts[id];
      if (!text || !text.trim() || !onReplyFeedback) return;
      
      onReplyFeedback(id, text);
      setReplyTexts(prev => ({ ...prev, [id]: '' }));
  };

  // Helper to construct modal message dynamically
  const getConfirmModalProps = () => {
      // 1. Feedback Delete Mode
      if (pendingFeedbackDeleteId) {
          return {
              title: "Excluir Feedback",
              message: "Tem certeza que deseja excluir este feedback permanentemente? Esta ação não pode ser desfeita.",
              isDangerous: true
          };
      }

      // 2. User Action Mode
      if (!pendingAction) return { title: '', message: '', isDangerous: false };
      
      const { type, targetUser } = pendingAction;
      const isSelf = targetUser.uid === currentUser.uid;

      if (type === 'delete') {
          const warningMsg = isSelf 
            ? "⚠️ VOCÊ ESTÁ EXCLUINDO SUA PRÓPRIA CONTA.\n\nEsta ação é irreversível. Você perderá seus acessos e poderes definitivamente."
            : "Esta ação removerá o usuário do sistema. Ele não poderá mais acessar.";
          return {
              title: "Excluir Usuário",
              message: `Tem certeza que deseja EXCLUIR DEFINITIVAMENTE ${targetUser.name}?\n\n${warningMsg}`,
              isDangerous: true
          };
      } else {
          const actionLabel = targetUser.status === 'Bloqueado' ? 'Desbloquear' : 'Bloquear';
          const warningMsg = isSelf 
            ? "⚠️ VOCÊ ESTÁ SE AUTO-BLOQUEANDO.\n\nVocê será desconectado imediatamente." 
            : `O usuário ${targetUser.name} perderá o acesso ao sistema.`;
          return {
              title: `${actionLabel} Usuário`,
              message: `Tem certeza que deseja ${actionLabel.toLowerCase()} ${targetUser.name}?\n\n${warningMsg}`,
              isDangerous: targetUser.status !== 'Bloqueado'
          };
      }
  };

  const modalProps = getConfirmModalProps();

  const typeConfig = {
      bug: { label: 'Erro / Bug', icon: '🐞', color: 'border-l-4 border-red-500 bg-red-50' },
      sugestao: { label: 'Sugestão', icon: '💡', color: 'border-l-4 border-yellow-500 bg-yellow-50' },
      elogio: { label: 'Elogio', icon: '👏', color: 'border-l-4 border-green-500 bg-green-50' }
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
          <h3 className="text-2xl font-bold text-trimais-blue">Painel de Administração</h3>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-trimais-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Gestão de Usuários
              </button>
              <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'feedback' ? 'bg-white text-trimais-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Feedback ({feedbacks.filter(f => !f.isRead).length})
              </button>
          </div>
      </div>
      
      {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
            {/* Create User Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Cadastrar Novo Usuário</h4>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="Ex: João Silva" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="joao@trimais.com" />
                    </div>
                     <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">WhatsApp (Opcional)</label>
                        <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="11999999999" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Perfil *</label>
                        <select value={role} onChange={e => setRole(e.target.value as Role)} className="mt-1 block w-full px-3 py-2 border rounded-md">
                            <option value={Role.Admin}>Administrador</option>
                            <option value={Role.Diretor}>Diretor</option>
                            <option value={Role.Gestor}>Gestor</option>
                            <option value={Role.Monitor}>Monitor</option>
                        </select>
                    </div>
                    {role === Role.Gestor && (
                        <div className="md:col-span-4 bg-white p-3 rounded border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Áreas *</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.values(Area).filter(a => a !== Area.Administrativo).map(areaOption => (
                                    <label key={areaOption} className="inline-flex items-center space-x-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={selectedAreas.includes(areaOption)} onChange={() => toggleArea(areaOption)} className="rounded text-trimais-blue focus:ring-trimais-blue" />
                                        <span className="text-sm text-gray-700">{areaOption}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="md:col-span-4 mt-2">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-trimais-blue text-white py-2 px-4 rounded-md hover:bg-blue-900 disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-md transition-all">
                            {isSubmitting ? 'Criando...' : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                    Criar Usuário e Gerar Acesso
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* User List */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                    <span>Usuários Cadastrados ({visibleUsers.length})</span>
                </h4>
                <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome / Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Perfil</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {visibleUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.status === 'Bloqueado' ? 'bg-red-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.name}
                                            {user.uid === currentUser.uid && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">VOCÊ</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {user.role}
                                        {user.allowedAreas && user.allowedAreas.length > 0 && (
                                            <div className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate">
                                                {user.allowedAreas.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border 
                                            ${user.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
                                              user.status === 'Bloqueado' ? 'bg-red-100 text-red-800' : 
                                              user.status === 'Provisorio' ? 'bg-blue-100 text-blue-800' :
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 items-center relative z-10">
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleEditClick(user, e)} 
                                                className="p-2 bg-white border border-gray-200 rounded hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer shadow-sm active:scale-95" 
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleBlockClick(user, e)} 
                                                className={`p-2 bg-white border rounded transition-colors cursor-pointer shadow-sm active:scale-95 ${user.status === 'Bloqueado' ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-orange-300 text-orange-500 hover:bg-orange-50'}`} 
                                                title={user.status === 'Bloqueado' ? "Desbloquear Acesso" : "Bloquear Acesso"}
                                            >
                                                {user.status === 'Bloqueado' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                )}
                                            </button>
                                            
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleDeleteClick(user, e)} 
                                                className="p-2 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer shadow-sm active:scale-95" 
                                                title="Excluir Usuário"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'feedback' && (
          <div className="animate-fade-in space-y-6">
              {/* Feedback Toolbar */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => setFeedbackFilterStatus('unread')} className={`px-3 py-1.5 text-sm rounded ${feedbackFilterStatus === 'unread' ? 'bg-trimais-blue text-white' : 'bg-white text-gray-600 border'}`}>
                            Não Lidos
                        </button>
                         <button onClick={() => setFeedbackFilterStatus('all')} className={`px-3 py-1.5 text-sm rounded ${feedbackFilterStatus === 'all' ? 'bg-trimais-blue text-white' : 'bg-white text-gray-600 border'}`}>
                            Todos
                        </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Pesquisar por nome ou conteúdo..." 
                    value={feedbackSearch}
                    onChange={e => setFeedbackSearch(e.target.value)}
                    className="w-full md:w-64 px-3 py-1.5 border rounded text-sm"
                  />
              </div>

              {filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Nenhum feedback encontrado.</div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredFeedbacks.map((item) => (
                        <div key={item.id} className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow relative group flex flex-col ${typeConfig[item.type].color.split(' ')[2]}`}>
                            {/* Card Header (User Info) */}
                            <div className="flex justify-between items-start p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                                 <div>
                                     <h4 className="font-bold text-trimais-blue text-sm">{item.userName}</h4>
                                     <p className="text-xs text-gray-500">
                                        {item.userRole}
                                        {item.userAreas && item.userAreas.length > 0 && (
                                            <span className="ml-1 text-[10px] font-semibold text-gray-500">({item.userAreas.join(', ')})</span>
                                        )}
                                     </p>
                                 </div>
                                 <div className={`p-1.5 rounded-lg text-lg ${typeConfig[item.type].color.replace('border-l-4', 'border')}`}>
                                     {typeConfig[item.type].icon}
                                 </div>
                            </div>

                            {/* Card Body (Content) */}
                            <div className={`p-4 ${item.isRead ? 'opacity-75' : ''}`}>
                                <div className="mb-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${typeConfig[item.type].color.replace('border-l-4', 'border')}`}>
                                        {typeConfig[item.type].label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 float-right mt-0.5">
                                        {format(parseISO(item.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                            </div>

                            {/* CHAT / COMMENTS SECTION */}
                            <div className="mt-auto border-t border-gray-100">
                                {openChats[item.id] ? (
                                    <div className="p-3 bg-gray-50 rounded-b-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500">Histórico / Notas</span>
                                            <button onClick={() => toggleChat(item.id)} className="text-xs text-gray-400 hover:text-gray-600">&times; Fechar</button>
                                        </div>
                                        
                                        {/* Messages List */}
                                        <div className="space-y-2 max-h-40 overflow-y-auto mb-3 custom-scrollbar">
                                            {item.comments && item.comments.length > 0 ? (
                                                item.comments.map((comment, idx) => (
                                                    <div key={idx} className={`p-2 rounded text-xs ${comment.isAdmin ? 'bg-blue-100 ml-4' : 'bg-white mr-4 border'}`}>
                                                        <p className="font-bold text-[10px] text-gray-600 mb-0.5">{comment.author}</p>
                                                        <p className="text-gray-800">{comment.text}</p>
                                                        <p className="text-[9px] text-gray-400 text-right mt-1">{format(parseISO(comment.timestamp), "dd/MM HH:mm")}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 text-center italic">Nenhuma observação.</p>
                                            )}
                                        </div>

                                        {/* Input */}
                                        <div className="flex gap-1">
                                            <input 
                                                type="text" 
                                                value={replyTexts[item.id] || ''}
                                                onChange={e => setReplyTexts(prev => ({...prev, [item.id]: e.target.value}))}
                                                placeholder="Adicionar nota..." 
                                                className="flex-1 text-xs p-1.5 border rounded focus:ring-1 focus:ring-trimais-blue"
                                            />
                                            <button 
                                                onClick={() => handleSendReply(item.id)}
                                                className="bg-trimais-blue text-white px-2 rounded text-xs hover:bg-blue-900"
                                            >
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center p-3">
                                        <button 
                                            onClick={() => toggleChat(item.id)} 
                                            className="text-xs text-trimais-blue font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                            {item.comments && item.comments.length > 0 ? `(${item.comments.length})` : 'Chat'}
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onToggleFeedbackRead && onToggleFeedbackRead(item.id, item.isRead)} 
                                                className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded transition-colors ${item.isRead ? 'text-gray-400 hover:text-blue-600' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                                            >
                                                {item.isRead ? 'Não Lido' : 'Marcar Lido'}
                                            </button>

                                            <button 
                                                onClick={() => handleFeedbackDeleteClick(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Excluir Feedback"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Type Stripe Indicator */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-lg ${typeConfig[item.type].color.split(' ')[1].replace('border-', 'bg-')}`}></div>
                        </div>
                      ))}
                  </div>
              )}
          </div>
      )}
      
      {/* SYSTEM MAINTENANCE SECTION (Only for Real Admins) */}
      {currentUser.role === Role.Admin && (
          <div className="mt-8 border-t-2 border-red-100 pt-6">
              <h4 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Manutenção do Sistema (Zona de Perigo)
              </h4>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 mb-4">
                      Ações irreversíveis que afetam todo o sistema. Use com cautela.
                  </p>
                  <button 
                      onClick={handleResetCountersClick}
                      className="bg-red-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-700 shadow-sm"
                  >
                      Zerar Numeração de Tarefas
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                      Reinicia o contador global. A próxima tarefa criada será a #001. Útil para iniciar testes pilotos.
                  </p>
              </div>
          </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={modalProps.title}
        message={modalProps.message}
        onConfirm={handleConfirmAction}
        onCancel={() => {
            setIsConfirmOpen(false);
            setPendingAction(null);
            setPendingFeedbackDeleteId(null);
        }}
        isDangerous={modalProps.isDangerous}
      />
      
      {/* RESET COUNTERS MODAL */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Zerar Numeração de Tarefas"
        message="Tem certeza que deseja zerar o contador de tarefas? A próxima tarefa criada começará do número 001. Isso não apaga as tarefas existentes, apenas reinicia a contagem para novos registros."
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
        confirmText="Sim, zerar contador"
        cancelText="Cancelar"
        isDangerous={true}
      />

      {showPromoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Sucessão de Administrador</h3>
                      <p className="text-sm text-gray-500 mt-2">
                          Selecione um sucessor para receber o cargo de Administrador.
                      </p>
                  </div>
                  
                  <div className="mb-6">
                      <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trimais-blue"
                        value={selectedSuccessorId}
                        onChange={(e) => setSelectedSuccessorId(e.target.value)}
                      >
                          <option value="">-- Selecione um usuário --</option>
                          {eligibleSuccessors.map(u => (
                              <option key={u.id} value={u.id}>
                                  {u.name} ({u.role})
                              </option>
                          ))}
                      </select>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowPromoteModal(false); setPendingSelfAction(null); }}
                        className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handlePromoteAndProceed}
                        disabled={!selectedSuccessorId}
                        className="flex-1 py-3 text-sm font-bold text-white bg-trimais-blue rounded-lg"
                      >
                          Promover e Continuar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showCreatedModal && createdUserInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                 <div className="text-center mb-6">
                      <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Usuário Criado com Sucesso!</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                        <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                             <p className="text-sm text-gray-600">
                                O usuário <strong>{createdUserInfo.name}</strong> foi adicionado à lista.
                            </p>
                             <p className="text-base text-trimais-blue font-bold mt-2 border-t pt-2 border-gray-200">
                                Senha Provisória: 123456
                            </p>
                             <p className="text-xs text-gray-500 mt-1">
                                O sistema pedirá a troca de senha no primeiro acesso.
                            </p>
                        </div>
                        
                      <button 
                        onClick={() => setShowCreatedModal(false)} 
                        className="w-full py-3 bg-trimais-blue text-white rounded-md font-bold hover:bg-blue-900 transition-colors shadow-md mt-2"
                      >
                          Concluído
                      </button>
                  </div>
              </div>
          </div>
      )}

      {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6">
                  <h4 className="text-xl font-bold mb-4">Editar Usuário</h4>
                  <div className="space-y-4">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded" placeholder="Nome" />
                      <input type="tel" value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} className="w-full border p-2 rounded" placeholder="WhatsApp (Opcional)" />
                      <select value={editRole} onChange={e => setEditRole(e.target.value as Role)} className="w-full border p-2 rounded">
                          <option value={Role.Admin}>Administrador</option>
                          <option value={Role.Diretor}>Diretor</option>
                          <option value={Role.Gestor}>Gestor</option>
                          <option value={Role.Monitor}>Monitor</option>
                      </select>
                      
                      {(editRole === Role.Gestor || editRole === Role.Admin) && (
                          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                               <p className="col-span-2 text-sm font-bold text-gray-600 mb-1">Áreas de Atuação/Responsabilidade:</p>
                              {Object.values(Area).filter(a => a !== Area.Administrativo).map(area => (
                                  <label key={area} className="flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={editAreas.includes(area)} onChange={() => toggleArea(area, true)} className="rounded text-trimais-blue focus:ring-trimais-blue" />
                                      <span className="text-sm">{area}</span>
                                  </label>
                              ))}
                          </div>
                      )}
                      <div className="flex gap-2 mt-4">
                          <button onClick={() => setEditingUser(null)} className="flex-1 bg-gray-200 py-2 rounded">Cancelar</button>
                          <button onClick={handleSaveEdit} className="flex-1 bg-trimais-blue text-white py-2 rounded">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
