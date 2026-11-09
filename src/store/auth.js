import { reactive } from 'vue';
import { auth } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { jeVlasnik } from '@/config/admin.js';

const googleProvider = new GoogleAuthProvider();

const state = reactive({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: true,
  error: null,
  odbijen: false // netko drugi se pokušao prijaviti - odmah je odjavljen
});

onAuthStateChanged(auth, async (user) => {
  state.loading = false;

  if (user && !jeVlasnik(user)) {
    // aplikacija je privatna: svaki račun osim vlasnikovog se odmah odjavljuje
    state.currentUser = null;
    state.isLoggedIn = false;
    state.isAdmin = false;
    state.odbijen = true;
    try {
      await signOut(auth);
    } catch {
      // odjava neuspjela - stanje je ionako "nije prijavljen"
    }
    return;
  }

  if (user) {
    state.currentUser = user;
    state.isLoggedIn = true;
    state.isAdmin = true;
    state.odbijen = false;
  } else {
    state.currentUser = null;
    state.isLoggedIn = false;
    state.isAdmin = false;
  }
});

const login = async (email, password) => {
  state.loading = true;
  state.error = null;
  state.odbijen = false;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
  state.odbijen = false;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
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

export function useAuth() {
  return {
    state,
    login,
    loginWithGoogle,
    logout
  };
}
