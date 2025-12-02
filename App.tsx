
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Occurrence, User, Status, Area, Role, FeedbackType, SystemFeedback, AppNotification, UserStatus, OccurrenceUpdate } from './types';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, getDocs, query, limit, runTransaction, updateDoc, addDoc, deleteDoc, deleteField, orderBy, where, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';

import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import ShareModal from './components/ShareModal';
import Dashboard from './components/Dashboard';
import MyTasks from './components/MyTasks';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import TeamPanel from './components/TeamPanel';
import FirstAdminSetup from './components/FirstAdminSetup';
import TrashPanel from './components/TrashPanel';
import ConfirmModal from './components/ConfirmModal';
import FeedbackModal from './components/FeedbackModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import NotificationToast from './components/NotificationToast';
import WelcomeSummaryModal from './components/WelcomeSummaryModal';
import InstallGuidePage from './components/InstallGuidePage';
import { APP_VERSION } from './types';

export type View = 'form' | 'dashboard' | 'myTasks' | 'admin' | 'team' | 'trash';

const getAreaAbbreviation = (area: Area | string): string => {
    if (area === 'Operações' || area === 'Operacoes') return 'OPE';

    const abbreviations: Record<string, string> = {
      [Area.Manutencao]: 'MAN',
      [Area.Limpeza]: 'LIM',
      [Area.Seguranca]: 'SEG',
      [Area.Marketing]: 'MKT',
      [Area.Financeiro]: 'FIN',
      [Area.Estacionamento]: 'EST',
      [Area.Comercial]: 'COM',
      [Area.Administrativo]: 'ADM',
      [Area.Superintendencia]: 'SUP',
      [Area.Diretoria]: 'DIR',
    };
    return abbreviations[area as string] || 'GER';
};

