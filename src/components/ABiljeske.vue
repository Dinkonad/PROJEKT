<template>
  <div class="stranica">
    <AZaglavljeStranice naslov="Bilješke" :podnaslov="podnaslov">
      <button type="button" class="gumb-sekundarni" @click="otvoriFileDialog">
        <span class="material-icons" aria-hidden="true">upload_file</span>Učitaj TXT
      </button>
      <button type="button" class="gumb-dodaj" @click="novaBiljeska()">
        <span class="material-icons" aria-hidden="true">add</span>Nova bilješka
      </button>
    </AZaglavljeStranice>

    <input ref="fileInput" type="file" accept=".txt,text/plain" class="sr-only" tabindex="-1" aria-hidden="true" @change="ucitajFajl" />

    <p v-if="ucitava" class="stanje">Učitavaju se bilješke...</p>

    <p v-else-if="greskaUcitavanja" class="stanje stanje-greska">
      Bilješke se nisu mogle učitati. Provjeri internet pa povuci stranicu prema dolje.
    </p>

    <div v-else-if="!biljeske.length" class="prazno">
      <span class="material-icons prazno-ikona" aria-hidden="true">sticky_note_2</span>
      <p class="prazno-naslov">Još nema bilješki</p>
      <p class="prazno-opis">Zapiši sve što ne želiš zaboraviti: ideje za snimanje, što nabaviti, brojeve, kratke podsjetnike.</p>
      <button type="button" class="gumb-dodaj" @click="novaBiljeska()">
        <span class="material-icons" aria-hidden="true">add</span>Napiši prvu bilješku
      </button>
    </div>

    <template v-else>
      <div class="pretraga-polje">
        <span class="material-icons pretraga-ikona" aria-hidden="true">search</span>
        <input
          v-model="pretraga"
          type="search"
          placeholder="Traži po naslovu ili tekstu..."
          aria-label="Traži bilješke"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button v-if="pretraga" type="button" class="pretraga-ocisti" aria-label="Očisti pretragu" @click="pretraga = ''">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </div>

      <p v-if="!vidljive.length" class="stanje">Nema bilješki za „{{ pretraga.trim() }}“.</p>

      <section v-for="o in odjeljci" :key="o.kljuc" class="odjeljak">
        <button
          v-if="o.sklopljivo"
          type="button"
          class="odjeljak-naslov odjeljak-gumb"
          :aria-expanded="gotovoPrikazano"
          @click="gotovoOtvoreno = !gotovoOtvoreno"
        >
          <span class="material-icons" aria-hidden="true">{{ o.ikona }}</span>
          {{ o.naslov }}
          <span class="material-icons strelica" :class="{ otvoreno: gotovoPrikazano }" aria-hidden="true">expand_more</span>
        </button>
        <h2 v-else-if="o.naslov" class="odjeljak-naslov">
          <span v-if="o.ikona" class="material-icons" aria-hidden="true">{{ o.ikona }}</span>
          {{ o.naslov }}
        </h2>

        <div v-if="!o.sklopljivo || gotovoPrikazano" class="mreza">
          <div
            v-for="b in o.stavke"
            :key="b.id"
            class="biljeska"
            :class="['boja-' + (b.boja || 'bez'), { zavrseno: b.realizovana }]"
            role="button"
            tabindex="0"
            @click="otvori(b)"
            @keydown.enter.self.prevent="otvori(b)"
            @keydown.space.self.prevent="otvori(b)"
          >
            <span v-if="b.prikvacena" class="material-icons biljeska-pin" aria-label="Prikvačeno">push_pin</span>
            <h3 v-if="b.naslov" class="biljeska-naslov">{{ b.naslov }}</h3>
            <p v-if="b.sadrzaj" class="biljeska-tekst">{{ skrati(b.sadrzaj, 500) }}</p>
            <span class="biljeska-datum">{{ kratkiDatum(b) }}</span>
          </div>
        </div>
      </section>
    </template>

    <Transition name="fade">
      <div v-if="ur" class="pozadina editor-pozadina" @mousedown.self="zatvori">
        <div class="editor" :class="'boja-' + (ur.boja || 'bez')" role="dialog" aria-modal="true" aria-label="Bilješka">
          <div class="editor-alati">
            <span class="editor-oznaka">{{ ur.id ? 'Bilješka' : 'Nova bilješka' }}</span>
            <div class="editor-radnje">
              <button
                type="button"
                class="ikona-gumb"
                :class="{ aktivno: ur.prikvacena }"
                :aria-pressed="ur.prikvacena"
                title="Prikvači na vrh"
                aria-label="Prikvači na vrh"
                @click="ur.prikvacena = !ur.prikvacena; promijenjeno(true)"
              >
                <span class="material-icons" aria-hidden="true">push_pin</span>
              </button>
              <button
                type="button"
                class="ikona-gumb"
                :class="{ aktivno: ur.realizovana }"
                :aria-pressed="ur.realizovana"
                :title="ur.realizovana ? 'Vrati među aktivne' : 'Označi kao završeno'"
                :aria-label="ur.realizovana ? 'Vrati među aktivne' : 'Označi kao završeno'"
                @click="ur.realizovana = !ur.realizovana; promijenjeno(true)"
              >
                <span class="material-icons" aria-hidden="true">task_alt</span>
              </button>
              <button type="button" class="ikona-gumb" title="Spremi kao TXT" aria-label="Spremi kao TXT" @click="izvezi">
                <span class="material-icons" aria-hidden="true">download</span>
              </button>
              <button type="button" class="ikona-gumb opasnost" title="Obriši" aria-label="Obriši" @click="potvrdaBrisanja = true">
                <span class="material-icons" aria-hidden="true">delete</span>
              </button>
              <button type="button" class="ikona-gumb" title="Zatvori" aria-label="Zatvori" @click="zatvori">
                <span class="material-icons" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          <div class="editor-tijelo" ref="tijeloPolje" @click.self="tekstPolje?.focus()">
            <input
              ref="naslovPolje"
              v-model="ur.naslov"
              type="text"
              class="editor-naslov"
              placeholder="Naslov (nije obavezan)"
              aria-label="Naslov bilješke"
              autocomplete="off"
              maxlength="200"
              @input="promijenjeno()"
              @keydown.enter.prevent="tekstPolje?.focus()"
            />
            <textarea
              ref="tekstPolje"
              v-model="ur.sadrzaj"
              class="editor-tekst"
              placeholder="Zapiši bilješku..."
              aria-label="Tekst bilješke"
              rows="6"
              @input="naTekst"
            ></textarea>
          </div>

          <div v-if="!potvrdaBrisanja" class="editor-podnozje">
            <div class="boje" role="group" aria-label="Boja bilješke">
              <button
                v-for="b in BOJE"
                :key="b.kljuc"
                type="button"
                class="boja-tocka"
                :class="['tocka-' + b.kljuc, { odabrana: (ur.boja || 'bez') === b.kljuc }]"
                :aria-pressed="(ur.boja || 'bez') === b.kljuc"
                :aria-label="b.naziv"
                :title="b.naziv"
                @click="postaviBoju(b.kljuc)"
              >
                <span v-if="(ur.boja || 'bez') === b.kljuc" class="material-icons" aria-hidden="true">check</span>
              </button>
            </div>
            <div class="editor-kraj">
              <span class="status" :class="'status-' + status" role="status" aria-live="polite">{{ statusTekst }}</span>
              <button type="button" class="gumb-primarni" @click="zatvori">Zatvori</button>
            </div>
          </div>

          <div v-else class="editor-podnozje potvrda">
            <span class="potvrda-tekst">Obrisati ovu bilješku? To se ne može poništiti.</span>
            <div class="editor-kraj">
              <button type="button" class="gumb-sekundarni" @click="potvrdaBrisanja = false">Odustani</button>
              <button type="button" class="gumb-opasnost" @click="obrisi">Obriši</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Bilješke: brzo zapisivanje kratkih stvari (zamjena za ljepljive papiriće / notes na laptopu).
