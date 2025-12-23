// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Occurrence, User, Status, Area, Role, SystemFeedback, AppNotification } from './types';
import { auth, db } from './config';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  getDoc, 
  getDocs 
} from 'firebase/firestore';

import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import ShareModal from './components/ShareModal';
import Dashboard from './components/Dashboard';
import MyTasks from './components/MyTasks';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import TrashPanel from './components/TrashPanel';
import FeedbackModal from './components/FeedbackModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import FirstAdminSetup from './components/FirstAdminSetup';

export type View = 'form' | 'dashboard' | 'myTasks' | 'admin' | 'team' | 'trash';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Inicialização SEGURA com arrays vazios
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<SystemFeedback[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOccurrence, setNewOccurrence] = useState<Occurrence | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [realRole, setRealRole] = useState<Role | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const profile = userDoc.data() as User;
            setCurrentUserProfile(profile);
            setRealRole(profile.role);
            if (profile.status === 'Provisorio') setIsChangePasswordModalOpen(true);
          } else {
            const usersSnap = await getDocs(collection(db, 'users'));
            if (usersSnap.empty) setNeedsSetup(true);
          }
          setUser(firebaseUser);
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
        }
      } else {
        setUser(null);
        setCurrentUserProfile(null);
        setRealRole(null);
        setOccurrences([]);
        setUsers([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // BLOQUEIO DE BUSCA PRÉ-LOGIN
    if (!auth.currentUser || !currentUserProfile) return;

    const qOccurrences = query(collection(db, 'occurrences'), orderBy('timestamp', 'desc'));
    const unsubscribeOccurrences = onSnapshot(qOccurrences, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Occurrence)) || [];
      setOccurrences(data);
    }, (err) => {
      console.error("Erro stream tarefas:", err);
      setOccurrences([]);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)) || [];
      setUsers(data);
    }, (err) => setUsers([]));

    return () => { 
      unsubscribeOccurrences(); 
      unsubscribeUsers(); 
    };
  }, [user, currentUserProfile]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-trimais-blue text-white font-bold">
      Iniciando Trimais Places...
    </div>
  );

  if (needsSetup) return <FirstAdminSetup onSetupComplete={() => setNeedsSetup(false)} />;

  // AUTH GUARD OBRIGATÓRIO: Não renderiza nada sem login
  if (!user || !currentUserProfile) return <LoginPage />;

  const safeOccs = occurrences || [];
  const activeOccurrences = safeOccs.filter(occ => !occ.deletedAt);
  const deletedOccurrences = safeOccs.filter(occ => !!occ.deletedAt);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header 
        activeView={activeView} setActiveView={setActiveView} 
        currentUser={currentUserProfile} notifications={notifications}
        realRole={realRole || currentUserProfile.role} 
        onSimulateRole={(role) => {
            if (role === null) { setCurrentUserProfile({...currentUserProfile, role: realRole}); setIsSimulating(false); }
            else { setCurrentUserProfile({...currentUserProfile, role}); setIsSimulating(true); }
        }}
        isSimulating={isSimulating} onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onChangePassword={() => setIsChangePasswordModalOpen(true)}
        onMarkNotificationsRead={() => {}}
      />
      <main className="container mx-auto px-4 py-8">
        {activeView === 'dashboard' && <Dashboard occurrences={activeOccurrences} users={users} currentUser={currentUserProfile} />}
        {activeView === 'form' && <OccurrenceForm onAddOccurrence={async (d) => { /* logic handled in component */ }} />}
        {activeView === 'myTasks' && <MyTasks occurrences={activeOccurrences} currentUser={currentUserProfile} users={users} updateOccurrence={(id, u) => updateDoc(doc(db, 'occurrences', id), u)} />}
        {activeView === 'admin' && <AdminPanel users={users} currentUser={currentUserProfile} onInviteUser={async (d) => {}} />}
        {activeView === 'trash' && <TrashPanel occurrences={deletedOccurrences} onRestore={(id) => updateDoc(doc(db, 'occurrences', id), {deletedAt: null})} onDeleteForever={(id) => deleteDoc(doc(db, 'occurrences', id))} />}
      </main>
      {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={async (t, c) => {}} />}
      {isChangePasswordModalOpen && <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} user={currentUserProfile} isForced={currentUserProfile.status === 'Provisorio'} />}
    </div>
  );
};

export default App;