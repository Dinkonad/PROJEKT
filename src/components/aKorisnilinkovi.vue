<template>
  <div class="stranica">
    <AZaglavljeStranice naslov="Linkovi" :podnaslov="podnaslov">
      <button type="button" class="gumb-sekundarni" @click="otvoriPostavljanje">
        <span class="material-icons" aria-hidden="true">ios_share</span>Spremanje s mobitela
      </button>
    </AZaglavljeStranice>

    <!-- dodavanje: zalijepi cijelu poruku s linkom, backend sam izvuče link, naslov i sličicu -->
    <section class="dodaj">
      <div class="dodaj-red">
        <div class="polje-link">
          <span class="material-icons polje-ikona" aria-hidden="true">link</span>
          <input
            v-model="unos"
            type="text"
            inputmode="url"
            class="unos-link"
            placeholder="Zalijepi link ili poruku s linkom"
            aria-label="Link za spremanje"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :disabled="sprema"
            @keydown.enter.prevent="spremiUnos"
          />
        </div>
        <div class="dodaj-gumbi">
          <button type="button" class="gumb-sekundarni" :disabled="sprema" @click="zalijepiISpremi">
            <span class="material-icons" aria-hidden="true">content_paste</span>Zalijepi
          </button>
          <button type="button" class="gumb-dodaj" :disabled="sprema || !unos.trim()" @click="spremiUnos">
            <span class="material-icons" aria-hidden="true">bookmark_add</span>{{ sprema ? 'Sprema...' : 'Spremi' }}
          </button>
        </div>
      </div>

      <button type="button" class="vise-gumb" :aria-expanded="dodatno" @click="dodatno = !dodatno">
        <span class="material-icons" aria-hidden="true">{{ dodatno ? 'expand_less' : 'add' }}</span>
        Bilješka i oznake (nije obavezno)
      </button>

      <div v-if="dodatno" class="dodatno">
        <textarea
          v-model="novaBiljeska"
          rows="2"
          class="unos-biljeska"
          placeholder="Što ti se sviđa na ovome? (npr. tranzicija na 0:07, glazba)"
          aria-label="Bilješka uz link"
        ></textarea>
        <div class="oznake-uredi">
          <span v-for="o in noveOznake" :key="o" class="oznaka oznaka-aktivna">
            {{ o }}
            <button type="button" :aria-label="`Ukloni oznaku ${o}`" @click="noveOznake = noveOznake.filter((x) => x !== o)">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </span>
          <input
            v-model="novaOznaka"
            type="text"
            class="unos-oznaka"
            placeholder="Nova oznaka + Enter"
            aria-label="Nova oznaka"
            maxlength="30"
            @keydown="tipkaNoveOznake"
          />
        </div>
        <div v-if="predlozeneNove.length" class="oznake-prijedlozi">
          <button v-for="o in predlozeneNove" :key="o" type="button" class="oznaka" @click="noveOznake.push(o)">+ {{ o }}</button>
        </div>
      </div>

      <p v-if="poruka.tekst" class="poruka" :class="'poruka-' + poruka.vrsta" role="status" aria-live="polite">
        <span class="material-icons" aria-hidden="true">{{ poruka.vrsta === 'ok' ? 'check_circle' : poruka.vrsta === 'greska' ? 'error_outline' : 'info' }}</span>
        {{ poruka.tekst }}
      </p>
    </section>

    <p v-if="ucitava" class="stanje">Učitavaju se linkovi...</p>
    <p v-else-if="greskaUcitavanja" class="stanje stanje-greska">Linkovi se nisu mogli učitati. Provjeri internet pa povuci stranicu prema dolje.</p>

    <div v-else-if="!linkovi.length" class="prazno">
      <span class="material-icons prazno-ikona" aria-hidden="true">video_library</span>
      <p class="prazno-naslov">Još nema spremljenih linkova</p>
      <p class="prazno-opis">
        Zalijepi prvi link gore, a još bolje: uključi spremanje jednim dodirom pa videe s Instagrama, Facebooka i TikToka
        spremaš izravno iz tih aplikacija (Podijeli → Spremi u Nagy).
      </p>
      <button type="button" class="gumb-dodaj" @click="otvoriPostavljanje">
        <span class="material-icons" aria-hidden="true">ios_share</span>Kako uključiti
      </button>
    </div>

    <template v-else>
      <!-- filteri: platforma, oznaka, pretraga -->
      <div class="tabovi" role="tablist" aria-label="Platforma">
        <button type="button" class="tab" :class="{ aktivan: !odabranaPlatforma }" @click="odabranaPlatforma = ''">
          Sve <span class="tab-broj">{{ linkovi.length }}</span>
        </button>
        <button
          v-for="p in dostupnePlatforme"
          :key="p.kljuc"
          type="button"
          class="tab"
          :class="{ aktivan: odabranaPlatforma === p.kljuc }"
          @click="odabranaPlatforma = odabranaPlatforma === p.kljuc ? '' : p.kljuc"
        >
          {{ p.naziv }} <span class="tab-broj">{{ p.broj }}</span>
        </button>
      </div>

      <div class="pretraga-polje">
        <span class="material-icons pretraga-ikona" aria-hidden="true">search</span>
        <input v-model="pretraga" type="search" placeholder="Traži po naslovu, autoru, bilješci, oznaci..." aria-label="Traži linkove" autocomplete="off" enterkeyhint="search" />
        <button v-if="pretraga" type="button" class="pretraga-ocisti" aria-label="Očisti pretragu" @click="pretraga = ''">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </div>

      <div v-if="sveOznake.length" class="oznake-filter" role="group" aria-label="Oznake">
        <button
          v-for="o in sveOznake"
          :key="o.naziv"
          type="button"
          class="oznaka"
          :class="{ 'oznaka-aktivna': odabranaOznaka === o.naziv }"
          :aria-pressed="odabranaOznaka === o.naziv"
          @click="odabranaOznaka = odabranaOznaka === o.naziv ? '' : o.naziv"
        >
          #{{ o.naziv }} <span class="oznaka-broj">{{ o.broj }}</span>
        </button>
      </div>

      <p v-if="!prikazani.length" class="stanje">Nema linkova za ovaj odabir.</p>

      <div v-else class="mreza">
        <article
          v-for="link in prikazani"
          :key="link.id"
          class="video"
          role="link"
          tabindex="0"
          :aria-label="`Otvori: ${link.naziv}`"
          @click="otvori(link)"
          @keydown.enter.self.prevent="otvori(link)"
        >
          <div class="video-slika" :class="'tip-' + platforma(link)">
            <img
              v-if="link.slika && !slikaPala[link.id]"
              :src="link.slika"
              :alt="''"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              @error="slikaPala[link.id] = true"
            />
            <div v-else class="video-zamjena" aria-hidden="true">
              <span class="material-icons">play_circle</span>
              <strong>{{ PLATFORME[platforma(link)].kratko }}</strong>
            </div>
            <span class="video-platforma">{{ PLATFORME[platforma(link)].naziv }}</span>
            <button type="button" class="video-uredi" aria-label="Uredi" title="Uredi" @click.stop="uredi(link)">
              <span class="material-icons" aria-hidden="true">edit</span>
            </button>
          </div>
          <div class="video-tijelo">
            <h3 class="video-naziv">{{ link.naziv || 'Bez naslova' }}</h3>
            <p v-if="link.autor" class="video-autor">{{ link.autor }}</p>
            <p v-if="link.biljeska" class="video-biljeska">{{ link.biljeska }}</p>
            <div v-if="link.oznake && link.oznake.length" class="video-oznake">
              <span v-for="o in link.oznake" :key="o" class="oznaka oznaka-mala">#{{ o }}</span>
            </div>
            <span class="video-datum">{{ kratkiDatum(link) }}</span>
          </div>
        </article>
      </div>
    </template>

    <!-- uređivanje -->
    <Transition name="fade">
      <div v-if="ur" class="pozadina" @mousedown.self="zatvoriUredivanje">
        <div class="prozor" role="dialog" aria-modal="true" aria-label="Uredi link">
          <div class="prozor-zaglavlje">
            <h2>Uredi link</h2>
            <button type="button" class="ikona-gumb" aria-label="Zatvori" @click="zatvoriUredivanje">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="prozor-tijelo">
            <label class="oznaka-polja" for="ur-naziv">Naslov</label>
            <input id="ur-naziv" v-model="ur.naziv" type="text" class="unos" maxlength="200" autocomplete="off" />

            <label class="oznaka-polja" for="ur-biljeska">Bilješka</label>
            <textarea id="ur-biljeska" v-model="ur.biljeska" rows="4" class="unos" placeholder="Što ti se sviđa na ovome?"></textarea>

            <span class="oznaka-polja">Oznake</span>
            <div class="oznake-uredi">
              <span v-for="o in ur.oznake" :key="o" class="oznaka oznaka-aktivna">
                {{ o }}
                <button type="button" :aria-label="`Ukloni oznaku ${o}`" @click="ur.oznake = ur.oznake.filter((x) => x !== o)">
                  <span class="material-icons" aria-hidden="true">close</span>
                </button>
              </span>
              <input
                v-model="urOznaka"
                type="text"
                class="unos-oznaka"
                placeholder="Nova oznaka + Enter"
                aria-label="Nova oznaka"
                maxlength="30"
                @keydown="tipkaUrOznake"
              />
            </div>
            <div v-if="predlozeneUr.length" class="oznake-prijedlozi">
              <button v-for="o in predlozeneUr" :key="o" type="button" class="oznaka" @click="ur.oznake.push(o)">+ {{ o }}</button>
            </div>

            <a class="izvor" :href="ur.url" target="_blank" rel="noopener noreferrer">
              <span class="material-icons" aria-hidden="true">open_in_new</span>
              <span class="izvor-tekst">{{ skratiUrl(ur.url) }}</span>
            </a>
          </div>

          <div v-if="!potvrdaBrisanja" class="prozor-podnozje">
            <button type="button" class="gumb-opasnost-tanki" @click="potvrdaBrisanja = true">
              <span class="material-icons" aria-hidden="true">delete</span>Obriši
            </button>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="zatvoriUredivanje">Odustani</button>
              <button type="button" class="gumb-primarni" :disabled="spremaUredbe" @click="spremiUredbe">
                {{ spremaUredbe ? 'Sprema...' : 'Spremi' }}
              </button>
            </div>
          </div>
          <div v-else class="prozor-podnozje potvrda">
            <span class="potvrda-tekst">Obrisati ovaj link? To se ne može poništiti.</span>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="potvrdaBrisanja = false">Odustani</button>
              <button type="button" class="gumb-opasnost" :disabled="spremaUredbe" @click="obrisiLink">Obriši</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- spremanje s mobitela -->
    <Transition name="fade">
      <div v-if="postavljanjeOtvoreno" class="pozadina" @mousedown.self="postavljanjeOtvoreno = false">
        <div class="prozor prozor-siroki" role="dialog" aria-modal="true" aria-label="Spremanje s mobitela">
          <div class="prozor-zaglavlje">
            <h2>Spremanje s mobitela</h2>
            <button type="button" class="ikona-gumb" aria-label="Zatvori" @click="postavljanjeOtvoreno = false">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
          <div class="prozor-tijelo">
            <p class="uvod">
              Na Instagramu, Facebooku, TikToku ili YouTubeu dodirni <strong>Podijeli</strong>, odaberi
              <strong>„Spremi u Nagy“</strong> i video je spremljen sa sličicom i naslovom, bez otvaranja ove aplikacije.
              Prečac napraviš jednom (oko 2 minute):
            </p>

            <div class="dnevnik">
              <span class="oznaka-polja">Zadnji pokušaji spremanja</span>
              <p v-if="!dnevnik.length" class="mali">
                Još nijedan pokušaj nije stigao na server. Ako si podijelio link preko prečaca, a ovdje nema ničega,
                zahtjev uopće ne dolazi do servera (provjeri adresu u prečacu).
              </p>
              <ul v-else class="dnevnik-popis">
                <li v-for="z in dnevnik" :key="z.id" :class="'dnevnik-' + z.ishod">
                  <span class="material-icons" aria-hidden="true">{{ z.ishod === 'ok' ? 'check_circle' : z.ishod === 'duplikat' ? 'content_copy' : 'error_outline' }}</span>
                  <div class="dnevnik-tekst">
                    <span>{{ z.poruka }}</span>
                    <small>{{ vrijemeZapisa(z) }} · {{ z.izvor === 'precac' ? 'prečac s mobitela' : 'app' }}<template v-if="z.ishod === 'greska' && z.primljeno"> · prečac je poslao: „{{ z.primljeno }}“</template></small>
                  </div>
                </li>
              </ul>
            </div>

            <div class="kopiraj-blok">
              <span class="oznaka-polja">1. Adresa</span>
              <div class="kopiraj-red">
                <code class="kopiraj-vrijednost">{{ adresa || 'Backend adresa nije postavljena' }}</code>
                <button type="button" class="gumb-sekundarni" :disabled="!adresa" @click="kopiraj('adresa', adresa)">
                  {{ kopirano === 'adresa' ? 'Kopirano ✓' : 'Kopiraj' }}
                </button>
              </div>
            </div>

            <div class="kopiraj-blok">
              <span class="oznaka-polja">2. Tajni ključ</span>
              <p v-if="kljucUcitava" class="mali">Učitavam ključ (server se možda budi, do minute)...</p>
              <p v-else-if="kljucGreska" class="mali mali-greska">{{ kljucGreska }}</p>
              <div v-else class="kopiraj-red">
                <code class="kopiraj-vrijednost">{{ kljucPrikazan ? kljuc : '••••••••••••••••••••••••' }}</code>
                <button type="button" class="gumb-sekundarni" @click="kljucPrikazan = !kljucPrikazan">{{ kljucPrikazan ? 'Sakrij' : 'Prikaži' }}</button>
                <button type="button" class="gumb-sekundarni" :disabled="!kljuc" @click="kopiraj('kljuc', kljuc)">
                  {{ kopirano === 'kljuc' ? 'Kopirano ✓' : 'Kopiraj' }}
                </button>
              </div>
              <p class="mali">Ključ je lozinka tvog prečaca. Nikome ga ne šalji.</p>
            </div>

            <ol class="koraci">
              <li>Otvori aplikaciju <strong>Prečaci</strong> na iPhoneu, dodirni <strong>+</strong> i nazovi prečac <strong>Spremi u Nagy</strong>.</li>
              <li>
                Dodaj radnju <strong>Dohvati sadržaj URL-a</strong> (u tražilici radnji upiši <em>URL</em>). U polje URL zalijepi
                <em>adresu</em> odozgo.
              </li>
              <li>
                Dodirni <strong>Prikaži više</strong> uz tu radnju. Metodu postavi na <strong>POST</strong>. Kad se pojavi
                <strong>Tijelo zahtjeva</strong> (ili „Zatraži tijelo“), odaberi <strong>JSON</strong>.
              </li>
              <li>
                Dodaj dva polja u tijelo zahtjeva (opcija <strong>Dodaj novo polje</strong>, vrsta <strong>Tekst</strong>):
                <ul>
                  <li>ključ <code>url</code>, vrijednost: dodirni polje i odaberi <strong>Ulazni podatak prečaca</strong></li>
                  <li>ključ <code>kljuc</code>, vrijednost: zalijepi <em>tajni ključ</em> odozgo</li>
                </ul>
              </li>
              <li>
                Dodaj radnju <strong>Dohvati vrijednost rječnika</strong>: vrijednost za ključ <code>poruka</code>, iz
                <strong>Sadržaja URL-a</strong> (rezultat prethodne radnje).
              </li>
              <li>Dodaj radnju <strong>Prikaži obavijest</strong> i u nju stavi tu vrijednost (varijabla <strong>Vrijednost rječnika</strong>).</li>
              <li>
                Dodirni ikonu <strong>i</strong> (postavke prečaca) i uključi <strong>Prikaži u listi za dijeljenje</strong>.
                Vrste ulaznih podataka <strong>ne ograničavaj</strong> (ostavi sve): Instagram ponekad šalje link kao vrstu koju
                iPhone ne računa kao običan URL, pa bi se prečac sakrio.
              </li>
              <li>
                Probaj: u Instagramu otvori bilo koji reel → <strong>Dijeli</strong> (avion) → povuci red s radnjama do kraja →
                <strong>Spremi u Nagy</strong>. Trebala bi stići obavijest „Spremljeno (Instagram): …“.
              </li>
            </ol>

            <p class="mali">
              Gdje ga naći: u izborniku Dijeli prečaci nisu u redu s aplikacijama, nego u donjem redu s radnjama (Kopiraj…).
              Dodirni <strong>Prikaži više</strong>, pomakni se do kraja i dodirni <strong>Uredi radnje</strong>, pa u popisu
              uključi „Spremi u nagy“ i dodaj ga u <strong>Omiljeno</strong> da bude odmah vidljiv.
              Prvo spremanje nakon duže pauze može potrajati do minute jer se server budi.
            </p>
            <p class="mali">
              Što se sprema: link, naslov, autor i malena kopija sličice. Instagram i Facebook ponekad ne daju naslov ili sličicu;
              tada se link ipak spremi, a naslov i sličicu možeš dopisati ovdje u appu (olovka na kartici).
            </p>

            <div class="novi-kljuc">
              <template v-if="!potvrdaNovogKljuca">
                <button type="button" class="gumb-sekundarni" :disabled="kljucUcitava || !kljuc" @click="potvrdaNovogKljuca = true">
                  <span class="material-icons" aria-hidden="true">autorenew</span>Napravi novi ključ
                </button>
              </template>
              <template v-else>
                <span class="potvrda-tekst">Stari prečac prestaje raditi dok ne upišeš novi ključ.</span>
                <div class="prozor-radnje">
                  <button type="button" class="gumb-sekundarni" @click="potvrdaNovogKljuca = false">Odustani</button>
                  <button type="button" class="gumb-opasnost" @click="napraviNoviKljuc">Napravi novi</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Linkovi: spremljeni videi/linkovi s Instagrama, Facebooka, TikToka, YouTubea...
