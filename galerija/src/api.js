// Komunikacija s backendom. Klijent nema račun: sve ide preko tokena iz linka (i dozvole nakon PIN-a).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiGreska extends Error {
  constructor(poruka, status) {
    super(poruka);
    this.status = status;
  }
}

const kljucPristupa = (token) => `g-pristup-${token}`;

export const pristupZa = (token) => {
  try { return sessionStorage.getItem(kljucPristupa(token)) || ''; } catch { return ''; }
};

export const spremiPristup = (token, zapis) => {
  try { sessionStorage.setItem(kljucPristupa(token), zapis); } catch { /* privatni prozor */ }
};

async function zovi(putanja, { metoda = 'GET', tijelo, token, timeoutMs = 45000 } = {}) {
  if (!API) throw new ApiGreska('Adresa servera nije postavljena.', 0);
  const zaglavlja = { Accept: 'application/json' };
  if (tijelo !== undefined) zaglavlja['Content-Type'] = 'application/json';
  const pristup = token ? pristupZa(token) : '';
  if (pristup) zaglavlja['X-Pristup'] = pristup;

  const kontrola = new AbortController();
  const odbrojavanje = setTimeout(() => kontrola.abort(), timeoutMs);
  let odgovor;
  try {
    odgovor = await fetch(`${API}${putanja}`, {
      method: metoda,
      headers: zaglavlja,
      body: tijelo !== undefined ? JSON.stringify(tijelo) : undefined,
      signal: kontrola.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
  } catch (e) {
    throw new ApiGreska(e.name === 'AbortError' ? 'Server predugo odgovara.' : 'Nema veze sa serverom.', 0);
  } finally {
    clearTimeout(odbrojavanje);
  }
  let podaci = null;
  try { podaci = await odgovor.json(); } catch { podaci = null; }
  if (!odgovor.ok) throw new ApiGreska(podaci?.detail || `Greška ${odgovor.status}`, odgovor.status);
  return podaci;
}

// Prvo učitavanje: besplatni server zna spavati (do minute), pa pokušavamo više puta.
export async function ucitajGaleriju(token, ref, naSporo) {
  const upit = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  let zadnja;
  for (let pokusaj = 0; pokusaj < 4; pokusaj++) {
    try {
      return await zovi(`/javno/g/${token}${upit}`, { token, timeoutMs: 40000 });
    } catch (e) {
      zadnja = e;
      if (e.status !== 0 && e.status !== 502 && e.status !== 503 && e.status !== 504) throw e;
      if (naSporo) naSporo();
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  throw zadnja;
}

export const posaljiPin = (token, pin) => zovi(`/javno/g/${token}/pin`, { metoda: 'POST', tijelo: { pin }, token });
export const dohvatiSlike = (token, ids, v) => zovi(`/javno/g/${token}/slike`, { metoda: 'POST', tijelo: { ids, v }, token });
export const dohvatiPreuzimanje = (token, id) => zovi(`/javno/g/${token}/preuzmi`, { metoda: 'POST', tijelo: { id }, token });
export const zatraziZip = (token, ids) => zovi(`/javno/g/${token}/zip`, { metoda: 'POST', tijelo: { ids }, token, timeoutMs: 60000 });
