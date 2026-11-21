// Besplatni Render zaspi kad se ne koristi, a prvo buđenje traje do minute. Ovo pri otvaranju aplikacije
// pita backend je li budan: ako ne odgovori brzo, korisnik vidi poruku da se server budi (umjesto da misli
// da je nešto pokvareno), a usput se server stvarno probudi prije prve radnje.
import { ref, onMounted, onBeforeUnmount } from 'vue';

const BACKEND_URL = (import.meta.env.VITE_GARMIN_BACKEND_URL || '').replace(/\/+$/, '');
const POKAZI_NAKON_MS = 2500;
const NAJDUZE_MS = 120000;

export function useStatusServera() {
  const stanje = ref('uredu'); // uredu | budi | spreman
  let odustani = false;

  const spavaj = (ms) => new Promise((r) => setTimeout(r, ms));

  const provjeri = async () => {
    if (!BACKEND_URL) return;
    let gotovo = false;
    const pokaziTimer = setTimeout(() => { if (!gotovo && !odustani) stanje.value = 'budi'; }, POKAZI_NAKON_MS);
    const pocetak = Date.now();
    while (!odustani && Date.now() - pocetak < NAJDUZE_MS) {
      const kontrola = new AbortController();
      const prekid = setTimeout(() => kontrola.abort(), 8000);
      try {
        const odgovor = await fetch(`${BACKEND_URL}/health`, { signal: kontrola.signal, cache: 'no-store' });
        if (odgovor.ok) { gotovo = true; break; }
      } catch { /* server još spava ili nema mreže: pokušaj ponovno */ }
      finally { clearTimeout(prekid); }
      await spavaj(3000);
    }
    clearTimeout(pokaziTimer);
    if (odustani) return;
    if (gotovo && stanje.value === 'budi') {
      stanje.value = 'spreman';
      setTimeout(() => { if (!odustani) stanje.value = 'uredu'; }, 2500);
    } else {
      stanje.value = 'uredu';
    }
  };

  onMounted(provjeri);
  onBeforeUnmount(() => { odustani = true; });
  return { stanje };
}
