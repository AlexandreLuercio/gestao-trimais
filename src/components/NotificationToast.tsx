
import React, { useEffect } from 'react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onView: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onView }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000); // Disappear after 6 seconds
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1100] w-[90%] max-w-md animate-slide-down cursor-pointer" onClick={onView}>
      <div className="bg-white/95 backdrop-blur-md border-l-4 border-trimais-gold rounded-lg shadow-2xl p-4 flex items-start gap-4 ring-1 ring-black/5">
        <div className="flex-shrink-0">
            <div className={`p-2 rounded-full ${notification.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-trimais-blue'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-600 mt-1 leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Toque para ver detalhes</p>
        </div>
        <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="text-gray-400 hover:text-gray-600 p-1"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
