
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase de la aplicación web. Es segura para ser pública.
export const firebaseConfig = {
  "projectId": "guardian-shield-k9g9l",
  "appId": "1:224891357938:web:399bcf1f064bdf7bdf9e6b",
  "storageBucket": "guardian-shield-k9g9l.firebasestorage.app", 
  "apiKey": "AIzaSyC6MOe2IHjiMxGLl2aEAqg2KKvsAcnd-ZM",
  "authDomain": "guardian-shield-k9g9l.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "224891357938"
};

// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// El módulo de Auth ya no es necesario
export { db, app, storage };
