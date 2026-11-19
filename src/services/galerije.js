// Galerije za klijente: poziva backend (s prijavom vlasnika) i šalje fotke IZRAVNO u privatni R2.
// Fotke nikad ne prolaze kroz backend: backend samo izda privremenu dozvolu za upload.
import { auth } from './firebase.js';
import { pripremiFotku, ekstenzija } from '@/utils/slike.js';

export const BACKEND_URL = (import.meta.env.VITE_GARMIN_BACKEND_URL || '').replace(/\/+$/, '');
export const GALERIJA_URL = (import.meta.env.VITE_GALERIJA_URL || '').replace(/\/+$/, '');

export const linkGalerije = (token, ref = '') => {
  if (!GALERIJA_URL) return '';
  const osnova = `${GALERIJA_URL}/g/${token}`;
  const k = String(ref || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
  return k ? `${osnova}?k=${k}` : osnova;
};

async function poziv(putanja, opcije = {}, timeoutMs = 60000) {
  if (!BACKEND_URL) throw new Error('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).');
  if (!auth.currentUser) throw new Error('Nisi prijavljen.');
  const idToken = await auth.currentUser.getIdToken();
  const kontrola = new AbortController();
  const odbrojavanje = setTimeout(() => kontrola.abort(), timeoutMs);
  let odgovor;
  try {
    odgovor = await fetch(`${BACKEND_URL}${putanja}`, {
      ...opcije,
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', ...(opcije.headers || {}) },
      signal: kontrola.signal
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Server predugo odgovara (Render se možda budi). Pokušaj ponovno.');
    throw new Error('Server se ne može dosegnuti. Provjeri internet.');
  } finally {
    clearTimeout(odbrojavanje);
  }
  let tijelo = null;
  try { tijelo = await odgovor.json(); } catch { tijelo = null; }
  if (!odgovor.ok) throw new Error(tijelo?.detail || `Greška ${odgovor.status}`);
  return tijelo;
}

const post = (p, tijelo) => poziv(p, { method: 'POST', body: JSON.stringify(tijelo || {}) });

export const novaGalerija = (podaci) => post('/galerije', podaci);
export const noviToken = (gid) => post(`/galerije/${gid}/novi-token`);
export const postaviPin = (gid, pin) => post(`/galerije/${gid}/pin`, { pin: pin || null });
export const popisFotki = (gid) => poziv(`/galerije/${gid}/fotke`);
export const obrisiFotke = (gid, ids) => post(`/galerije/${gid}/fotke/obrisi`, { ids });
export const postaviNaslovnu = (gid, id) => post(`/galerije/${gid}/naslovna`, { id });
export const obrisiGaleriju = (gid) => post(`/galerije/${gid}/obrisi`);
// zbroj veličina svih datoteka u R2 bucketu (backend ga pamti 10 minuta)
export const zauzecePohrane = (osvjezi = false) => poziv(`/galerije/pohrana${osvjezi ? '?osvjezi=true' : ''}`);

// ---------- upload u R2 (XHR zbog napretka); Content-Type mora biti točno onaj za koji je link potpisan

export function posaljiUR2(url, tijelo, tip, naNapredak) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.setRequestHeader('Content-Type', tip);
    x.upload.onprogress = (e) => { if (e.lengthComputable && naNapredak) naNapredak(e.loaded / e.total); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`Pohrana je odbila datoteku (${x.status}). Provjeri CORS postavke R2 bucketa.`)));
    x.onerror = () => reject(new Error('Upload nije uspio (mreža ili CORS postavke R2 bucketa).'));
    x.ontimeout = () => reject(new Error('Upload je predugo trajao.'));
    x.timeout = 20 * 60 * 1000;
    x.send(tijelo);
  });
}

async function saPonavljanjem(fn, pokusaja = 3) {
  let zadnja;
  for (let i = 0; i < pokusaja; i++) {
    try { return await fn(); } catch (e) {
      zadnja = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1) ** 2));
    }
  }
  throw zadnja;
}

// Svaka datoteka: obrada u pregledniku -> dozvole -> upload (mala, srednja, original) -> upis u popis galerije.
// stanja[] su reaktivni objekti koje UI prikazuje: { ime, velicina, stanje, napredak, greska }
export async function uploadajFotke(gid, datoteke, stanja, { paralelno = 3, prekid } = {}) {
  let sljedeca = 0;
  const cekajUpis = [];

  const upisi = async () => {
    const paket = cekajUpis.splice(0, cekajUpis.length);
    if (!paket.length) return;
    try {
      await saPonavljanjem(() => post(`/galerije/${gid}/fotke`, { fotke: paket.map((p) => p.zapis) }));
      paket.forEach((p) => { p.stanje.stanje = 'spremljeno'; p.stanje.napredak = 1; });
    } catch (e) {
      paket.forEach((p) => { p.stanje.stanje = 'greska'; p.stanje.greska = e.message; });
    }
  };

  const obradi = async (i) => {
    const file = datoteke[i];
    const st = stanja[i];
    try {
      st.stanje = 'priprema';
      const p = await pripremiFotku(file);
      if (prekid?.zaustavi) throw new Error('Prekinuto.');
      st.stanje = 'salje';
      const odgovor = await saPonavljanjem(() => post(`/galerije/${gid}/upload-url`, { datoteke: [{ ime: file.name, ext: p.ext, velicina: file.size }] }));
      const d = odgovor.datoteke[0];
      const dijelovi = [
        { w: 0.03, cilj: d.t, tijelo: p.mala },
        { w: 0.07, cilj: d.m, tijelo: p.srednja },
        { w: 0.9, cilj: d.o, tijelo: file }
      ];
      let gotovo = 0;
      for (const dio of dijelovi) {
        await saPonavljanjem(() => posaljiUR2(dio.cilj.url, dio.tijelo, dio.cilj.tip, (f) => { st.napredak = gotovo + dio.w * f; }));
        gotovo += dio.w;
        st.napredak = gotovo;
      }
      st.stanje = 'upis';
      cekajUpis.push({ stanje: st, zapis: { id: d.id, ext: d.ext, ime: file.name, w: p.w, h: p.h, boja: p.boja, snimljeno: p.snimljeno } });
      if (cekajUpis.length >= 8) await upisi();
    } catch (e) {
      st.stanje = 'greska';
      st.greska = e.message || 'Nepoznata greška.';
    }
  };

  const radnik = async () => {
    while (sljedeca < datoteke.length && !prekid?.zaustavi) {
      const i = sljedeca++;
      await obradi(i);
    }
  };

  await Promise.all(Array.from({ length: Math.min(paralelno, datoteke.length) }, radnik));
  await upisi();
}

export { ekstenzija };
