// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAWJ6G0YPn3ZRuV6Zjk2DYwL67MaNEDFYk",
  authDomain: "agri-fe357.firebaseapp.com",
  projectId: "agri-fe357",
  storageBucket: "agri-fe357.firebasestorage.app",
  messagingSenderId: "134987081660",
  appId: "1:134987081660:web:084fb2f0c7ec5d1882edb9",
  measurementId: "G-TGHVTP024Y"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider };
export default app;