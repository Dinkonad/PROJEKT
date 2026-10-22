// Face ID / Touch ID / Windows Hello - prava WebAuthn registracija i prijava.
// Backend (isti Render servis kao Garmin sync) čuva javni ključ svakog uređaja i
// kriptografski provjerava potpis, pa nakon uspješne potvrde izdaje pravu Firebase
// prijavu (custom token) - isto sigurno kao prijava lozinkom.
import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_GARMIN_BACKEND_URL || '';
const SIGURNOSNI_DOC = () => doc(db, 'security', 'webauthn-credentials');

const b64urlEncode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binarno = '';
  bytes.forEach(b => { binarno += String.fromCharCode(b); });
  return btoa(binarno).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64urlDecode = (str) => {
  const dopuna = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const binarno = atob(str.replace(/-/g, '+').replace(/_/g, '/') + dopuna);
  const bytes = new Uint8Array(binarno.length);
  for (let i = 0; i < binarno.length; i++) bytes[i] = binarno.charCodeAt(i);
  return bytes.buffer;
};

export function jePodrzano() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function dohvatiRegistrirane() {
  try {
    const snap = await getDoc(SIGURNOSNI_DOC());
    return snap.exists() ? (snap.data().credentials || []) : [];
  } catch (error) {
    console.error('Greška pri dohvaćanju Face ID credentiala:', error);
    return [];
  }
}

const pripremiKreiranjeOpcije = (opcije) => ({
  ...opcije,
  challenge: b64urlDecode(opcije.challenge),
  user: { ...opcije.user, id: b64urlDecode(opcije.user.id) },
  excludeCredentials: (opcije.excludeCredentials || []).map(c => ({ ...c, id: b64urlDecode(c.id) }))
});

const pripremiPrijavuOpcije = (opcije) => ({
  ...opcije,
  challenge: b64urlDecode(opcije.challenge),
  allowCredentials: (opcije.allowCredentials || []).map(c => ({ ...c, id: b64urlDecode(c.id) }))
});

const kredencijalUJson = (credential) => {
  const jeRegistracija = !!credential.response.attestationObject;
  return {
    id: credential.id,
    rawId: b64urlEncode(credential.rawId),
    type: credential.type,
    response: jeRegistracija
      ? {
          clientDataJSON: b64urlEncode(credential.response.clientDataJSON),
          attestationObject: b64urlEncode(credential.response.attestationObject)
        }
      : {
          clientDataJSON: b64urlEncode(credential.response.clientDataJSON),
          authenticatorData: b64urlEncode(credential.response.authenticatorData),
          signature: b64urlEncode(credential.response.signature),
          userHandle: credential.response.userHandle ? b64urlEncode(credential.response.userHandle) : null
        }
  };
};

const dohvatiJson = async (odgovor) => {
  if (!odgovor.ok) {
    let poruka = `Greška ${odgovor.status}`;
    try {
      const tijelo = await odgovor.json();
      poruka = tijelo.detail || poruka;
    } catch {
      // ignoriraj - koristi generičku poruku
    }
    throw new Error(poruka);
  }
  return odgovor.json();
};

export async function registrirajNoviCredential(idToken, nazivUredaja) {
  if (!BACKEND_URL) throw new Error('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL).');

  const opcije = await dohvatiJson(await fetch(`${BACKEND_URL}/faceid/register-options`, {
    headers: { Authorization: `Bearer ${idToken}` }
  }));

  const credential = await navigator.credentials.create({ publicKey: pripremiKreiranjeOpcije(opcije) });

  await dohvatiJson(await fetch(`${BACKEND_URL}/faceid/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ credential: kredencijalUJson(credential), naziv: nazivUredaja })
  }));
}

export async function prijaviSeFaceIdom() {
  if (!BACKEND_URL) throw new Error('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL).');

  const opcije = await dohvatiJson(await fetch(`${BACKEND_URL}/faceid/login-options`));
  const credential = await navigator.credentials.get({ publicKey: pripremiPrijavuOpcije(opcije) });

  const rezultat = await dohvatiJson(await fetch(`${BACKEND_URL}/faceid/login-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: kredencijalUJson(credential) })
  }));

  return rezultat.token;
}

export async function ukloniCredential(zapis) {
  const trenutni = await dohvatiRegistrirane();
  const filtrirano = trenutni.filter(c => c.id !== zapis.id);
  await setDoc(SIGURNOSNI_DOC(), { credentials: filtrirano }, { merge: true });
}

// Lokalna provjera prisutnosti (bez backend poziva) - koristi je samo Šifre vault
// za brzo otključavanje na ovom uređaju, ne za login.
export async function potvrdiCredential(registrirani) {
  if (!registrirani.length) return false;

  const rezultat = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: registrirani.map(c => ({ id: b64urlDecode(c.id), type: 'public-key' })),
      userVerification: 'required',
      timeout: 60000
    }
  });

  return !!rezultat;
}