// Dodaju se (1) zalijepljenim linkom ovdje ili (2) jednim dodirom iz drugih aplikacija (iOS Prečac -> backend).
// Backend dohvati naslov, autora i sličicu; ovdje se samo prikazuje, pretražuje i uređuje.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import AZaglavljeStranice from './AZaglavljeStranice.vue';
import { obavijesti } from '@/services/obavijest.js';
import { postaviOsvjezavanje } from '@/store/osvjezavanje.js';
import { db } from '@/services/firebase.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { adresaSpremanja, spremiLinkNaServeru, dohvatiKljucPrecaca, noviKljucPrecaca } from '@/services/linkovi.js';

const PLATFORME = {
  instagram: { naziv: 'Instagram', kratko: 'IG' },
  tiktok: { naziv: 'TikTok', kratko: 'TT' },
  facebook: { naziv: 'Facebook', kratko: 'FB' },
  'youtube-video': { naziv: 'YouTube', kratko: 'YT' },
  x: { naziv: 'X', kratko: 'X' },
  pinterest: { naziv: 'Pinterest', kratko: 'P' },
  ostalo: { naziv: 'Web', kratko: 'WWW' }
};
const REDOSLIJED_PLATFORMI = ['instagram', 'facebook', 'tiktok', 'youtube-video', 'x', 'pinterest', 'ostalo'];
const PREDLOZENE_OZNAKE = ['Reel ideja', 'Tranzicija', 'Glazba', 'Kadar', 'Montaža', 'Naslov i tekst'];

