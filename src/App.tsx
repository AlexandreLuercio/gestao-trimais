import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import Login from './components/Login';
import OccurrenceForm from './components/OccurrenceForm';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Busca o papel (role) do usuário no Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setUser(currentUser);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003366]"></div>
          <p className="text-[#003366] font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isAdmin={isAdmin} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isAdmin && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#003366] text-[#003366] rounded shadow-sm flex items-center justify-between">
              <span className="font-bold">Painel do Administrador Ativo</span>
              <span className="text-xs bg-[#003366] text-white px-2 py-1 rounded">ADMIN</span>
            </div>
          )}
          
          <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">
              Registrar Nova Ocorrência
            </h1>
            <OccurrenceForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
