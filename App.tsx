// src/App.tsx
import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';

// --- DEFINIÇÕES DE TIPOS (Se não estiverem em types.ts, coloque-as aqui temporariamente) ---
// Certifique-se de que estes tipos correspondem ao que o Header.tsx espera
export type Role = 'admin' | 'user' | 'manager'; // Adicione outros papéis se aplicável
export interface AppUser { // Renomeado para AppUser para evitar conflito com o tipo User do Supabase
  id: string;
  email: string | undefined;
  role: Role;
}
export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
}
export type View = 'dashboard' | 'form' | 'myTasks' | 'admin' | 'trash'; // Adicione outras views se aplicável
// --- FIM DEFINIÇÕES DE TIPOS ---


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null); // NOVO ESTADO: Objeto de usuário completo
  const [activeView, setActiveView] = useState<View>('dashboard'); // NOVO ESTADO: Para gerenciar a view ativa no Header

  useEffect(() => {
    const fetchSessionAndProfile = async (currentSession: Session | null) => {
      setLoading(true); // Inicia carregamento
      try {
        if (currentSession) {
          console.log("DEBUG: fetchSessionAndProfile - Session user ID:", currentSession.user.id);
          
          // Busca o papel (role) do usuário na tabela 'profiles'
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          if (!error && data?.role) {
            // Se encontrou o papel, cria o objeto appUser
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: data.role as Role // Converte para o tipo Role
            });
          } else {
            // Se não encontrou o papel ou houve erro, define um papel padrão
            console.warn("DEBUG: Perfil não encontrado ou sem papel para o usuário:", currentSession.user.id, error);
            setAppUser({
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: 'user' // Papel padrão, por exemplo
            });
          }
        } else {
          setAppUser(null); // Limpa o appUser se não houver sessão
        }
      } catch (err: any) {
        console.error("DEBUG: Erro em fetchSessionAndProfile:", err);
        setAppUser(null); // Limpa o appUser em caso de erro
      } finally {
        setLoading(false); // Finaliza carregamento
      }
    };

    // 1. Verificação inicial da sessão ao carregar o aplicativo
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      fetchSessionAndProfile(initialSession); // Busca o perfil com a sessão inicial
    }).catch(err => {
      console.error("DEBUG: Erro em getSession inicial:", err);
      setLoading(false);
    });

    // 2. Escuta por mudanças no estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      console.log("DEBUG: onAuthStateChange - Event:", _event, "New Session:", newSession);
      fetchSessionAndProfile(newSession); // Busca o perfil novamente em caso de mudança de sessão
    });

    // Limpa a inscrição ao desmontar o componente
    return () => subscription.unsubscribe();
  }, []); // Array de dependências vazio: este efeito roda apenas uma vez ao montar

  // Estado derivado: isAdmin é true se o papel do appUser for 'admin'
  const isAdmin = appUser?.role === 'admin';

  // --- Lógica de Renderização ---

  // Mostra spinner enquanto carrega
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  // Se não há sessão ou o appUser ainda não foi carregado (e não está mais carregando), mostra a tela de Login
  if (!session || !appUser) return <Login />;

  // Se chegamos aqui, significa que há uma sessão e o appUser foi carregado
  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={appUser} // AGORA PASSAMOS O OBJETO appUser COMPLETO
        notifications={[]} // Placeholder: Você precisará gerenciar este estado em App.tsx
        realRole={appUser.role} // O papel real do perfil do usuário
        onSimulateRole={() => console.log("Simulate Role clicked")} // Placeholder
        isSimulating={false} // Placeholder: Você precisará gerenciar este estado em App.tsx
        onOpenFeedback={() => console.log("Open Feedback clicked")} // Placeholder
        onChangePassword={() => console.log("Change Password clicked")} // Placeholder
        onMarkNotificationsRead={() => console.log("Mark Notifications Read clicked")} // Placeholder
      />
      <main className="max-w-7xl mx-auto py-6 px-4">
        {isAdmin && (
          <div className="bg-[#003366] text-white text-center py-2 rounded-lg mb-6 font-bold shadow-md">
            PAINEL DO ADMINISTRADOR ATIVO
          </div>
        )}
        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
          <OccurrenceForm />
        </div>
      </main>
    </div>
  );
};

export default App;
