import React, { useState, useEffect } from 'react';
import { auth, db } from '../config';
import * as FirebaseAuth from 'firebase/auth';
import * as FirebaseFirestore from 'firebase/firestore';
const { createUserWithEmailAndPassword } = FirebaseAuth as any;
const { doc, getDoc, setDoc, deleteDoc } = FirebaseFirestore as any;
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
            const userDocSnap = await getDoc(doc(db, 'users', userIdToRegister));
            if(userDocSnap.exists()) {
                const userData = { id: userDocSnap.id, ...(userDocSnap.data() as any) } as User;
                setPendingUser(userData);
                if(userData.name) setName(userData.name);
            }
        } catch (e) { console.error(e); }
    };
    fetchPendingUser();
  }, [userIdToRegister]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, pendingUser!.email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), { ...pendingUser, name, status: 'Ativo', uid, id: uid });
      if (userIdToRegister !== uid) await deleteDoc(doc(db, 'users', userIdToRegister));
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-trimais-blue">Finalizar Cadastro</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome Completo" className="w-full p-2 border rounded" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-2 border rounded" required />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full bg-trimais-blue text-white py-2 rounded">Criar Acesso</button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;