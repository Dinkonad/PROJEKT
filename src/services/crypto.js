// Enkripcija za password vault (Web Crypto API): PIN -> PBKDF2 -> AES-GCM ključ.
// PIN se nigdje ne sprema - izvodi se ključ u memoriji samo dok je vault otvoren.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function izvediKljuc(pin, saltBytes) {
  const baza = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 150000, hash: 'SHA-256' },
    baza,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));

export async function enkriptiraj(tekst, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const kljuc = await izvediKljuc(pin, salt);
  const sifrirano = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kljuc, encoder.encode(tekst));
  return `${toBase64(salt)}.${toBase64(iv)}.${toBase64(sifrirano)}`;
}

export async function dekriptiraj(paket, pin) {
  const [saltB64, ivB64, podaciB64] = paket.split('.');
  const salt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const kljuc = await izvediKljuc(pin, salt);
  const otvoreno = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kljuc, fromBase64(podaciB64));
  return decoder.decode(otvoreno);
}
