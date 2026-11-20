<template>
  <Zaslon v-if="stanje === 'ucitava'" naslov="Pripremam galeriju" :tekst="sporo ? 'Server se budi, još samo trenutak...' : ''" ucitava />

  <Zaslon v-else-if="stanje === 'nema'" naslov="Galerija nije dostupna" tekst="Provjeri je li link potpun ili se javi fotografu." />

  <Zaslon v-else-if="stanje === 'greska'" naslov="Nešto nije u redu" :tekst="greskaTekst">
    <button type="button" class="gumb gumb-glavni" @click="pokreni">Pokušaj ponovno</button>
  </Zaslon>

  <PinZaslon v-else-if="stanje === 'pin'" :naziv="meta.naziv" :klijent="meta.klijent" :greska="pinGreska" :zauzet="pinZauzet" @posalji="provjeriPin" />

  <div v-else class="app">
    <!-- natpis na vrhu: oznaka na Instagramu -->
    <aside v-if="meta.instagram || meta.poruka" class="ig-traka">
      <Ikona ime="instagram" class="ig-ikona" />
      <p class="ig-tekst">
        {{ meta.poruka || zadanaPoruka }}
        <a v-if="meta.instagram" class="ig-veza" :href="`https://www.instagram.com/${meta.instagram}/`" target="_blank" rel="noopener noreferrer">@{{ meta.instagram }}</a>
      </p>
    </aside>

    <Hero
      :naslov="meta.naziv"
      :gornja="meta.klijent"
      :meta="heroMeta"
      :slika="meta.naslovnaUrl || ''"
      :boja="naslovnaBoja"
      :zakljucano="zakljucano"
      :preuzmi-tekst="`Preuzmi sve (${meta.brojFotki})`"
      @pogledaj="idiNaFotke"
      @preuzmi="preuzmiSve"
    />

    <p v-if="zakljucano" class="zakljucano-traka" role="status">
      <Ikona ime="lokot" />
      Preuzimanje će biti omogućeno nakon uplate. Fotografije možeš već sada pregledavati.
    </p>

    <main id="fotke" ref="fotkeOdjeljak" class="fotke">
      <div class="alatna" :class="{ zalijepljena }">
        <div class="alatna-unutra">
          <div class="filtri" role="group" aria-label="Prikaz">
            <button type="button" class="filtar" :class="{ aktivan: !samoOmiljene }" :aria-pressed="!samoOmiljene" @click="samoOmiljene = false">Sve <span class="broj">{{ meta.fotke.length }}</span></button>
            <button type="button" class="filtar" :class="{ aktivan: samoOmiljene }" :aria-pressed="samoOmiljene" :disabled="!omiljene.size" @click="samoOmiljene = true">
              <Ikona ime="srce" class="mala-ikona" />Omiljene <span class="broj">{{ omiljene.size }}</span>
            </button>
          </div>
          <span class="razmak"></span>
          <span class="savjet-odabira savjet-dodir">Drži fotografiju za odabir</span>
          <span class="savjet-odabira savjet-mis">Kvačica u kutu fotografije za odabir</span>
        </div>
      </div>

      <Mreza
        :stavke="prikazane"
        :urlovi="urlovi"
        :odabrane="odabrane"
        :omiljene="omiljene"
        :nacin-odabira="nacinOdabira"
        @otvori="otvoriSvjetlosnik"
        @odaberi="prebaciOdabranu"
        @srce="prebaciSrce"
        @vidljivo="zatraziThumbove"
        @greska-slike="(id) => osvjeziUrl(id, 't')"
      />
    </main>

    <footer class="podnozje">
      <p class="marka">{{ marka }}</p>
      <p class="mala-napomena">
        Fotografije su privatne i namijenjene tebi.
        <template v-if="meta.instagram"> Ako ih objavljuješ, označi <a :href="`https://www.instagram.com/${meta.instagram}/`" target="_blank" rel="noopener noreferrer">@{{ meta.instagram }}</a>.</template>
      </p>
    </footer>

    <!-- traka odabira -->
    <Transition name="traka">
      <div v-if="nacinOdabira" class="odabir-traka" role="region" aria-label="Odabrane fotografije">
        <button type="button" class="odabir-x" aria-label="Poništi odabir" @click="ocistiOdabir"><Ikona ime="zatvori" /></button>
        <span class="odabir-broj">{{ odabrane.size }} odabrano</span>
        <button type="button" class="gumb odabir-gumb" @click="odaberiSve">Sve</button>
        <button type="button" class="gumb gumb-glavni odabir-gumb" @click="preuzmiOdabrane">
          <Ikona :ime="zakljucano ? 'lokot' : 'preuzmi'" />Preuzmi<span class="samo-sirok">&nbsp;odabrane</span>
        </button>
      </div>
    </Transition>

    <Svjetlosnik
      v-if="otvoreniIndex !== null"
      :stavke="prikazane"
      :pocetni-index="otvoreniIndex"
      :urlovi="urlovi"
      :omiljene="omiljene"
      :zakljucano="zakljucano"
      :moze-spremi-u-fotografije="mozeDijeliDatoteke"
      @zatvori="otvoreniIndex = null"
      @srce="prebaciSrce"
      @preuzmi="preuzmiJednu"
      @spremi="spremiUFotografije"
      @treba-m="(ids) => zatraziSlike(ids, 'm')"
      @greska-slike="(id, v) => osvjeziUrl(id, v)"
    />

    <PreuzimanjeZip v-if="zip" :token="token" :ids="zip.ids" :broj="zip.broj" :fotke="zip.fotke" :naziv="meta.naziv" @zatvori="zip = null" />
    <SpremiUMapu v-if="mapa" :token="token" :fotke="mapa.fotke" :dir="mapa.dir" :naziv="meta.naziv" @zatvori="mapa = null" />
    <SpremiUGaleriju v-if="spremanje" :token="token" :fotke="spremanje.fotke" @zatvori="spremanje = null" @kao-zip="prebaciNaZip" />

    <Transition name="poruka">
      <div v-if="poruka" class="poruka" role="status">{{ poruka }}</div>
    </Transition>
  </div>
