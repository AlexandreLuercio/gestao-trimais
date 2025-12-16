
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

  const newTasksCount = unreadNotifications.filter(n => n.title.includes('Nova Tarefa') || n.type === 'new').length;
  const recentItems = unreadNotifications.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-trimais-blue/90 z-[1200] flex justify-center items-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-trimais-blue to-blue-900 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-1">Olá, {userName.split(' ')[0]}!</h2>
                <p className="text-blue-100 text-sm">Aqui está o resumo do que aconteceu enquanto você estava fora.</p>
            </div>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tarefas Pendentes</p>
                    <p className="text-3xl font-extrabold text-trimais-blue">{unreadNotifications.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-trimais-blue">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </div>
            </div>

            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">Últimas Atualizações</h3>
            <div className="space-y-3 mb-6">
                {recentItems.map(notif => (
                    <div key={notif.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{notif.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{format(parseISO(notif.timestamp), "HH:mm")}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-trimais-blue text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-900 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
                <span>Ver Minhas Tarefas</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSummaryModal;
