// Trecho essencial que deve estar no seu App.tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      // Esta linha é o que conecta o login ao que você fez no Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setUser(currentUser);
    } else {
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
