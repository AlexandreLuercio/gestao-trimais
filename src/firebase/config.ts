import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Fix: Cast import.meta to any to resolve "Property 'env' does not exist on type 'ImportMeta'" errors
const metaEnv = (import.meta as any).env || {};

// Configuração estrita com variáveis de ambiente do Vite
export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Chave da Gemini para uso interno do sistema
// Fix: Use the safely accessed metaEnv for Gemini API key
export const GEMINI_API_KEY = metaEnv.VITE_API_KEY;
