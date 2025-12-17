import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { updatePassword } from 'firebase/auth'; // <-- Corrigido aqui
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isForced?: boolean; // If true, user cannot close modal without changing
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user, isForced = false }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    setIsSubmitting(true);

    try {
        if (auth.currentUser) {
            // 1. Update Auth Password
            await updatePassword(auth.currentUser, newPassword);
            
            // 2. If forced (first login), update status to Ativo in Firestore
            if (isForced) {
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, { status: 'Ativo' });
            }

            alert('Senha alterada com sucesso! Bem-vindo ao sistema.');
            
            // 3. DO NOT RELOAD. 
            // The App.tsx listener will detect the status change to 'Ativo' automatically
            // and close the modal gracefully via the setForcePasswordChange(false) logic.
            if (!isForced) {
                onClose();
            }
        }
    } catch (err: any) {
        console.error("Error changing password:", err);
        if (err.code === 'auth/requires-recent-login') {
            setError('Por segurança, faça login novamente antes de alterar a senha.');
        } else {
            setError('Erro ao alterar senha. Tente novamente.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-90 z-[1000] flex justify-center items-center p-4 backdrop-blur-sm"
        // CRITICAL: Block closing if forced
        onClick={() => !isForced && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isForced ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'} mb-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-trimais-blue">
                {isForced ? 'Troca de Senha Obrigatória' : 'Alterar Senha'}
            </h3>
            <p className="text-gray-600 mt-2">
                {isForced 
                    ? 'Este é seu primeiro acesso. Por segurança, defina uma nova senha pessoal.' 
                    : 'Digite sua nova senha abaixo.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-trimais-blue focus:border-trimais-blue"
                    placeholder="Mínimo 6 caracteres"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-trimais-blue focus:border-trimais-blue"
                    placeholder="Repita a senha"
                    required
                />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">{error}</div>}

            <div className="flex gap-3 mt-6">
                {!isForced && (
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-md text-white font-bold shadow-md transition-colors disabled:bg-gray-400 ${isForced ? 'w-full bg-trimais-blue hover:bg-blue-900' : 'bg-trimais-blue hover:bg-blue-900'}`}
                >
                    {isSubmitting ? 'Salvando...' : 'Definir Nova Senha'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
