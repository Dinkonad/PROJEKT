import { reactive } from 'vue';
import { auth, db } from '../services/firebase'; 
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore'; 

const googleProvider = new GoogleAuthProvider();

const state = reactive({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: true,
  error: null
});

const saveUserToFirestore = async (user) => {
  if (!user) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      status: 'online',
      lastActive: serverTimestamp(),
      lastLogin: serverTimestamp(),
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Greška pri spremanju korisnika u Firestore:', error);
  }
};

const updateUserStatus = async (userId, status) => {
  if (!userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      status: status,
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Greška pri ažuriranju statusa korisnika:', error);
  }
};

window.addEventListener('beforeunload', () => {
  if (state.currentUser) {
    updateUserStatus(state.currentUser.uid, 'offline');
  }
});

onAuthStateChanged(auth, async (user) => {
  state.loading = false;
  
  if (user) {
    state.currentUser = user;
    state.isLoggedIn = true;
    state.isAdmin = user.email === 'naddinko@gmail.com';
    await saveUserToFirestore(user);
    await updateUserStatus(user.uid, 'online');
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
        
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
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

const signup = async (username, email, password) => {
  state.loading = true;
  state.error = null;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
    if (state.currentUser) {
      await updateUserStatus(state.currentUser.uid, 'offline');
    }
    
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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