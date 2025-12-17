import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // <-- Corrigido aqui
import { doc, setDoc } from '@firebase/firestore';
import { Role, Area } from '../types';

interface FirstAdminSetupProps {
  onSetupComplete: () => void;
}

const FirstAdminSetup: React.FC<FirstAdminSetupProps> = ({ onSetupComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("A criação do usuário de autenticação falhou.");
      }

      // Step 2: Create user profile in Firestore
      const userDocRef = doc(db, 'users', user.uid); // Use Auth UID as Document ID for the first user
      await setDoc(userDocRef, {
        uid: user.uid,
        id: user.uid, // For consistency in the data model
        name: name,
        email: email,
        role: Role.Admin,
        area: Area.Administrativo, // Legacy keep
        allowedAreas: [Area.Administrativo], // New standard
        status: 'Ativo',
      });

      // Step 3: Trigger the main app to reload its state
      onSetupComplete();

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError('Ocorreu um erro ao criar a conta.');
        console.error("First admin setup error:", err);
      }
      setIsLoading(false);
    }
    // Don't set isLoading to false on success, as the app will remount
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-trimais-blue">Bem-vindo!</h1>
          <p className="text-gray-600">Vamos configurar a conta do Administrador Central.</p>
        </div>
        <form className="space-y-4" onSubmit={handleCreateAdmin}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Senha (mínimo 6 caracteres)</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          <div>
            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-trimais-blue text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-900 disabled:bg-gray-400">
            {isLoading ? 'Criando conta...' : 'Criar Conta e Iniciar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstAdminSetup;
