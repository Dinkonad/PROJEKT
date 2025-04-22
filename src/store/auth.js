import { reactive } from 'vue';
import { auth } from '../services/firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';


const googleProvider = new GoogleAuthProvider();


const state = reactive({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: true,
  error: null
});

onAuthStateChanged(auth, (user) => {
  state.loading = false;
  
  if (user) {
    state.currentUser = user;
    state.isLoggedIn = true;
    state.isAdmin = user.email === 'naddinko@gmail.com';
  } else {
    state.currentUser = null;
    state.isLoggedIn = false;
    state.isAdmin = false;
  }
});

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
