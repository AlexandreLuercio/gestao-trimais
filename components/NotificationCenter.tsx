import React, { useState } from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1 relative flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full animate-pulse">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border shadow-xl rounded z-50 p-2 max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <span className="font-bold text-xs text-trimais-blue">Notificações</span>
            <button onClick={onMarkAsRead} className="text-[10px] text-blue-600 underline">Limpar</button>
          </div>
          {safeNotifications.length ? (
            safeNotifications.map(n => (
              <div key={n.id} className={`p-2 border-b text-xs ${!n.read ? 'bg-blue-50' : ''}`}>
                <p className="font-bold">{n.title}</p>
                <p className="text-gray-600">{n.message}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sem notificações</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;