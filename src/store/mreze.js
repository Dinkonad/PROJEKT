// Zajedničko stanje za stranicu "Društvene mreže". Stanje živi ovdje (a ne u komponenti)
// da se ne izgubi kad se prebacuješ među karticama ili stranicama dok traje veza (~1 sat).
// Nova mreža = dodaj je u PLATFORME, dodaj njezin sažetak u `sazetci` i napravi panel.
import { reactive, computed } from 'vue';
import {
  dohvatiPoveznicu,
  osvjeziNaServeru,
  odspojiNaServeru,
  ucitajIzBaze,
  isoDatum
} from '@/services/youtube.js';

export const PLATFORME = [
  {
    kljuc: 'youtube',
    naziv: 'YouTube',
    ikona: 'smart_display',
    boja: '#E53935',
    stavke: []
  },
  {
    kljuc: 'instagram',
    naziv: 'Instagram',
    ikona: 'photo_camera',
    boja: '#C13584',
    stavke: ['Pratitelji i rast', 'Doseg i pregledi profila', 'Lajkovi i komentari po objavi'],
    napomena: 'Treba Business ili Creator račun povezan s Facebook stranicom.'
  },
  {
    kljuc: 'facebook',
    naziv: 'Facebook',
    ikona: 'groups',
    boja: '#1877F2',
    stavke: ['Pratitelji stranice', 'Doseg i pregledi', 'Interakcije po objavi'],
    napomena: 'Radi preko Facebook stranice, ne preko osobnog profila.'
  },
  {
    kljuc: 'tiktok',
    naziv: 'TikTok',
    ikona: 'music_note',
    boja: '#14B8A6',
    stavke: ['Pratitelji i lajkovi', 'Pregledi po videu', 'Komentari i dijeljenja'],
    napomena: 'TikTok daje samo trenutne ukupne brojke, povijest se gradi dnevnim snimkama.'
  }
];

// ==================== YOUTUBE ====================
// Podatke povlači backend (jednom dnevno + gumb "Osvježi") i sprema ih u Firestore;
// ovdje se samo čitaju iz baze. Nema prijave u pregledniku, pa ni tokena koji istječe.
export const yt = reactive({
  ucitano: false,
  ucitava: false,
  osvjezava: false,
  povezuje: false,
  greska: '',
  status: null,
  kanal: null,
  dnevno: [],
  videa: []
});

const poruka = (e) => {
  if (e?.code === 'permission-denied') {
    return 'Firestore pravila ne dopuštaju čitanje YouTube podataka. U Firebase Console → Firestore → Rules dodaj čitanje za kolekcije youtube-status, youtube-kanal, youtube-dnevno i youtube-videa (samo za tvoj email).';
  }
  return e?.message || String(e);
};

export const youtubeSpojen = computed(() => !!yt.kanal);

export async function ucitajYoutube() {
  yt.ucitava = true;
  try {
    const podaci = await ucitajIzBaze();
    yt.status = podaci.status;
    yt.kanal = podaci.kanal;
    yt.dnevno = podaci.dnevno;
    yt.videa = podaci.videa;
    yt.greska = '';
  } catch (e) {
    yt.greska = poruka(e);
  } finally {
    yt.ucitava = false;
    yt.ucitano = true;
  }
}

export async function osvjeziYoutube(puno = false) {
  yt.osvjezava = true;
  yt.greska = '';
  try {
    await osvjeziNaServeru(puno);
  } catch (e) {
    yt.greska = poruka(e);
  } finally {
    // čak i nakon greške učitaj bazu: backend je u status zapisao što je pošlo krivo
    const zadrziGresku = yt.greska;
    await ucitajYoutube();
    if (zadrziGresku) yt.greska = zadrziGresku;
    yt.osvjezava = false;
  }
}

export async function poveziYoutube() {
  yt.povezuje = true;
  yt.greska = '';
  try {
    window.location.href = await dohvatiPoveznicu();
  } catch (e) {
    yt.greska = poruka(e);
    yt.povezuje = false;
  }
}

export async function odspojiYoutube() {
  yt.greska = '';
  try {
    await odspojiNaServeru();
    await ucitajYoutube();
  } catch (e) {
    yt.greska = poruka(e);
  }
}

const granica28 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 27);
  return isoDatum(d);
};

const zbroj = (redovi) => ({
  pregledi: redovi.reduce((s, r) => s + (r.views || 0), 0),
  minute: redovi.reduce((s, r) => s + (r.estimatedMinutesWatched || 0), 0),
  dobiveno: redovi.reduce((s, r) => s + (r.subscribersGained || 0), 0),
  izgubljeno: redovi.reduce((s, r) => s + (r.subscribersLost || 0), 0),
  lajkovi: redovi.reduce((s, r) => s + (r.likes || 0), 0)
});