</template>

<script setup>
// Klijentska galerija: otvara se preko osobnog linka /g/<token>. Ništa drugo na ovoj stranici ne postoji.
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import Zaslon from './components/Zaslon.vue';
import PinZaslon from './components/PinZaslon.vue';
import Hero from './components/Hero.vue';
import Mreza from './components/Mreza.vue';
import Svjetlosnik from './components/Svjetlosnik.vue';
import PreuzimanjeZip from './components/PreuzimanjeZip.vue';
import SpremiUGaleriju from './components/SpremiUGaleriju.vue';
import SpremiUMapu from './components/SpremiUMapu.vue';
import { jeSlikaZaGaleriju, mozeSpremitiUGaleriju } from './mobilno.js';
import Ikona from './components/Ikona.vue';
import { ucitajGaleriju, posaljiPin, dohvatiSlike, dohvatiPreuzimanje, spremiPristup } from './api.js';

const marka = import.meta.env.VITE_MARKA || 'Nagy Photos';
const zadanaPoruka = 'Ako objavljujete fotografije, molim vas da me označite na Instagramu. Puno ljudi će ih vidjeti, a ne znaju od koga su.';

const token = (location.pathname.match(/^\/g\/([A-Za-z0-9_-]{16,64})\/?$/) || [])[1] || '';
const oznakaLinka = new URLSearchParams(location.search).get('k') || '';

const stanje = ref(token ? 'ucitava' : 'nema'); // ucitava | nema | greska | pin | spremno
const sporo = ref(false);
const greskaTekst = ref('');
const meta = ref(null);
const urlovi = reactive({});
const pinGreska = ref('');
const pinZauzet = ref(false);

