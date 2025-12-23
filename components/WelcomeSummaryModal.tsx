import React from 'react';
import { AppNotification, User } from '../types';
import { format, parseISO } from 'date-fns';

interface WelcomeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreadNotifications: AppNotification[];
  userName: string;
}

const WelcomeSummaryModal: React.FC<WelcomeSummaryModalProps> = ({ isOpen, onClose, unreadNotifications, userName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-trimais-blue/90 z-[1200] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-trimais-blue">Olá, {userName}!</h2>
        <p className="mt-2 text-gray-600">Você tem {unreadNotifications.length} novas notificações desde seu último acesso.</p>
        <button onClick={onClose} className="w-full bg-trimais-blue text-white py-3 rounded mt-6 font-bold hover:bg-blue-900 transition-colors">
          Acessar Painel
        </button>
      </div>
    </div>
  );
};

export default WelcomeSummaryModal;