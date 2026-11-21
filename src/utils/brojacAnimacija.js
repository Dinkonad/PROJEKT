// Blaga animacija brojki: kad se na stranici pojavi velika brojka (iznos, broj koraka...), ona "dobroji"
// posljednjih ~10 % do prave vrijednosti (npr. 900 -> 1000) kratko, kao brojač. Ne dira vrijednost,
// završni tekst je uvijek točno onaj iz stranice. Poštuje postavku sustava "smanji pokrete".
//
// Radi preko MutationObservera, pa stranice ne trebaju nikakve izmjene: dovoljno je da brojka bude
// u elementu koji odgovara popisu SELEKTORI i sadrži samo tekst.

const SELEKTORI = ['.kartica .iznos', '.kartica-ukupno .iznos', '.uvid-broj', '.pregled-glavno', '.hero-broj'];
const SPOJENO = SELEKTORI.join(',');
const TRAJANJE_MS = 900;
const POCETAK_UDIO = 0.9; // brojka kreće od 90 % prave vrijednosti

const zadnjiTekst = new WeakMap(); // element -> zadnji tekst koji smo mi postavili (da vlastite promjene ne pokreću novu animaciju)
const okviri = new WeakMap();      // element -> id animacijskog okvira

const smanjenPokret = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// pronalazi prvu brojku u tekstu i pamti kako je napisana (hrvatski zapis 1.234,56 ili točka 1234.56)
function procitaj(tekst) {
  const m = /-?\d[\d.,]*/.exec(tekst);
  if (!m) return null;
  const token = m[0].replace(/[.,]+$/, '');
  // brojka mora biti na početku teksta ili odmah iza predznaka / valute, ne usred rečenice ("Zagreb 2026")
  const prije = tekst.slice(0, m.index).trim();
  if (prije && !/^[+\-€$]+$/.test(prije)) return null;

  let vrijednost;
  let decimale = 0;
  let hr = false;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(token)) {
    hr = true;
    const [cijeli, dec = ''] = token.replace(/\./g, '').split(',');
    vrijednost = parseFloat(dec ? `${cijeli}.${dec}` : cijeli);
    decimale = dec.length;
  } else if (/^-?\d+,\d+$/.test(token)) {
    hr = true;
    vrijednost = parseFloat(token.replace(',', '.'));
    decimale = token.split(',')[1].length;
  } else if (/^-?\d+\.\d+$/.test(token)) {
    vrijednost = parseFloat(token);
    decimale = token.split('.')[1].length;
  } else {
    vrijednost = parseInt(token, 10);
  }
  if (!Number.isFinite(vrijednost)) return null;
  return { token, indeks: m.index, vrijednost, decimale, hr };
}

const oblikuj = (v, p) => (p.hr
  ? v.toLocaleString('hr-HR', { minimumFractionDigits: p.decimale, maximumFractionDigits: p.decimale })
  : v.toFixed(p.decimale));

function animiraj(el) {
  if (!el.isConnected || el.children.length) return;
  const tekst = el.textContent;
  if (zadnjiTekst.get(el) === tekst) return; // naša vlastita promjena ili već obrađeno
  const p = procitaj(tekst);
  if (!p || Math.abs(p.vrijednost) < 10 || smanjenPokret()) { zadnjiTekst.set(el, tekst); return; }

  const stari = okviri.get(el);
  if (stari) cancelAnimationFrame(stari);

  const prefiks = tekst.slice(0, p.indeks);
  const sufiks = tekst.slice(p.indeks + p.token.length);
  const pocetak = p.vrijednost * POCETAK_UDIO;
  const t0 = performance.now();

  const korak = (t) => {
    // ako je Vue u međuvremenu postavio novi tekst, ustupamo mjesto novoj animaciji
    if (zadnjiTekst.get(el) !== undefined && el.textContent !== zadnjiTekst.get(el) && el.textContent !== tekst) return;
    const k = Math.min(1, (t - t0) / TRAJANJE_MS);
    const lakoca = 1 - (1 - k) ** 3;
    const novi = prefiks + (k >= 1 ? p.token : oblikuj(pocetak + (p.vrijednost - pocetak) * lakoca, p)) + sufiks;
    zadnjiTekst.set(el, novi);
    if (el.textContent !== novi) {
      // mijenjamo postojeći tekstualni čvor (ne zamjenjujemo ga), da Vue i dalje drži ispravnu referencu
      const dijete = el.firstChild;
      if (dijete && el.childNodes.length === 1 && dijete.nodeType === 3) dijete.nodeValue = novi;
      else el.textContent = novi;
    }
    if (k < 1) okviri.set(el, requestAnimationFrame(korak));
    else okviri.delete(el);
  };
  zadnjiTekst.set(el, tekst);
  okviri.set(el, requestAnimationFrame(korak));
}

export function ukljuciBrojacAnimaciju(korijen = document.body) {
  let cekaju = new Set();
  let zakazano = false;
  const obradi = () => {
    zakazano = false;
    const lista = [...cekaju];
    cekaju = new Set();
    lista.forEach(animiraj);
  };
  const zakazi = (el) => {
    cekaju.add(el);
    if (!zakazano) { zakazano = true; requestAnimationFrame(obradi); }
  };
  const prikupi = (cvor) => {
    if (cvor.nodeType !== 1) return;
    if (cvor.matches(SPOJENO)) zakazi(cvor);
    cvor.querySelectorAll(SPOJENO).forEach(zakazi);
  };

  const promatrac = new MutationObserver((mutacije) => {
    for (const m of mutacije) {
      if (m.type === 'childList') m.addedNodes.forEach(prikupi);
      if (m.type === 'characterData' || m.type === 'childList') {
        const roditelj = m.type === 'characterData' ? m.target.parentElement : m.target;
        const el = roditelj && roditelj.closest ? roditelj.closest(SPOJENO) : null;
        if (el) zakazi(el);
      }
    }
  });
  promatrac.observe(korijen, { childList: true, characterData: true, subtree: true });
  prikupi(korijen);
  return () => promatrac.disconnect();
}
