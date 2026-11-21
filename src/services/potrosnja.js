// Potrošnja aplikacije (Firestore, R2, Render) s backenda. Vidi garmin/potrosnja.py.
import { auth } from './firebase.js';

const BACKEND_URL = (import.meta.env.VITE_GARMIN_BACKEND_URL || '').replace(/\/+$/, '');

export async function dohvatiPotrosnju(osvjezi = false) {
  if (!BACKEND_URL) throw new Error('Adresa backenda nije postavljena (VITE_GARMIN_BACKEND_URL).');
  if (!auth.currentUser) throw new Error('Nisi prijavljen.');
  const token = await auth.currentUser.getIdToken();
  const kontrola = new AbortController();
  const odbrojavanje = setTimeout(() => kontrola.abort(), 70000); // Render se može buditi do minute
  let odgovor;
  try {
    odgovor = await fetch(`${BACKEND_URL}/status/potrosnja${osvjezi ? '?osvjezi=true' : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: kontrola.signal
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Server se budi. Pokušaj osvježiti za koju sekundu.' : 'Server se ne može dosegnuti.');
  } finally {
    clearTimeout(odbrojavanje);
  }
  if (!odgovor.ok) throw new Error(odgovor.status === 404 ? 'Backend još nema ovu funkciju (treba novi deploy na Renderu).' : `Greška ${odgovor.status}.`);
  return odgovor.json();
}