// Podaci su u istoj Firestore kolekciji kao stare "kreativne ideje", pa se ništa ne gubi.
// Svaka promjena se sprema sama - nema gumba "Spremi".
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import AZaglavljeStranice from './AZaglavljeStranice.vue';
import { obavijesti } from '@/services/obavijest.js';
import { postaviOsvjezavanje } from '@/store/osvjezavanje.js';
import { db } from '@/services/firebase.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const KOLEKCIJA = 'ideje';

const BOJE = [
  { kljuc: 'bez', naziv: 'Bez boje' },
  { kljuc: 'zuta', naziv: 'Žuta' },
  { kljuc: 'narancasta', naziv: 'Narančasta' },
  { kljuc: 'zelena', naziv: 'Zelena' },
  { kljuc: 'plava', naziv: 'Plava' },
  { kljuc: 'ljubicasta', naziv: 'Ljubičasta' },
  { kljuc: 'roza', naziv: 'Roza' }
];

const biljeske = ref([]);
const ucitava = ref(true);
const greskaUcitavanja = ref(false);
const pretraga = ref('');
const gotovoOtvoreno = ref(false);

const fileInput = ref(null);
const naslovPolje = ref(null);
const tekstPolje = ref(null);
const tijeloPolje = ref(null);

// bilješka koja je trenutno otvorena u uređivaču (null = zatvoren)
const ur = ref(null);
const status = ref('');
const potvrdaBrisanja = ref(false);

