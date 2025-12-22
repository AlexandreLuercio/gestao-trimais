import React, { useState } from 'react';
import { auth, db } from '../config';
import * as FirebaseAuth from 'firebase/auth';
import * as FirebaseFirestore from 'firebase/firestore';
const { createUserWithEmailAndPassword } = FirebaseAuth as any;
const { doc, setDoc } = FirebaseFirestore as any;
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
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), { uid, id: uid, name, email, role: Role.Admin, allowedAreas: [Area.Administrativo], status: 'Ativo' }, { merge: true });
      onSetupComplete();
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  return (
    <div className="bg-trimais-blue flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6 text-center">
        <h1 className="text-2xl font-bold text-trimais-blue">Configuração de Primeiro Acesso</h1>
        <p className="text-sm text-gray-500">Crie a conta do Administrador principal para o Trimais Places.</p>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="w-full p-2 border rounded" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full p-2 border rounded" required />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar" className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full bg-trimais-blue text-white py-3 rounded font-bold uppercase">Finalizar Instalação</button>
        </form>
      </div>
    </div>
  );
};

export default FirstAdminSetup;