const platforma = (l) => (PLATFORME[l.tip] ? l.tip : 'ostalo');

const linkovi = ref([]);
const ucitava = ref(true);
const greskaUcitavanja = ref(false);
const slikaPala = ref({});

// ---------- dodavanje ----------
const unos = ref('');
const sprema = ref(false);
const dodatno = ref(false);
const novaBiljeska = ref('');
const noveOznake = ref([]);
const novaOznaka = ref('');
const poruka = ref({ vrsta: '', tekst: '' });
let porukaTimer = null;

const postaviPoruku = (vrsta, tekst, nestajeZa = 0) => {
  clearTimeout(porukaTimer);
  poruka.value = { vrsta, tekst };
  if (nestajeZa) porukaTimer = setTimeout(() => { poruka.value = { vrsta: '', tekst: '' }; }, nestajeZa);
};

const ocistiOznaku = (t) => String(t || '').replace(/\s+/g, ' ').trim().replace(/^#+/, '').slice(0, 30);

// zarez/točka-zarez razdvaja oznake (i kad tipkovnica ne javi tipku, npr. neke Android tipkovnice)
const dodajOznaku = (lista, tekst) => {
  let dodano = false;
  for (const dio of String(tekst || '').split(/[,;]/)) {
    const o = ocistiOznaku(dio);
    if (!o || lista.length >= 12 || lista.some((x) => x.toLowerCase() === o.toLowerCase())) continue;
    lista.push(o);
    dodano = true;
  }
  return dodano;
};

const dodajNovuOznaku = () => {
  dodajOznaku(noveOznake.value, novaOznaka.value);
  novaOznaka.value = '';
};

// Enter ili zarez dodaje oznaku
const tipkaNoveOznake = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    dodajNovuOznaku();
  }
};