// ---------- popis ----------
const normaliziraj = (t) => String(t ?? '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');
const traziSe = computed(() => normaliziraj(pretraga.value).trim().length > 0);

const uMs = (t) => {
  if (!t) return 0;
  const d = t.toDate ? t.toDate() : new Date(t);
  const ms = d.getTime();
  return Number.isNaN(ms) ? 0 : ms;
};
const vrijemeBiljeske = (b) => uMs(b.izmijenjeno) || uMs(b.datum);

const vidljive = computed(() => {
  const rijeci = normaliziraj(pretraga.value).split(/\s+/).filter(Boolean);
  let lista = [...biljeske.value];
  if (rijeci.length) {
    lista = lista.filter((b) => {
      const tekst = normaliziraj(`${b.naslov || ''} ${b.sadrzaj || ''}`);
      return rijeci.every((r) => tekst.includes(r));
    });
  }
  return lista.sort((a, b) => vrijemeBiljeske(b) - vrijemeBiljeske(a));
});

const odjeljci = computed(() => {
  const prikvacene = vidljive.value.filter((b) => b.prikvacena && !b.realizovana);
  const ostale = vidljive.value.filter((b) => !b.prikvacena && !b.realizovana);
  const gotove = vidljive.value.filter((b) => b.realizovana);
  const r = [];
  if (prikvacene.length) r.push({ kljuc: 'prikvaceno', naslov: 'Prikvačeno', ikona: 'push_pin', stavke: prikvacene });
  if (ostale.length) r.push({ kljuc: 'ostalo', naslov: prikvacene.length ? 'Ostalo' : '', ikona: '', stavke: ostale });
  if (gotove.length) r.push({ kljuc: 'zavrseno', naslov: `Završeno (${gotove.length})`, ikona: 'task_alt', stavke: gotove, sklopljivo: true });
  return r;
});

// završene su sklopljene, osim kad tražiš nešto (da ne promašiš staru bilješku)
const gotovoPrikazano = computed(() => gotovoOtvoreno.value || traziSe.value);

const podnaslov = computed(() => {
  const n = biljeske.value.length;
  if (!n) return '';
  const zadnje2 = n % 100;
  const zadnja = n % 10;
  const rijec = zadnje2 >= 11 && zadnje2 <= 14 ? 'bilješki' : zadnja === 1 ? 'bilješka' : zadnja >= 2 && zadnja <= 4 ? 'bilješke' : 'bilješki';
  return `${n} ${rijec}`;
});

