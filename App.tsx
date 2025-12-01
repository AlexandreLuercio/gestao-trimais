
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Occurrence, User, Status, Area, Role, FeedbackType, SystemFeedback, AppNotification, UserStatus, FeedbackComment } from './types';
import { auth, db, firebaseConfig } from './firebase/config';
import { onAuthStateChanged, User as FirebaseUser, signOut, getAuth, createUserWithEmailAndPassword } from '@firebase/auth';
import { collection, onSnapshot, doc, getDocs, query, limit, runTransaction, updateDoc, addDoc, deleteDoc, deleteField, orderBy, writeBatch, where, setDoc, getDoc, arrayUnion } from '@firebase/firestore';
import { initializeApp, deleteApp } from '@firebase/app';
import { differenceInDays, parseISO, differenceInSeconds } from 'date-fns';

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

// SYSTEM VERSION: 1.4.5 (BUTTON REMOVED)
export const APP_VERSION = '1.4.5';

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
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  
  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOccurrence, setNewOccurrence] = useState<Occurrence | null>(null);
  
  // --- ADMIN/FEEDBACK MODALS ---
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  // --- TRASH/DELETE STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // --- ROLE SIMULATION (ADMIN ONLY) ---
  const [simulatedRole, setSimulatedRole] = useState<Role | null>(null);

  // --- IDENTITY RECONCILIATION STATE ---
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [isIdentityHealing, setIsIdentityHealing] = useState(false);

  // Get User Profile with Role Simulation applied
  const effectiveUser = useMemo(() => {
    if (!currentUserProfile) return null;
    if (currentUserProfile.role === Role.Admin && simulatedRole) {
        return { ...currentUserProfile, role: simulatedRole };
    }
    return currentUserProfile;
  }, [currentUserProfile, simulatedRole]);

  // Handle URL params for Invite Registration & Install Guide
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const registerParam = urlParams.get('register');
    
    // Check if running in standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (registerParam) {
      // 1. Save the invite ID persistently (for after install)
      localStorage.setItem('pendingInviteId', registerParam);
      
      if (!isStandalone) {
          // 2. Not installed? Show the guide first IF invited.
          setShowInstallGuide(true);
          setRegistrationId(registerParam);
      } else {
          // 3. Installed? Go straight to registration
          setRegistrationId(registerParam);
      }
    } else {
        // 4. No URL param? Check if we have a pending invite in storage (User just opened the installed app)
        const storedInvite = localStorage.getItem('pendingInviteId');
        if (storedInvite && !user) {
            setRegistrationId(storedInvite);
        }
    }
  }, [user]);

  // --- AUTH LISTENER & PROFILE SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIdentityError(null);
      
      if (firebaseUser) {
        // Clear pending invites if user is successfully logged in
        // Note: We might keep it if they are logging in just to register, but RegistrationPage clears it
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() } as User;
            
            if (userData.status === 'Bloqueado' || userData.status === 'Excluido') {
                setIdentityError(userData.status === 'Bloqueado' ? "Sua conta está bloqueada." : "Sua conta foi excluída.");
                setCurrentUserProfile(null);
                setAuthLoading(false);
                return;
            }

            setCurrentUserProfile(userData);
            
            // Only force password change if explicitly flagged (deprecated mostly with new invite flow but kept for safety)
            if (userData.status === 'Provisorio') {
                setForcePasswordChange(true);
                setIsPasswordModalOpen(true);
            }

          } else {
            // Identity Healing: Try to find user by email if UID doc is missing
            if (!isIdentityHealing) {
                setIsIdentityHealing(true);
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where("email", "==", firebaseUser.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                         const oldProfileDoc = querySnapshot.docs[0];
                         const oldData = oldProfileDoc.data();
                         
                         // If we found a doc, verify it's not excluded before migrating
                         if (oldData.status === 'Excluido') {
                             setIdentityError("Sua conta foi excluída.");
                             setCurrentUserProfile(null);
                             setIsIdentityHealing(false);
                             setAuthLoading(false);
                             return;
                         }

                         const newProfileRef = doc(db, 'users', firebaseUser.uid);
                         await setDoc(newProfileRef, {
                             ...oldData,
                             uid: firebaseUser.uid, 
                             id: firebaseUser.uid,
                             status: 'Ativo' 
                         });
                         await deleteDoc(oldProfileDoc.ref);
                         // Snapshot listener will fire again and set profile
                    } else {
                         setCurrentUserProfile(null);
                    }
                } catch (e) {
                    console.error("Identity Healing Failed:", e);
                } finally {
                    setIsIdentityHealing(false);
                }
            } else {
                 setCurrentUserProfile(null);
            }
          }
          setAuthLoading(false);
        }, (err) => {
            console.error("Profile Snapshot Error:", err);
            setAuthLoading(false);
        });

        return () => unsubProfile();
      } else {
        setCurrentUserProfile(null);
        setAuthLoading(false);
      }
    }, (error) => {
        setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isIdentityHealing]); 


  // --- DATA LISTENERS ---
  const previousNotificationsRef = useRef<number>(0);

  useEffect(() => {
    if (!effectiveUser) return;

    // 1. OCCURRENCES
    const qOccurrences = query(collection(db, 'occurrences'), orderBy('timestamp', 'desc'));
    const unsubOccurrences = onSnapshot(qOccurrences, (snapshot) => {
      const occurrencesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Occurrence));
      setOccurrences(occurrencesData); 
    });

    // 2. USERS
    const qUsers = query(collection(db, 'users')); 
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      // FIX: Spread order changed to ensure doc.id overrides any potential empty 'id' field in the document data
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(usersData);
    });

    // 3. FEEDBACK
    let unsubFeedback = () => {};
    if (effectiveUser.role === Role.Admin) {
        const qFeedback = query(collection(db, 'system_feedback'), orderBy('timestamp', 'desc'));
        unsubFeedback = onSnapshot(qFeedback, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemFeedback));
            setFeedbacks(data);
        });
    }

    // 4. NOTIFICATIONS (UX ENHANCED)
    const qNotifications = query(
        collection(db, 'notifications'), 
        where('recipientId', '==', effectiveUser.uid)
    );
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
        const notifs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as AppNotification))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const latest20 = notifs.slice(0, 20);
        
        // --- UX LOGIC: TOAST & WELCOME ---
        
        // 1. Detect NEW notification arriving now (Toast)
        if (notifs.length > previousNotificationsRef.current && previousNotificationsRef.current !== 0) {
            const newest = notifs[0];
            if (newest && !newest.read) {
                setActiveToast(newest);
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
                audio.volume = 0.2;
                audio.play().catch(e => console.log('Audio blocked', e));
            }
        }

        // 2. Detect Initial Load for Welcome Modal
        if (previousNotificationsRef.current === 0 && notifs.some(n => !n.read) && !hasSeenWelcome) {
            setShowWelcomeModal(true);
            setHasSeenWelcome(true);
        }

        previousNotificationsRef.current = notifs.length;
        setNotifications(latest20);
    });

    return () => {
      unsubOccurrences();
      unsubUsers();
      unsubFeedback();
      unsubNotifications();
    };
  }, [effectiveUser?.uid, effectiveUser?.role]); 


  // --- NOTIFICATION HELPERS ---
  const markNotificationsAsRead = async () => {
      const unread = notifications.filter(n => !n.read);
      const batch = writeBatch(db);
      unread.forEach(n => {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { read: true });
      });
      if (unread.length > 0) {
          await batch.commit();
      }
  };

  const sendNotification = async (recipientId: string, title: string, message: string, type: 'new' | 'update' | 'alert' | 'info', occurrenceId?: string) => {
      try {
          await addDoc(collection(db, 'notifications'), {
              recipientId,
              title,
              message,
              type,
              occurrenceId: occurrenceId || null,
              timestamp: new Date().toISOString(),
              read: false
          });
      } catch (e) {
          console.error("Failed to send notification", e);
      }
  };

  // --- HELPER: CLEANUP USER DATA (DEEP CLEAN) ---
  const cleanupUserNotifications = async (userId: string) => {
      try {
          const qNotif = query(collection(db, 'notifications'), where('recipientId', '==', userId));
          const notifSnap = await getDocs(qNotif);
          
          if (!notifSnap.empty) {
              const batch = writeBatch(db);
              notifSnap.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
              console.log(`Cleaned up ${notifSnap.size} notifications for user ${userId}`);
          }
      } catch (e) {
          console.error("Error cleaning up notifications:", e);
      }
  };

  // --- ACTIONS ---

  const handleAddOccurrence = async (occurrenceData: Omit<Occurrence, 'id' | 'timestamp' | 'status' | 'uniqueId' | 'createdBy' | 'creatorName' | 'updatesLog'>) => {
    if (!effectiveUser) return;
    const safeCreatorName = effectiveUser.name || effectiveUser.email || 'Colaborador';

    try {
        const countDocRef = doc(db, 'settings', 'counters');
        let newCount = 1;
        
        await runTransaction(db, async (transaction) => {
            const countDoc = await transaction.get(countDocRef);
            if (!countDoc.exists()) {
                transaction.set(countDocRef, { occurrences: 1 });
            } else {
                newCount = countDoc.data().occurrences + 1;
                transaction.update(countDocRef, { occurrences: newCount });
            }
        });

        const year = new Date().getFullYear().toString().slice(-2);
        const areaAbbr = getAreaAbbreviation(occurrenceData.area);
        const uniqueId = `${newCount.toString().padStart(3, '0')}-${year}-${areaAbbr}`;

        const initialLog = {
            text: `Tarefa criada por ${safeCreatorName}.`,
            timestamp: new Date().toISOString(),
            authorName: safeCreatorName
        };

        const newOccurrenceFull = {
            ...occurrenceData,
            audioUrl: occurrenceData.audioUrl || null, 
            status: Status.Aberto,
            timestamp: new Date().toISOString(),
            uniqueId: uniqueId,
            createdBy: effectiveUser.uid,
            creatorName: safeCreatorName, 
            updatesLog: [initialLog],
            isUrgent: occurrenceData.isUrgent || false
        };

        const docRef = await addDoc(collection(db, 'occurrences'), newOccurrenceFull);
        setNewOccurrence({ id: docRef.id, ...newOccurrenceFull } as Occurrence);
        
        // NOTIFY MANAGERS OF THAT AREA
        const areaManagers = users.filter(u => u.status === 'Ativo' && (u.role === Role.Admin || (u.role === Role.Gestor && u.allowedAreas?.includes(occurrenceData.area))));
        
        if (areaManagers.length > 0) {
             const batch = writeBatch(db);
             areaManagers.forEach(manager => {
                 if (manager.id !== effectiveUser.uid) { // Don't notify self
                     const notifRef = doc(collection(db, 'notifications'));
                     batch.set(notifRef, {
                         recipientId: manager.id,
                         title: "Nova Tarefa Criada",
                         message: `${safeCreatorName} abriu uma tarefa em ${occurrenceData.area}: ${occurrenceData.title}`,
                         type: 'new',
                         timestamp: new Date().toISOString(),
                         read: false,
                         occurrenceId: docRef.id
                     });
                 }
             });
             batch.commit().catch(e => console.error("Batch notify failed", e));
        }

        setIsShareModalOpen(true); 
        setActiveView('myTasks');

    } catch (error) {
        console.error("Error adding occurrence: ", error);
        alert("Erro ao salvar tarefa. Tente novamente.");
    }
  };

  const updateOccurrence = async (occurrenceId: string, updates: Partial<Omit<Occurrence, 'id'>>) => {
     try {
         const occRef = doc(db, 'occurrences', occurrenceId);
         await updateDoc(occRef, updates);
     } catch (e) {
         console.error("Error updating", e);
     }
  };

  const handleMoveToTrash = (id: string) => {
      setItemToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmMoveToTrash = async () => {
      if (itemToDelete && effectiveUser) {
          try {
             const task = occurrences.find(o => o.id === itemToDelete);
             await updateDoc(doc(db, 'occurrences', itemToDelete), {
                 deletedAt: new Date().toISOString()
             });

             if (task && task.status !== Status.Concluido && task.createdBy) {
                 if (task.createdBy !== effectiveUser.uid) {
                     sendNotification(
                         task.createdBy,
                         "Tarefa Excluída",
                         `Sua tarefa '${task.title}' foi movida para a lixeira por ${effectiveUser.name} antes da conclusão.`,
                         'alert',
                         task.id
                     );
                 }
             }

             setIsDeleteModalOpen(false);
             setItemToDelete(null);
          } catch (e) {
              console.error("Error moving to trash", e);
          }
      }
  };

  const handleRestoreFromTrash = async (id: string) => {
      try {
          await updateDoc(doc(db, 'occurrences', id), {
              deletedAt: deleteField()
          });
          alert("Tarefa restaurada com sucesso!");
      } catch (e) {
          console.error("Error restoring", e);
      }
  };

  const handleDeleteForever = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'occurrences', id));
      } catch (e) {
          console.error("Error deleting forever", e);
      }
  };


  // --- USER MANAGEMENT ---

  const handleInviteUser = async (inviteData: { email: string; whatsapp?: string; allowedAreas: Area[]; role: Role; invitedBy: string; name: string }) => {
     try {
         // 1. Check for existing users with this email to clean up "ghosts" or duplicates
         const usersRef = collection(db, 'users');
         const q = query(usersRef, where("email", "==", inviteData.email));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty) {
             // Hard delete existing records AND notifications with this email to prevent conflicts
             for (const docSnapshot of querySnapshot.docs) {
                 await cleanupUserNotifications(docSnapshot.id); // DEEP CLEAN NOTIFICATIONS
                 await deleteDoc(doc(db, 'users', docSnapshot.id));
             }
         }

         // 2. Create the Pending Invite
         // NOTE: We do not pass an 'id' field to avoid overwriting doc.id with empty strings
         const docRef = await addDoc(collection(db, 'users'), {
             ...inviteData,
             uid: '', 
             status: 'Pendente',
         });
         
         // Update the doc with its own ID for data consistency
         await updateDoc(docRef, { id: docRef.id });

         return docRef.id;
     } catch (e: any) {
         console.error("Invite User Error:", e);
         alert("Erro ao criar convite: " + e.message);
         return null;
     }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
      try {
          await updateDoc(doc(db, 'users', userId), data);
      } catch (e) {
          console.error("Update user error", e);
      }
  };
  
  const handleRequestDeleteUser = async (userId: string) => {
      if (!userId) {
          console.error("Delete Error: User ID is missing.");
          alert("Erro: ID do usuário inválido (vazio).");
          return;
      }
      try {
          await cleanupUserNotifications(userId); // DEEP CLEAN NOTIFICATIONS BEFORE DELETE
          await deleteDoc(doc(db, 'users', userId));
          alert("Usuário e histórico de notificações excluídos com sucesso.");
      } catch (e) {
          console.error("Delete user error", e);
          alert("Erro ao excluir usuário.");
      }
  };

  const handleToggleUserBlock = async (userToBlock: User) => {
      try {
          const newStatus = userToBlock.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado';
          await updateDoc(doc(db, 'users', userToBlock.id), {
              status: newStatus
          });
      } catch (e) {
          console.error("Block user error", e);
      }
  };
  
  // --- SYSTEM MAINTENANCE ---
  const handleResetCounters = async () => {
      try {
          await setDoc(doc(db, 'settings', 'counters'), { occurrences: 0 });
          alert("Contadores zerados! A próxima tarefa será #001.");
      } catch (e) {
          console.error("Reset Counters Error:", e);
          alert("Erro ao zerar contadores.");
      }
  };


  // --- FEEDBACK ---
  const handleSendFeedback = async (type: FeedbackType, content: string) => {
      if (!effectiveUser) return;
      await addDoc(collection(db, 'system_feedback'), {
          userId: effectiveUser.uid,
          userName: effectiveUser.name,
          userRole: effectiveUser.role,
          userAreas: effectiveUser.allowedAreas || [], 
          type,
          content,
          timestamp: new Date().toISOString(),
          isRead: false
      });
      alert("Feedback enviado com sucesso! Obrigado.");
  };

  const handleToggleFeedbackRead = async (id: string, currentStatus: boolean) => {
      await updateDoc(doc(db, 'system_feedback', id), { isRead: !currentStatus });
  };

  const handleReplyFeedback = async (id: string, text: string) => {
      if (!effectiveUser) return;
      const comment: FeedbackComment = {
          author: effectiveUser.name,
          text: text,
          timestamp: new Date().toISOString(),
          isAdmin: effectiveUser.role === Role.Admin
      };
      
      const feedbackRef = doc(db, 'system_feedback', id);
      await updateDoc(feedbackRef, {
          comments: arrayUnion(comment)
      });
  };

  const handleDeleteFeedback = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'system_feedback', id));
      } catch (e) {
          console.error("Delete feedback error", e);
      }
  };
  
  const handleManualRefresh = () => {
      window.location.reload();
  };


  // --- RENDER ---

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 flex-col gap-4">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-trimais-blue"></div>
             <p className="text-gray-500 font-medium animate-pulse">Carregando sistema...</p>
        </div>
    );
  }

  // --- INSTALL GUIDE INTERCEPTION ---
  if (showInstallGuide && !user) {
      return (
          <InstallGuidePage 
            onContinue={() => setShowInstallGuide(false)} 
          />
      );
  }

  // Identity/Block Error Screen - ONLY SHOW IF we have a persistent error AND no healing in progress
  if (user && identityError && !isIdentityHealing) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                      <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Interrompido</h2>
                  <p className="text-gray-600 mb-6">{identityError}</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={handleManualRefresh} className="bg-trimais-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition-colors">
                        Tentar Novamente
                    </button>
                    <button onClick={() => signOut(auth)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors">
                        Sair da Conta
                    </button>
                  </div>
              </div>
          </div>
      );
  }

  // Registration Route
  if (registrationId) {
      return <RegistrationPage userIdToRegister={registrationId} />;
  }

  // Login Route
  if (!effectiveUser) {
    // Removed passing onInstallClick
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={effectiveUser} 
        realRole={currentUserProfile?.role}
        onSimulateRole={setSimulatedRole}
        isSimulating={!!simulatedRole}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        notifications={notifications}
        onMarkNotificationsRead={markNotificationsAsRead}
        onChangePassword={() => setIsPasswordModalOpen(true)}
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        {activeView === 'form' && <OccurrenceForm onAddOccurrence={handleAddOccurrence} />}
        
        {activeView === 'dashboard' && (
             <Dashboard 
                occurrences={occurrences.filter(o => !o.deletedAt)} // Only active
                users={users} 
                currentUser={effectiveUser} 
                onMoveToTrash={effectiveUser.role !== Role.Monitor ? handleMoveToTrash : undefined}
             />
        )}
        
        {activeView === 'myTasks' && (
            <MyTasks 
                occurrences={occurrences.filter(o => !o.deletedAt)} 
                currentUser={effectiveUser} 
                users={users}
                updateOccurrence={updateOccurrence}
                onMoveToTrash={effectiveUser.role !== Role.Monitor ? handleMoveToTrash : undefined}
            />
        )}
        
        {activeView === 'admin' && effectiveUser.role === Role.Admin && (
            <AdminPanel 
                users={users} 
                currentUser={effectiveUser}
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
        )}

        {/* Team Panel disabled/hidden as requested, logic centralized in Admin */}
        {activeView === 'team' && effectiveUser.role !== Role.Admin && (
            <div className="text-center p-10 text-gray-500">A gestão de equipe está centralizada no Administrador.</div>
        )}
        
        {activeView === 'trash' && (
            <TrashPanel 
                occurrences={occurrences.filter(o => o.deletedAt)} // Only deleted
                onRestore={handleRestoreFromTrash}
                onDeleteForever={handleDeleteForever}
            />
        )}
      </main>

      {/* --- MODALS & ALERTS --- */}
      
      {/* 1. TOAST NOTIFICATION (Real-time) */}
      <NotificationToast 
          notification={activeToast} 
          onClose={() => setActiveToast(null)}
          onView={() => { setActiveView('myTasks'); setActiveToast(null); }}
      />

      {/* 2. WELCOME SUMMARY MODAL (On Load) */}
      <WelcomeSummaryModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        unreadNotifications={notifications.filter(n => !n.read)}
        userName={effectiveUser.name}
      />

      {isShareModalOpen && newOccurrence && (
        <ShareModal 
            occurrence={newOccurrence} 
            onClose={() => setIsShareModalOpen(false)} 
        />
      )}

      {isDeleteModalOpen && (
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            title="Mover para Lixeira?"
            message="A tarefa será movida para a lixeira e excluída permanentemente após 30 dias."
            onConfirm={confirmMoveToTrash}
            onCancel={() => setIsDeleteModalOpen(false)}
            confirmText="Sim, mover"
            cancelText="Cancelar"
            isDangerous={true}
          />
      )}

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleSendFeedback}
      />

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={effectiveUser}
        isForced={forcePasswordChange}
      />

    </div>
  );
};

export default App;
