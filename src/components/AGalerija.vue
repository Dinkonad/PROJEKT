<template>
  <div class="stranica">
    <router-link to="/admin/galerije" class="natrag"><span class="material-icons" aria-hidden="true">arrow_back</span>Sve galerije</router-link>

    <p v-if="ucitano && !g" class="stanje">Ova galerija ne postoji (možda je obrisana).</p>
    <p v-else-if="!g" class="stanje">Učitavanje...</p>

    <template v-else>
      <AZaglavljeStranice :naslov="g.naziv" :podnaslov="[g.klijent, `${g.brojFotki || 0} fotki`, velicinaTekst].filter(Boolean).join(' · ')">
        <button type="button" class="gumb-sekundarni" @click="promijeniPreuzimanje">
          <span class="material-icons" aria-hidden="true">{{ g.preuzimanje === 'zakljucano' ? 'lock' : 'lock_open' }}</span>
          {{ g.preuzimanje === 'zakljucano' ? 'Otključaj preuzimanje' : 'Zaključaj preuzimanje' }}
        </button>
        <button type="button" :class="g.objavljena ? 'gumb-sekundarni' : 'gumb-dodaj'" @click="promijeniObjavu">
          <span class="material-icons" aria-hidden="true">{{ g.objavljena ? 'visibility_off' : 'public' }}</span>
          {{ g.objavljena ? 'Sakrij galeriju' : 'Objavi galeriju' }}
        </button>
      </AZaglavljeStranice>

      <p v-if="!g.objavljena" class="obavijest-skica">
        <span class="material-icons" aria-hidden="true">info</span>
        Galerija je <strong>skica</strong>: klijent je ne može otvoriti dok je ne objaviš.
      </p>

      <!-- LINK -->
      <section class="sekcija">
        <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">link</span>Link za klijenta</h2>
        <p v-if="!GALERIJA_URL" class="mali mali-greska">Adresa klijentske galerije nije postavljena (VITE_GALERIJA_URL), pa se link ne može složiti.</p>
        <template v-else>
          <div class="link-red">
            <input class="unos unos-link" type="text" readonly :value="link" aria-label="Link galerije" @focus="$event.target.select()" />
            <button type="button" class="gumb-primarni" @click="kopiraj(link, 'link')">{{ kopirano === 'link' ? 'Kopirano ✓' : 'Kopiraj' }}</button>
            <a class="gumb-sekundarni" :href="link" target="_blank" rel="noopener">Otvori</a>
            <button type="button" class="gumb-sekundarni" @click="otvoriQr"><span class="material-icons" aria-hidden="true">qr_code_2</span>QR kod</button>
          </div>

          <details class="detalji">
            <summary>Poseban link za svaku osobu (da vidiš tko ga otvara)</summary>
            <div class="link-red">
              <input v-model="refIme" class="unos" type="text" maxlength="24" placeholder="npr. ana" autocomplete="off" aria-label="Oznaka osobe" />
              <button type="button" class="gumb-sekundarni" :disabled="!refIme.trim()" @click="kopiraj(refLink, 'ref')">{{ kopirano === 'ref' ? 'Kopirano ✓' : 'Kopiraj link' }}</button>
            </div>
            <p class="mali">Isti sadržaj, ali se pregledi broje posebno. Samo slova, brojke, - i _.</p>
          </details>

          <div v-if="!potvrdaNovogLinka" class="novi-link">
            <button type="button" class="gumb-tekst" @click="potvrdaNovogLinka = true"><span class="material-icons" aria-hidden="true">autorenew</span>Napravi novi link (stari prestaje raditi)</button>
          </div>
          <div v-else class="novi-link potvrda">
            <span class="potvrda-tekst">Stari link se odmah gasi. Koristi to ako je link procurio.</span>
            <button type="button" class="gumb-sekundarni" @click="potvrdaNovogLinka = false">Odustani</button>
            <button type="button" class="gumb-opasnost" @click="napraviNoviLink">Novi link</button>
          </div>
        </template>
      </section>

      <!-- UPLOAD -->
      <section class="sekcija">
        <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">cloud_upload</span>Dodaj fotke</h2>
        <div
          class="odlozi"
          :class="{ povuceno }"
          @dragover.prevent="povuceno = true"
          @dragleave.prevent="povuceno = false"
          @drop.prevent="naDrop"
        >
          <span class="material-icons odlozi-ikona" aria-hidden="true">add_photo_alternate</span>
          <p class="odlozi-tekst">Povuci fotke ovdje</p>
          <p class="mali">JPG, PNG, WebP, HEIC i RAW (CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF). Original ostaje netaknut.</p>
          <div class="odlozi-gumbi">
            <button type="button" class="gumb-primarni" :disabled="uploadAktivan" @click="$refs.datoteke.click()">Odaberi fotke</button>
            <button type="button" class="gumb-sekundarni" :disabled="uploadAktivan" @click="$refs.mapa.click()">Odaberi mapu</button>
          </div>
          <input ref="datoteke" type="file" multiple :accept="ACCEPT" class="sr-only" tabindex="-1" @change="naOdabir" />
          <input ref="mapa" type="file" webkitdirectory multiple class="sr-only" tabindex="-1" @change="naOdabir" />
        </div>

        <div v-if="stanja.length" class="napredak">
          <div class="napredak-zaglavlje">
            <strong>{{ gotoviBroj }} / {{ stanja.length }}</strong>
            <span class="mali">{{ uploadAktivan ? 'Šalje se... ne zatvaraj stranicu' : (neuspjeleBroj ? `${neuspjeleBroj} nije uspjelo` : 'Gotovo') }}</span>
            <span class="razmak"></span>
            <button v-if="uploadAktivan" type="button" class="gumb-tekst" @click="prekid.zaustavi = true">Prekini</button>
            <button v-else-if="neuspjeleBroj" type="button" class="gumb-sekundarni" @click="ponoviNeuspjele">Pokušaj ponovno ({{ neuspjeleBroj }})</button>
            <button v-else type="button" class="gumb-tekst" @click="ocistiPopis">Očisti popis</button>
          </div>
          <div class="traka" role="progressbar" :aria-valuenow="Math.round(ukupniNapredak * 100)" aria-valuemin="0" aria-valuemax="100">
            <div class="traka-ispuna" :style="{ width: `${ukupniNapredak * 100}%` }"></div>
          </div>
          <ul class="popis-datoteka">
            <li v-for="(s, i) in prikazaniStanja" :key="i" :class="'st-' + s.stanje">
              <span class="material-icons" aria-hidden="true">{{ ikonaStanja(s.stanje) }}</span>
              <span class="ime">{{ s.ime }}</span>
              <span class="mali">{{ opisStanja(s) }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- FOTKE -->
      <section class="sekcija">
        <div class="sekcija-red">
          <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">photo_library</span>Fotografije ({{ fotke.length }})</h2>
          <span class="razmak"></span>
          <template v-if="fotke.length">
            <button type="button" class="gumb-tekst" @click="odaberiSve">{{ odabrane.length === fotke.length ? 'Poništi odabir' : 'Odaberi sve' }}</button>
          </template>
        </div>
        <p v-if="greskaFotki" class="mali mali-greska">{{ greskaFotki }}</p>
        <p v-else-if="!fotke.length" class="mali">Još nema fotki.</p>

        <div v-if="odabrane.length" class="alati-odabira">
          <strong>{{ odabrane.length }} odabrano</strong>
          <button v-if="odabrane.length === 1" type="button" class="gumb-sekundarni" @click="postaviKaoNaslovnu"><span class="material-icons" aria-hidden="true">star</span>Postavi naslovnu</button>
          <button type="button" class="gumb-opasnost" @click="potvrdaBrisanjaFotki = true"><span class="material-icons" aria-hidden="true">delete</span>Obriši</button>
        </div>

        <div class="fotke">
          <button
            v-for="f in fotke"
            :key="f.i"
            type="button"
            class="fotka"
            :class="{ odabrana: odabrane.includes(f.i) }"
            :style="{ backgroundColor: f.c || 'var(--bg-card-muted)' }"
            :aria-pressed="odabrane.includes(f.i)"
            :aria-label="`${f.n}${g.naslovnaId === f.i ? ' (naslovna)' : ''}`"
            @click="prebaciOdabir(f.i)"
          >
            <img v-if="urlovi[f.i]" :src="urlovi[f.i]" :alt="f.n" loading="lazy" decoding="async" />
            <span class="fotka-kvacica"><span class="material-icons" aria-hidden="true">{{ odabrane.includes(f.i) ? 'check_circle' : 'radio_button_unchecked' }}</span></span>
            <span v-if="g.naslovnaId === f.i" class="fotka-naslovna"><span class="material-icons" aria-hidden="true">star</span>Naslovna</span>
            <span v-if="f.t === 'raw'" class="fotka-raw">RAW</span>
            <span v-if="g.fotkaPreuzimanja && g.fotkaPreuzimanja[f.i]" class="fotka-preuzimanja"><span class="material-icons" aria-hidden="true">download</span>{{ g.fotkaPreuzimanja[f.i] }}</span>
          </button>
        </div>
      </section>

      <!-- POSTAVKE -->
      <section class="sekcija">
        <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">tune</span>Postavke galerije</h2>
        <form class="forma" @submit.prevent="spremiPostavke">
          <div class="forma-red">
            <div class="polje"><label for="p-naziv">Naziv</label><input id="p-naziv" v-model="forma.naziv" class="unos" type="text" maxlength="120" required /></div>
            <div class="polje"><label for="p-klijent">Klijent</label><input id="p-klijent" v-model="forma.klijent" class="unos" type="text" maxlength="120" /></div>
          </div>
          <div class="forma-red">
            <div class="polje"><label for="p-datum">Datum događaja</label><input id="p-datum" v-model="forma.datum" class="unos" type="date" /></div>
            <div class="polje"><label for="p-rok">Link vrijedi do (prazno = zauvijek)</label><input id="p-rok" v-model="forma.rok" class="unos" type="date" /></div>
          </div>
          <div class="polje"><label for="p-ig">Tvoj Instagram</label><input id="p-ig" v-model="forma.instagram" class="unos" type="text" maxlength="40" placeholder="@nagy.photos" autocapitalize="off" autocomplete="off" /></div>
          <div class="polje">
            <label for="p-poruka">Natpis na vrhu galerije</label>
            <textarea id="p-poruka" v-model="forma.poruka" class="unos" rows="3" maxlength="400" :placeholder="zadanaPoruka"></textarea>
            <span class="mali">Ako ostaviš prazno, klijent vidi zadani tekst (uz tvoj Instagram).</span>
          </div>
          <div class="prozor-radnje">
            <button type="submit" class="gumb-primarni" :disabled="spremaPostavke">{{ spremaPostavke ? 'Sprema...' : 'Spremi postavke' }}</button>
          </div>
        </form>

        <div class="pin-blok">
          <h3 class="podnaslov-sekcije">PIN za otvaranje galerije</h3>
          <p class="mali">{{ g.pinHash ? 'PIN je postavljen: klijent ga mora upisati da vidi fotke.' : 'Bez PIN-a svatko s linkom vidi galeriju. S PIN-om link nije dovoljan.' }}</p>
          <div class="link-red">
            <input v-model="pinUnos" class="unos" type="text" inputmode="numeric" maxlength="12" placeholder="4 do 12 znakova" autocomplete="off" aria-label="Novi PIN" />
            <button type="button" class="gumb-sekundarni" :disabled="pinUnos.length < 4" @click="spremiPin">{{ g.pinHash ? 'Promijeni PIN' : 'Postavi PIN' }}</button>
            <button v-if="g.pinHash" type="button" class="gumb-tekst" @click="ukloniPin">Ukloni PIN</button>
          </div>
        </div>
      </section>

      <!-- STATISTIKA -->
      <section class="sekcija">
        <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">insights</span>Statistika</h2>
        <div class="brojke">
          <div class="brojka"><strong>{{ stat.pregleda }}</strong><span>pregleda</span></div>
          <div class="brojka"><strong>{{ stat.jedinstvenih }}</strong><span>jedinstvenih posjetitelja</span></div>
          <div class="brojka"><strong>{{ stat.preuzimanja }}</strong><span>preuzetih fotki</span></div>
          <div class="brojka"><strong>{{ stat.zipova }}</strong><span>ZIP preuzimanja</span></div>
        </div>
        <p class="mali">Zadnji pregled: {{ vrijeme(stat.zadnjiPregled) }} · zadnje preuzimanje: {{ vrijeme(stat.zadnjePreuzimanje) }}</p>
        <p class="mali">Uređaji: mobitel {{ stat.uredaji?.mobitel || 0 }}, računalo {{ stat.uredaji?.racunalo || 0 }}</p>
        <table v-if="refovi.length" class="tablica">
          <thead><tr><th>Link osobe</th><th>Pregleda</th></tr></thead>
          <tbody><tr v-for="r in refovi" :key="r[0]"><td>{{ r[0] }}</td><td>{{ r[1] }}</td></tr></tbody>
        </table>
        <p class="mali">Isti posjetitelj u 30 minuta se broji jednom. Ne bilježi se ime ni adresa, samo anonimna oznaka uređaja.</p>
      </section>

      <!-- OPASNO -->
      <section class="sekcija opasno">
        <h2 class="sekcija-naslov"><span class="material-icons" aria-hidden="true">warning</span>Brisanje galerije</h2>
        <p class="mali">Trajno briše sve fotke (i originale) iz R2 i galeriju. Ne može se poništiti.</p>
        <button type="button" class="gumb-opasnost-tanki" @click="potvrdaBrisanjaGalerije = true"><span class="material-icons" aria-hidden="true">delete_forever</span>Obriši galeriju</button>
      </section>
    </template>

    <!-- QR -->
    <Transition name="fade">
      <div v-if="qrOtvoren" class="pozadina" @mousedown.self="qrOtvoren = false">
        <div class="prozor" role="dialog" aria-modal="true" aria-label="QR kod">
          <div class="prozor-zaglavlje">
            <h2>QR kod galerije</h2>
            <button type="button" class="ikona-gumb" aria-label="Zatvori" @click="qrOtvoren = false"><span class="material-icons" aria-hidden="true">close</span></button>
          </div>
          <div class="prozor-tijelo qr">
            <div class="qr-slika" v-html="qrSvg" role="img" aria-label="QR kod koji vodi na galeriju"></div>
            <p class="mali">Skeniranjem se otvara link galerije. Isprintaj ga na karticu ili plakat.</p>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="preuzmiQr('svg')">Preuzmi SVG</button>
              <button type="button" class="gumb-primarni" @click="preuzmiQr('png')">Preuzmi PNG</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- potvrde -->
    <Transition name="fade">
      <div v-if="potvrdaBrisanjaFotki" class="pozadina" @mousedown.self="potvrdaBrisanjaFotki = false">
        <div class="prozor" role="dialog" aria-modal="true">
          <div class="prozor-zaglavlje"><h2>Obrisati {{ odabrane.length }} fotki?</h2></div>
          <div class="prozor-tijelo">
            <p>Fotke se trajno brišu iz galerije i iz R2 (i originali). Klijent ih više neće vidjeti.</p>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="potvrdaBrisanjaFotki = false">Odustani</button>
              <button type="button" class="gumb-opasnost" :disabled="brise" @click="obrisiOdabrane">{{ brise ? 'Briše se...' : 'Obriši' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="potvrdaBrisanjaGalerije" class="pozadina" @mousedown.self="potvrdaBrisanjaGalerije = false">
        <div class="prozor" role="dialog" aria-modal="true">
          <div class="prozor-zaglavlje"><h2>Obrisati cijelu galeriju?</h2></div>
          <div class="prozor-tijelo">
            <p>Galerija „{{ g?.naziv }}" i svih {{ g?.brojFotki || 0 }} fotki bit će trajno obrisano. Link klijenta prestaje raditi.</p>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="potvrdaBrisanjaGalerije = false">Odustani</button>
              <button type="button" class="gumb-opasnost" :disabled="brise" @click="obrisiCijelu">{{ brise ? 'Briše se...' : 'Obriši galeriju' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Jedna galerija: link i QR za klijenta, upload (orig. netaknut), popis fotki, postavke (PIN, rok, zaključavanje), statistika.
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QRCode from 'qrcode';
import AZaglavljeStranice from './AZaglavljeStranice.vue';
import { db } from '@/services/firebase.js';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { obavijesti } from '@/services/obavijest.js';
import {
  uploadajFotke, popisFotki, obrisiFotke, postaviNaslovnu, noviToken, postaviPin, obrisiGaleriju, linkGalerije, GALERIJA_URL
} from '@/services/galerije.js';
import { ACCEPT, podrzanaDatoteka } from '@/utils/slike.js';

const route = useRoute();
const router = useRouter();
const gid = route.params.id;

const g = ref(null);
const ucitano = ref(false);
const fotke = ref([]);
const urlovi = ref({});
const greskaFotki = ref('');
const odabrane = ref([]);

const forma = reactive({ naziv: '', klijent: '', datum: '', rok: '', instagram: '', poruka: '' });
const spremaPostavke = ref(false);
const pinUnos = ref('');
const refIme = ref('');
const kopirano = ref('');
const potvrdaNovogLinka = ref(false);
const potvrdaBrisanjaFotki = ref(false);
const potvrdaBrisanjaGalerije = ref(false);
const brise = ref(false);
const qrOtvoren = ref(false);
const qrSvg = ref('');

const povuceno = ref(false);
const stanja = ref([]);
const uploadAktivan = ref(false);
const prekid = reactive({ zaustavi: false });
let datotekeZaUpload = [];

const zadanaPoruka = 'Ako objavljujete fotografije, molim vas da me označite na Instagramu. Puno ljudi će ih vidjeti, a ne znaju od koga su.';

let odjava = null;
let prviPut = true;

const link = computed(() => (g.value?.token ? linkGalerije(g.value.token) : ''));
const refLink = computed(() => (g.value?.token ? linkGalerije(g.value.token, refIme.value) : ''));
const stat = computed(() => ({ pregleda: 0, jedinstvenih: 0, preuzimanja: 0, zipova: 0, ...(g.value?.statistika || {}) }));
const refovi = computed(() => Object.entries(stat.value.refovi || {}).sort((a, b) => b[1] - a[1]));
const velicinaTekst = computed(() => {
  const b = g.value?.velicinaUkupno || 0;
  if (!b) return '';
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
});

const vrijeme = (ts) => {
  if (!ts) return 'nikad';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? 'nikad' : d.toLocaleString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const osvjeziFotke = async () => {
  greskaFotki.value = '';
  try {
    const o = await popisFotki(gid);
    fotke.value = o.fotke;
    urlovi.value = o.urlovi;
    odabrane.value = odabrane.value.filter((i) => o.fotke.some((f) => f.i === i));
  } catch (e) {
    greskaFotki.value = `Popis fotki se ne može učitati: ${e.message}`;
  }
};

const kopiraj = async (tekst, oznaka) => {
  try {
    await navigator.clipboard.writeText(tekst);
  } catch {
    const t = document.createElement('textarea');
    t.value = tekst;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch { /* ništa */ }
    document.body.removeChild(t);
  }
  kopirano.value = oznaka;
  setTimeout(() => { if (kopirano.value === oznaka) kopirano.value = ''; }, 1800);
};

// ---------- QR
const otvoriQr = async () => {
  qrSvg.value = await QRCode.toString(link.value, { type: 'svg', margin: 2, width: 280, errorCorrectionLevel: 'M' });
  qrOtvoren.value = true;
};

const preuzmiQr = async (vrsta) => {
  const a = document.createElement('a');
  if (vrsta === 'svg') {
    const svg = await QRCode.toString(link.value, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  } else {
    a.href = await QRCode.toDataURL(link.value, { margin: 2, width: 1200, errorCorrectionLevel: 'M' });
  }
  a.download = `qr-${(g.value.naziv || 'galerija').replace(/[^\w-]+/g, '_')}.${vrsta}`;
  a.click();
};

// ---------- postavke
const popuniFormu = () => {
  Object.assign(forma, {
    naziv: g.value.naziv || '', klijent: g.value.klijent || '', datum: g.value.datum || '', rok: g.value.rok || '',
    instagram: g.value.instagram ? `@${g.value.instagram}` : '', poruka: g.value.poruka || ''
  });
};

const spremiPostavke = async () => {
  if (spremaPostavke.value || !forma.naziv.trim()) return;
  spremaPostavke.value = true;
  try {
    const ig = forma.instagram.replace(/[^A-Za-z0-9._]/g, '').slice(0, 40);
    try { localStorage.setItem('galerije-instagram', ig); } catch { /* ništa */ }
    await updateDoc(doc(db, 'galerije', gid), {
      naziv: forma.naziv.trim().slice(0, 120), klijent: forma.klijent.trim().slice(0, 120), datum: forma.datum || '',
      rok: forma.rok || null, instagram: ig, poruka: forma.poruka.trim().slice(0, 400), izmijenjeno: serverTimestamp()
    });
    obavijesti('Postavke su spremljene.');
  } catch (e) {
    obavijesti(`Greška pri spremanju: ${e.message}`, 'greska');
  } finally {
    spremaPostavke.value = false;
  }
};

const promijeniObjavu = async () => {
  if (!g.value.objavljena && !fotke.value.length && !window.confirm('Galerija nema fotki. Svejedno je objaviti?')) return;
  try { await updateDoc(doc(db, 'galerije', gid), { objavljena: !g.value.objavljena, izmijenjeno: serverTimestamp() }); } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

const promijeniPreuzimanje = async () => {
  try {
    await updateDoc(doc(db, 'galerije', gid), { preuzimanje: g.value.preuzimanje === 'zakljucano' ? 'otvoreno' : 'zakljucano', izmijenjeno: serverTimestamp() });
  } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

const spremiPin = async () => {
  try {
    await postaviPin(gid, pinUnos.value);
    pinUnos.value = '';
    obavijesti('PIN je postavljen.');
  } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

const ukloniPin = async () => {
  try {
    await postaviPin(gid, null);
    obavijesti('PIN je uklonjen.');
  } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

const napraviNoviLink = async () => {
  potvrdaNovogLinka.value = false;
  try {
    await noviToken(gid);
    obavijesti('Novi link je spreman. Stari više ne radi.');
  } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

// ---------- upload
const dodajDatoteke = (lista) => {
  const sve = [...lista];
  const dobre = sve.filter((f) => f.size > 0 && podrzanaDatoteka(f.name));
  const preskoceno = sve.length - dobre.length;
  if (preskoceno) obavijesti(`${preskoceno} datoteka je preskočeno (nepodržan format ili prazna).`);
  if (!dobre.length) return;
  pokreniUpload(dobre);
};

const naOdabir = (e) => {
  dodajDatoteke(e.target.files || []);
  e.target.value = '';
};

const naDrop = (e) => {
  povuceno.value = false;
  dodajDatoteke(e.dataTransfer?.files || []);
};

const pokreniUpload = async (datoteke) => {
  if (uploadAktivan.value) return;
  datotekeZaUpload = datoteke;
  stanja.value = datoteke.map((f) => reactive({ ime: f.name, velicina: f.size, stanje: 'ceka', napredak: 0, greska: '' }));
  uploadAktivan.value = true;
  prekid.zaustavi = false;
  try {
    await uploadajFotke(gid, datoteke, stanja.value, { paralelno: 3, prekid });
  } finally {
    uploadAktivan.value = false;
    await osvjeziFotke();
    const neuspjelo = stanja.value.filter((s) => s.stanje === 'greska').length;
    obavijesti(neuspjelo ? `Upload gotov, ${neuspjelo} fotki nije uspjelo.` : 'Sve fotke su spremljene.', neuspjelo ? 'greska' : 'info');
  }
};

const ponoviNeuspjele = () => {
  const ponovno = datotekeZaUpload.filter((_, i) => stanja.value[i]?.stanje === 'greska');
  if (ponovno.length) pokreniUpload(ponovno);
};

const ocistiPopis = () => { stanja.value = []; datotekeZaUpload = []; };

const gotoviBroj = computed(() => stanja.value.filter((s) => s.stanje === 'spremljeno').length);
const neuspjeleBroj = computed(() => stanja.value.filter((s) => s.stanje === 'greska').length);
const ukupniNapredak = computed(() => {
  const ukupno = stanja.value.reduce((z, s) => z + s.velicina, 0);
  return ukupno ? stanja.value.reduce((z, s) => z + s.velicina * s.napredak, 0) / ukupno : 0;
});
// popis prikazuje prvo ono što se događa, da se na tisuću fotki ne izgubi
const prikazaniStanja = computed(() => {
  const red = { greska: 0, salje: 1, priprema: 2, upis: 3, ceka: 4, spremljeno: 5 };
  return [...stanja.value].sort((a, b) => red[a.stanje] - red[b.stanje]).slice(0, 40);
});
const ikonaStanja = (s) => ({ spremljeno: 'check_circle', greska: 'error_outline', salje: 'cloud_upload', priprema: 'hourglass_top', upis: 'sync', ceka: 'schedule' }[s]);
const opisStanja = (s) => ({
  spremljeno: 'spremljeno', salje: `${Math.round(s.napredak * 100)}%`, priprema: 'priprema', upis: 'upis', ceka: 'čeka', greska: s.greska || 'greška'
}[s.stanje]);

const prije = (e) => {
  if (uploadAktivan.value) {
    e.preventDefault();
    e.returnValue = '';
  }
};

// ---------- fotke
const prebaciOdabir = (id) => {
  odabrane.value = odabrane.value.includes(id) ? odabrane.value.filter((x) => x !== id) : [...odabrane.value, id];
};
const odaberiSve = () => { odabrane.value = odabrane.value.length === fotke.value.length ? [] : fotke.value.map((f) => f.i); };

const postaviKaoNaslovnu = async () => {
  try {
    await postaviNaslovnu(gid, odabrane.value[0]);
    odabrane.value = [];
    obavijesti('Naslovna fotka je postavljena.');
  } catch (e) { obavijesti(`Greška: ${e.message}`, 'greska'); }
};

const obrisiOdabrane = async () => {
  brise.value = true;
  try {
    await obrisiFotke(gid, odabrane.value);
    potvrdaBrisanjaFotki.value = false;
    odabrane.value = [];
    await osvjeziFotke();
  } catch (e) {
    obavijesti(`Greška pri brisanju: ${e.message}`, 'greska');
  } finally {
    brise.value = false;
  }
};

const obrisiCijelu = async () => {
  brise.value = true;
  try {
    await obrisiGaleriju(gid);
    router.replace('/admin/galerije');
  } catch (e) {
    obavijesti(`Greška pri brisanju: ${e.message}`, 'greska');
    brise.value = false;
  }
};

watch(() => g.value?.verzija, (nova, stara) => {
  // promjena izvan ove stranice (npr. drugi uređaj) -> osvježi popis
  if (!uploadAktivan.value && stara !== undefined && nova !== stara) osvjeziFotke();
});

onMounted(() => {
  window.addEventListener('beforeunload', prije);
  odjava = onSnapshot(
    doc(db, 'galerije', gid),
    (snimka) => {
      g.value = snimka.exists() ? { id: snimka.id, ...snimka.data({ serverTimestamps: 'estimate' }) } : null;
      ucitano.value = true;
      if (g.value && prviPut) {
        prviPut = false;
        popuniFormu();
        osvjeziFotke();
      }
    },
    (e) => { console.error('Greška pri učitavanju galerije:', e); ucitano.value = true; }
  );
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', prije);
  if (odjava) odjava();
});
</script>

<style scoped>
.natrag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: var(--space-3);
  color: var(--text-muted);
  font-size: 0.88rem;
  text-decoration: none;
}

.natrag .material-icons {
  font-size: 18px;
}

.stanje {
  padding: var(--space-7) var(--space-4);
  text-align: center;
  color: var(--text-muted);
}

.obavijest-skica {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-small);
  color: var(--text-muted);
  font-size: 0.92rem;
}

.sekcija {
  margin-bottom: var(--space-section);
  padding: var(--space-card);
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.sekcija.opasno {
  border-color: var(--danger);
}

.sekcija-naslov {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  font-size: 1.02rem;
  color: var(--text-heading);
}

.sekcija-naslov .material-icons {
  font-size: 22px;
  color: var(--accent);
}

.sekcija-red {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.razmak {
  flex: 1;
}

.podnaslov-sekcije {
  margin: var(--space-4) 0 var(--space-1);
  font-size: 0.92rem;
  color: var(--text-heading);
}

.mali {
  margin: var(--space-1) 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.mali-greska {
  color: var(--danger);
}

.unos {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card);
  color: var(--text-body);
  font-size: 1rem;
}

.unos:focus {
  outline: none;
  border-color: var(--accent);
}

.unos-link {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
}

.link-red {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.link-red .unos {
  flex: 1 1 260px;
  min-width: 0;
}

.detalji {
  margin: var(--space-3) 0;
  font-size: 0.92rem;
}

.detalji summary {
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--space-1) 0;
}

.novi-link {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.potvrda-tekst {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-heading);
}

.gumb-tekst {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
}

.gumb-tekst:hover {
  color: var(--accent);
}

.gumb-tekst .material-icons {
  font-size: 18px;
}

.gumb-opasnost,
.gumb-opasnost-tanki {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: var(--radius-small);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.gumb-opasnost {
  background-color: var(--danger);
  color: #fff;
}

.gumb-opasnost:disabled {
  opacity: 0.6;
}

.gumb-opasnost-tanki {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}

.gumb-opasnost .material-icons,
.gumb-opasnost-tanki .material-icons {
  font-size: 18px;
}

/* upload */
.odlozi {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-card);
  text-align: center;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.odlozi.povuceno {
  border-color: var(--accent);
  background-color: var(--bg-card-muted);
}

.odlozi-ikona {
  font-size: 44px;
  color: var(--accent);
  opacity: 0.7;
}

.odlozi-tekst {
  margin: 0;
  font-weight: 600;
  color: var(--text-heading);
}

.odlozi-gumbi {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.napredak {
  margin-top: var(--space-4);
}

.napredak-zaglavlje {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.traka {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--bg-card-muted);
}

.traka-ispuna {
  height: 100%;
  background-color: var(--accent);
  transition: width 0.3s ease;
}

.popis-datoteka {
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
  max-height: 260px;
  overflow-y: auto;
}

.popis-datoteka li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 0;
  font-size: 0.85rem;
}

.popis-datoteka .ime {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popis-datoteka .material-icons {
  font-size: 18px;
  color: var(--text-muted);
}

.st-spremljeno .material-icons {
  color: var(--success);
}

.st-greska .material-icons,
.st-greska .mali {
  color: var(--danger);
}

/* fotke */
.alati-odabira {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card-muted);
}

.fotke {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.fotka {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--radius-small);
  cursor: pointer;
}

.fotka img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fotka.odabrana {
  border-color: var(--accent);
}

.fotka-kvacica {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.fotka.odabrana .fotka-kvacica {
  color: var(--accent);
}

.fotka-naslovna,
.fotka-raw,
.fotka-preuzimanja {
  position: absolute;
  padding: 1px 7px;
  border-radius: 999px;
  background-color: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
}

.fotka-naslovna {
  left: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.fotka-naslovna .material-icons,
.fotka-preuzimanja .material-icons {
  font-size: 12px;
}

.fotka-raw {
  top: 4px;
  right: 4px;
}

.fotka-preuzimanja {
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* postavke */
.forma {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.forma-red {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.polje {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.polje label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.pin-blok {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}

/* statistika */
.brojke {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.brojka {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card-muted);
}

.brojka strong {
  font-size: 1.5rem;
  color: var(--text-heading);
}

.brojka span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.tablica {
  width: 100%;
  margin: var(--space-3) 0;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.tablica th,
.tablica td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
}

/* prozori */
.pozadina {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(3, 3, 3, 0.55);
}

.prozor {
  width: 460px;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
}

.prozor-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-color);
}

.prozor-zaglavlje h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-heading);
}

.ikona-gumb {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.prozor-tijelo {
  padding: var(--space-4) var(--space-5) var(--space-5);
}

.prozor-radnje {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.qr {
  text-align: center;
}

.qr-slika {
  width: 280px;
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: var(--radius-small);
}

.qr-slika :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .forma-red {
    grid-template-columns: 1fr;
  }

  .fotke {
    grid-template-columns: repeat(3, 1fr);
  }

  .pozadina {
    align-items: flex-start;
  }

  .prozor {
    width: 100%;
  }

  .prozor-radnje > * {
    flex: 1;
  }
}
</style>