const skrati = (tekst, max) => (tekst.length <= max ? tekst : `${tekst.slice(0, max).trimEnd()}…`);

const dvije = (n) => String(n).padStart(2, '0');
const kratkiDatum = (b) => {
  const ms = vrijemeBiljeske(b);
  if (!ms) return '';
  const d = new Date(ms);
  const sada = new Date();
  const jucer = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate() - 1);
  const istiDan = (a, c) => a.getFullYear() === c.getFullYear() && a.getMonth() === c.getMonth() && a.getDate() === c.getDate();
  if (istiDan(d, sada)) return `danas ${dvije(d.getHours())}:${dvije(d.getMinutes())}`;
  if (istiDan(d, jucer)) return 'jučer';
  const dm = `${dvije(d.getDate())}.${dvije(d.getMonth() + 1)}.`;
  return d.getFullYear() === sada.getFullYear() ? dm : `${dm}${d.getFullYear()}.`;
};

// ---------- uređivač ----------
const nova = () => ({ id: null, naslov: '', sadrzaj: '', boja: '', prikvacena: false, realizovana: false, zapisanoRealizovana: false });

let prljavo = false;
let timer = null;
let lanac = Promise.resolve();
let zatvara = false;
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

const prilagodiVisinu = () => {
  const el = tekstPolje.value;
  if (!el) return;
  const tijelo = tijeloPolje.value;
  const skrol = tijelo ? tijelo.scrollTop : 0;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
  if (tijelo) tijelo.scrollTop = skrol;
};

const novaBiljeska = (pocetno = {}) => {
  ur.value = { ...nova(), ...pocetno };
  prljavo = false;
  status.value = '';
  potvrdaBrisanja.value = false;
  nextTick(() => {
    prilagodiVisinu();
    tekstPolje.value?.focus();
  });
};

const otvori = (b) => {
  ur.value = {
    id: b.id,
    naslov: b.naslov || '',
    sadrzaj: b.sadrzaj || '',
    boja: b.boja || '',
    prikvacena: !!b.prikvacena,
    realizovana: !!b.realizovana,
    zapisanoRealizovana: !!b.realizovana
  };
  prljavo = false;
  status.value = '';
  potvrdaBrisanja.value = false;
  nextTick(prilagodiVisinu);
};

const statusTekst = computed(() => {
  if (status.value === 'sprema') return 'Sprema se...';
  if (status.value === 'spremljeno') return 'Spremljeno';
  if (status.value === 'greska') return 'Nije spremljeno';
  return ur.value && !ur.value.id ? 'Sprema se samo od sebe' : '';
});

const zapisi = async () => {
  const d = ur.value;
  if (!d || !prljavo) return;
  prljavo = false;

  const podaci = {
    naslov: d.naslov.trim(),
    sadrzaj: d.sadrzaj.trim(),
    boja: d.boja,
    prikvacena: d.prikvacena,
    realizovana: d.realizovana
  };

  if (!d.id && !podaci.naslov && !podaci.sadrzaj) {
    status.value = '';
    return;
  }

  try {
    if (!d.id) {
      const ref = await addDoc(collection(db, KOLEKCIJA), {
        ...podaci,
        datumRealizacije: podaci.realizovana ? serverTimestamp() : null,
        datum: serverTimestamp(),
        izmijenjeno: serverTimestamp()
      });
      d.id = ref.id;
      d.zapisanoRealizovana = podaci.realizovana;
    } else {
      const izmjena = { ...podaci, izmijenjeno: serverTimestamp() };
      if (podaci.realizovana !== d.zapisanoRealizovana) {
        izmjena.datumRealizacije = podaci.realizovana ? serverTimestamp() : null;
      }
      await updateDoc(doc(db, KOLEKCIJA, d.id), izmjena);
      d.zapisanoRealizovana = podaci.realizovana;
    }
    if (!prljavo) status.value = 'spremljeno';
  } catch (greska) {
    console.error('Greška pri spremanju bilješke:', greska);
    prljavo = true;
    status.value = 'greska';
    obavijesti('Bilješka nije spremljena. Provjeri internet i pokušaj ponovno.');
  }
};

