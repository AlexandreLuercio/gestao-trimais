import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase/config';
import { onAuthStateChanged } from '@firebase/auth';
import { doc, getDoc } from '@firebase/firestore';

// Componentes
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Settings from './components/Settings';
import ProfilePage from './components/ProfilePage';
import ErrorPage from './components/ErrorPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import OccurrenceForm from './components/OccurrenceForm';
import MyTasks from './components/MyTasks';
import AdminPanel from './components/AdminPanel';
import TrashPanel from './components/TrashPanel';
import FeedbackModal from './components/FeedbackModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import NotificationToast from './components/NotificationToast';
import WelcomeSummaryModal from './components/WelcomeSummaryModal';
import InstallGuidePage from './components/InstallGuidePage';
import FirstAdminSetup from './components/FirstAdminSetup';


// Tipos
import { User, UserRole } from './types'; // Assumindo que o tipo User está aqui

// Contextos
import { AuthContext } from './contexts/AuthContext';

// --- INÍCIO DAS ALTERAÇÕES ---

// Definir e exportar APP_VERSION e View
export const APP_VERSION = '1.0.0'; // A versão da sua aplicação
export type View =
  'dashboard' |
  'users' |
  'settings' |
  'profile' |
  'error' |
  'mytasks' |
  'admin' |
  'trash' |
  'install-guide' |
  'login' |
  'register' |
  'first-admin-setup' | // Adicionado para cobrir todos os modais/páginas
  'welcome-summary';


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [initialAdminSetupNeeded, setInitialAdminSetupNeeded] = useState(false); // Novo estado
  const [hasFirstLoginOccurred, setHasFirstLoginOccurred] = useState(false); // Novo estado
  const [initialWelcomeSummary, setInitialWelcomeSummary] = useState(false); // Novo estado
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Estados para modais e toasts
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Tipo mais específico depois

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Obter dados adicionais do Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          setCurrentUser({ ...userData, id: user.uid });

          // Verifica se é o primeiro login (status "Provisório")
          if (userData.status === 'Provisório') {
            setForcePasswordChange(true);
            setHasFirstLoginOccurred(true); // Marca que o primeiro login ocorreu para exibir o modal de boas-vindas depois
          } else {
            setForcePasswordChange(false);
            // Se o status não é provisório, verifica se o usuário é "Ativo" e é o primeiro login (para o modal de boas-vindas)
            // A lógica exata para "primeiro login" para o modal de boas-vindas pode precisar ser mais sofisticada (ex: um campo 'lastLogin' no Firestore)
            // Por enquanto, vamos assumir que se o status mudou de provisório para ativo, é um bom gatilho
            if (userData.status === 'Ativo' && hasFirstLoginOccurred) { // Usamos o hasFirstLoginOccurred
              setInitialWelcomeSummary(true);
              setHasFirstLoginOccurred(false); // Resetar para não mostrar novamente
            }
          }

          // Verifica se precisa fazer o setup do primeiro admin
          if (userData.role === 'admin' && !userData.initialSetupDone) {
            setInitialAdminSetupNeeded(true);
          } else {
            setInitialAdminSetupNeeded(false);
          }

        } else {
          // Usuário existe no Auth, mas não no Firestore (novo registro?)
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setForcePasswordChange(false);
        setInitialAdminSetupNeeded(false);
        setInitialWelcomeSummary(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hasFirstLoginOccurred]); // Adicionado hasFirstLoginOccurred como dependência para reavaliar quando ele muda

  if (loading) {
    return <LoadingSpinner />;
  }

  // Lógica para adicionar notificações (exemplo)
  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => clearNotification(id), 5000); // Remove após 5 segundos
  };

  const clearNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };


  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, addNotification }}>
      <Router>
        {forcePasswordChange ? (
          <ChangePasswordModal
            isOpen={true}
            onClose={() => setForcePasswordChange(false)}
            user={currentUser!}
            isForced={true}
          />
        ) : initialAdminSetupNeeded && currentUser?.role === 'admin' && !currentUser?.initialSetupDone ? (
          <FirstAdminSetup
            isOpen={true}
            onClose={() => setInitialAdminSetupNeeded(false)}
            currentUser={currentUser!}
            onSetupComplete={() => {
                setInitialAdminSetupNeeded(false);
                // Opcional: mostrar WelcomeSummaryModal após setup do admin
                setInitialWelcomeSummary(true);
            }}
          />
        ) : initialWelcomeSummary ? (
            <WelcomeSummaryModal
              isOpen={true}
              onClose={() => setInitialWelcomeSummary(false)}
              user={currentUser!}
            />
        ) : (
          <div className="flex h-screen bg-gray-100">
            {currentUser && <Sidebar currentUser={currentUser} />}
            <div className="flex-1 flex flex-col overflow-hidden">
              {currentUser && <Header currentUser={currentUser} />}
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                <Routes>
                  {currentUser ? (
                    <>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/mytasks" element={<MyTasks />} />
                      <Route path="/occurrence/:id?" element={<OccurrenceForm />} />
                      {currentUser.role === 'admin' && (
                        <>
                          <Route path="/users" element={<Users />} />
                          <Route path="/admin" element={<AdminPanel />} />
                          <Route path="/trash" element={<TrashPanel />} />
                          <Route path="/settings" element={<Settings />} />
                        </>
                      )}
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/install-guide" element={<InstallGuidePage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                  )}
                  <Route path="/error" element={<ErrorPage />} />
                </Routes>
              </main>
            </div>
          </div>
        )}
        <NotificationToast
          notifications={notifications}
          onClearNotification={clearNotification}
        />
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          user={currentUser!} // Assumindo que currentUser não será null quando este modal for mostrado manualmente
        />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
