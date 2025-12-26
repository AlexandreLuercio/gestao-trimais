// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Occurrence, User, Role, SystemFeedback, AppNotification } from './types';

// Componentes
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import ShareModal from './components/ShareModal';
import Dashboard from './components/Dashboard';
import MyTasks from './components/MyTasks';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import TrashPanel from './components/TrashPanel';
import FeedbackModal from './components/FeedbackModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import FirstAdminSetup from './components/FirstAdminSetup';

export type View = 'form' | 'dashboard' | 'myTasks' | 'admin' | 'team' | 'trash';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<SystemFeedback[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [realRole, setRealRole] = useState<Role | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // 1. GERENCIAMENTO DE AUTENTICAÇÃO
  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setCurrentUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Se não encontrar perfil, verifica se o sistema precisa de setup inicial
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (count === 0) setNeedsSetup(true);
      } else if (data) {
        setCurrentUserProfile(data);
        setRealRole(data.role);
        if (data.status === 'Provisorio') setIsChangePasswordModalOpen(true);
      }
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. CARREGAMENTO DE DADOS (OCORRÊNCIAS E USUÁRIOS)
  useEffect(() => {
    if (!session || !currentUserProfile) return;

    // Busca inicial de Ocorrências
    const fetchOccurrences = async () => {
      const { data } = await supabase
        .from('occurrences')
        .select('*')
        .order('created_at', { ascending: false });
      setOccurrences(data || []);
    };

    // Busca inicial de Usuários (Perfis)
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setUsers(data || []);
    };

    fetchOccurrences();
    fetchUsers();

    // INSCRIÇÃO EM TEMPO REAL (Substitui o onSnapshot do Firebase)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => fetchOccurrences())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, currentUserProfile]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#003366] text-white font-bold">
      Iniciando Trimais Places...
    </div>
  );

  if (needsSetup) return <FirstAdminSetup onSetupComplete={() => setNeedsSetup(false)} />;
  if (!session || !currentUserProfile) return <LoginPage />;

  const safeOccs = occurrences || [];
  const activeOccurrences = safeOccs.filter(occ => !occ.deleted_at);
  const deletedOccurrences = safeOccs.filter(occ => !!occ.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header 
        activeView={activeView} setActiveView={setActiveView} 
        currentUser={currentUserProfile} notifications={notifications}
        realRole={realRole || currentUserProfile.role} 
        onSimulateRole={(role) => {
            if (role === null) { setCurrentUserProfile({...currentUserProfile, role: realRole}); setIsSimulating(false); }
            else { setCurrentUserProfile({...currentUserProfile, role}); setIsSimulating(true); }
        }}
        isSimulating={isSimulating} onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onChangePassword={() => setIsChangePasswordModalOpen(true)}
        onMarkNotificationsRead={() => {}}
      />
      <main className="container mx-auto px-4 py-8">
        {activeView === 'dashboard' && <Dashboard occurrences={activeOccurrences} users={users} currentUser={currentUserProfile} />}
        {activeView === 'form' && <OccurrenceForm onAddOccurrence={async () => {}} />}
        {activeView === 'myTasks' && (
          <MyTasks 
            occurrences={activeOccurrences} 
            currentUser={currentUserProfile} 
            users={users} 
            updateOccurrence={async (id, updates) => {
              await supabase.from('occurrences').update(updates).eq('id', id);
            }} 
          />
        )}
        {activeView === 'admin' && <AdminPanel users={users} currentUser={currentUserProfile} onInviteUser={async () => {}} />}
        {activeView === 'trash' && (
          <TrashPanel 
            occurrences={deletedOccurrences} 
            onRestore={async (id) => await supabase.from('occurrences').update({deleted_at: null}).eq('id', id)} 
            onDeleteForever={async (id) => await supabase.from('occurrences').delete().eq('id', id)} 
          />
        )}
      </main>
      {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={async () => {}} />}
      {isChangePasswordModalOpen && <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} user={currentUserProfile} isForced={currentUserProfile.status === 'Provisorio'} />}
    </div>
  );
};

export default App;