const spremiSada = () => {
  clearTimeout(timer);
  lanac = lanac.then(zapisi);
  return lanac;
};

const promijenjeno = (odmah = false) => {
  prljavo = true;
  status.value = 'sprema';
  clearTimeout(timer);
  timer = setTimeout(spremiSada, odmah === true ? 0 : 700);
};

const naTekst = () => {
  prilagodiVisinu();
  promijenjeno();
};

const postaviBoju = (kljuc) => {
  ur.value.boja = kljuc === 'bez' ? '' : kljuc;
  promijenjeno(true);
};

const zatvori = async () => {
  if (!ur.value || zatvara) return;
  zatvara = true;
  clearTimeout(timer);
  const d = ur.value;
  try {
    // bez čekanja u nedogled ako nema interneta: Firestore dovrši zapis čim se veza vrati
    await Promise.race([spremiSada(), pauza(3000)]);
    // sve je obrisano iz postojeće bilješke -> nema smisla čuvati praznu karticu
    if (d.id && !d.naslov.trim() && !d.sadrzaj.trim()) {
      deleteDoc(doc(db, KOLEKCIJA, d.id)).catch((e) => console.error('Greška pri brisanju prazne bilješke:', e));
    }
  } finally {
    ur.value = null;
    potvrdaBrisanja.value = false;
    status.value = '';
    zatvara = false;
  }
};

const obrisi = async () => {
  const d = ur.value;
  if (!d) return;
  clearTimeout(timer);
  prljavo = false;
  try {
    if (d.id) await Promise.race([deleteDoc(doc(db, KOLEKCIJA, d.id)), pauza(3000)]);
    ur.value = null;
    potvrdaBrisanja.value = false;
    status.value = '';
  } catch (greska) {
    console.error('Greška pri brisanju bilješke:', greska);
    obavijesti('Bilješka nije obrisana. Pokušaj ponovno.');
  }
};

