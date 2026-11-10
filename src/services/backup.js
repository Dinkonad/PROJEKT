// Sigurnosna kopija: pročita sve kolekcije iz Firestorea i spremi ih u jednu .json datoteku.
//
// Lozinke (kolekcija "sifre") ostaju enkriptirane PIN-om, točno kako su spremljene u bazi -
// bez PIN-a se iz kopije ne mogu pročitati.
// Namjerno izostavljeno: "security", "youtube-tajne", "youtube-status" i "linkovi-tajne" (tajni ključevi i tokeni).

import { db, auth } from '@/services/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

export const KOLEKCIJE_ZA_KOPIJU = [
  'prihodi', 'oprema', 'raspored-aktivnosti', 'biznisbaza-predlosci', 'biznisbaza-prebacivanja',
  'placa-postavke', 'videa', 'auto',
  'zdravlje-dani', 'zdravlje-aktivnosti', 'zdravlje-meta',
  'ideje', 'linkovi', 'komentari', 'uploads', 'users',
  'sifre', 'sifre-postavke',
  'kalendar-eventi', 'kalendar-meta',
  'youtube-videa', 'youtube-kanal', 'youtube-dnevno'
];

const IZOSTAVLJENO = ['security', 'youtube-tajne', 'youtube-status', 'linkovi-tajne'];

// Firestore tipovi (Timestamp, GeoPoint, reference, bytes) -> obični JSON koji se može i vratiti
const uJson = (v) => {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(uJson);
  if (typeof v.toDate === 'function') return { __timestamp: v.toDate().toISOString() };
  if (typeof v.toBase64 === 'function') return { __bytes: v.toBase64() };
  if (typeof v.path === 'string' && v.firestore) return { __referenca: v.path };
  if (typeof v.latitude === 'number' && typeof v.longitude === 'number') return { __geo: { latitude: v.latitude, longitude: v.longitude } };
  return Object.fromEntries(Object.entries(v).map(([kljuc, vrijednost]) => [kljuc, uJson(vrijednost)]));
};

const dvaBroja = (n) => String(n).padStart(2, '0');

export async function sastaviSigurnosnuKopiju() {
  const podaci = {};
  const greske = {};

  await Promise.all(KOLEKCIJE_ZA_KOPIJU.map(async (naziv) => {
    try {
      const snap = await getDocs(collection(db, naziv));
      podaci[naziv] = snap.docs.map(d => ({ id: d.id, data: uJson(d.data()) }));
    } catch (error) {
      greske[naziv] = error.code || error.message || 'nepoznata greška';
    }
  }));

  const poredano = Object.fromEntries(KOLEKCIJE_ZA_KOPIJU.filter(k => k in podaci).map(k => [k, podaci[k]]));
  const brojZapisa = Object.fromEntries(Object.entries(poredano).map(([k, lista]) => [k, lista.length]));
  const ukupno = Object.values(brojZapisa).reduce((zbroj, n) => zbroj + n, 0);

  const sada = new Date();
  const naziv = `nagy-backup-${sada.getFullYear()}-${dvaBroja(sada.getMonth() + 1)}-${dvaBroja(sada.getDate())}.json`;

  const kopija = {
    meta: {
      aplikacija: 'nagy-photos',
      verzija: 1,
      napravljeno: sada.toISOString(),
      korisnik: auth.currentUser?.email || null,
      brojZapisa,
      kolekcijeSGreskom: greske,
      izostavljeno: IZOSTAVLJENO
    },
    kolekcije: poredano
  };

  return { naziv, json: JSON.stringify(kopija, null, 2), ukupno, brojKolekcija: Object.keys(poredano).length, greske };
}

const preuzmiDatoteku = (sadrzaj, naziv) => {
  const url = URL.createObjectURL(new Blob([sadrzaj], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = naziv;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// Na mobitelu otvori izbornik za dijeljenje (tu je "Spremi u Datoteke"), na računalu običan download.
export async function spremiSigurnosnuKopiju() {
  const kopija = await sastaviSigurnosnuKopiju();
  const jeMobitel = window.matchMedia('(pointer: coarse)').matches;

  if (jeMobitel && typeof File === 'function' && navigator.canShare) {
    const datoteka = new File([kopija.json], kopija.naziv, { type: 'application/json' });
    if (navigator.canShare({ files: [datoteka] })) {
      try {
        await navigator.share({ files: [datoteka], title: 'Sigurnosna kopija' });
        return { ...kopija, nacin: 'dijeljenje' };
      } catch (error) {
        if (error.name === 'AbortError') return { ...kopija, nacin: 'odustao' };
        // dijeljenje nije uspjelo (npr. istekao dodir) - probaj običan download
      }
    }
  }

  preuzmiDatoteku(kopija.json, kopija.naziv);
  return { ...kopija, nacin: 'preuzimanje' };
}

export function opisRezultata(r) {
  if (r.nacin === 'odustao') return 'Odustao si od spremanja kopije.';
  let tekst = `Kopija spremljena: ${r.ukupno} zapisa iz ${r.brojKolekcija} kolekcija.`;
  const neprocitano = Object.keys(r.greske);
  if (neprocitano.length) tekst += ` Nije se moglo pročitati: ${neprocitano.join(', ')}.`;
  return tekst;
}
