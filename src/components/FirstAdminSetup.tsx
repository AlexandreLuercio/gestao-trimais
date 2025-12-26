import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  onSetupComplete: () => void;
}

const FirstAdminSetup: React.FC<Props> = ({ onSetupComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar o usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Criar o perfil de administrador na tabela 'profiles'
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: 'admin',
              status: 'Ativo'
            }
          ]);

        if (profileError) throw profileError;

        onSetupComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao configurar administrador inicial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003366] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#003366] text-center">Bem-vindo ao TrIA</h2>
        <p className="text-gray-500 mt-2 mb-6 text-center">
          Nenhum usuário encontrado. Configure o primeiro administrador do sistema para começar.
        </p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail do Administrador</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#003366] focus:border-[#003366] outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@trimais.com.br"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha de Acesso</label>
            <input
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#003366] focus:border-[#003366] outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-[#002244] transition-colors disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Configurando...' : 'Criar Administrador e Iniciar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstAdminSetup;