const izvezi = () => {
  const d = ur.value;
  if (!d) return;
  const sadrzaj = d.naslov.trim() ? `${d.naslov.trim()}\n\n${d.sadrzaj}` : d.sadrzaj;
  const blob = new Blob([sadrzaj], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(d.naslov.trim() || 'biljeska').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------- uvoz iz TXT-a ----------
const otvoriFileDialog = () => fileInput.value?.click();

const ucitajFajl = (event) => {
  const datoteka = event.target.files[0];
  event.target.value = '';
  if (!datoteka) return;
  if (!/\.txt$/i.test(datoteka.name) && datoteka.type !== 'text/plain') {
    obavijesti('Odaberi tekstualnu (.txt) datoteku.');
    return;
  }
  const citac = new FileReader();
  citac.onload = () => {
    novaBiljeska({ naslov: datoteka.name.replace(/\.txt$/i, ''), sadrzaj: String(citac.result || '').trim() });
    promijenjeno(true);
  };
  citac.readAsText(datoteka);
};

// ---------- učitavanje (uživo, pa se promjene s laptopa odmah vide na mobitelu) ----------
let odjavaSnimke = null;

const pokreniSlusanje = () => {
  if (odjavaSnimke) odjavaSnimke();
  greskaUcitavanja.value = false;
  odjavaSnimke = onSnapshot(
    collection(db, KOLEKCIJA),
    (snimka) => {
      const lista = [];
      snimka.forEach((d) => lista.push({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      biljeske.value = lista;
      ucitava.value = false;
      greskaUcitavanja.value = false;
    },
    (greska) => {
      console.error('Greška pri učitavanju bilješki:', greska);
      ucitava.value = false;
      greskaUcitavanja.value = true;
    }
  );
};

const naTipku = (e) => {
  if (e.key === 'Escape' && ur.value) zatvori();
};
const naVidljivost = () => {
  if (document.hidden && ur.value) spremiSada();
};

onMounted(() => {
  pokreniSlusanje();
  window.addEventListener('keydown', naTipku);
  document.addEventListener('visibilitychange', naVidljivost);
});

// povuci prema dolje (mobitel): ponovno spoji uživo praćenje ako je puklo
const odjaviOsvjezavanje = postaviOsvjezavanje(async () => { pokreniSlusanje(); });

onBeforeUnmount(() => {
  odjaviOsvjezavanje();
  if (odjavaSnimke) odjavaSnimke();
  clearTimeout(timer);
  window.removeEventListener('keydown', naTipku);
  document.removeEventListener('visibilitychange', naVidljivost);
  if (ur.value) spremiSada(); // zatvaranje stranice usred pisanja ne smije izgubiti tekst
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

/* ---------- prazno ---------- */
.prazno {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 56px var(--space-5);
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
  max-width: 420px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ---------- pretraga ---------- */
.pretraga-polje {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-5);
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

/* ---------- popis ---------- */
.odjeljak {
  margin-bottom: var(--space-6);
}

.odjeljak-naslov {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 var(--space-3);
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.odjeljak-naslov .material-icons {
  font-size: 18px;
}

.odjeljak-gumb {
  cursor: pointer;
  min-height: 32px;
}

.odjeljak-gumb .strelica {
  transition: transform 0.2s ease;
}

.odjeljak-gumb .strelica.otvoreno {
  transform: rotate(180deg);
}

/* kartice popunjavaju cijelu širinu, poredane slijeva nadesno (najnovije prve) */
.mreza {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
  align-items: start;
}

/* boje bilješki: --bilj-bg pozadina, --bilj-rub rub */
.boja-bez {
  --bilj-bg: var(--glass-bg);
  --bilj-rub: var(--glass-border);
}
.boja-zuta {
  --bilj-bg: #fff3b0;
  --bilj-rub: #e8d36a;
}
.boja-narancasta {
  --bilj-bg: #ffe0c2;
  --bilj-rub: #edb27a;
}
.boja-zelena {
  --bilj-bg: #d8f0d2;
  --bilj-rub: #94cc8a;
}
.boja-plava {
  --bilj-bg: #d4e8f8;
  --bilj-rub: #8dbbe0;
}
.boja-ljubicasta {
  --bilj-bg: #e6ddf6;
  --bilj-rub: #b5a1dd;
}
.boja-roza {
  --bilj-bg: #fadce6;
  --bilj-rub: #e5a0ba;
}

[data-theme='dark'] .boja-zuta {
  --bilj-bg: #4a4222;
  --bilj-rub: #7a6c2e;
}
[data-theme='dark'] .boja-narancasta {
  --bilj-bg: #4d3722;
  --bilj-rub: #86592f;
}
[data-theme='dark'] .boja-zelena {
  --bilj-bg: #263f2a;
  --bilj-rub: #3f6a45;
}
[data-theme='dark'] .boja-plava {
  --bilj-bg: #223a52;
  --bilj-rub: #3a6286;
}
[data-theme='dark'] .boja-ljubicasta {
  --bilj-bg: #3a2f55;
  --bilj-rub: #5e4d8c;
}
[data-theme='dark'] .boja-roza {
  --bilj-bg: #51283a;
  --bilj-rub: #8a4560;
}

.biljeska {
  position: relative;
  display: block;
  min-width: 0;
  padding: var(--space-4);
  background-color: var(--bilj-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--bilj-rub);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
  text-align: left;
  cursor: pointer;
  animation: pojaviSe 0.35s ease both;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.biljeska:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.biljeska.zavrseno {
  opacity: 0.7;
}

.biljeska.zavrseno .biljeska-naslov {
  text-decoration: line-through;
}

.biljeska-pin {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 16px;
  color: var(--text-muted);
  transform: rotate(35deg);
}

.biljeska-naslov {
  margin: 0 0 var(--space-2);
  padding-right: 18px;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-heading);
  overflow-wrap: anywhere;
}

.biljeska-tekst {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 9;
  line-clamp: 9;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.93rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--text-body);
}

.biljeska-datum {
  display: block;
  margin-top: var(--space-3);
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* ---------- uređivač ---------- */
.editor-pozadina {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(3, 3, 3, 0.55);
}

.editor {
  width: 640px;
  max-width: 100%;
  height: min(100%, 620px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bilj-bg);
  border: 1px solid var(--bilj-rub);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
}

/* bez boje: pisanje ide na čistu podlogu, ne na prozirnu */
.editor.boja-bez {
  --bilj-bg: var(--bg-card);
  --bilj-rub: var(--border-color);
}

.editor-alati {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-5);
  flex-shrink: 0;
}

.editor-oznaka {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.editor-radnje {
  display: flex;
  align-items: center;
  gap: 2px;
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
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ikona-gumb .material-icons {
  font-size: 22px;
}

.ikona-gumb:hover {
  background-color: rgba(128, 128, 128, 0.18);
  color: var(--text-heading);
}

.ikona-gumb.aktivno {
  background-color: var(--accent);
  color: var(--on-accent);
}

.ikona-gumb.opasnost:hover {
  background-color: var(--danger);
  color: #fff;
}

.editor-tijelo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-5) var(--space-4);
  cursor: text;
  overscroll-behavior: contain;
}

.editor-naslov,
.editor-tekst {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-body);
  font-family: inherit;
}

.editor-naslov {
  padding: var(--space-2) 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-heading);
}

.editor-tekst {
  min-height: 220px;
  padding: var(--space-2) 0;
  font-size: 1.02rem;
  line-height: 1.6;
  resize: none;
  overflow: hidden;
}

.editor-naslov:focus,
.editor-tekst:focus {
  outline: none;
}

.editor-naslov::placeholder,
.editor-tekst::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
  font-weight: 400;
}

.editor-podnozje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--bilj-rub);
  flex-shrink: 0;
}

.boje {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.boja-tocka {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid rgba(0, 0, 0, 0.18);
  border-radius: 50%;
  color: #1b2731;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.boja-tocka:hover {
  transform: scale(1.12);
}

.boja-tocka .material-icons {
  font-size: 16px;
}

.boja-tocka.odabrana {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--bilj-bg), 0 0 0 4px var(--accent);
}

.tocka-bez {
  background-color: var(--bg-card);
  border-style: dashed;
  color: var(--text-heading);
}
.tocka-zuta {
  background-color: #f9d949;
}
.tocka-narancasta {
  background-color: #f4a55a;
}
.tocka-zelena {
  background-color: #7cc576;
}
.tocka-plava {
  background-color: #6ab0e6;
}
.tocka-ljubicasta {
  background-color: #a78bdb;
}
.tocka-roza {
  background-color: #ee86ae;
}

.editor-kraj {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.status-greska {
  color: var(--danger);
  font-weight: 600;
}

.potvrda-tekst {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-heading);
}

.gumb-opasnost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: var(--radius-small);
  background-color: var(--danger);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.gumb-opasnost:hover {
  background-color: var(--danger-hover);
}

@media (pointer: coarse) {
  .gumb-opasnost {
    min-height: var(--touch);
  }
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
  .mreza {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .biljeska {
    padding: var(--space-3);
  }

  /* uređivač je na vrhu, da tipkovnica ne prekrije mjesto gdje pišeš */
  .editor-pozadina {
    align-items: flex-start;
  }

  .editor {
    width: 100%;
    height: min(100%, 560px);
  }

  .editor-tijelo,
  .editor-podnozje {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  .editor-alati {
    padding-left: var(--space-4);
  }

  .editor-tekst {
    min-height: 160px;
  }

  .editor-podnozje {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-kraj {
    justify-content: space-between;
  }

  .potvrda .editor-kraj {
    justify-content: stretch;
  }

  .potvrda .editor-kraj > * {
    flex: 1;
  }
}
</style>