const izvuciUrl = (tekst) => {
  const m = String(tekst || '').match(/https?:\/\/[^\s<>"']+/i);
  if (m) return m[0].replace(/[.,;:!?)\]}'"]+$/, '');
  const t = String(tekst || '').trim();
  return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t) ? `https://${t}` : null;
};

const prepoznajTip = (url) => {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch { return 'ostalo'; }
  const je = (...d) => d.some((x) => host === x || host.endsWith(`.${x}`));
  if (je('youtube.com', 'youtu.be')) return 'youtube-video';
  if (je('instagram.com', 'instagr.am')) return 'instagram';
  if (je('tiktok.com')) return 'tiktok';
  if (je('facebook.com', 'fb.com', 'fb.watch')) return 'facebook';
  if (je('x.com', 'twitter.com', 't.co')) return 'x';
  if (je('pinterest.com', 'pin.it')) return 'pinterest';
  return 'ostalo';
};

const spremiUnos = async () => {
  const tekst = unos.value.trim();
  if (!tekst || sprema.value) return;
  if (!izvuciUrl(tekst)) {
    postaviPoruku('greska', 'U tekstu nema linka. Zalijepi adresu koja počinje s https://');
    return;
  }

  sprema.value = true;
  postaviPoruku('info', 'Sprema se...');
  const budenje = setTimeout(() => postaviPoruku('info', 'Server se budi, može potrajati do minute...'), 5000);
  const biljeska = novaBiljeska.value.trim();
  const oznake = [...noveOznake.value];

  try {
    const odgovor = await spremiLinkNaServeru({ url: tekst, biljeska, oznake });
    postaviPoruku(odgovor.vec_postoji ? 'info' : 'ok', odgovor.poruka || 'Spremljeno.', 8000);
    unos.value = '';
    novaBiljeska.value = '';
    noveOznake.value = [];
    novaOznaka.value = '';
  } catch (greska) {
    const url = izvuciUrl(tekst);
    if (greska.mrezna && url) {
      // server nedostupan: link se ne smije izgubiti - spremi ga izravno, naslov i sličicu možeš dodati kasnije
      try {
        let host = url;
        try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ostaje cijeli url */ }
        await addDoc(collection(db, 'linkovi'), {
          url,
          naziv: host,
          tip: prepoznajTip(url),
          slika: null,
          autor: '',
          opis: '',
          biljeska,
          oznake,
          kljuc: null,
          izvor: 'app-bez-servera',
          pregled: false,
          datum: serverTimestamp(),
          izmijenjeno: serverTimestamp()
        });
        postaviPoruku('info', 'Server nije dostupan pa je link spremljen bez naslova i sličice. Naslov možeš dopisati olovkom na kartici.', 12000);
        unos.value = '';
        novaBiljeska.value = '';
        noveOznake.value = [];
      } catch (e2) {
        console.error('Greška pri spremanju linka:', e2);
        postaviPoruku('greska', 'Link nije spremljen. Pokušaj ponovno.');
      }
    } else {
      postaviPoruku('greska', greska.message || 'Link nije spremljen. Pokušaj ponovno.');
    }
  } finally {
    clearTimeout(budenje);
    sprema.value = false;
  }
};

