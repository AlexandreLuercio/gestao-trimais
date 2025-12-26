import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Erro de Login:", err.code);
      setError(`Erro: ${err.code}. Verifique se a Identity Toolkit API está ativa no Google Cloud.`);
    }
  };

  // FUNÇÃO MESTRE: Tenta criar um usuário de teste para validar a conexão
  const handleSetupTest = async () => {
    setStatus('Tentando criar usuário de teste...');
    try {
      await createUserWithEmailAndPassword(auth, 'teste@trimais.com.br', 'Teste123456!');
      setStatus('Sucesso! Usuário teste@trimais.com.br criado. Tente logar agora.');
    } catch (err: any) {
      console.error("Erro no Setup:", err.code);
      if (err.code === 'auth/email-already-in-use') {
        setStatus('O usuário já existe. A conexão está funcionando! ✅');
      } else {
        setStatus(`Falha Crítica: ${err.code}. O Google está bloqueando sua API Key (Erro 403).`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#003366]">Gestão Trimais</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Acesse sua conta</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#003366] focus:border-[#003366] sm:text-sm"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#003366] focus:border-[#003366] sm:text-sm"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366]"
            >
              Entrar
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500 mb-4">Ferramenta de Diagnóstico:</p>
