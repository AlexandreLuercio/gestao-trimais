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
  runTransaction, 
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
  
  // Inicialização Segura Obrigatória
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
    // BLOQUEIO TOTAL PRÉ-LOGIN: Só busca se houver usuário e perfil carregados
    if (!auth.currentUser || !currentUserProfile) return;

    const qOccurrences = query(collection(db, 'occurrences'), orderBy('timestamp', 'desc'));
    const unsubscribeOccurrences = onSnapshot(qOccurrences, (snapshot) => {
      setOccurrences(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Occurrence)) || []);
    }, (err) => {
      console.error("Erro tarefas:", err);
      setOccurrences([]);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)) || []);
    }, (err) => setUsers([]));

    let unsubscribeFeedbacks = () => {};
    if (currentUserProfile.role === Role.Admin) {
      unsubscribeFeedbacks = onSnapshot(collection(db, 'feedbacks'), (snapshot) => {
        setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemFeedback)) || []);
      }, (err) => setFeedbacks([]));
    }

    return () => { 
      unsubscribeOccurrences(); 
      unsubscribeUsers(); 
      unsubscribeFeedbacks(); 
    };
  }, [user, currentUserProfile]);

  const handleSimulateRole = (role: Role | null) => {
    if (!currentUserProfile) return;
    if (role === null) {
      setCurrentUserProfile({ ...currentUserProfile, role: realRole! });
      setIsSimulating(false);
    } else {
      setCurrentUserProfile({ ...currentUserProfile, role });
      setIsSimulating(true);
    }
  };

  const updateOccurrence = (id, updates) => updateDoc(doc(db, 'occurrences', id), updates);
  const handleMoveToTrash = (id) => updateDoc(doc(db, 'occurrences', id), { deletedAt: new Date().toISOString() });
  const handleRestore = (id) => updateDoc(doc(db, 'occurrences', id), { deletedAt: null });
  const handleDeleteForever = (id) => deleteDoc(doc(db, 'occurrences', id));
  
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-trimais-blue text-white font-bold">Iniciando Trimais Places...</div>;
  if (needsSetup) return <FirstAdminSetup onSetupComplete={() => setNeedsSetup(false)} />;
  if (!user || !currentUserProfile) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header 
        activeView={activeView} setActiveView={setActiveView} 
        currentUser={currentUserProfile} notifications={notifications || []}
        realRole={realRole || currentUserProfile.role} 
        onSimulateRole={handleSimulateRole}
        isSimulating={isSimulating} onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onChangePassword={() => setIsChangePasswordModalOpen(true)}
        onMarkNotificationsRead={() => {}}
      />
      <main className="container mx-auto px-4 py-8">
        {activeView === 'dashboard' && <Dashboard occurrences={(occurrences || []).filter(occ => !occ.deletedAt)} users={users || []} currentUser={currentUserProfile} onMoveToTrash={handleMoveToTrash} />}
        {activeView === 'form' && <OccurrenceForm onAddOccurrence={async (d) => { /* logic inside form or passed as prop */ }} />}
        {activeView === 'myTasks' && <MyTasks occurrences={(occurrences || []).filter(occ => !occ.deletedAt)} currentUser={currentUserProfile} users={users || []} updateOccurrence={updateOccurrence} onMoveToTrash={handleMoveToTrash} />}
        {activeView === 'admin' && <AdminPanel users={users || []} currentUser={currentUserProfile} feedbacks={feedbacks || []} />}
        {activeView === 'trash' && <TrashPanel occurrences={(occurrences || []).filter(occ => !!occ.deletedAt)} onRestore={handleRestore} onDeleteForever={handleDeleteForever} />}
      </main>
      {isShareModalOpen && newOccurrence && <ShareModal occurrence={newOccurrence} onClose={() => setIsShareModalOpen(false)} />}
      {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={async (t, c) => {
          await addDoc(collection(db, 'feedbacks'), { userId: user.uid, userName: currentUserProfile.name, userRole: currentUserProfile.role, type: t, content: c, timestamp: new Date().toISOString(), isRead: false });
      }} />}
      {isChangePasswordModalOpen && <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} user={currentUserProfile} isForced={currentUserProfile.status === 'Provisorio'} />}
    </div>
  );
};

export default App;