// jedan dodir: pročitaj međuspremnik i odmah spremi (iPhone pritom pita "Zalijepi?")
const zalijepiISpremi = async () => {
  try {
    const tekst = await navigator.clipboard.readText();
    if (!tekst || !tekst.trim()) {
      postaviPoruku('info', 'Međuspremnik je prazan. Prvo kopiraj link.', 5000);
      return;
    }
    unos.value = tekst.trim();
    await spremiUnos();
  } catch {
    postaviPoruku('info', 'Zalijepi ručno: dodirni polje i drži prst pa odaberi Zalijepi.', 7000);
  }
};

// ---------- popis ----------
let odjavaSnimke = null;

const pokreniSlusanje = () => {
  if (odjavaSnimke) odjavaSnimke();
  greskaUcitavanja.value = false;
  odjavaSnimke = onSnapshot(
    collection(db, 'linkovi'),
    (snimka) => {
      const lista = [];
      snimka.forEach((d) => lista.push({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      linkovi.value = lista.sort((a, b) => uMs(b.datum) - uMs(a.datum));
      ucitava.value = false;
      greskaUcitavanja.value = false;
    },
    (greska) => {
      console.error('Greška pri učitavanju linkova:', greska);
      ucitava.value = false;
      greskaUcitavanja.value = true;
    }
  );
};

const uMs = (t) => {
  if (!t) return 0;
  const d = t.toDate ? t.toDate() : new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const podnaslov = computed(() => {
  const n = linkovi.value.length;
  if (!n) return '';
  const z2 = n % 100;
  const z = n % 10;
  const rijec = z2 >= 11 && z2 <= 14 ? 'linkova' : z === 1 ? 'link' : z >= 2 && z <= 4 ? 'linka' : 'linkova';
  return `${n} ${rijec}`;
});

const pretraga = ref('');
const odabranaPlatforma = ref('');
const odabranaOznaka = ref('');

const normaliziraj = (t) => String(t ?? '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');

const dostupnePlatforme = computed(() => {
  const brojevi = {};
  for (const l of linkovi.value) brojevi[platforma(l)] = (brojevi[platforma(l)] || 0) + 1;
  return REDOSLIJED_PLATFORMI.filter((k) => brojevi[k]).map((k) => ({ kljuc: k, naziv: PLATFORME[k].naziv, broj: brojevi[k] }));
});

const sveOznake = computed(() => {
  const brojevi = new Map();
  for (const l of linkovi.value) for (const o of l.oznake || []) brojevi.set(o, (brojevi.get(o) || 0) + 1);
  return [...brojevi.entries()].map(([naziv, broj]) => ({ naziv, broj })).sort((a, b) => b.broj - a.broj || a.naziv.localeCompare(b.naziv, 'hr'));
});

const prikazani = computed(() => {
  const rijeci = normaliziraj(pretraga.value).split(/\s+/).filter(Boolean);
  return linkovi.value.filter((l) => {
    if (odabranaPlatforma.value && platforma(l) !== odabranaPlatforma.value) return false;
    if (odabranaOznaka.value && !(l.oznake || []).includes(odabranaOznaka.value)) return false;
    if (!rijeci.length) return true;
    const tekst = normaliziraj(`${l.naziv || ''} ${l.autor || ''} ${l.biljeska || ''} ${(l.oznake || []).join(' ')} ${l.opis || ''} ${l.url || ''}`);
    return rijeci.every((r) => tekst.includes(r));
  });
});

const predlozeneNove = computed(() => {
  const postojece = new Set([...PREDLOZENE_OZNAKE, ...sveOznake.value.map((o) => o.naziv)]);
  return [...postojece].filter((o) => !noveOznake.value.some((x) => x.toLowerCase() === o.toLowerCase())).slice(0, 10);
});

const dvije = (n) => String(n).padStart(2, '0');
const kratkiDatum = (l) => {
  const ms = uMs(l.datum);
  if (!ms) return '';
  const d = new Date(ms);
  const sada = new Date();
  const istiDan = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (istiDan(d, sada)) return 'danas';
  const jucer = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate() - 1);
  if (istiDan(d, jucer)) return 'jučer';
  const dm = `${dvije(d.getDate())}.${dvije(d.getMonth() + 1)}.`;
  return d.getFullYear() === sada.getFullYear() ? dm : `${dm}${d.getFullYear()}.`;
};

const skratiUrl = (url) => {
  const t = String(url || '').replace(/^https?:\/\/(www\.)?/, '');
  return t.length > 60 ? `${t.slice(0, 60)}…` : t;
};

const otvori = (link) => {
  if (link.url) window.open(link.url, '_blank', 'noopener');
};

// ---------- uređivanje ----------
const ur = ref(null);
const urOznaka = ref('');
const spremaUredbe = ref(false);
const potvrdaBrisanja = ref(false);

const uredi = (link) => {
  ur.value = {
    id: link.id,
    url: link.url || '',
    naziv: link.naziv || '',
    biljeska: link.biljeska || '',
    oznake: [...(link.oznake || [])]
  };
  urOznaka.value = '';
  potvrdaBrisanja.value = false;
};

const zatvoriUredivanje = () => {
  ur.value = null;
  potvrdaBrisanja.value = false;
};

const dodajUrOznaku = () => {
  if (ur.value) dodajOznaku(ur.value.oznake, urOznaka.value);
  urOznaka.value = '';
};

const tipkaUrOznake = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    dodajUrOznaku();
  }
};

const predlozeneUr = computed(() => {
  if (!ur.value) return [];
  const postojece = new Set([...PREDLOZENE_OZNAKE, ...sveOznake.value.map((o) => o.naziv)]);
  return [...postojece].filter((o) => !ur.value.oznake.some((x) => x.toLowerCase() === o.toLowerCase())).slice(0, 10);
});

const spremiUredbe = async () => {
  if (!ur.value || spremaUredbe.value) return;
  dodajUrOznaku(); // oznaka upisana, a Enter nije stisnut
  spremaUredbe.value = true;
  try {
    const stari = linkovi.value.find((l) => l.id === ur.value.id);
    await updateDoc(doc(db, 'linkovi', ur.value.id), {
      naziv: ur.value.naziv.trim() || stari?.naziv || 'Bez naslova',
      biljeska: ur.value.biljeska.trim(),
      oznake: ur.value.oznake,
      izmijenjeno: serverTimestamp()
    });
    zatvoriUredivanje();
  } catch (greska) {
    console.error('Greška pri spremanju promjena:', greska);
    obavijesti('Promjene nisu spremljene. Pokušaj ponovno.');
  } finally {
    spremaUredbe.value = false;
  }
};

const obrisiLink = async () => {
  if (!ur.value || spremaUredbe.value) return;
  spremaUredbe.value = true;
  try {
    await deleteDoc(doc(db, 'linkovi', ur.value.id));
    zatvoriUredivanje();
  } catch (greska) {
    console.error('Greška pri brisanju linka:', greska);
    obavijesti('Link nije obrisan. Pokušaj ponovno.');
  } finally {
    spremaUredbe.value = false;
  }
};

// ---------- postavljanje prečaca ----------
const postavljanjeOtvoreno = ref(false);
const adresa = adresaSpremanja();
const kljuc = ref('');
const kljucUcitava = ref(false);
const kljucGreska = ref('');
const kljucPrikazan = ref(false);
const kopirano = ref('');
const potvrdaNovogKljuca = ref(false);
let kopiranoTimer = null;

const ucitajKljuc = async (novi = false) => {
  kljucUcitava.value = true;
  kljucGreska.value = '';
  try {
    kljuc.value = novi ? await noviKljucPrecaca() : await dohvatiKljucPrecaca();
  } catch (greska) {
    kljucGreska.value = greska.message || 'Ključ se nije mogao dohvatiti.';
  } finally {
    kljucUcitava.value = false;
  }
};

const otvoriPostavljanje = () => {
  postavljanjeOtvoreno.value = true;
  potvrdaNovogKljuca.value = false;
  kljucPrikazan.value = false;
  if (!kljuc.value) ucitajKljuc();
};

const napraviNoviKljuc = async () => {
  potvrdaNovogKljuca.value = false;
  await ucitajKljuc(true);
  if (kljuc.value) kljucPrikazan.value = true;
};

const kopiraj = async (naziv, tekst) => {
  if (!tekst) return;
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
  kopirano.value = naziv;
  clearTimeout(kopiranoTimer);
  kopiranoTimer = setTimeout(() => { kopirano.value = ''; }, 1800);
};

// ---------- dnevnik pokušaja (što je stiglo na server) ----------
const dnevnik = ref([]);
let odjavaDnevnika = null;

const vrijemeZapisa = (z) => {
  const ms = uMs(z.vrijeme);
  if (!ms) return '';
  const d = new Date(ms);
  const sada = new Date();
  const sat = `${dvije(d.getHours())}:${dvije(d.getMinutes())}`;
  return d.toDateString() === sada.toDateString() ? `danas ${sat}` : `${dvije(d.getDate())}.${dvije(d.getMonth() + 1)}. ${sat}`;
};

const zaustaviDnevnik = () => {
  if (odjavaDnevnika) odjavaDnevnika();
  odjavaDnevnika = null;
};

watch(postavljanjeOtvoreno, (otvoreno) => {
  zaustaviDnevnik();
  if (!otvoreno) return;
  odjavaDnevnika = onSnapshot(
    query(collection(db, 'linkovi-dnevnik'), orderBy('vrijeme', 'desc'), limit(8)),
    (snimka) => {
      const lista = [];
      snimka.forEach((d) => lista.push({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      dnevnik.value = lista;
    },
    (greska) => console.error('Dnevnik linkova se ne može učitati:', greska)
  );
});

// ---------- životni ciklus ----------
const naTipku = (e) => {
  if (e.key !== 'Escape') return;
  if (ur.value) zatvoriUredivanje();
  else if (postavljanjeOtvoreno.value) postavljanjeOtvoreno.value = false;
};

onMounted(() => {
  pokreniSlusanje();
  window.addEventListener('keydown', naTipku);
});

// povuci prema dolje (mobitel): ponovno spoji uživo praćenje
const odjaviOsvjezavanje = postaviOsvjezavanje(async () => { pokreniSlusanje(); });

onBeforeUnmount(() => {
  odjaviOsvjezavanje();
  zaustaviDnevnik();
  if (odjavaSnimke) odjavaSnimke();
  clearTimeout(porukaTimer);
  clearTimeout(kopiranoTimer);
  window.removeEventListener('keydown', naTipku);
});
</script>

<style scoped>
.stanje {
  padding: var(--space-7) var(--space-4);
  text-align: center;
  color: var(--text-muted);
}

.stanje-greska {
  color: var(--danger);
}

/* ---------- dodavanje ---------- */
.dodaj {
  margin-bottom: var(--space-5);
  padding: var(--space-card);
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.dodaj-red {
  display: flex;
  gap: var(--space-3);
  align-items: stretch;
}

.polje-link {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.polje-ikona {
  position: absolute;
  left: 12px;
  z-index: 1;
  font-size: 20px;
  color: var(--text-muted);
  pointer-events: none;
}

.unos-link {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px 10px 42px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card);
  color: var(--text-body);
  font-size: 1rem;
}

.unos-link:focus {
  outline: none;
  border-color: var(--accent);
}

.dodaj-gumbi {
  display: flex;
  gap: var(--space-2);
}

.vise-gumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: var(--space-3);
  padding: 4px 0;
  border: none;
  background: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
}

.vise-gumb .material-icons {
  font-size: 18px;
}

.vise-gumb:hover {
  color: var(--accent);
}

.dodatno {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.unos-biljeska,
.unos {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card);
  color: var(--text-body);
  font-size: 1rem;
  line-height: 1.45;
}

.unos-biljeska {
  resize: vertical;
}

.unos-biljeska:focus,
.unos:focus,
.unos-oznaka:focus {
  outline: none;
  border-color: var(--accent);
}

.poruka {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: var(--space-3) 0 0;
  font-size: 0.92rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.poruka .material-icons {
  font-size: 20px;
  flex-shrink: 0;
}

.poruka-ok {
  color: var(--success);
  font-weight: 500;
}

.poruka-greska {
  color: var(--danger);
  font-weight: 500;
}

/* ---------- oznake ---------- */
.oznaka {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 30px;
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
}

.oznaka:hover {
  border-color: var(--accent);
}

.oznaka-aktivna {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.oznaka-aktivna button {
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}

.oznaka-aktivna .material-icons {
  font-size: 14px;
}

.oznaka-broj {
  opacity: 0.7;
  font-size: 0.75rem;
}

.oznaka-mala {
  min-height: 0;
  padding: 1px 8px;
  font-size: 0.7rem;
  cursor: default;
}

.oznake-uredi {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.unos-oznaka {
  flex: 1 1 140px;
  min-width: 0;
  min-height: 34px;
  padding: 4px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--text-body);
  font-size: 0.9rem;
}

.oznake-prijedlozi,
.oznake-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.oznake-filter {
  margin-bottom: var(--space-5);
}

/* ---------- prazno ---------- */
.prazno {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 48px var(--space-5);
  text-align: center;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.prazno-ikona {
  font-size: 56px;
  color: var(--accent);
  opacity: 0.55;
}

.prazno-naslov {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-heading);
}

.prazno-opis {
  margin: 0 0 var(--space-2);
  max-width: 460px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ---------- filteri ---------- */
.tab-broj {
  opacity: 0.7;
  font-size: 0.8em;
  font-weight: 500;
}

.pretraga-polje {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
}

.pretraga-ikona {
  position: absolute;
  left: 14px;
  z-index: 1;
  font-size: 20px;
  color: var(--text-muted);
  pointer-events: none;
}

.pretraga-polje input {
  width: 100%;
  padding: 12px 46px 12px 44px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  color: var(--text-body);
  font-size: 1rem;
  box-shadow: var(--glass-shadow);
}

.pretraga-polje input:focus {
  outline: none;
  border-color: var(--accent);
}

.pretraga-ocisti {
  position: absolute;
  right: 4px;
  z-index: 1;
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

.pretraga-ocisti .material-icons {
  font-size: 20px;
}

/* ---------- kartice videa ---------- */
.mreza {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.video {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  cursor: pointer;
  animation: pojaviSe 0.35s ease both;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.video:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.video-slika {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background-color: var(--bg-card-muted);
}

.video-slika img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-zamjena {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.92);
  background: var(--accent);
}

.video-zamjena .material-icons {
  font-size: 44px;
  opacity: 0.85;
}

.video-zamjena strong {
  font-size: 1.1rem;
  letter-spacing: 0.08em;
}

.tip-instagram .video-zamjena {
  background: linear-gradient(135deg, #f09433, #dc2743 55%, #bc1888);
}
.tip-tiktok .video-zamjena {
  background: linear-gradient(135deg, #25f4ee, #111 45%, #fe2c55);
}
.tip-facebook .video-zamjena {
  background: linear-gradient(135deg, #1877f2, #0a4bb3);
}
.tip-youtube-video .video-zamjena {
  background: linear-gradient(135deg, #ff3b30, #b3001b);
}
.tip-x .video-zamjena {
  background: linear-gradient(135deg, #2b2b2b, #000);
}
.tip-pinterest .video-zamjena {
  background: linear-gradient(135deg, #e60023, #a3001a);
}

.video-platforma {
  position: absolute;
  left: 8px;
  top: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background-color: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.video-uredi {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.62);
  color: #fff;
  cursor: pointer;
}

.video-uredi .material-icons {
  font-size: 18px;
}

.video-uredi:hover {
  background-color: rgba(0, 0, 0, 0.82);
}

.video-tijelo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-3) var(--space-3);
}

.video-naziv {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-heading);
  overflow-wrap: anywhere;
}

.video-autor {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.video-biljeska {
  margin: 2px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--text-body);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.video-oznake {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.video-datum {
  margin-top: 2px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* ---------- prozori ---------- */
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
  width: 520px;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
}

.prozor-siroki {
  width: 640px;
}

.prozor-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
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

.ikona-gumb:hover {
  background-color: rgba(128, 128, 128, 0.18);
  color: var(--text-heading);
}

.prozor-tijelo {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.oznaka-polja {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.izvor {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--accent);
  font-size: 0.85rem;
  text-decoration: none;
}

.izvor .material-icons {
  font-size: 18px;
  flex-shrink: 0;
}

.izvor-tekst {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prozor-podnozje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.prozor-radnje {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.potvrda-tekst {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-heading);
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

.gumb-opasnost:hover:not(:disabled) {
  background-color: var(--danger-hover);
}

.gumb-opasnost-tanki {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}

.gumb-opasnost-tanki:hover {
  background-color: var(--danger);
  color: #fff;
}

.gumb-opasnost-tanki .material-icons {
  font-size: 18px;
}

@media (pointer: coarse) {
  .gumb-opasnost,
  .gumb-opasnost-tanki {
    min-height: var(--touch);
  }
}

/* upute za prečac */
.uvod {
  margin: 0;
  line-height: 1.55;
}

.kopiraj-blok {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kopiraj-red {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.kopiraj-vrijednost {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
  color: var(--text-heading);
  user-select: all;
}

.dnevnik {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background-color: var(--bg-card-muted);
}

.dnevnik-popis {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dnevnik-popis li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 0.88rem;
  line-height: 1.35;
}

.dnevnik-popis .material-icons {
  font-size: 20px;
  flex-shrink: 0;
}

.dnevnik-ok .material-icons {
  color: var(--success);
}

.dnevnik-duplikat .material-icons {
  color: var(--text-muted);
}

.dnevnik-greska .material-icons,
.dnevnik-greska .dnevnik-tekst > span {
  color: var(--danger);
}

.dnevnik-tekst {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;
}

.dnevnik-tekst small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.mali {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.mali-greska {
  color: var(--danger);
}

.koraci {
  margin: 0;
  padding-left: 1.3em;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  line-height: 1.5;
  font-size: 0.93rem;
}

.koraci ul {
  margin: 4px 0 0;
  padding-left: 1.2em;
}

.koraci code,
.uvod code {
  padding: 1px 6px;
  border-radius: 6px;
  background-color: var(--bg-card-muted);
  font-size: 0.88em;
}

.novi-kljuc {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-color);
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
  .dodaj {
    padding: var(--space-4);
  }

  .dodaj-red {
    flex-direction: column;
  }

  .dodaj-gumbi > * {
    flex: 1;
  }

  .mreza {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .video-tijelo {
    padding: 10px;
  }

  .video-naziv {
    font-size: 0.88rem;
  }

  .pozadina {
    align-items: flex-start;
  }

  .prozor,
  .prozor-siroki {
    width: 100%;
  }

  .prozor-tijelo,
  .prozor-podnozje {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  .prozor-zaglavlje {
    padding-left: var(--space-4);
  }

  .prozor-podnozje {
    flex-direction: column;
    align-items: stretch;
  }

  .prozor-radnje {
    justify-content: stretch;
  }

  .prozor-radnje > * {
    flex: 1;
  }

  .prozor-podnozje > .gumb-opasnost-tanki {
    order: 2;
  }

  .kopiraj-red {
    flex-wrap: wrap;
  }

  .kopiraj-vrijednost {
    flex-basis: 100%;
  }
}
</style>
