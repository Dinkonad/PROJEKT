// Face ID / Touch ID / Windows Hello preko WebAuthn-a.
//
// VAŽNA NAPOMENA: ovdje nema posebnog backend servera koji provjerava kriptografski
// potpis (to bi zahtijevalo server koji ovaj projekt nema). Zato ovo NIJE zamjena
// za Firebase login, nego lokalna "brava" preko VEĆ prijavljene Firebase sesije -
// isti princip kao "Face ID za otvaranje" u bankovnim aplikacijama. Ako platforma
// (Face ID/Touch ID/Windows Hello) uspješno potvrdi korisnika, smatramo ekran otključanim;
// ako ne uspije ili je otkazano, aplikacija ostaje zaključana i nudi prijavu lozinkom.
import { db } from './firebase.js';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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

const nasumicniChallenge = () => crypto.getRandomValues(new Uint8Array(32));

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

export async function registrirajNoviCredential(korisnikEmail, nazivUredaja) {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: nasumicniChallenge(),
      rp: { name: 'Nagy Photos', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(korisnikEmail),
        name: korisnikEmail,
        displayName: korisnikEmail
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    }
  });

  const zapis = {
    id: b64urlEncode(credential.rawId),
    naziv: nazivUredaja || 'Uređaj',
    kreirano: new Date().toISOString()
  };

  await setDoc(SIGURNOSNI_DOC(), { credentials: arrayUnion(zapis) }, { merge: true });
  return zapis;
}

export async function ukloniCredential(zapis) {
  await setDoc(SIGURNOSNI_DOC(), { credentials: arrayRemove(zapis) }, { merge: true });
}

export async function potvrdiCredential(registrirani) {
  if (!registrirani.length) return false;

  const rezultat = await navigator.credentials.get({
    publicKey: {
      challenge: nasumicniChallenge(),
      allowCredentials: registrirani.map(c => ({ id: b64urlDecode(c.id), type: 'public-key' })),
      userVerification: 'required',
      timeout: 60000
    }
  });

  return !!rezultat;
}
