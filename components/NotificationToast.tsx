import React, { useEffect } from 'react';
import { AppNotification } from '../tipos';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onView: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onView }) => {
  useEffect(() => { if (notification) { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); } }, [notification, onClose]);
  if (!notification) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-md bg-white border-l-4 border-trimais-gold p-4 shadow-2xl rounded cursor-pointer" onClick={onView}>
        <h4 className="font-bold text-sm">{notification.title}</h4>
        <p className="text-sm text-gray-600">{notification.message}</p>
    </div>
  );
};

export default NotificationToast;