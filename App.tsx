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
  
  // 1. INICIALIZAÇÃO SEGURA: Sempre arrays vazios
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
        // Limpeza no logout
        setUser(null);
        setCurrentUserProfile(null);
        setRealRole(null);
        setOccurrences([]);
        setUsers([]);
        setFeedbacks([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // 2. BLOQUEIO DE BUSCA PRÉ-LOGIN
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
  
  // TELA DE CARREGAMENTO INICIAL
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-trimais-blue text-white font-bold">
      Iniciando Trimais Places...
    </div>
  );

  // SETUP INICIAL SE NÃO HOUVER ADMIN
  if (needsSetup) return <FirstAdminSetup onSetupComplete={() => setNeedsSetup(false)} />;

  // 3. TELA INICIAL: SE NÃO LOGADO, MOSTRA APENAS LOGIN
  if (!user || !currentUserProfile) return <LoginPage />;

  // 4. SEGURANÇA DE ARRAY: Blindagem antes da renderização
  const safeOccs = (occurrences || []);
  const activeOccurrences = safeOccs.filter(occ => !occ.deletedAt);
  const deletedOccurrences = safeOccs.filter(occ => !!occ.deletedAt);
  const safeUsers = (users || []);

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
        {activeView === 'dashboard' && <Dashboard occurrences={activeOccurrences} users={safeUsers} currentUser={currentUserProfile} onMoveToTrash={handleMoveToTrash} />}
        {activeView === 'form' && <OccurrenceForm onAddOccurrence={async (d) => { /* logic */ }} />}
        {activeView === 'myTasks' && <MyTasks occurrences={activeOccurrences} currentUser={currentUserProfile} users={safeUsers} updateOccurrence={updateOccurrence} onMoveToTrash={handleMoveToTrash} />}
        {activeView === 'admin' && <AdminPanel users={safeUsers} currentUser={currentUserProfile} feedbacks={feedbacks || []} onInviteUser={async (d) => { /* logic */ }} />}
        {activeView === 'trash' && <TrashPanel occurrences={deletedOccurrences} onRestore={handleRestore} onDeleteForever={handleDeleteForever} />}
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