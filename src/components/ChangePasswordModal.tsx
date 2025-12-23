
import React from 'react';

const ChangePasswordModal: React.FC<{ isOpen: boolean; onClose: () => void; user: any; isForced?: boolean }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
        <h3 className="text-xl font-bold text-trimais-blue mb-4">Alterar Senha</h3>
        <input type="password" placeholder="Nova Senha" className="w-full border p-3 rounded mb-2" />
        <input type="password" placeholder="Confirmar" className="w-full border p-3 rounded" />
        <button onClick={onClose} className="w-full bg-trimais-blue text-white py-3 rounded mt-4 font-bold">Salvar</button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
