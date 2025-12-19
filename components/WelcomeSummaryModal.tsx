import React from 'react';
import { AppNotification, User } from '../tipos';
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
    <div className="fixed inset-0 bg-trimais-blue/90 z-[1200] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg"><h2>Olá, {userName}!</h2><p className="mt-2">Você tem {unreadNotifications.length} novas notificações.</p><button onClick={onClose} className="w-full bg-trimais-blue text-white py-3 rounded mt-6">Entrar</button></div></div>
  );
};

export default WelcomeSummaryModal;