const App: React.FC = () => {
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // --- DATA STATE ---
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<SystemFeedback[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // --- NOTIFICATION UX STATE ---
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOccurrence, setNewOccurrence] = useState<Occurrence | null>(null);
  
  // --- ADMIN/FEEDBACK MODALS ---
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  // --- SIMULATION ---
  const [realRole, setRealRole] = useState<Role | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // --- INSTALL GUIDE ---
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // --- URL PARAMS ---
  const [registerId, setRegisterId] = useState<string | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const regId = params.get('register');
      if (regId) setRegisterId(regId);
      
      // Check if installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isStandalone && !localStorage.getItem('installGuideSeen')) {
          setShowInstallGuide(true);
      }
  }, []);

  // AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch User Profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = { id: docSnap.id, ...docSnap.data() } as User;
                setCurrentUserProfile(userData);
                setRealRole(userData.role); // Default to real role
            } else {
                setCurrentUserProfile(null);
            }
            setAuthLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setAuthLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setCurrentUserProfile(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // DATA LISTENERS
  useEffect(() => {
      if (!user) {
          setOccurrences([]);
          setUsers([]);
          setFeedbacks([]);
          setNotifications([]);
          return;
      }

      const qOccurrences = query(collection(db, 'occurrences'), orderBy('timestamp', 'desc'));
      const unsubOccurrences = onSnapshot(qOccurrences, (snapshot) => {
          const occs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Occurrence));
          setOccurrences(occs);
      });

      const qUsers = query(collection(db, 'users'));
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      });

      const qFeedbacks = query(collection(db, 'system_feedback'), orderBy('timestamp', 'desc'));
      const unsubFeedbacks = onSnapshot(qFeedbacks, (snapshot) => {
          setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemFeedback)));
      });

      // FIX: Removed orderBy from query to avoid "Missing Index" error.
      // Sorting is now done client-side.
      const qNotifications = query(collection(db, 'notifications'), where('recipientId', '==', user.uid));
      const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
          let notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
          
          // Client-side Sort (Newest first)
          notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          // Client-side Limit (Keep top 50)
          if (notifs.length > 50) {
              notifs = notifs.slice(0, 50);
          }

          setNotifications(notifs);
          
          // Toast for newest
          const newest = notifs[0];
          if (newest && !newest.read && Date.now() - new Date(newest.timestamp).getTime() < 10000) {
              setActiveToast(newest);
          }
      });

      return () => {
          unsubOccurrences();
          unsubUsers();
          unsubFeedbacks();
          unsubNotifications();
      };
  }, [user]);

  // Welcome Modal Logic
  useEffect(() => {
      if (currentUserProfile && !authLoading && notifications.length > 0) {
          const unread = notifications.filter(n => !n.read);
          if (unread.length > 0 && !sessionStorage.getItem('welcomeShown')) {
              setShowWelcomeModal(true);
              sessionStorage.setItem('welcomeShown', 'true');
          }
      }
  }, [currentUserProfile, authLoading, notifications]);

  // --- ACTIONS ---

  const handleAddOccurrence = async (data: Omit<Occurrence, 'id' | 'timestamp' | 'status' | 'uniqueId' | 'createdBy' | 'creatorName' | 'updatesLog'>) => {
      if (!currentUserProfile) return;
      
      try {
          // Generate ID Logic (Simplified Transaction)
          let uniqueId = '';
          const year = new Date().getFullYear().toString().substr(-2);
          const areaAbbr = getAreaAbbreviation(data.area);

          await runTransaction(db, async (transaction) => {
              const counterRef = doc(db, 'counters', 'occurrences');
              const counterDoc = await transaction.get(counterRef);
              
              let currentCount = 1;
              if (counterDoc.exists()) {
                  currentCount = counterDoc.data().count + 1;
              }
              
              transaction.set(counterRef, { count: currentCount });
              uniqueId = `${String(currentCount).padStart(3, '0')}-${year}-${areaAbbr}`;
          });

          const newOcc: any = {
              ...data,
              uniqueId,
              timestamp: new Date().toISOString(),
              status: Status.Aberto,
              createdBy: currentUserProfile.uid,
              creatorName: currentUserProfile.name,
              updatesLog: [{
                  text: `Tarefa criada por ${currentUserProfile.name}`,
                  timestamp: new Date().toISOString(),
                  authorName: currentUserProfile.name
              }]
          };

          const docRef = await addDoc(collection(db, 'occurrences'), newOcc);
          
          setNewOccurrence({ id: docRef.id, ...newOcc });
          setIsShareModalOpen(true);
          setActiveView('myTasks'); // Redirect to list
      } catch (error) {
          console.error("Error adding occurrence", error);
          alert("Erro ao criar tarefa.");
      }
  };

  const handleUpdateOccurrence = async (id: string, updates: Partial<Occurrence>) => {
      try {
          await updateDoc(doc(db, 'occurrences', id), updates);
      } catch (error) {
          console.error("Error updating", error);
      }
  };

  const handleMoveToTrash = async (id: string) => {
      await updateDoc(doc(db, 'occurrences', id), { deletedAt: new Date().toISOString() });
  };
  
  const handleRestore = async (id: string) => {
      await updateDoc(doc(db, 'occurrences', id), { deletedAt: deleteField() });
  };

  const handleDeleteForever = async (id: string) => {
      await deleteDoc(doc(db, 'occurrences', id));
  };

  const handleInviteUser = async (inviteData: any) => {
     try {
         // Check for existing user first (by email) to avoid duplicates or ghost accounts
         const q = query(collection(db, 'users'), where('email', '==', inviteData.email));
         const snapshot = await getDocs(q);
         
         if (!snapshot.empty) {
             const existing = snapshot.docs[0];
             const userData = existing.data();
             
             // If existing user is 'Excluido', we can overwrite/reactivate
             if (userData.status === 'Excluido') {
                 await deleteDoc(doc(db, 'users', existing.id)); // Hard delete old to clean up
             } else {
                 // Active user exists
                 alert("Este email já está cadastrado no sistema.");
                 return null;
             }
         }

         const docRef = await addDoc(collection(db, 'users'), {
             ...inviteData,
             status: 'Pendente',
             createdAt: new Date().toISOString()
         });
         return docRef.id;
     } catch (e) {
         console.error(e);
         return null;
     }
  };

  const handleUpdateUser = async (id: string, data: any) => {
      await updateDoc(doc(db, 'users', id), data);
  };
  
  const handleDeleteUser = async (id: string) => {
      // HARD DELETE to allow re-invitation without errors
      // Also cleanup notifications for this user
      
      try {
          // 1. Delete Notifications
          const qNotif = query(collection(db, 'notifications'), where('recipientId', '==', id));
          const snapshot = await getDocs(qNotif);
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
          });
          
          // 2. Delete User Doc
          const userRef = doc(db, 'users', id);
          batch.delete(userRef);
          
          await batch.commit();
          
      } catch (e) {
          console.error("Error deleting user:", e);
          alert("Erro ao excluir usuário.");
      }
  };
  
  const handleToggleBlock = async (user: User) => {
      const newStatus = user.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado';
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
  };

  const handleSubmitFeedback = async (type: FeedbackType, content: string) => {
      if (!currentUserProfile) return;
      await addDoc(collection(db, 'system_feedback'), {
          userId: currentUserProfile.uid,
          userName: currentUserProfile.name,
          userRole: currentUserProfile.role,
          userAreas: currentUserProfile.allowedAreas || [],
          type,
          content,
          timestamp: new Date().toISOString(),
          isRead: false
      });
      alert("Obrigado pelo seu feedback!");
  };

  const handleMarkNotificationRead = async () => {
      try {
          const batch = writeBatch(db);
          notifications.filter(n => !n.read).forEach(n => {
              const ref = doc(db, 'notifications', n.id);
              batch.update(ref, { read: true });
          });
          await batch.commit();
      } catch (e) {
          console.error("Error marking notifications read", e);
      }
  };

  const handleSimulateRole = (role: Role | null) => {
      if (!realRole || !currentUserProfile) return;
      if (role === null) {
          setIsSimulating(false);
          // Restore
          const realUser = users.find(u => u.uid === currentUserProfile.uid);
          if (realUser) setCurrentUserProfile(realUser);
      } else {
          setIsSimulating(true);
          setCurrentUserProfile({ ...currentUserProfile, role });
      }
  };

  const handleResetCounters = async () => {
      await setDoc(doc(db, 'counters', 'occurrences'), { count: 0 });
      alert("Contadores zerados.");
  };

  // --- RENDERING ---

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-trimais-blue"></div>
          </div>
      );
  }

  // INSTALL GUIDE
  if (showInstallGuide) {
      return <InstallGuidePage onContinue={() => { setShowInstallGuide(false); localStorage.setItem('installGuideSeen', 'true'); }} />;
  }

  // REGISTRATION
  if (registerId && !user) {
      return <RegistrationPage userIdToRegister={registerId} />;
  }

  // FIRST SETUP
  if (!user && users.length === 0 && !authLoading) {
      return <FirstAdminSetup onSetupComplete={() => window.location.reload()} />;
  }

  // LOGIN
  if (!user || !currentUserProfile) {
      // If user is authenticated but no profile found in Firestore (and not registering), logout or show access denied.
      if (user) {
           return (
               <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                   <h2 className="text-xl font-bold text-red-600 mb-2">Acesso Negado ou Perfil Não Encontrado</h2>
                   <p className="text-gray-600 mb-4">Seu usuário não possui um perfil ativo no sistema.</p>
                   <p className="text-xs text-gray-500 mb-6">UID: {user.uid}</p>
                   <button onClick={() => auth.signOut()} className="bg-trimais-blue text-white px-4 py-2 rounded">Voltar para Login</button>
               </div>
           );
      }
      return <LoginPage />;
  }

  // MAIN APP
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-10">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={currentUserProfile}
        realRole={realRole || undefined}
        onSimulateRole={handleSimulateRole}
        isSimulating={isSimulating}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationRead}
        onChangePassword={() => setIsChangePasswordModalOpen(true)}
      />

      <main className="container mx-auto px-4 md:px-6 py-6">
        {activeView === 'dashboard' && (
            <Dashboard 
                occurrences={occurrences.filter(o => !o.deletedAt)} 
                users={users} 
                currentUser={currentUserProfile}
                onMoveToTrash={handleMoveToTrash}
            />
        )}
        
        {activeView === 'myTasks' && (
            <MyTasks 
                occurrences={occurrences.filter(o => !o.deletedAt)} 
                currentUser={currentUserProfile}
                users={users}
                updateOccurrence={handleUpdateOccurrence}
                onMoveToTrash={handleMoveToTrash}
            />
        )}

        {activeView === 'form' && (
            <OccurrenceForm onAddOccurrence={handleAddOccurrence} />
        )}

        {activeView === 'admin' && currentUserProfile.role === Role.Admin && (
            <AdminPanel 
                users={users} 
                currentUser={currentUserProfile} 
                onInviteUser={handleInviteUser}
                onUpdateUser={handleUpdateUser}
                onRequestDeleteUser={handleDeleteUser}
                onToggleUserBlock={handleToggleBlock}
                feedbacks={feedbacks}
                onToggleFeedbackRead={async (id, current) => updateDoc(doc(db, 'system_feedback', id), { isRead: !current })}
                onReplyFeedback={async (id, text) => {
                    const fb = feedbacks.find(f => f.id === id);
                    if (fb) {
                        const comments = fb.comments || [];
                        comments.push({ author: currentUserProfile.name, text, timestamp: new Date().toISOString(), isAdmin: true });
                        await updateDoc(doc(db, 'system_feedback', id), { comments });
                    }
                }}
                onDeleteFeedback={async (id) => deleteDoc(doc(db, 'system_feedback', id))}
                onResetCounters={handleResetCounters}
            />
        )}
        
        {/* Team Panel for Gestor/Admin */}
        {activeView === 'team' && (currentUserProfile.role === Role.Admin || currentUserProfile.role === Role.Gestor) && (
            <TeamPanel 
                users={users}
                currentUser={currentUserProfile}
                onInviteUser={handleInviteUser}
            />
        )}

        {activeView === 'trash' && (
             <TrashPanel 
                occurrences={occurrences.filter(o => o.deletedAt)}
                onRestore={handleRestore}
                onDeleteForever={handleDeleteForever}
             />
        )}
      </main>

      {/* MODALS */}
      {newOccurrence && isShareModalOpen && (
          <ShareModal occurrence={newOccurrence} onClose={() => setIsShareModalOpen(false)} />
      )}

      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        onSubmit={handleSubmitFeedback} 
      />

      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)}
        user={currentUserProfile}
        isForced={currentUserProfile.status === 'Pendente' || currentUserProfile.status === 'Provisorio'}
      />

      <NotificationToast 
        notification={activeToast} 
        onClose={() => setActiveToast(null)} 
        onView={() => { setActiveToast(null); /* Could open notif panel */ }} 
      />

      <WelcomeSummaryModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        unreadNotifications={notifications.filter(n => !n.read)}
        userName={currentUserProfile.name}
      />
    </div>
  );
};

export default App;
