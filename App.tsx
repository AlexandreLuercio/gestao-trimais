
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
              let nextId = 1;
              if (counterDoc.exists()) {
                  nextId = counterDoc.data().count + 1;
              }
              transaction.set(counterRef, { count: nextId });
              uniqueId = `${String(nextId).padStart(3, '0')}-${year}-${areaAbbr}`;
          });

          const newOccurrenceData = {
              ...data,
              timestamp: new Date().toISOString(),
              status: Status.Aberto,
              createdBy: currentUserProfile.uid,
              creatorName: currentUserProfile.name,
              uniqueId: uniqueId,
              updatesLog: []
          };
          
          const docRef = await addDoc(collection(db, 'occurrences'), newOccurrenceData);
          const addedOccurrence = { id: docRef.id, ...newOccurrenceData } as Occurrence;
          
          setNewOccurrence(addedOccurrence);
          setIsShareModalOpen(true);

          // Notify managers
          const managers = users.filter(u => 
              (u.role === Role.Gestor && u.allowedAreas?.includes(data.area)) || 
              u.role === Role.Admin ||
              u.role === Role.Diretor
          );

          const batch = writeBatch(db);
          managers.forEach(manager => {
              if (manager.uid === currentUserProfile.uid) return;
              const notifRef = doc(collection(db, 'notifications'));
              batch.set(notifRef, {
                  recipientId: manager.uid,
                  title: 'Nova Tarefa Registrada',
                  message: `${currentUserProfile.name} registrou uma nova tarefa para ${data.area}: ${data.title}`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: 'new',
                  occurrenceId: docRef.id
              });
          });
          await batch.commit();

      } catch (error) {
          console.error("Error adding occurrence: ", error);
          alert("Erro ao adicionar tarefa. Tente novamente.");
      }
  };

  const handleUpdateOccurrence = async (occurrenceId: string, updates: Partial<Omit<Occurrence, 'id'>>) => {
      try {
          const docRef = doc(db, 'occurrences', occurrenceId);
          await updateDoc(docRef, updates);
          
          // Notify Creator if status changes
          if (updates.status && currentUserProfile) {
              const occ = occurrences.find(o => o.id === occurrenceId);
              if (occ && occ.createdBy !== currentUserProfile.uid) {
                  const creatorNotifRef = doc(collection(db, 'notifications'));
                  // Check if creator still exists
                  const creatorUser = users.find(u => u.uid === occ.createdBy);
                  if (creatorUser) {
                      await setDoc(creatorNotifRef, {
                          recipientId: occ.createdBy,
                          title: 'Atualização de Tarefa',
                          message: `Sua tarefa "${occ.title}" foi atualizada para: ${updates.status} por ${currentUserProfile.name}`,
                          timestamp: new Date().toISOString(),
                          read: false,
                          type: 'update',
                          occurrenceId: occurrenceId
                      });
                  }
              }
          }
      } catch (error) {
          console.error("Error updating occurrence: ", error);
          alert("Erro ao atualizar tarefa.");
      }
  };

  const handleMoveToTrash = async (id: string) => {
      if (!currentUserProfile) return;
      try {
          const docRef = doc(db, 'occurrences', id);
          await updateDoc(docRef, { deletedAt: new Date().toISOString() });
      } catch (error) {
          console.error("Error moving to trash:", error);
          alert("Erro ao mover para lixeira.");
      }
  };

  const handleRestoreFromTrash = async (id: string) => {
      try {
          const docRef = doc(db, 'occurrences', id);
          await updateDoc(docRef, { deletedAt: deleteField() });
      } catch (error) {
           console.error("Error restoring:", error);
           alert("Erro ao restaurar tarefa.");
      }
  };

  const handleDeleteForever = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'occurrences', id));
      } catch (error) {
          console.error("Error deleting forever:", error);
          alert("Erro ao excluir permanentemente.");
      }
  };

  // --- USER MANAGEMENT ---

  const handleInviteUser = async (inviteData: { email: string; whatsapp?: string; allowedAreas: Area[]; role: Role; invitedBy: string, name?: string }) => {
    try {
        // 1. Check if user already exists (Active or Deleted) to clean up old records
        // This prevents the "Invalid Document Reference" or "User Already Exists" error on broken records.
        const q = query(collection(db, 'users'), where('email', '==', inviteData.email));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);

        if (!snapshot.empty) {
             // Clean up old records for this email
             snapshot.forEach(doc => {
                 batch.delete(doc.ref);
             });
        }
        
        // 2. Create the new Invite Document
        const newDocRef = doc(collection(db, 'users')); // Auto-ID
        const newId = newDocRef.id;

        batch.set(newDocRef, {
            ...inviteData,
            status: 'Pendente',
            id: newId, // Ensure ID field matches Document ID
            uid: newId // Temporary UID until registration
        });
        
        await batch.commit();
        return newId;

    } catch (error) {
        console.error("Error inviting user: ", error);
        alert("Erro ao criar convite. Verifique o console.");
        return null;
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
      try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, data);
      } catch (error) {
          console.error("Error updating user:", error);
          alert("Erro ao atualizar usuário.");
      }
  };
  
  const handleRequestDeleteUser = async (userId: string) => {
      if (!userId) {
          console.error("Invalid User ID for deletion");
          return;
      }
      try {
          // Hard Delete: Actually remove the document so email can be reused
          await deleteDoc(doc(db, 'users', userId));

          // Clean up notifications related to this user to prevent ghost notifications
          const batch = writeBatch(db);
          const qNotif = query(collection(db, 'notifications'), where('recipientId', '==', userId));
          const notifSnap = await getDocs(qNotif);
          notifSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();

      } catch (error) {
          console.error("Error deleting user:", error);
          alert("Erro ao excluir usuário.");
      }
  };

  const handleToggleUserBlock = async (targetUser: User) => {
      const newStatus: UserStatus = targetUser.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado';
      await handleUpdateUser(targetUser.id, { status: newStatus });
  };
  
  // --- FEEDBACK & SYSTEM ---

  const handleSubmitFeedback = async (type: FeedbackType, content: string) => {
      if (!currentUserProfile) return;
      try {
          await addDoc(collection(db, 'system_feedback'), {
              userId: currentUserProfile.uid,
              userName: currentUserProfile.name,
              userRole: currentUserProfile.role,
              userAreas: currentUserProfile.allowedAreas,
              type,
              content,
              timestamp: new Date().toISOString(),
              isRead: false
          });
          alert('Feedback enviado com sucesso! Obrigado.');
          setIsFeedbackModalOpen(false);
      } catch (error) {
          console.error("Error sending feedback:", error);
          alert("Erro ao enviar feedback.");
      }
  };

  const handleToggleFeedbackRead = async (id: string, currentStatus: boolean) => {
      try {
          await updateDoc(doc(db, 'system_feedback', id), { isRead: !currentStatus });
      } catch (e) { console.error(e); }
  };

  const handleReplyFeedback = async (id: string, text: string) => {
       if (!currentUserProfile) return;
       try {
           const feedbackRef = doc(db, 'system_feedback', id);
           const feedbackDoc = await getDoc(feedbackRef);
           if (feedbackDoc.exists()) {
               const currentComments = feedbackDoc.data().comments || [];
               const newComment = {
                   author: currentUserProfile.name,
                   text: text,
                   timestamp: new Date().toISOString(),
                   isAdmin: true
               };
               await updateDoc(feedbackRef, { comments: [...currentComments, newComment] });
           }
       } catch(e) { console.error(e); }
  };

  const handleDeleteFeedback = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'system_feedback', id));
      } catch(e) { console.error(e); }
  };

  const handleResetCounters = async () => {
      try {
          await setDoc(doc(db, 'counters', 'occurrences'), { count: 0 });
          alert("Contador de tarefas zerado com sucesso. A próxima tarefa será #001.");
      } catch (e) {
          console.error(e);
          alert("Erro ao zerar contador.");
      }
  };

  const handleMarkNotificationsRead = async () => {
      if (!currentUserProfile) return;
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.read);
      unread.forEach(n => {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { read: true });
      });
      if (unread.length > 0) await batch.commit();
  };

  const handleSimulateRole = (role: Role | null) => {
      if (currentUserProfile?.role !== Role.Admin) return; // Security check
      setIsSimulating(!!role);
      
      if (role) {
          setCurrentUserProfile(prev => prev ? { ...prev, role } : null);
      } else {
          // Reset to real role
          if (realRole) {
               setCurrentUserProfile(prev => prev ? { ...prev, role: realRole } : null);
          }
      }
  };

  // --- RENDER ---

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-trimais-blue"></div>
      </div>
    );
  }

  // 1. REGISTRATION VIEW
  if (registerId) {
      return <RegistrationPage userIdToRegister={registerId} />;
  }

  // 2. LOGIN VIEW
  if (!user || !currentUserProfile) {
      // Check if it's the very first run (no users) to show First Setup
      // Note: In a real app, you might want a more robust check, but checking if users array is empty (from a public query) is risky.
      // Better to manually enable setup or assume login page handles "User Not Found".
      // For this PWA, we assume user must be invited or is the first admin.
      
      return (
        <>
            <LoginPage />
            {/* Hidden Trigger for First Setup - if login fails and no users exist, logic could be added here */}
            {/* But for simplicity, we assume we use the FirstAdminSetup component only if explicitly routed or manually handled */}
            <div className="fixed bottom-4 right-4 opacity-50 hover:opacity-100">
                <button 
                    onClick={() => setActiveView('admin')} // Hacky way to trigger setup if needed
                    className="text-xs text-gray-300 hover:text-gray-500"
                >
                    Admin Setup (Dev)
                </button>
            </div>
            {activeView === 'admin' && <div className="fixed inset-0 z-50 bg-white"><FirstAdminSetup onSetupComplete={() => setActiveView('dashboard')} /></div>}
        </>
      );
  }

  // 3. MAIN APP VIEW
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={currentUserProfile}
        realRole={realRole || Role.Gestor}
        onSimulateRole={handleSimulateRole}
        isSimulating={isSimulating}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onChangePassword={() => setIsChangePasswordModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
        
        {activeView === 'dashboard' && (
          <div className="animate-fade-in">
             <Dashboard 
                occurrences={occurrences.filter(o => !o.deletedAt)} 
                users={users} 
                currentUser={currentUserProfile} 
                onMoveToTrash={handleMoveToTrash}
             />
          </div>
        )}

        {activeView === 'form' && (
          <div className="animate-slide-down">
            <OccurrenceForm onAddOccurrence={handleAddOccurrence} />
          </div>
        )}

        {activeView === 'myTasks' && (
           <div className="animate-fade-in">
             <MyTasks 
                occurrences={occurrences.filter(o => !o.deletedAt)} 
                currentUser={currentUserProfile} 
                users={users}
                updateOccurrence={handleUpdateOccurrence} 
                onMoveToTrash={handleMoveToTrash}
             />
           </div>
        )}

        {activeView === 'admin' && currentUserProfile.role === Role.Admin && (
          <div className="animate-fade-in">
            <AdminPanel 
                users={users} 
                currentUser={currentUserProfile}
                onInviteUser={handleInviteUser}
                onUpdateUser={handleUpdateUser}
                onRequestDeleteUser={handleRequestDeleteUser}
                onToggleUserBlock={handleToggleUserBlock}
                feedbacks={feedbacks}
                onToggleFeedbackRead={handleToggleFeedbackRead}
                onReplyFeedback={handleReplyFeedback}
                onDeleteFeedback={handleDeleteFeedback}
                onResetCounters={handleResetCounters}
            />
          </div>
        )}
        
        {activeView === 'trash' && (
             <div className="animate-fade-in">
                 <TrashPanel 
                    occurrences={occurrences.filter(o => o.deletedAt)} 
                    onRestore={handleRestoreFromTrash}
                    onDeleteForever={handleDeleteForever}
                 />
             </div>
        )}

        {/* Team Panel is technically part of Admin logic but can be a separate view if needed */}
      </main>

      {/* MODALS & OVERLAYS */}
      {isShareModalOpen && newOccurrence && (
        <ShareModal 
            occurrence={newOccurrence} 
            onClose={() => { setIsShareModalOpen(false); setActiveView('myTasks'); }} 
        />
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
      />

      {activeToast && (
        <NotificationToast 
            notification={activeToast} 
            onClose={() => setActiveToast(null)}
            onView={() => { setActiveToast(null); setActiveView('myTasks'); }}
        />
      )}

      <WelcomeSummaryModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        unreadNotifications={notifications.filter(n => !n.read)}
        userName={currentUserProfile.name}
      />

      {/* INSTALL GUIDE OVERLAY */}
      {showInstallGuide && (
          <InstallGuidePage onContinue={() => {
              setShowInstallGuide(false);
              localStorage.setItem('installGuideSeen', 'true');
          }} />
      )}

    </div>
  );
};

export default App;
