
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
        alert('Por favor, escreva sua mensagem.');
        return;
    }
    setIsSubmitting(true);
    await onSubmit(type, content);
    setIsSubmitting(false);
    setContent('');
    setType('sugestao');
    onClose();
  };

  const typeConfig = {
      bug: { label: 'Relatar Erro', icon: '🐞', color: 'bg-red-100 text-red-800 border-red-200', selected: 'ring-2 ring-red-500' },
      sugestao: { label: 'Sugestão', icon: '💡', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', selected: 'ring-2 ring-yellow-500' },
      elogio: { label: 'Elogio', icon: '👏', color: 'bg-green-100 text-green-800 border-green-200', selected: 'ring-2 ring-green-500' }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-trimais-blue p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-trimais-gold" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Central de Feedback
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Sua opinião é vital para a evolução do sistema. O que você gostaria de compartilhar?</p>
            
            <div className="grid grid-cols-3 gap-2">
                {(Object.keys(typeConfig) as FeedbackType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${typeConfig[t].color} ${type === t ? typeConfig[t].selected : 'opacity-60 hover:opacity-100'}`}
                    >
                        <span className="text-xl">{typeConfig[t].icon}</span>
                        {typeConfig[t].label}
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'bug' ? 'Descreva o erro encontrado:' : type === 'sugestao' ? 'Qual sua ideia de melhoria?' : 'O que você mais gostou?'}
                </label>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trimais-blue focus:border-transparent resize-none text-sm"
                    placeholder="Digite aqui..."
                    required
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-trimais-blue text-white py-2 rounded-lg font-bold shadow-md hover:bg-blue-900 transition-colors disabled:bg-gray-400"
            >
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
