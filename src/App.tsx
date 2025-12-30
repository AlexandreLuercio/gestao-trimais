import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verifica a sessão atual ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        console.log("DEBUG: getSession - Session user ID:", session.user.id); // NOVO LOG
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    }).catch(err => { // NOVO CATCH para getSession
      console.error("DEBUG: Erro em getSession:", err);
      setLoading(false);
    });

    // Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        console.log("DEBUG: onAuthStateChange - Session user ID:", session.user.id); // NOVO LOG
        await checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log("DEBUG: checkAdminStatus iniciado para userId:", userId); // Log para saber que a função começou
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      console.log("DEBUG: Resposta do Supabase - data:", data); // Log do que veio em 'data'
      console.log("DEBUG: Resposta do Supabase - error:", error); // Log do que veio em 'error'

      if (error) {
        console.error("DEBUG: Erro ao buscar perfil no Supabase:", error.message); // Se houver erro, mostre a mensagem
        setIsAdmin(false);
        return; // Importante: sair da função se houver erro
      }
      
      // Verificação mais robusta para 'data' e 'role'
      if (data && typeof data === 'object' && 'role' in data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e: any) {
      console.error("DEBUG: UM ERRO INESPERADO OCORREU em checkAdminStatus:", e);
      setIsAdmin(false);
      // Re-throw para garantir que o erro apareça no console principal
      throw e; 
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isAdmin={isAdmin} />
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
