
import React from 'react';
import { Occurrence } from '../types';

interface ShareModalProps {
  occurrence: Occurrence;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ occurrence, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg relative animate-fade-in-up">
        
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-trimais-blue mt-4 mb-2">Tarefa Criada com Sucesso!</h3>
            <p className="text-sm text-gray-500 mb-6">A tarefa foi registrada e está disponível para gestão.</p>
        </div>

        <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <p><strong>ID:</strong> <span className="text-trimais-blue font-mono font-bold">{occurrence.uniqueId || 'N/A'}</span></p>
            <p><strong>Título:</strong> {occurrence.title}</p>
            <p><strong>Localização:</strong> {occurrence.location}</p>
            <p><strong>Área:</strong> {occurrence.area}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full flex justify-center items-center gap-2 bg-trimais-blue hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          Voltar para Minhas Tarefas
        </button>

      </div>
    </div>
  );
};

export default ShareModal;
