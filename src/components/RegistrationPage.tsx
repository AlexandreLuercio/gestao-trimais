import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Save, Layout } from 'lucide-react';

interface Props {
  userIdToRegister: string;
  onComplete: () => void;
}

const RegistrationPage: React.FC<Props> = ({ userIdToRegister, onComplete }) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Salva os detalhes do perfil na tabela 'profiles' do Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userIdToRegister,
          name: name,
          area: area,
          role: 'user', // Cargo padrão para novos registros
          status: 'Ativo',
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      onComplete(); // Avisa o App.tsx que o cadastro terminou
    } catch (err: any) {
      console.error("Erro ao finalizar cadastro:", err);
      setError(err.message || "Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003366] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full border border-blue-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <UserPlus className="text-[#003366] w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#003366]">Finalizar Cadastro</h2>
          <p className="text-gray-500 text-sm text-center mt-2">
            Estamos quase lá! Complete suas informações para acessar o TrIA Places.
          </p>
        </div>

        <form onSubmit={handleCompleteRegistration} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Nome Completo</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none transition-all"
              placeholder="Como você quer ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Área / Setor</label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none transition-all bg-white"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Selecione seu setor...</option>
              <option value="Operações">Operações</option>
              <option value="Segurança">Segurança</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Administrativo">Administrativo</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                Concluir e Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest">
            <Layout size={12} />
            <span>Trimais Places v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
