import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  // Ferramenta de diagnóstico para garantir que o Supabase está respondendo
  const testConnection = async () => {
    setStatus('Iniciando diagnóstico...');
    const { error } = await supabase.auth.signUp({
      email: 'teste@trimais.com.br',
      password: 'Teste123456!',
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        setStatus('Conexão OK! O banco de dados está respondendo. ✅');
      } else {
        setStatus(`Erro de Conexão: ${error.message} ❌`);
      }
    } else {
      setStatus('Sucesso! Usuário de teste criado no Supabase. ✅');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#003366] p-3 rounded-xl mb-4 shadow-lg">
            <CheckCircle className="text-[#d4af37] w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#003366]">Gestão Trimais</h2>
          <p className="text-gray-500 text-sm mt-2">Acesse o sistema operacional</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">E-mail Corporativo</label>
            <input
              type="email"
              placeholder="exemplo@trimais.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-lg font-bold text-white bg-[#003366] hover:bg-[#002244] transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <ShieldCheck size={20} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-center text-[10px] text-gray-400 mb-4 uppercase tracking-widest font-bold">Diagnóstico de Rede</p>
          <button
            onClick={testConnection}
            className="w-full py-2 border-2 border-[#d4af37] text-[#d4af37] font-bold rounded-lg hover:bg-yellow-50 transition-all text-xs flex items-center justify-center gap-2"
          >
            VERIFICAR STATUS DO BANCO DE DADOS
          </button>
          {status && (
            <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-[9px] text-center font-mono text-gray-600 leading-tight">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
