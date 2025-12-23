
import React from 'react';

const RegistrationPage: React.FC<{ userIdToRegister: string }> = () => {
  return (
    <div className="min-h-screen bg-trimais-blue flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-trimais-blue">Finalizar Cadastro</h2>
        <p className="text-gray-500 mt-2">Configurando seu acesso ao Trimais Places...</p>
      </div>
    </div>
  );
};

export default RegistrationPage;
