import React, { useState } from 'react';
import { FeedbackType } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: FeedbackType, content: string) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<FeedbackType>('sugestao');
  const [content, setContent] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(type, content);
    onClose();
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-trimais-blue">Enviar Feedback</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value as FeedbackType)}
              className="w-full border p-2 rounded-lg bg-gray-50 outline-none focus:ring-2 ring-trimais-gold"
            >
              <option value="sugestao">💡 Sugestão</option>
              <option value="bug">🐞 Relatar Erro</option>
              <option value="elogio">⭐ Elogio</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mensagem</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="w-full border p-3 rounded-lg bg-gray-50 h-32 outline-none focus:ring-2 ring-trimais-gold resize-none" 
              placeholder="Descreva seu feedback aqui..." 
              required 
            />
          </div>
        </div>
        
        <button type="submit" className="w-full bg-trimais-blue text-white py-3 rounded-lg font-bold mt-6 hover:bg-blue-900 transition-colors">
          Enviar para Administração
        </button>
      </form>
    </div>
  );
};

export default FeedbackModal;