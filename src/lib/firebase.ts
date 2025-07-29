// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration - This is safe to be public
export const firebaseConfig = {
  "projectId": "guardian-shield-k9g9l",
  "appId": "1:224891357938:web:399bcf1f064bdf7bdf9e6b",
  "storageBucket": "guardian-shield-k9g9l.firebasestorage.app", 
  "apiKey": "AIzaSyC6MOe2IHjiMxGLl2aEAqg2KKvsAcnd-ZM",
  "authDomain": "guardian-shield-k9g9l.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "224891357938"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Auth is no longer needed in this simplified version
export { db, app, storage };
