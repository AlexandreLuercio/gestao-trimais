import React, { useState } from 'react';
import { auth, db } from '../config';
import * as FirebaseAuth from 'firebase/auth';
import * as FirebaseFirestore from 'firebase/firestore';
const { updatePassword } = FirebaseAuth as any;
const { doc, updateDoc } = FirebaseFirestore as any;
import { User } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isForced?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user, isForced = false }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    if (auth.currentUser) {
        try {
            await updatePassword(auth.currentUser, newPassword);
            if (isForced) {
                await updateDoc(doc(db, 'users', user.id), { status: 'Ativo' });
            }
            onClose();
            alert("Senha atualizada com sucesso!");
        } catch (error: any) {
            console.error("Error updating password:", error);
            setError("Erro ao atualizar senha. Verifique se você fez login recentemente.");
        }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex justify-center items-center p-4 animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-2 text-trimais-blue">Alterar Senha</h3>
        <p className="text-sm text-gray-500 mb-6">
          {isForced ? 'Seu primeiro acesso requer a troca da senha provisória.' : 'Escolha uma nova senha segura.'}
        </p>
        
        <div className="space-y-4">
          <input 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            className="w-full border p-3 rounded-lg bg-gray-50" 
            placeholder="Nova Senha" 
            required
          />
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            className="w-full border p-3 rounded-lg bg-gray-50" 
            placeholder="Confirmar Nova Senha" 
            required
          />
        </div>

        {error && <p className="text-red-600 text-xs mt-3 bg-red-50 p-2 rounded">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-trimais-blue text-white py-3 rounded-lg font-bold mt-6 hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordModal;