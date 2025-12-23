
import React from 'react';

const FeedbackModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: any }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
        <h3 className="text-xl font-bold text-trimais-blue mb-4">Enviar Feedback</h3>
        <textarea className="w-full border p-3 rounded h-32" placeholder="Sua mensagem..."></textarea>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border py-2 rounded font-bold">Cancelar</button>
          <button className="flex-1 bg-trimais-blue text-white py-2 rounded font-bold">Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
