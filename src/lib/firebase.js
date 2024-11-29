import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let analytics;
let db;
let storage;

try {
  console.log('Inicializando Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase inicializado com sucesso');

  // Initialize Firebase Authentication
  auth = getAuth(app);
  auth.onAuthStateChanged((user) => {
    console.log('Estado de autenticação mudou:', user ? user.email : 'Nenhum usuário');
  });

  // Initialize other services
  analytics = getAnalytics(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('Todos os serviços Firebase inicializados');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  throw error;
}

export { app, auth, analytics, db, storage };
