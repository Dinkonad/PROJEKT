<template>
  <div class="zdravlje">
    <div class="zaglavlje">
      <h1 class="naslov">Zdravlje</h1>
      <div class="zaglavlje-akcije">
        <span class="zadnji-sync">Zadnje osvježeno: {{ formatVrijemeSync(zadnjiSync?.vrijeme) }}</span>
        <button class="gumb-osvjezi" :disabled="osvjezavanje" @click="osvjeziSad">
          <span class="material-icons" :class="{ spinning: osvjezavanje }">sync</span>
          {{ osvjezavanje ? 'Osvježavam...' : 'Osvježi sad' }}
        </button>
      </div>
    </div>

    <p v-if="porukaGreske" class="poruka-greska">{{ porukaGreske }}</p>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje...</p>
    </div>

    <div v-else-if="dani.length === 0" class="prazno">
      <span class="material-icons">favorite_border</span>
      <p>Još nema podataka. Klikni "Osvježi sad" da povučeš prve podatke s Garmina.</p>
    </div>

    <template v-else>
      <div class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">directions_walk</span></div>
          <div class="podaci">
            <h3>Koraci</h3>
            <p class="iznos">{{ (najnoviDan.steps || 0).toLocaleString('hr-HR') }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">bedtime</span></div>
          <div class="podaci">
            <h3>San</h3>
            <p class="iznos">{{ formatSati(najnoviDan.sleep_seconds) }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">favorite</span></div>
          <div class="podaci">
            <h3>Puls u mirovanju</h3>
            <p class="iznos">{{ najnoviDan.resting_hr || '-' }} bpm</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">bolt</span></div>
          <div class="podaci">
            <h3>Body Battery</h3>
            <p class="iznos">{{ najnoviDan.body_battery_low ?? '-' }}–{{ najnoviDan.body_battery_high ?? '-' }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">spa</span></div>
          <div class="podaci">
            <h3>Prosječni stres</h3>
            <p class="iznos">{{ najnoviDan.avg_stress ?? '-' }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">monitor_heart</span></div>
          <div class="podaci">
            <h3>HRV (sinoć)</h3>
            <p class="iznos">{{ najnoviDan.hrv_last_night ?? '-' }} ms</p>
          </div>
        </div>
      </div>

      <div v-if="sanRaspodjela" class="sekcija">
        <div class="sekcija-zaglavlje"><h2>San sinoć</h2></div>
        <div class="san-traka">
          <div
            v-for="dio in sanRaspodjela"
            :key="dio.naziv"
            :class="['san-dio', `san-${dio.boja}`]"
            :style="{ width: dio.postotak + '%' }"
            :title="`${dio.naziv}: ${formatSati(dio.sekunde)}`"
          ></div>
        </div>
        <div class="san-legenda">
          <span v-for="dio in sanRaspodjela" :key="dio.naziv" class="san-legenda-stavka">
            <span :class="['san-tockica', `san-${dio.boja}`]"></span>
            {{ dio.naziv }}: {{ formatSati(dio.sekunde) }}
          </span>
        </div>
      </div>

      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Koraci - zadnjih 14 dana</h2></div>
        <div class="koraci-graf">
          <div v-for="dan in zadnjihNDana" :key="dan.datum" class="dan-stupac">
            <span class="dan-iznos" v-if="dan.steps">{{ Math.round((dan.steps || 0) / 1000) }}k</span>
            <div class="dan-stupac-omotac">
              <div class="dan-stupac-traka" :style="{ height: visinaStupca(dan.steps) + 'px' }"></div>
            </div>
            <span class="dan-naziv">{{ formatKratkiDatum(dan.datum) }}</span>
          </div>
        </div>
      </div>

      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Pregled po danima</h2></div>
        <div class="lista-dana">
          <div v-for="dan in dani" :key="dan.datum" class="redak-dana">
            <span class="redak-datum">{{ formatDatum(dan.datum) }}</span>
            <span class="redak-stavka"><span class="material-icons">directions_walk</span>{{ (dan.steps || 0).toLocaleString('hr-HR') }}</span>
            <span class="redak-stavka"><span class="material-icons">bedtime</span>{{ formatSati(dan.sleep_seconds) }}</span>
            <span class="redak-stavka"><span class="material-icons">favorite</span>{{ dan.resting_hr || '-' }}</span>
            <span class="redak-stavka"><span class="material-icons">spa</span>{{ dan.avg_stress ?? '-' }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { db, auth } from '@/services/firebase.js';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_GARMIN_BACKEND_URL || '';

const ucitava = ref(true);
const dani = ref([]);
const zadnjiSync = ref(null);
const osvjezavanje = ref(false);
const porukaGreske = ref('');

let unsubDani = null;
let unsubMeta = null;

onMounted(() => {
  const q = query(collection(db, 'zdravlje-dani'), orderBy('__name__', 'desc'), limit(30));
  unsubDani = onSnapshot(q, (snap) => {
    dani.value = snap.docs.map(d => ({ datum: d.id, ...d.data() }));
    ucitava.value = false;
  });
  unsubMeta = onSnapshot(doc(db, 'zdravlje-meta', 'zadnji-sync'), (snap) => {
    zadnjiSync.value = snap.exists() ? snap.data() : null;
  });
});

onBeforeUnmount(() => {
  if (unsubDani) unsubDani();
  if (unsubMeta) unsubMeta();
});

const najnoviDan = computed(() => dani.value[0] || {});
const zadnjihNDana = computed(() => [...dani.value].slice(0, 14).reverse());
const maxKoraci = computed(() => Math.max(...zadnjihNDana.value.map(d => d.steps || 0), 1));

const visinaStupca = (steps) => {
  if (!steps) return 0;
  return Math.max(6, Math.round((steps / maxKoraci.value) * 140));
};

const sanRaspodjela = computed(() => {
  const d = najnoviDan.value;
  if (!d || !d.sleep_seconds) return null;
  const ukupno = d.sleep_seconds || 1;
  return [
    { naziv: 'Duboki', sekunde: d.deep_seconds || 0, boja: 'duboki' },
    { naziv: 'Lagani', sekunde: d.light_seconds || 0, boja: 'lagani' },
    { naziv: 'REM', sekunde: d.rem_seconds || 0, boja: 'rem' },
    { naziv: 'Budan', sekunde: d.awake_seconds || 0, boja: 'budan' }
  ].map(s => ({ ...s, postotak: Math.max((s.sekunde / ukupno) * 100, 0) }));
});

const formatSati = (sekunde) => {
  if (!sekunde) return '-';
  const h = Math.floor(sekunde / 3600);
  const m = Math.round((sekunde % 3600) / 60);
  return `${h}h ${m}min`;
};

const formatDatum = (datumString) => new Date(datumString).toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'short' });
const formatKratkiDatum = (datumString) => new Date(datumString).toLocaleDateString('hr-HR', { day: 'numeric', month: 'numeric' });

const formatVrijemeSync = (timestamp) => {
  if (!timestamp?.seconds) return 'nikad';
  return new Date(timestamp.seconds * 1000).toLocaleString('hr-HR');
};

const osvjeziSad = async () => {
  if (!BACKEND_URL) {
    porukaGreske.value = 'Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).';
    return;
  }
  osvjezavanje.value = true;
  porukaGreske.value = '';
  try {
    const token = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!odgovor.ok) {
      const tekst = await odgovor.text();
      throw new Error(tekst || `Greška ${odgovor.status}`);
    }
  } catch (error) {
    console.error('Greška pri osvježavanju zdravstvenih podataka:', error);
    porukaGreske.value = 'Osvježavanje nije uspjelo. Prvi poziv na Render može potrajati do minutu (budi se iz mirovanja) - probaj ponovno za malo.';
  } finally {
    osvjezavanje.value = false;
  }
};
</script>

<style scoped>
.zdravlje {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
  font-family: 'Roboto', sans-serif;
}

.zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.naslov {
  color: var(--text-heading);
  font-weight: 700;
  margin: 0;
}

.zaglavlje-akcije {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.zadnji-sync {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.gumb-osvjezi {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  font-weight: 500;
}

.gumb-osvjezi:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.poruka-greska {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.loading-container, .prazno {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.prazno .material-icons {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 25px;
}

.kartica {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px;
}

.kartica .ikona {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-card-muted);
  color: var(--accent);
  flex-shrink: 0;
}

.kartica .podaci h3 {
  margin: 0 0 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.kartica .podaci .iznos {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-heading);
}

.sekcija {
  background-color: var(--bg-card);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 6px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  margin-bottom: 25px;
}

.sekcija-zaglavlje h2 {
  color: var(--text-heading);
  margin: 0 0 20px;
  font-weight: 600;
  font-size: 1.2rem;
}

.san-traka {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
}

.san-duboki { background-color: #1D4ED8; }
.san-lagani { background-color: #60A5FA; }
.san-rem { background-color: #A78BFA; }
.san-budan { background-color: #F87171; }

.san-legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.san-legenda-stavka {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.san-tockica {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.koraci-graf {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  padding-top: 10px;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.dan-stupac {
  flex: 1;
  min-width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dan-iznos {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-heading);
  white-space: nowrap;
}

.dan-stupac-omotac {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.dan-stupac-traka {
  width: 60%;
  max-width: 24px;
  background-color: var(--accent);
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.dan-naziv {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.lista-dana {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.redak-dana {
  display: grid;
  grid-template-columns: 110px repeat(4, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--bg-card-muted);
  font-size: 0.85rem;
  color: var(--text-heading);
}

.redak-dana:last-child {
  border-bottom: none;
}

.redak-datum {
  font-weight: 600;
  text-transform: capitalize;
}

.redak-stavka {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.redak-stavka .material-icons {
  font-size: 16px;
}

@media (max-width: 768px) {
  .zdravlje {
    padding: 20px;
    padding-bottom: 100px;
  }

  .redak-dana {
    grid-template-columns: 90px repeat(2, 1fr);
    row-gap: 6px;
  }
}
</style>