export const ytZbroj28 = computed(() => {
  const g = granica28();
  const z = zbroj(yt.dnevno.filter((r) => r.day >= g));
  return { ...z, netoPretplatnika: z.dobiveno - z.izgubljeno };
});

export const ytPromjenaPregleda = computed(() => {
  const g = granica28();
  const prethodni = zbroj(yt.dnevno.filter((r) => r.day < g && r.day >= prije28())).pregledi;
  if (!prethodni) return null;
  return ((ytZbroj28.value.pregledi - prethodni) / prethodni) * 100;
});

function prije28() {
  const d = new Date();
  d.setDate(d.getDate() - 55);
  return isoDatum(d);
}

export const ytDani28 = computed(() => {
  const poDatumu = new Map(yt.dnevno.map((r) => [r.day, r.views || 0]));
  const lista = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const datum = isoDatum(d);
    lista.push({ datum, pregledi: poDatumu.get(datum) || 0 });
  }
  const max = Math.max(...lista.map((d) => d.pregledi), 0);
  return lista.map((d) => ({ ...d, visina: max > 0 ? Math.max(3, Math.round((d.pregledi / max) * 120)) : 3 }));
});

export const ytNajboljiDan = computed(() => {
  const s = [...ytDani28.value].sort((a, b) => b.pregledi - a.pregledi)[0];
  return s && s.pregledi > 0 ? s : null;
});

const KRATICE_MJESECI = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

// Zadnjih 12 mjeseci (uključujući tekući), zbroj dnevnih pregleda - to je moguće tek
// otkad se podaci spremaju u bazu.
export const ytMjeseci12 = computed(() => {
  const mjeseci = [];
  const sada = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(sada.getFullYear(), sada.getMonth() - i, 1);
    const kljuc = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    mjeseci.push({ kljuc, kratica: KRATICE_MJESECI[d.getMonth()], godina: d.getFullYear(), pregledi: 0 });
  }
  const poKljucu = new Map(mjeseci.map((m) => [m.kljuc, m]));
  for (const r of yt.dnevno) {
    const m = poKljucu.get(String(r.day).slice(0, 7));
    if (m) m.pregledi += r.views || 0;
  }
  const max = Math.max(...mjeseci.map((m) => m.pregledi), 0);
  return mjeseci.map((m) => ({ ...m, visina: max > 0 ? Math.max(3, Math.round((m.pregledi / max) * 120)) : 3 }));
});

export const ytProsjekPoVideu = computed(() => {
  const pregledi = Number(yt.kanal?.statistics?.viewCount);
  const videi = Number(yt.kanal?.statistics?.videoCount);
  return videi > 0 ? Math.round(pregledi / videi) : 0;
});

// ==================== SAŽETCI ZA ZAJEDNIČKI DASHBOARD ====================
// Svaka mreža vraća isti oblik: { povezano, pregledi, pratitelji, sadrzaj, pregledi28 }.
// Polje koje mreža ne daje je null i ne ulazi u zbrojeve.
export const sazetci = computed(() => {
  const ne = { povezano: false, pregledi: null, pratitelji: null, sadrzaj: null, pregledi28: null };
  const stat = yt.kanal?.statistics;
  return {
    youtube: yt.kanal
      ? {
          povezano: true,
          pregledi: Number(stat?.viewCount) || 0,
          pratitelji: stat?.hiddenSubscriberCount ? null : (Number(stat?.subscriberCount) || 0),
          sadrzaj: Number(stat?.videoCount) || 0,
          pregledi28: yt.dnevno.length ? ytZbroj28.value.pregledi : null
        }
      : ne,
    instagram: ne,
    facebook: ne,
    tiktok: ne
  };
});

const zbrojPolja = (polje) => {
  let ukupno = 0;
  let ima = false;
  for (const p of PLATFORME) {
    const v = sazetci.value[p.kljuc][polje];
    if (v !== null && v !== undefined) {
      ukupno += v;
      ima = true;
    }
  }
  return ima ? ukupno : null;
};

export const ukupno = computed(() => ({
  povezanih: PLATFORME.filter((p) => sazetci.value[p.kljuc].povezano).length,
  ukupnoMreza: PLATFORME.length,
  pregledi: zbrojPolja('pregledi'),
  pratitelji: zbrojPolja('pratitelji'),
  sadrzaj: zbrojPolja('sadrzaj'),
  pregledi28: zbrojPolja('pregledi28')
}));

export const udjeliPregleda = computed(() => {
  const povezane = PLATFORME.filter((p) => (sazetci.value[p.kljuc].pregledi || 0) > 0);
  const suma = povezane.reduce((s, p) => s + sazetci.value[p.kljuc].pregledi, 0);
  return povezane.map((p) => ({
    ...p,
    pregledi: sazetci.value[p.kljuc].pregledi,
    postotak: suma > 0 ? (sazetci.value[p.kljuc].pregledi / suma) * 100 : 0
  }));
});
