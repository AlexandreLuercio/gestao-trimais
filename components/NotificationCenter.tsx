import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../tipos';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1 relative">🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">{unreadCount}</span>}</button>
      {isOpen && <div className="absolute right-0 mt-2 w-64 bg-white border shadow-xl rounded z-50 p-2 max-h-48 overflow-y-auto"> {notifications.length ? notifications.map(n => <div key={n.id} className="p-2 border-b text-xs">{n.title}</div>) : <p className="text-xs text-gray-400">Sem notificações</p>} </div>}
    </div>
  );
};

export default NotificationCenter;