
import React from 'react';

const FirstAdminSetup: React.FC<{ onSetupComplete: () => void }> = () => {
  return (
    <div className="min-h-screen bg-trimais-blue flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-trimais-blue">Bem-vindo ao TrIA</h2>
        <p className="text-gray-500 mt-2 mb-6">Iniciando a configuração do primeiro administrador...</p>
        <button className="w-full bg-trimais-blue text-white py-3 rounded font-bold">Iniciar Configuração</button>
      </div>
    </div>
  );
};

export default FirstAdminSetup;
