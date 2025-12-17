import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AppNotification } from '../types'; // Importa o tipo User e AppNotification
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // <-- Corrigido aqui
import { doc, getDoc } from '@firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Lógica para adicionar notificações
  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => clearNotification(id), 5000); // Remove após 5 segundos
  };

  const clearNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser({
            id: firebaseUser.uid,
            ...userDocSnap.data() as Omit<User, 'id'>,
          });
        } else {
          // Usuário existe no Firebase Auth, mas não no Firestore
          // Isso pode indicar um novo registro que ainda não criou seu perfil no Firestore
          setCurrentUser(null); // Ou um objeto User básico
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, addNotification }}>
      {children}
      {/* Aqui você poderia renderizar um componente de Notificações, se ele não for global no App.tsx */}
    </AuthContext.Provider>
  );
};
