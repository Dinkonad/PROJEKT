// Web Push - besplatne push notifikacije (bez ikakvog placenog servisa),
// standardni browser Push API + VAPID. Pretplata se sprema direktno u
// Firestore (isti obrazac kao webauthn-credentials), backend je samo cita
// kad treba poslati notifikaciju.
import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const PRETPLATE_DOC = () => doc(db, 'security', 'push-subscriptions');

export function jePodrzanoPush() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

const urlB64ToUint8Array = (base64String) => {
  const dopuna = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + dopuna).replace(/-/g, '+').replace(/_/g, '/');
  const sirovo = window.atob(base64);
  return Uint8Array.from([...sirovo].map((c) => c.charCodeAt(0)));
};

export async function jePretplacenNaOvomUredjaju() {
  if (!jePodrzanoPush()) return false;
  const registracija = await navigator.serviceWorker.getRegistration();
  if (!registracija) return false;
  const pretplata = await registracija.pushManager.getSubscription();
  return !!pretplata;
}

export async function ukljuciPushNotifikacije() {
  if (!jePodrzanoPush()) throw new Error('Preglednik ne podržava push notifikacije.');
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID ključ nije postavljen (VITE_VAPID_PUBLIC_KEY).');

  const dozvola = await Notification.requestPermission();
  if (dozvola !== 'granted') throw new Error('Dozvola za notifikacije nije odobrena.');

  const registracija = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const pretplata = await registracija.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const json = pretplata.toJSON();
  const snap = await getDoc(PRETPLATE_DOC());
  const postojece = snap.exists() ? (snap.data().pretplate || []) : [];
  const filtrirane = postojece.filter((p) => p.endpoint !== json.endpoint);
  filtrirane.push(json);
  await setDoc(PRETPLATE_DOC(), { pretplate: filtrirane }, { merge: true });
}

export async function iskljuciPushNotifikacije() {
  const registracija = await navigator.serviceWorker.getRegistration();
  if (!registracija) return;
  const pretplata = await registracija.pushManager.getSubscription();
  if (!pretplata) return;

  const endpoint = pretplata.endpoint;
  await pretplata.unsubscribe();

  const snap = await getDoc(PRETPLATE_DOC());
  const postojece = snap.exists() ? (snap.data().pretplate || []) : [];
  const filtrirane = postojece.filter((p) => p.endpoint !== endpoint);
  await setDoc(PRETPLATE_DOC(), { pretplate: filtrirane }, { merge: true });
}
