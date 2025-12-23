import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import Login from './components/Login'; // Certifique-se que este arquivo existe em src/components

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Nova Ocorrência</h1>
            <OccurrenceForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
