
import React from 'react';
import { Occurrence } from '../types';

interface ShareModalProps {
  occurrence: Occurrence;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ occurrence, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h3 className="text-xl font-bold text-trimais-blue">Tarefa Criada!</h3>
        <p className="text-sm text-gray-500 mt-2">ID: {occurrence.uniqueId || occurrence.id}</p>
        <button onClick={onClose} className="w-full bg-trimais-blue text-white py-3 rounded-lg font-bold mt-6 hover:bg-blue-900">Entendido</button>
      </div>
    </div>
  );
};

export default ShareModal;