const samoOmiljene = ref(false);
const odabrane = ref(new Set());
const nacinOdabira = computed(() => odabrane.value.size > 0); // odabir traje dok je išta označeno
const omiljene = ref(new Set());
const otvoreniIndex = ref(null);
const zip = ref(null);
const spremanje = ref(null);
const poruka = ref('');
const zalijepljena = ref(false);
const fotkeOdjeljak = ref(null);

let porukaTimer = null;
const javi = (tekst) => {
  poruka.value = tekst;
  clearTimeout(porukaTimer);
  porukaTimer = setTimeout(() => { poruka.value = ''; }, 4200);
};

// ---------- učitavanje
const pokreni = async () => {
  if (!token) { stanje.value = 'nema'; return; }
  stanje.value = 'ucitava';
  sporo.value = false;
  const odbrojavanje = setTimeout(() => { sporo.value = true; }, 6000);
  try {
    const o = await ucitajGaleriju(token, oznakaLinka, () => { sporo.value = true; });
    meta.value = o;
    if (o.trebaPin) { stanje.value = 'pin'; return; }
    prihvati(o);
  } catch (e) {
    if (e.status === 404) stanje.value = 'nema';
    else { stanje.value = 'greska'; greskaTekst.value = e.status === 0 ? 'Nema veze sa serverom. Provjeri internet i pokušaj ponovno.' : e.message; }
  } finally {
    clearTimeout(odbrojavanje);
  }
};

const prihvati = (o) => {
  meta.value = o;
  Object.entries(o.urlovi || {}).forEach(([id, u]) => { urlovi[id] = { ...(urlovi[id] || {}), t: u }; });
  citajOmiljene();
  stanje.value = 'spremno';
  try { history.replaceState(null, '', location.pathname); } catch { /* ništa */ }   // ?k=ime se ne kopira dalje
  document.title = `${o.naziv} · ${marka}`;
};

const provjeriPin = async (pin) => {
  pinZauzet.value = true;
  pinGreska.value = '';
  try {
    const o = await posaljiPin(token, pin);
    if (o.pristup) spremiPristup(token, o.pristup);
    await pokreni();
  } catch (e) {
    pinGreska.value = e.status === 429 ? 'Previše pokušaja. Pričekaj nekoliko minuta.' : (e.status === 401 ? 'Neispravan PIN.' : e.message);
  } finally {
    pinZauzet.value = false;
  }
};

// ---------- linkovi slika (traže se u paketima dok se skrola)
const trazeno = new Set();
let red = { t: new Set(), m: new Set() };
let odgoda = null;

const zatraziSlike = (ids, v = 't') => {
  ids.forEach((id) => {
    const kljuc = `${v}:${id}`;
    if (!(urlovi[id] && urlovi[id][v]) && !trazeno.has(kljuc)) { trazeno.add(kljuc); red[v].add(id); }
  });
  if (!odgoda) odgoda = setTimeout(isprazniRed, 60);
};
const zatraziThumbove = (ids) => zatraziSlike(ids, 't');

const isprazniRed = async () => {
  odgoda = null;
  const trenutni = red;
  red = { t: new Set(), m: new Set() };
  for (const v of ['t', 'm']) {
    const sve = [...trenutni[v]];
    for (let i = 0; i < sve.length; i += 60) {
      const paket = sve.slice(i, i + 60);
      try {
        const o = await dohvatiSlike(token, paket, v);
        Object.entries(o.urlovi || {}).forEach(([id, u]) => { urlovi[id] = { ...(urlovi[id] || {}), [v]: u }; });
      } catch (e) {
        if (e.status === 401) { await pokreni(); return; }   // dozvola je istekla: ponovno PIN
        paket.forEach((id) => trazeno.delete(`${v}:${id}`));
      }
    }
  }
};

const osvjeziUrl = (id, v) => {
  trazeno.delete(`${v}:${id}`);
  if (urlovi[id]) urlovi[id] = { ...urlovi[id], [v]: undefined };
  zatraziSlike([id], v);
};

