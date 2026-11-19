<template>
  <div class="stranica">
    <AZaglavljeStranice naslov="Galerije" :podnaslov="podnaslov">
      <button type="button" class="gumb-dodaj" @click="otvoriNovu">
        <span class="material-icons" aria-hidden="true">add</span>Nova galerija
      </button>
    </AZaglavljeStranice>

    <p v-if="!BACKEND_URL" class="upozorenje">Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL). Galerije ne mogu raditi.</p>
    <p v-else-if="!GALERIJA_URL" class="upozorenje">
      Adresa klijentske galerije nije postavljena (VITE_GALERIJA_URL). Galerije možeš pripremati, ali linkovi za klijente neće biti prikazani.
    </p>

    <section v-if="BACKEND_URL" class="pohrana" aria-label="Zauzeće pohrane">
      <div class="pohrana-vrh">
        <span class="pohrana-naslov"><span class="material-icons" aria-hidden="true">cloud</span>Cloudflare R2 pohrana</span>
        <button type="button" class="pohrana-osvjezi" :disabled="pohranaUcitava" aria-label="Osvježi zauzeće" @click="ucitajPohranu(true)">
          <span class="material-icons" :class="{ vrti: pohranaUcitava }" aria-hidden="true">refresh</span>
        </button>
      </div>
      <p v-if="pohranaGreska" class="pohrana-greska">{{ pohranaGreska }}</p>
      <template v-else-if="pohrana">
        <div class="pohrana-brojke">
          <strong>{{ formatGB(pohrana.gb) }}</strong>
          <span>od {{ BESPLATNO_GB }} GB besplatno</span>
          <span class="pohrana-cijena" :class="{ placa: pohrana.trosak > 0 }">
            {{ pohrana.trosak > 0 ? `≈ ${formatCijena(pohrana.trosak)} $ / mj` : '0 $ ovaj mjesec' }}
          </span>
        </div>
        <div class="pohrana-traka" role="progressbar" :aria-valuenow="Math.round(pohrana.postotak)" aria-valuemin="0" aria-valuemax="100">
          <div class="pohrana-ispuna" :class="{ puno: pohrana.gb > BESPLATNO_GB }" :style="{ width: `${Math.max(1.5, Math.min(100, pohrana.postotak))}%` }"></div>
        </div>
        <p class="pohrana-sitno">
          {{ pohrana.gb > BESPLATNO_GB ? `${formatGB(pohrana.gb - BESPLATNO_GB)} iznad besplatnih 10 GB × ${CIJENA_GB} $/GB.` : `Još ${formatGB(BESPLATNO_GB - pohrana.gb)} besplatno.` }}
          Fotke {{ formatGB(pohrana.fotkeGB) }}<template v-if="pohrana.privremenoGB > 0.005"> · privremeni ZIP-ovi {{ formatGB(pohrana.privremenoGB) }} (brišu se sami)</template><template v-if="pohrana.ostaloGB > 0.005"> · ostalo {{ formatGB(pohrana.ostaloGB) }}</template>.
          Skidanje klijentima je besplatno. Procjena prema cijeni R2.
          <template v-if="!pohrana.potpuno"> Bucket je jako velik: prikaz je donja granica.</template>
        </p>
      </template>
      <p v-else class="pohrana-sitno">Računam zauzeće...</p>
    </section>

    <p v-if="ucitava" class="stanje">Učitavaju se galerije...</p>

    <div v-else-if="!galerije.length" class="prazno">
      <span class="material-icons prazno-ikona" aria-hidden="true">photo_library</span>
      <p class="prazno-naslov">Još nema galerija</p>
      <p class="prazno-opis">Napravi galeriju za klijenta (npr. „KoncertBraus"), uploadaj fotke i pošalji mu njegov privatni link.</p>
      <button type="button" class="gumb-dodaj" @click="otvoriNovu"><span class="material-icons" aria-hidden="true">add</span>Napravi prvu galeriju</button>
    </div>

    <div v-else class="mreza">
      <router-link v-for="g in galerije" :key="g.id" :to="`/admin/galerije/${g.id}`" class="galerija">
        <div class="galerija-vrh">
          <h3 class="galerija-naziv">{{ g.naziv }}</h3>
          <span class="znacka" :class="g.objavljena ? 'znacka-ok' : 'znacka-skica'">{{ g.objavljena ? 'Objavljena' : 'Skica' }}</span>
        </div>
        <p class="galerija-meta">{{ [g.klijent, formatDatum(g.datum)].filter(Boolean).join(' · ') || 'Bez klijenta' }}</p>
        <div class="galerija-brojke">
          <span><strong>{{ g.brojFotki || 0 }}</strong> fotki</span>
          <span><strong>{{ g.statistika?.pregleda || 0 }}</strong> pregleda</span>
          <span><strong>{{ g.statistika?.preuzimanja || 0 }}</strong> preuzimanja</span>
        </div>
        <div class="galerija-oznake">
          <span v-if="g.preuzimanje === 'zakljucano'" class="oznaka"><span class="material-icons" aria-hidden="true">lock</span>Preuzimanje zaključano</span>
          <span v-if="g.pinHash" class="oznaka"><span class="material-icons" aria-hidden="true">pin</span>PIN</span>
          <span v-if="g.rok" class="oznaka"><span class="material-icons" aria-hidden="true">event</span>do {{ formatDatum(g.rok) }}</span>
        </div>
      </router-link>
    </div>

    <Transition name="fade">
      <div v-if="nova" class="pozadina" @mousedown.self="nova = null">
        <div class="prozor" role="dialog" aria-modal="true" aria-label="Nova galerija">
          <div class="prozor-zaglavlje">
            <h2>Nova galerija</h2>
            <button type="button" class="ikona-gumb" aria-label="Zatvori" @click="nova = null"><span class="material-icons" aria-hidden="true">close</span></button>
          </div>
          <form class="prozor-tijelo" @submit.prevent="napravi">
            <label class="polje-oznaka" for="g-naziv">Naziv galerije</label>
            <input id="g-naziv" v-model="nova.naziv" class="unos" type="text" maxlength="120" placeholder="npr. KoncertBraus" autocomplete="off" required />

            <label class="polje-oznaka" for="g-klijent">Klijent (nije obavezno)</label>
            <input id="g-klijent" v-model="nova.klijent" class="unos" type="text" maxlength="120" autocomplete="off" />

            <label class="polje-oznaka" for="g-datum">Datum događaja</label>
            <input id="g-datum" v-model="nova.datum" class="unos" type="date" />

            <label class="polje-oznaka" for="g-ig">Tvoj Instagram (za natpis na vrhu galerije)</label>
            <input id="g-ig" v-model="nova.instagram" class="unos" type="text" maxlength="40" placeholder="@nagy.photos" autocomplete="off" autocapitalize="off" />

            <p v-if="greska" class="greska">{{ greska }}</p>
            <div class="prozor-radnje">
              <button type="button" class="gumb-sekundarni" @click="nova = null">Odustani</button>
              <button type="submit" class="gumb-primarni" :disabled="sprema || !nova.naziv.trim()">{{ sprema ? 'Stvara se...' : 'Napravi galeriju' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Popis galerija za klijente. Podaci o galerijama su u Firestoreu (vidi ih samo vlasnik), a same fotke u privatnom R2.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import AZaglavljeStranice from './AZaglavljeStranice.vue';
import { db } from '@/services/firebase.js';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { novaGalerija, zauzecePohrane, BACKEND_URL, GALERIJA_URL } from '@/services/galerije.js';

// Cloudflare R2: prvih 10 GB mjesečno je besplatno, dalje oko 0,015 $ po GB (skidanje je besplatno).
// Mijenjaš li plan ili cijene, promijeni samo ove dvije brojke.
const BESPLATNO_GB = 10;
const CIJENA_GB = 0.015;

const router = useRouter();
const pohrana = ref(null);
const pohranaUcitava = ref(false);
const pohranaGreska = ref('');

const formatGB = (gb) => `${gb < 0.1 ? gb.toFixed(3) : gb < 10 ? gb.toFixed(2) : gb.toFixed(1)} GB`.replace('.', ',');
const formatCijena = (c) => c.toFixed(2).replace('.', ',');

const ucitajPohranu = async (osvjezi = false) => {
  if (pohranaUcitava.value) return;
  pohranaUcitava.value = true;
  pohranaGreska.value = '';
  try {
    const o = await zauzecePohrane(osvjezi);
    const gb = o.bajtova / 1e9; // R2 računa decimalne GB
    pohrana.value = {
      gb,
      postotak: (gb / BESPLATNO_GB) * 100,
      trosak: Math.max(0, gb - BESPLATNO_GB) * CIJENA_GB,
      fotkeGB: (o.poMapama?.g || 0) / 1e9,
      privremenoGB: (o.poMapama?.z || 0) / 1e9,
      ostaloGB: Object.entries(o.poMapama || {}).filter(([k]) => k !== 'g' && k !== 'z').reduce((a, [, v]) => a + v, 0) / 1e9,
      potpuno: o.potpuno !== false
    };
  } catch (e) {
    pohranaGreska.value = `Zauzeće se ne može izračunati: ${e.message}`;
  } finally {
    pohranaUcitava.value = false;
  }
};
const galerije = ref([]);
const ucitava = ref(true);
const nova = ref(null);
const sprema = ref(false);
const greska = ref('');
let odjava = null;

const podnaslov = computed(() => (galerije.value.length ? `${galerije.value.length} galerija` : ''));

const formatDatum = (iso) => {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const danas = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const otvoriNovu = () => {
  let ig = '';
  try { ig = localStorage.getItem('galerije-instagram') || ''; } catch { /* nema pohrane */ }
  nova.value = { naziv: '', klijent: '', datum: danas(), instagram: ig };
  greska.value = '';
};

const napravi = async () => {
  if (sprema.value || !nova.value.naziv.trim()) return;
  sprema.value = true;
  greska.value = '';
  try {
    const ig = nova.value.instagram.replace(/^@/, '').trim();
    try { localStorage.setItem('galerije-instagram', ig); } catch { /* ništa */ }
    const o = await novaGalerija({ naziv: nova.value.naziv, klijent: nova.value.klijent, datum: nova.value.datum, instagram: ig });
    nova.value = null;
    router.push(`/admin/galerije/${o.id}`);
  } catch (e) {
    greska.value = e.message;
  } finally {
    sprema.value = false;
  }
};

onMounted(() => {
  if (BACKEND_URL) ucitajPohranu();
  odjava = onSnapshot(
    query(collection(db, 'galerije'), orderBy('stvoreno', 'desc')),
    (snimka) => {
      const lista = [];
      snimka.forEach((d) => lista.push({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      galerije.value = lista;
      ucitava.value = false;
    },
    (e) => {
      console.error('Greška pri učitavanju galerija:', e);
      ucitava.value = false;
    }
  );
});

onBeforeUnmount(() => { if (odjava) odjava(); });
</script>

<style scoped>
.pohrana {
  margin: 0 0 var(--space-4);
  padding: var(--space-4);
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.pohrana-vrh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.pohrana-naslov {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-heading);
}

.pohrana-naslov .material-icons {
  font-size: 20px;
  color: var(--accent);
}

.pohrana-osvjezi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.pohrana-osvjezi:disabled {
  cursor: default;
  opacity: 0.6;
}

.pohrana-osvjezi .material-icons {
  font-size: 20px;
}

.vrti {
  animation: pohrana-vrti 0.9s linear infinite;
}

@keyframes pohrana-vrti {
  to {
    transform: rotate(360deg);
  }
}

.pohrana-brojke {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-top: var(--space-2);
}

.pohrana-brojke strong {
  font-size: 1.5rem;
  color: var(--text-heading);
  font-variant-numeric: tabular-nums;
}

.pohrana-brojke span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.pohrana-brojke .pohrana-cijena {
  margin-left: auto;
  font-weight: 600;
  color: var(--accent);
}

.pohrana-brojke .pohrana-cijena.placa {
  color: var(--danger);
}

.pohrana-traka {
  height: 8px;
  margin: var(--space-3) 0 var(--space-2);
  overflow: hidden;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.2);
}

.pohrana-ispuna {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.5s ease;
}

.pohrana-ispuna.puno {
  background: var(--danger);
}

.pohrana-sitno,
.pohrana-greska {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.pohrana-greska {
  margin-top: var(--space-2);
  color: var(--danger);
}

.upozorenje {
  margin: 0 0 var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--danger);
  border-radius: var(--radius-small);
  color: var(--danger);
  font-size: 0.92rem;
}

.stanje {
  padding: var(--space-7) var(--space-4);
  text-align: center;
  color: var(--text-muted);
}

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
  max-width: 440px;
  color: var(--text-muted);
  line-height: 1.5;
}

.mreza {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.galerija {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-card);
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.galerija:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.galerija-vrh {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.galerija-naziv {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-heading);
  overflow-wrap: anywhere;
}

.galerija-meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.galerija-brojke {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
  font-size: 0.82rem;
  color: var(--text-muted);
}

.galerija-brojke strong {
  color: var(--text-heading);
  font-size: 1rem;
}

.galerija-oznake {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.oznaka {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.oznaka .material-icons {
  font-size: 14px;
}

.znacka {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.znacka-ok {
  background-color: var(--success);
  color: #fff;
}

.znacka-skica {
  background-color: var(--bg-card-muted);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

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
  width: 480px;
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
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5) var(--space-5);
  overflow-y: auto;
}

.polje-oznaka {
  margin-top: var(--space-2);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
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

.greska {
  margin: var(--space-2) 0 0;
  color: var(--danger);
  font-size: 0.9rem;
}

.prozor-radnje {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
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
    grid-template-columns: 1fr;
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
