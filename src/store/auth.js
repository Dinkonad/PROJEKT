import { reactive } from 'vue';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9OpsZEmSBiGgLNQJwA99inp-OcyxU_Ls",
  authDomain: "blawda-6388c.firebaseapp.com",
  projectId: "blawda-6388c",
  storageBucket: "blawda-6388c.firebasestorage.app",
  messagingSenderId: "986728872789",
  appId: "1:986728872789:web:5e4419d14b242f7ebc8ddc",
  measurementId: "G-Q1RZ6WYB4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Create reactive state
const state = reactive({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: true,
  error: null
});

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  state.loading = false;
  
  if (user) {
    state.currentUser = user;
    state.isLoggedIn = true;
    // Check if user is admin
    state.isAdmin = user.email === 'naddinko@gmail.com';
  } else {
    state.currentUser = null;
    state.isLoggedIn = false;
    state.isAdmin = false;
  }
});

// Auth functions
const login = async (username, password) => {
  state.loading = true;
  state.error = null;
  
  try {
    const userEmail = username.includes('@') 
      ? username 
      : `${username}@example.com`;
    
    await signInWithEmailAndPassword(auth, userEmail, password);
  } catch (error) {
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
};

const loginWithGoogle = async () => {
  state.loading = true;
  state.error = null;
  
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
};

const signup = async (username, email, password) => {
  state.loading = true;
  state.error = null;
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
};

const logout = async () => {
  state.loading = true;
  state.error = null;
  
  try {
    await signOut(auth);
  } catch (error) {
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
};

const loginAsAdmin = async (email, password) => {
  state.loading = true;
  state.error = null;
  
  if (email !== 'naddinko@gmail.com') {
    const error = new Error('Samo administrator može pristupiti ovom dijelu');
    state.error = error.message;
    throw error;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    state.error = error.message;
    throw error;
  } finally {
    state.loading = false;
  }
};

// Auth composable
export function useAuth() {
  return {
    state,
    login,
    loginWithGoogle,
    signup,
    logout,
    loginAsAdmin
  };
}