// ---------- prikaz
const heroMeta = computed(() => {
  const dijelovi = [];
  if (meta.value.datum) {
    const d = new Date(`${meta.value.datum.slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(d.getTime())) dijelovi.push(d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' }));
  }
  dijelovi.push(`${meta.value.brojFotki} fotografija`);
  return dijelovi.join('  ·  ');
});
const naslovnaBoja = computed(() => (meta.value.fotke.find((f) => f.i === meta.value.naslovnaId) || {}).c || '');
const zakljucano = computed(() => meta.value?.preuzimanje === 'zakljucano');
const prikazane = computed(() => (samoOmiljene.value ? meta.value.fotke.filter((f) => omiljene.value.has(f.i)) : meta.value.fotke));
const mozeDijeliDatoteke = computed(() => {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'])], 'x.jpg', { type: 'image/jpeg' })] }));
  } catch { return false; }
});

const idiNaFotke = () => fotkeOdjeljak.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });

// ---------- omiljene (pamte se samo na ovom uređaju)
const kljucOmiljenih = `g-omiljene-${token}`;
const citajOmiljene = () => {
  try {
    const sacuvano = JSON.parse(localStorage.getItem(kljucOmiljenih) || '[]');
    const postojece = new Set(meta.value.fotke.map((f) => f.i));
    omiljene.value = new Set(sacuvano.filter((i) => postojece.has(i)));
  } catch { omiljene.value = new Set(); }
};
const prebaciSrce = (id) => {
  const novi = new Set(omiljene.value);
  if (!novi.delete(id)) novi.add(id);
  omiljene.value = novi;
  if (!novi.size) samoOmiljene.value = false;
  try { localStorage.setItem(kljucOmiljenih, JSON.stringify([...novi])); } catch { /* ništa */ }
};

// ---------- odabir
let sidroOdabira = null; // zadnja označena fotka: od nje počinje Shift+klik raspon
const prebaciOdabranu = (id, raspon = false) => {
  const novi = new Set(odabrane.value);
  const lista = prikazane.value;
  if (raspon && sidroOdabira && sidroOdabira !== id) {
    const a = lista.findIndex((f) => f.i === sidroOdabira);
    const b = lista.findIndex((f) => f.i === id);
    if (a >= 0 && b >= 0) {
      for (let k = Math.min(a, b); k <= Math.max(a, b); k++) novi.add(lista[k].i);
      odabrane.value = novi;
      sidroOdabira = id;
      return;
    }
  }
  if (novi.delete(id)) { if (!novi.size) sidroOdabira = null; } else { novi.add(id); sidroOdabira = id; }
  odabrane.value = novi;
};
const ocistiOdabir = () => { odabrane.value = new Set(); sidroOdabira = null; };
const odaberiSve = () => { odabrane.value = new Set(prikazane.value.map((f) => f.i)); };

// Esc poništava odabir, Ctrl/Cmd+A označava sve (samo dok je odabir započet i ništa drugo nije otvoreno)
const tipkaOdabira = (e) => {
  if (!nacinOdabira.value || otvoreniIndex.value !== null || zip.value || mapa.value || spremanje.value) return;
  if (e.key === 'Escape') { ocistiOdabir(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); odaberiSve(); }
};

// ---------- svjetlosnik
const otvoriSvjetlosnik = (id) => {
  const i = prikazane.value.findIndex((f) => f.i === id);
  if (i >= 0) otvoreniIndex.value = i;
};

// ---------- preuzimanje
const provjeriDozvoluPreuzimanja = () => {
  if (zakljucano.value) { javi('Preuzimanje će biti omogućeno nakon uplate.'); return false; }
  return true;
};

const preuzmiJednu = async (id) => {
  if (!provjeriDozvoluPreuzimanja()) return;
  try {
    const o = await dohvatiPreuzimanje(token, id);
    const a = document.createElement('a');
    a.href = o.url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
    javi('Preuzimanje je počelo.');
  } catch (e) {
    javi(e.status === 403 ? 'Preuzimanje će biti omogućeno nakon uplate.' : (e.message || 'Preuzimanje nije uspjelo.'));
  }
};

// iPhone/Android: izbornik za dijeljenje nudi "Spremi sliku" i fotka završi u Fotografijama
const spremiUFotografije = async (id) => {
  if (!provjeriDozvoluPreuzimanja()) return;
  const f = meta.value.fotke.find((x) => x.i === id);
  try {
    javi('Priprema fotografije...');
    const o = await dohvatiPreuzimanje(token, id);
    const odgovor = await fetch(o.url, { referrerPolicy: 'no-referrer', credentials: 'omit' });
    if (!odgovor.ok) throw new Error('nije dostupno');
    const blob = await odgovor.blob();
    const datoteka = new File([blob], f?.n || `${id}.jpg`, { type: blob.type || 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [datoteka] })) {
      await navigator.share({ files: [datoteka] });
      poruka.value = '';
    } else {
      throw new Error('dijeljenje nije dostupno');
    }
  } catch (e) {
    if (e && e.name === 'AbortError') { poruka.value = ''; return; }
    javi('Spremanje u Fotografije nije uspjelo. Koristi gumb za preuzimanje.');
  }
};

// do 25 fotki i 400 MB ZIP se slaže u pregledniku (odmah, bez čekanja na server); veće slaže server
const MALI_ODABIR_FOTKI = 25;
const MALI_ODABIR_BAJTOVA = 400 * 1024 * 1024;
const zaLokalniZip = (fotke) => (
  fotke.length > 0 && fotke.length <= MALI_ODABIR_FOTKI &&
  fotke.reduce((a, f) => a + (f.s || 0), 0) <= MALI_ODABIR_BAJTOVA ? fotke : null
);

// Mobitel: obične slike (do 60 odjednom) idu izravno u galeriju preko izbornika za dijeljenje
const MAX_U_GALERIJU = 300;
const zaGaleriju = (fotke) => (
  fotke.length > 0 && fotke.length <= MAX_U_GALERIJU && fotke.every(jeSlikaZaGaleriju) && mozeSpremitiUGaleriju()
);

const prebaciNaZip = () => {
  const fotke = spremanje.value ? spremanje.value.fotke : [];
  spremanje.value = null;
  zip.value = { ids: fotke.map((f) => f.i), broj: fotke.length, fotke: zaLokalniZip(fotke) };
};

// Računalo: ZIP se izbjegava. "Preuzmi sve" pita za mapu i upisuje fotke izravno u nju (Chrome/Edge),
// a manji odabir (do 30 fotki) se samo preuzme kao obične datoteke.
const jeDodirni = () => { try { return window.matchMedia('(pointer: coarse)').matches; } catch { return false; } };
const mozeUMapu = () => !jeDodirni() && typeof window.showDirectoryPicker === 'function';
const MAX_POJEDINACNO = 30;       // do toliko odabranih fotki preuzima se pojedinačno (bez pitanja za mapu)
const MAX_POJEDINACNO_SVE = 300;  // preglednici bez odabira mape: do toliko fotki jednu po jednu

const mapa = ref(null);

// birač mape mora se otvoriti izravno iz klika, zato se zove prije bilo čega asinkronog
const spremiUMapu = async (fotke) => {
  let dir;
  try {
    dir = await window.showDirectoryPicker({ id: 'galerija-preuzimanje', mode: 'readwrite', startIn: 'downloads' });
  } catch (e) {
    if (!(e && e.name === 'AbortError')) javi('Preglednik nije dopustio odabir mape. Pokušaj ponovno.');
    return;
  }
  mapa.value = { fotke, dir };
};

let preuzimaNekoliko = false;
const spavaj = (ms) => new Promise((r) => setTimeout(r, ms));
const preuzmiNekoliko = async (fotke) => {
  if (preuzimaNekoliko) return;
  preuzimaNekoliko = true;
  let n = 0;
  try {
    for (const f of fotke) {
      const o = await dohvatiPreuzimanje(token, f.i);
      const a = document.createElement('a');
      a.href = o.url;
      a.download = '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      n += 1;
      javi(`Preuzimam ${n} od ${fotke.length}...`);
      await spavaj(450);
    }
    javi(`Preuzimanje je počelo (${n} fotografija). Fotografije su u mapi Preuzimanja.`);
  } catch (e) {
    javi(e.status === 403 ? 'Preuzimanje će biti omogućeno nakon uplate.' : `Preuzimanje je prekinuto nakon ${n} fotografija. Pokušaj ponovno.`);
  } finally {
    preuzimaNekoliko = false;
  }
};

const preuzmiSve = () => {
  if (!provjeriDozvoluPreuzimanja()) return;
  if (zaGaleriju(meta.value.fotke)) { spremanje.value = { fotke: meta.value.fotke }; return; }
  if (mozeUMapu()) { spremiUMapu(meta.value.fotke); return; }
  // preglednici bez odabira mape (Firefox, Safari): fotke se skidaju jedna po jedna, bez ZIP-a na serveru
  if (!jeDodirni() && meta.value.fotke.length <= MAX_POJEDINACNO_SVE) { preuzmiNekoliko(meta.value.fotke); return; }
  zip.value = { ids: null, broj: meta.value.brojFotki, fotke: zaLokalniZip(meta.value.fotke) };
};

const preuzmiOdabrane = () => {
  if (!provjeriDozvoluPreuzimanja()) return;
  const fotke = meta.value.fotke.filter((f) => odabrane.value.has(f.i));
  if (zaGaleriju(fotke)) { spremanje.value = { fotke }; return; }
  // jedna fotka: izravno u originalnoj kvaliteti
  if (fotke.length === 1) { preuzmiJednu(fotke[0].i); return; }
  if (!jeDodirni() && fotke.length <= MAX_POJEDINACNO) { preuzmiNekoliko(fotke); return; }
  if (mozeUMapu()) { spremiUMapu(fotke); return; }
  if (!jeDodirni() && fotke.length <= MAX_POJEDINACNO_SVE) { preuzmiNekoliko(fotke); return; }
  zip.value = { ids: fotke.map((f) => f.i), broj: fotke.length, fotke: zaLokalniZip(fotke) };
};

// ---------- ljepljiva alatna traka
let promatracAlatne = null;
const postaviPromatraca = () => {
  const el = document.querySelector('.alatna');
  if (!el || !('IntersectionObserver' in window)) return;
  promatracAlatne = new IntersectionObserver(([u]) => { zalijepljena.value = u.intersectionRatio < 1; }, { threshold: [1], rootMargin: '-1px 0px 0px 0px' });
  promatracAlatne.observe(el);
};

onMounted(async () => {
  window.addEventListener('keydown', tipkaOdabira);
  await pokreni();
  setTimeout(postaviPromatraca, 50);
  // jednom na dodirnom uređaju: kratka uputa kako se odabire više fotografija
  try {
    if (stanje.value === 'spremno' && jeDodirni() && !localStorage.getItem('g-savjet-odabir')) {
      localStorage.setItem('g-savjet-odabir', '1');
      setTimeout(() => javi('Drži prst na fotografiji za odabir više fotografija.'), 2500);
    }
  } catch { /* ništa */ }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', tipkaOdabira);
  promatracAlatne?.disconnect();
  clearTimeout(porukaTimer);
  clearTimeout(odgoda);
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--bg);
}

.ig-traka {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: calc(11px + env(safe-area-inset-top, 0px)) 18px 11px;
  background: linear-gradient(90deg, #1c1810, #251e12 50%, #1c1810);
  border-bottom: 1px solid rgba(214, 182, 127, 0.25);
  text-align: left;
}

.ig-ikona {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--akcent);
}

.ig-tekst {
  margin: 0;
  max-width: 760px;
  color: #e9dfcb;
  font-size: 0.86rem;
  line-height: 1.45;
}

.ig-veza {
  margin-left: 6px;
  color: var(--akcent);
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  border-bottom: 1px solid rgba(214, 182, 127, 0.5);
}

.zakljucano-traka {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0;
  padding: 14px 18px;
  background: var(--bg-2);
  border-bottom: 1px solid var(--linija);
  color: var(--tekst-2);
  font-size: 0.9rem;
  text-align: center;
}

.zakljucano-traka svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--akcent);
}

.fotke {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 0 40px;
  scroll-margin-top: 0;
}

.alatna {
  position: sticky;
  top: -1px;
  z-index: 20;
  padding: 0 10px;
  transition: background-color 0.25s, border-color 0.25s, backdrop-filter 0.25s;
  border-bottom: 1px solid transparent;
}

.alatna.zalijepljena {
  background: rgba(12, 12, 14, 0.82);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  backdrop-filter: blur(16px) saturate(140%);
  border-bottom-color: var(--linija);
}

.alatna-unutra {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1800px;
  margin: 0 auto;
  padding: 14px 8px;
}

.razmak {
  flex: 1;
}

.filtri {
  display: flex;
  gap: 8px;
}

.filtar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--linija);
  border-radius: 999px;
  background: transparent;
  color: var(--tekst-2);
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.filtar:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--tekst);
}

.filtar:disabled {
  opacity: 0.4;
  cursor: default;
}

.filtar.aktivan {
  background: var(--tekst);
  border-color: var(--tekst);
  color: #111;
}

.filtar .broj {
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.mala-ikona {
  width: 16px;
  height: 16px;
}

.podnozje {
  padding: 40px 24px calc(60px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  border-top: 1px solid var(--linija);
}

.marka {
  margin: 0;
  font-family: var(--font-naslov);
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.mala-napomena {
  margin: 8px auto 0;
  max-width: 460px;
  color: var(--tekst-3);
  font-size: 0.84rem;
}

.mala-napomena a {
  color: var(--akcent);
}

.odabir-traka {
  position: fixed;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 8px;
  border: 1px solid var(--linija);
  border-radius: 999px;
  background: rgba(24, 24, 28, 0.9);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transform: translateX(-50%);
  white-space: nowrap;
}

.odabir-x {
  flex: none;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--tekst);
}

.odabir-x svg {
  width: 20px;
  height: 20px;
}

.odabir-broj {
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.odabir-gumb {
  min-height: 42px;
  padding: 0 18px;
}

.savjet-odabira {
  color: var(--tekst-3);
  font-size: 0.82rem;
  white-space: nowrap;
}

/* miš: kvačica u kutu; dodir: dugi pritisak */
.savjet-dodir {
  display: none;
}

@media (hover: none) {
  .savjet-mis {
    display: none;
  }

  .savjet-dodir {
    display: inline;
  }
}

@media (max-width: 520px) {
  .savjet-odabira {
    display: none !important;
  }
}

.poruka {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 200;
  max-width: calc(100vw - 32px);
  padding: 12px 20px;
  border: 1px solid var(--linija);
  border-radius: 999px;
  background: rgba(30, 30, 34, 0.95);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  font-size: 0.9rem;
  text-align: center;
  transform: translateX(-50%);
}

.traka-enter-active,
.traka-leave-active,
.poruka-enter-active,
.poruka-leave-active {
  transition: opacity 0.25s, transform 0.3s var(--ease);
}

.traka-enter-from,
.traka-leave-to,
.poruka-enter-from,
.poruka-leave-to {
  opacity: 0;
  transform: translate(-50%, 14px);
}

@media (max-width: 600px) {
  .ig-traka {
    align-items: flex-start;
    padding-left: 16px;
    padding-right: 16px;
  }

  .ig-ikona {
    margin-top: 2px;
  }

  .alatna {
    padding: 0 4px;
  }

  .filtar {
    padding: 0 13px;
  }

  .odabir-traka {
    box-sizing: border-box;
    width: calc(100vw - 24px);
    max-width: 420px;
    justify-content: space-between;
    gap: 6px;
    padding: 6px;
  }

  .odabir-broj {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.85rem;
  }

  .odabir-gumb {
    flex: 0 0 auto;
    min-height: 44px;
    padding: 0 14px;
    font-size: 0.88rem;
  }

  .samo-sirok {
    display: none;
  }
}
</style>
