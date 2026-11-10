// Linkovi: spremanje videa/linkova preko backenda (garmin_backend.py / linkovi_spremi.py).
// Backend izvuče link iz teksta, prepozna platformu, dohvati naslov + sličicu i upiše u Firestore.
// Isti backend prima i spremanja s mobitela (iOS Prečac) - tamo se šalje tajni ključ umjesto prijave.
import { auth } from './firebase.js';

export const BACKEND_URL = (import.meta.env.VITE_GARMIN_BACKEND_URL || '').replace(/\/+$/, '');

// greška koja znači "backend se nije mogao dosegnuti" (mreža / Render spava) - tada se link ipak sprema izravno
const mreznaGreska = (poruka) => Object.assign(new Error(poruka), { mrezna: true });

async function pozoviBackend(putanja, opcije = {}, timeoutMs = 70000) {
  if (!BACKEND_URL) throw new Error('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).');
  if (!auth.currentUser) throw new Error('Nisi prijavljen.');
  const idToken = await auth.currentUser.getIdToken();

  const kontrola = new AbortController();
  const odbrojavanje = setTimeout(() => kontrola.abort(), timeoutMs);
  let odgovor;
  try {
    odgovor = await fetch(`${BACKEND_URL}${putanja}`, {
      ...opcije,
      headers: { Authorization: `Bearer ${idToken}`, ...(opcije.headers || {}) },
      signal: kontrola.signal
    });
  } catch (e) {
    if (e.name === 'AbortError') throw mreznaGreska('Server predugo odgovara (Render se možda budi).');
    throw mreznaGreska('Server se ne može dosegnuti. Provjeri internet.');
  } finally {
    clearTimeout(odbrojavanje);
  }

  let tijelo = null;
  try {
    tijelo = await odgovor.json();
  } catch {
    tijelo = null;
  }
  if (!odgovor.ok) {
    const greska = new Error(tijelo?.detail || `Greška ${odgovor.status}`);
    greska.status = odgovor.status;
    if (odgovor.status >= 500) greska.mrezna = true; // server je pao: link ipak spremi bez pregleda
    throw greska;
  }
  return tijelo;
}

// { url (ili cijeli tekst s linkom), naziv?, biljeska?, oznake? } -> { ok, vec_postoji, id, naziv, poruka, ... }
export function spremiLinkNaServeru({ url, naziv = '', biljeska = '', oznake = [] }) {
  return pozoviBackend('/linkovi/spremi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, naziv, biljeska, oznake })
  });
}

export const adresaSpremanja = () => (BACKEND_URL ? `${BACKEND_URL}/linkovi/spremi` : '');

// tajni ključ iOS prečaca (backend ga napravi kad ga prvi put zatražiš)
export const dohvatiKljucPrecaca = async () => (await pozoviBackend('/linkovi/precac', {}, 70000)).kljuc;
export const noviKljucPrecaca = async () => (await pozoviBackend('/linkovi/precac/novi', { method: 'POST' }, 70000)).kljuc;
