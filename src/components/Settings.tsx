import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal'; // Reutiliza o ChangePasswordModal

const Settings: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  if (!currentUser) {
    return <div className="text-red-500 text-center mt-8">Nenhum usuário logado.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Configurações da Conta</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <p className="mt-1 text-lg text-gray-900">{currentUser.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Papel:</label>
          <p className="mt-1 text-lg text-gray-900">{currentUser.role}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status:</label>
          <p className="mt-1 text-lg text-gray-900">{currentUser.status}</p>
        </div>
        {/* Adicione outros campos do usuário conforme necessário */}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Segurança</h3>
        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="px-4 py-2 bg-trimais-blue text-white rounded-md hover:bg-trimais-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trimais-blue"
        >
          Alterar Senha
        </button>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        user={currentUser}
        isForced={false}
      />
    </div>
  );
};

export default Settings;
