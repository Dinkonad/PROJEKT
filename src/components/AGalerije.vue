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
import { novaGalerija, BACKEND_URL, GALERIJA_URL } from '@/services/galerije.js';

const router = useRouter();
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
