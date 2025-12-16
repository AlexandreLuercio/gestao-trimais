
import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) {
        onMarkAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="text-white hover:text-trimais-gold transition-colors p-1 relative"
        title="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${unreadCount > 0 ? 'animate-swing' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* HYPER-ACTIVE BADGE */}
        {unreadCount > 0 && (
          <>
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-600 z-10 text-white text-[10px] font-bold flex items-center justify-center border-2 border-trimais-blue">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 animate-ping opacity-75"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50 border border-gray-200 animate-fade-in">
          <div className="bg-trimais-blue px-4 py-2 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Notificações</h3>
            <span className="text-xs text-white/70">{notifications.length} recentes</span>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Nenhuma notificação recente.</p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id} className={`p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.type === 'alert' ? 'bg-red-500' : notification.type === 'new' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                          {format(parseISO(notification.timestamp), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
