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
      if (session) checkAdminStatus(session.user.id);
      setLoading(false);
    });

    // Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!error && data?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
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
