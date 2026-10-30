// YouTube pregledi: backend (garmin_backend.py / youtube_sync.py) drži Googleovu vezu i
// sam povlači podatke u Firestore. Ovdje frontend samo
//   1) traži od backenda povezivanje / osvježavanje (s Firebase tokenom admina), i
//   2) čita spremljene podatke izravno iz Firestorea.
// Nema više Googleove prijave u pregledniku ni tokena koji istječe.
import { auth, db } from './firebase.js';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_GARMIN_BACKEND_URL || '';

export const isoDatum = (d) => {
  const g = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dan = String(d.getDate()).padStart(2, '0');
  return `${g}-${m}-${dan}`;
};

async function pozoviBackend(putanja, opcije = {}, timeoutMs = 120000) {
  if (!BACKEND_URL) throw new Error('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).');
  if (!auth.currentUser) throw new Error('Nisi prijavljen.');
  const idToken = await auth.currentUser.getIdToken();

  const kontrola = new AbortController();
  const odbrojavanje = setTimeout(() => kontrola.abort(), timeoutMs);
  try {
    const odgovor = await fetch(`${BACKEND_URL}${putanja}`, {
      ...opcije,
      headers: { Authorization: `Bearer ${idToken}`, ...(opcije.headers || {}) },
      signal: kontrola.signal
    });
    let tijelo = null;
    try {
      tijelo = await odgovor.json();
    } catch {
      tijelo = null;
    }
    if (!odgovor.ok) {
      throw new Error(tijelo?.detail || `Greška ${odgovor.status}`);
    }
    return tijelo;
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('Backend predugo odgovara (Render se možda budi) - pokušaj ponovno za minutu.');
    }
    throw e;
  } finally {
    clearTimeout(odbrojavanje);
  }
}

export async function dohvatiPoveznicu() {
  const povratak = encodeURIComponent(window.location.origin);
  const { url } = await pozoviBackend(`/youtube/povezi-url?povratak=${povratak}`);
  return url;
}

export function osvjeziNaServeru(puno = false) {
  return pozoviBackend(`/youtube/osvjezi?puno=${puno ? 'true' : 'false'}`, { method: 'POST' }, 180000);
}

export function odspojiNaServeru() {
  return pozoviBackend('/youtube/odspoji', { method: 'POST' });
}

// Dnevni podaci se čitaju samo za zadnjih ~400 dana (dovoljno za 12 mjeseci + usporedbu),
// da otvaranje stranice ne troši stotine čitanja.
export async function ucitajIzBaze() {
  const od = new Date();
  od.setDate(od.getDate() - 400);

  const [statusSnap, kanalSnap, dnevnoSnap, videaSnap] = await Promise.all([
    getDoc(doc(db, 'youtube-status', 'sync')),
    getDocs(query(collection(db, 'youtube-kanal'), orderBy('datum', 'desc'), limit(1))),
    getDocs(query(collection(db, 'youtube-dnevno'), where('day', '>=', isoDatum(od)), orderBy('day', 'asc'))),
    getDocs(collection(db, 'youtube-videa'))
  ]);

  return {
    status: statusSnap.exists() ? statusSnap.data() : null,
    kanal: kanalSnap.empty ? null : kanalSnap.docs[0].data(),
    dnevno: dnevnoSnap.docs.map((d) => d.data()),
    videa: videaSnap.docs.map((d) => d.data())
  };
}
