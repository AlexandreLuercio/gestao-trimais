
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
// FIX: Use scoped firebase imports for auth and firestore.
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from '@firebase/firestore';
import { User } from '../types';

interface RegistrationPageProps {
  userIdToRegister: string;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ userIdToRegister }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchPendingUser = async () => {
        try {
            const userDocRef = doc(db, 'users', userIdToRegister);
            const userDocSnap = await getDoc(userDocRef);
            
            if(userDocSnap.exists()) {
                const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
                
                // SECURITY CHECK: If invite is blocked, do not allow registration
                if (userData.status === 'Bloqueado') {
                    setError("Este convite foi revogado ou bloqueado pelo administrador.");
                    return;
                }

                if (userData.status === 'Pendente' || userData.status === 'Provisorio') {
                    setPendingUser(userData);
                    if(userData.name) setName(userData.name);
                } else if (userData.status === 'Ativo') {
                    setError("Este convite já foi utilizado. Por favor, faça login.");
                }
            } else {
                setError("Link de registro inválido ou expirado.");
            }
        } catch (e) {
            setError("Erro ao verificar convite.");
            console.error(e);
        }
    };
    fetchPendingUser();
  }, [userIdToRegister]);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!pendingUser) {
        setError("Não foi possível encontrar os dados do convite.");
        return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, pendingUser.email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("Falha na criação do usuário.");
      }
      
      // 2. IDENTITY MIGRATION: 
      // Instead of updating the old invite doc, we create a NEW doc at the correct path (users/UID).
      // This matches the App's expectation for authenticated users.
      const newUid = user.uid;
      const newDocRef = doc(db, 'users', newUid);
      
      // Copy data from pendingUser, but set correct ID and Status
      await setDoc(newDocRef, {
        ...pendingUser,
        name: name, // User might have corrected the name
        status: 'Ativo',
        uid: newUid,
        id: newUid,
      });

      // 3. DELETE THE OLD INVITE DOC to prevent duplicates/confusion
      const oldDocRef = doc(db, 'users', userIdToRegister);
      if (userIdToRegister !== newUid) {
          await deleteDoc(oldDocRef);
      }

      // 4. Success - Clear URL and let App.tsx Auth Listener take over
      localStorage.removeItem('pendingInviteId');
      window.history.pushState({}, '', window.location.pathname);

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está registrado. Tente fazer login.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError('Ocorreu um erro ao registrar: ' + err.message);
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if(!pendingUser && !error) return <div className="flex justify-center items-center min-h-screen text-trimais-blue font-bold animate-pulse">Verificando convite...</div>;
  if(error) return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Atenção</h2>
            <p className="text-red-600">{error}</p>
            <a href="/" className="mt-6 inline-block bg-trimais-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition-colors">Voltar ao Login</a>
          </div>
      </div>
  );

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-trimais-blue">Finalize seu Cadastro</h1>
          <p className="text-gray-600">Defina sua senha para acessar o sistema.</p>
        </div>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Confirmado)</label>
            <p className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">{pendingUser?.email}</p>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Crie uma Senha</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          <div>
            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-trimais-blue text-white py-3 px-4 rounded-md shadow-lg hover:bg-blue-900 disabled:bg-gray-400 transition-all font-bold">
            {isLoading ? 'Criando Acesso...' : 'Registrar e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
