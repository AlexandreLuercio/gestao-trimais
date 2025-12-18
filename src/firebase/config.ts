import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // CORRIGIDO
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // CORRIGIDO
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // CORRIGIDO
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // CORRIGIDO
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // CORRIGIDO
  appId: import.meta.env.VITE_FIREBASE_APP_ID, // CORRIGIDO
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // ADICIONADO
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Chave para Google AI (Gemini)
export const GEMINI_API_KEY = import.meta.env.VITE_API_KEY; // CORRIGIDO
