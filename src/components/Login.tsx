import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const testConnection = async () => {
    setStatus('Testando conexão...');
    const { error } = await supabase.auth.signUp({
      email: 'teste@trimais.com.br',
      password: 'Teste123456!',
    });
    if (error) {
      if (error.message.includes('already registered')) {
        setStatus('Conexão OK! Usuário já existe. ✅');
      } else {
        setStatus(`Erro: ${error.message}`);
      }
    } else {
      setStatus('Sucesso! Usuário teste@trimais.com.br criado. ✅');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-[#003366]">Gestão Trimais</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
            required
          />
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white bg-[#003366] hover:bg-[#002244] transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={testConnection}
            className="w-full py-2 border-2 border-[#d4af37] text-[#d4af37] font-bold rounded-lg hover:bg-yellow-50 transition-all text-sm"
          >
            TESTAR CONEXÃO SUPABASE
          </button>
          {status && <p className="text-[10px] text-center mt-2 font-mono text-gray-500">{status}</p>}
        </div>
      </div>
    </div>
  );
};

export default App;
