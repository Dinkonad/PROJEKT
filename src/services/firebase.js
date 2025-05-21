import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: "AIzaSyB9OpsZEmSBiGgLNQJwA99inp-OcyxU_Ls",
  authDomain: "blawda-6388c.firebaseapp.com",
  projectId: "blawda-6388c",
  storageBucket: "blawda-6388c.firebasestorage.app",
  messagingSenderId: "986728872789",
  appId: "1:986728872789:web:5e4419d14b242f7ebc8ddc",
  measurementId: "G-Q1RZ6WYB4Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };