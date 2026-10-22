<template>
  <div class="zdravlje">
    <div class="zaglavlje">
      <h1 class="naslov">Zdravlje</h1>
      <div class="zaglavlje-akcije">
        <span v-if="uTijeku" class="zadnji-sync u-tijeku">
          <span class="material-icons spinning">sync</span> Sinkronizacija u tijeku...
          <button type="button" class="gumb-resetiraj" @click="resetirajSync">Zaglavilo? Resetiraj</button>
        </span>
        <span v-else class="zadnji-sync">Zadnje osvježeno: {{ formatVrijemeSync(zadnjiSync?.vrijeme) }}</span>
        <button class="gumb-osvjezi" :disabled="uTijeku || osvjezavanje" @click="osvjeziSad">
          <span class="material-icons" :class="{ spinning: osvjezavanje }">sync</span>
          Osvježi sad
        </button>
        <button class="gumb-povijest" :disabled="uTijeku || osvjezavanje" @click="povuciPovijest">
          <span class="material-icons">history</span> Povuci povijest
        </button>
      </div>
    </div>

    <p v-if="zadnjiSync?.greska" class="poruka-greska">Zadnji pokušaj nije uspio: {{ zadnjiSync.greska }}</p>
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
      <!-- ==================== GLAVNE KARTICE ==================== -->
      <div class="kartice kartice-animirane">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">directions_walk</span></div>
          <div class="podaci">
            <h3>Koraci</h3>
            <p class="iznos">{{ (najnoviDan.steps || 0).toLocaleString('hr-HR') }}</p>
            <div v-if="koraciProgres !== null" class="mini-progres">
              <div class="mini-progres-traka" :style="{ width: koraciProgres + '%' }"></div>
            </div>
            <span v-if="najnoviDan.step_goal" class="mini-tekst">cilj {{ najnoviDan.step_goal.toLocaleString('hr-HR') }} ({{ koraciProgres }}%)</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">local_fire_department</span></div>
          <div class="podaci">
            <h3>Kalorije</h3>
            <p class="iznos">{{ (najnoviDan.calories || 0).toLocaleString('hr-HR') }}</p>
            <span v-if="najnoviDan.active_calories" class="mini-tekst">aktivne {{ najnoviDan.active_calories }} · bazalne {{ najnoviDan.bmr_calories || '-' }}</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">bedtime</span></div>
          <div class="podaci">
            <h3>San</h3>
            <p class="iznos">{{ formatSati(najnoviDan.sleep_seconds) }}</p>
            <span v-if="najnoviDan.sleep_score" :class="['mini-znacka', ocjenaBoja(najnoviDan.sleep_score)]">{{ najnoviDan.sleep_score }} · {{ ocjenaSnaTekst(najnoviDan.sleep_score) }}</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">favorite</span></div>
          <div class="podaci">
            <h3>Puls u mirovanju</h3>
            <p class="iznos">{{ najnoviDan.resting_hr || '-' }} bpm</p>
            <span v-if="najnoviDan.min_hr" class="mini-tekst">raspon {{ najnoviDan.min_hr }}-{{ najnoviDan.max_hr }} bpm</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">bolt</span></div>
          <div class="podaci">
            <h3>Body Battery</h3>
            <p class="iznos">{{ najnoviDan.body_battery_low ?? '-' }}–{{ najnoviDan.body_battery_high ?? '-' }}</p>
            <span v-if="najnoviDan.body_battery_charged" class="mini-tekst">+{{ najnoviDan.body_battery_charged }} / −{{ najnoviDan.body_battery_drained }}</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">monitor_heart</span></div>
          <div class="podaci">
            <h3>HRV (sinoć)</h3>
            <p class="iznos">{{ najnoviDan.hrv_last_night ?? '-' }} ms</p>
            <span v-if="najnoviDan.hrv_status" class="mini-tekst">{{ hrvStatusTekst(najnoviDan.hrv_status) }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== DODATNE KARTICE ==================== -->
      <div class="kartice kartice-animirane kartice-dodatne">
        <div class="kartica kartica-malo">
          <div class="ikona"><span class="material-icons">spa</span></div>
          <div class="podaci">
            <h3>Prosječni stres</h3>
            <p class="iznos">{{ najnoviDan.avg_stress ?? '-' }}</p>
            <span v-if="najnoviDan.avg_stress != null" class="mini-tekst">{{ stresTekst(najnoviDan.avg_stress) }}</span>
          </div>
        </div>
        <div class="kartica kartica-malo" v-if="najnoviDan.avg_spo2">
          <div class="ikona"><span class="material-icons">water_drop</span></div>
          <div class="podaci">
            <h3>SpO2 (kisik)</h3>
            <p class="iznos">{{ najnoviDan.avg_spo2 }}%</p>
            <span class="mini-tekst">najniže {{ najnoviDan.lowest_spo2 }}%</span>
          </div>
        </div>
        <div class="kartica kartica-malo" v-if="najnoviDan.avg_respiration">
          <div class="ikona"><span class="material-icons">air</span></div>
          <div class="podaci">
            <h3>Disanje</h3>
            <p class="iznos">{{ najnoviDan.avg_respiration }} /min</p>
            <span class="mini-tekst">{{ najnoviDan.lowest_respiration }}-{{ najnoviDan.highest_respiration }} /min</span>
          </div>
        </div>
        <div class="kartica kartica-malo" v-if="najnoviDan.floors_climbed">
          <div class="ikona"><span class="material-icons">stairs</span></div>
          <div class="podaci">
            <h3>Katovi</h3>
            <p class="iznos">{{ najnoviDan.floors_climbed }}</p>
          </div>
        </div>
        <div class="kartica kartica-malo" v-if="najnoviDan.moderate_intensity_min != null">
          <div class="ikona"><span class="material-icons">bolt</span></div>
          <div class="podaci">
            <h3>Intenzivne minute</h3>
            <p class="iznos">{{ (najnoviDan.moderate_intensity_min || 0) + (najnoviDan.vigorous_intensity_min || 0) * 2 }}</p>
            <span class="mini-tekst">umjereno {{ najnoviDan.moderate_intensity_min || 0 }} · snažno {{ najnoviDan.vigorous_intensity_min || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== SAN SINOĆ ==================== -->
      <div v-if="sanRaspodjela" class="sekcija">
        <div class="sekcija-zaglavlje">
          <h2>San sinoć</h2>
          <span v-if="najnoviDan.sleep_score" :class="['znacka', ocjenaBoja(najnoviDan.sleep_score)]">{{ najnoviDan.sleep_score }}/100 · {{ ocjenaSnaTekst(najnoviDan.sleep_score) }}</span>
        </div>
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
            {{ dio.naziv }}: {{ formatSati(dio.sekunde) }} ({{ dio.postotak.toFixed(0) }}%)
          </span>
        </div>
        <div class="dodatne-mini-stavke" v-if="najnoviDan.sleep_avg_respiration || najnoviDan.sleep_avg_stress">
          <span v-if="najnoviDan.sleep_avg_respiration" class="mini-tekst"><span class="material-icons">air</span>Disanje tijekom sna: {{ najnoviDan.sleep_avg_respiration }} /min</span>
          <span v-if="najnoviDan.sleep_avg_stress != null" class="mini-tekst"><span class="material-icons">spa</span>Stres tijekom sna: {{ najnoviDan.sleep_avg_stress }}</span>
        </div>
      </div>

      <!-- ==================== STRES RASPODJELA ==================== -->
      <div v-if="stresRaspodjela" class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Stres danas</h2></div>
        <div class="san-traka">
          <div
            v-for="dio in stresRaspodjela"
            :key="dio.naziv"
            :class="['stres-dio', `stres-${dio.boja}`]"
            :style="{ width: dio.postotak + '%' }"
            :title="`${dio.naziv}: ${dio.minute} min`"
          ></div>
        </div>
        <div class="san-legenda">
          <span v-for="dio in stresRaspodjela" :key="dio.naziv" class="san-legenda-stavka">
            <span :class="['san-tockica', `stres-${dio.boja}`]"></span>
            {{ dio.naziv }}: {{ dio.minute }} min
          </span>
        </div>
      </div>

      <!-- ==================== TRENDOVI ==================== -->
      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Trendovi (prosjeci)</h2></div>
        <div class="trend-mreza">
          <div class="trend-stavka">
            <span class="trend-naziv">Koraci / 7 dana</span>
            <span class="trend-vrijednost">{{ prosjekKoraci7 !== null ? Math.round(prosjekKoraci7).toLocaleString('hr-HR') : '-' }}</span>
          </div>
          <div class="trend-stavka">
            <span class="trend-naziv">Koraci / 30 dana</span>
            <span class="trend-vrijednost">{{ prosjekKoraci30 !== null ? Math.round(prosjekKoraci30).toLocaleString('hr-HR') : '-' }}</span>
          </div>
          <div class="trend-stavka">
            <span class="trend-naziv">San / 7 dana</span>
            <span class="trend-vrijednost">{{ prosjekSan7 !== null ? formatSati(prosjekSan7) : '-' }}</span>
          </div>
          <div class="trend-stavka">
            <span class="trend-naziv">Puls u mirovanju / 7 dana</span>
            <span class="trend-vrijednost">{{ prosjekPuls7 !== null ? Math.round(prosjekPuls7) + ' bpm' : '-' }}</span>
          </div>
          <div class="trend-stavka">
            <span class="trend-naziv">HRV / 7 dana</span>
            <span class="trend-vrijednost">{{ prosjekHrv7 !== null ? Math.round(prosjekHrv7) + ' ms' : '-' }}</span>
          </div>
          <div class="trend-stavka">
            <span class="trend-naziv">Stres / 7 dana</span>
            <span class="trend-vrijednost">{{ prosjekStres7 !== null ? Math.round(prosjekStres7) : '-' }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== GRAFOVI ==================== -->
      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Koraci - zadnjih 14 dana</h2></div>
        <div class="trend-graf">
          <div v-for="dan in zadnjihNDana" :key="dan.datum" class="dan-stupac">
            <span class="dan-iznos" v-if="dan.steps">{{ Math.round((dan.steps || 0) / 1000) }}k</span>
            <div class="dan-stupac-omotac">
              <div class="dan-stupac-traka" :style="{ height: visinaStupca(dan.steps, maxKoraci) + 'px' }"></div>
            </div>
            <span class="dan-naziv">{{ formatKratkiDatum(dan.datum) }}</span>
          </div>
        </div>
      </div>

      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Puls u mirovanju - zadnjih 14 dana</h2></div>
        <div class="trend-graf">
          <div v-for="dan in zadnjihNDana" :key="dan.datum" class="dan-stupac">
            <span class="dan-iznos" v-if="dan.resting_hr">{{ dan.resting_hr }}</span>
            <div class="dan-stupac-omotac">
              <div class="dan-stupac-traka traka-puls" :style="{ height: visinaPulsStupca(dan.resting_hr) + 'px' }"></div>
            </div>
            <span class="dan-naziv">{{ formatKratkiDatum(dan.datum) }}</span>
          </div>
        </div>
      </div>

      <div class="sekcija">
        <div class="sekcija-zaglavlje"><h2>San - zadnjih 14 dana</h2></div>
        <div class="trend-graf">
          <div v-for="dan in zadnjihNDana" :key="dan.datum" class="dan-stupac">
            <span class="dan-iznos" v-if="dan.sleep_seconds">{{ (dan.sleep_seconds / 3600).toFixed(1) }}h</span>
            <div class="dan-stupac-omotac">
              <div class="dan-stupac-traka traka-san" :style="{ height: visinaStupca(dan.sleep_seconds, maxSan) + 'px' }"></div>
            </div>
            <span class="dan-naziv">{{ formatKratkiDatum(dan.datum) }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== AKTIVNOSTI ==================== -->
      <div v-if="aktivnosti.length > 0" class="sekcija">
        <div class="sekcija-zaglavlje"><h2>Nedavne aktivnosti</h2></div>
        <div class="lista-aktivnosti">
          <div v-for="akt in aktivnosti" :key="akt.id" class="aktivnost-kartica">
            <div class="aktivnost-ikona"><span class="material-icons">{{ ikonaAktivnosti(akt.type) }}</span></div>
            <div class="aktivnost-podaci">
              <div class="aktivnost-naslov">
                <span class="aktivnost-naziv">{{ akt.name || nazivTipaAktivnosti(akt.type) }}</span>
                <span class="aktivnost-datum">{{ formatDatumVrijemeAktivnosti(akt.start_time) }}</span>
              </div>
              <div class="aktivnost-stavke">
                <span v-if="akt.distance_m" class="mini-tekst"><span class="material-icons">straighten</span>{{ formatUdaljenost(akt.distance_m) }}</span>
                <span v-if="akt.duration_s" class="mini-tekst"><span class="material-icons">schedule</span>{{ formatTrajanje(akt.duration_s) }}</span>
                <span v-if="akt.calories" class="mini-tekst"><span class="material-icons">local_fire_department</span>{{ Math.round(akt.calories) }} kcal</span>
                <span v-if="akt.avg_hr" class="mini-tekst"><span class="material-icons">favorite</span>{{ Math.round(akt.avg_hr) }}-{{ Math.round(akt.max_hr || akt.avg_hr) }} bpm</span>
                <span v-if="akt.avg_speed" class="mini-tekst"><span class="material-icons">speed</span>{{ formatBrzina(akt.avg_speed) }}</span>
                <span v-if="akt.elevation_gain" class="mini-tekst"><span class="material-icons">terrain</span>+{{ Math.round(akt.elevation_gain) }} m</span>
                <span v-if="akt.aerobic_effect" class="mini-tekst"><span class="material-icons">monitor_heart</span>Aerobni {{ akt.aerobic_effect.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== PREGLED PO DANIMA ==================== -->
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
const aktivnosti = ref([]);
const zadnjiSync = ref(null);
const osvjezavanje = ref(false);
const porukaGreske = ref('');

let unsubDani = null;
let unsubMeta = null;
let unsubAktivnosti = null;

onMounted(() => {
  const qDani = query(collection(db, 'zdravlje-dani'), orderBy('dan', 'desc'), limit(30));
  unsubDani = onSnapshot(qDani, (snap) => {
    dani.value = snap.docs.map(d => ({ datum: d.id, ...d.data() }));
    ucitava.value = false;
  }, (error) => {
    console.error('Greška pri čitanju Zdravlje podataka:', error);
    ucitava.value = false;
  });

  unsubMeta = onSnapshot(doc(db, 'zdravlje-meta', 'zadnji-sync'), (snap) => {
    zadnjiSync.value = snap.exists() ? snap.data() : null;
  });

  const qAkt = query(collection(db, 'zdravlje-aktivnosti'), orderBy('start_time', 'desc'), limit(60));
  unsubAktivnosti = onSnapshot(qAkt, (snap) => {
    aktivnosti.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, (error) => {
    console.error('Greška pri čitanju aktivnosti:', error);
  });
});

onBeforeUnmount(() => {
  if (unsubDani) unsubDani();
  if (unsubMeta) unsubMeta();
  if (unsubAktivnosti) unsubAktivnosti();
});

const najnoviDan = computed(() => dani.value[0] || {});
const zadnjihNDana = computed(() => [...dani.value].slice(0, 14).reverse());
const maxKoraci = computed(() => Math.max(...zadnjihNDana.value.map(d => d.steps || 0), 1));
const maxSan = computed(() => Math.max(...zadnjihNDana.value.map(d => d.sleep_seconds || 0), 1));

const pulsVrijednosti = computed(() => zadnjihNDana.value.map(d => d.resting_hr).filter(v => typeof v === 'number'));
const maxPuls = computed(() => Math.max(...pulsVrijednosti.value, 1));
const minPuls = computed(() => pulsVrijednosti.value.length ? Math.min(...pulsVrijednosti.value) : 0);

const visinaStupca = (vrijednost, maxVrijednost) => {
  if (!vrijednost) return 0;
  return Math.max(6, Math.round((vrijednost / maxVrijednost) * 140));
};

const visinaPulsStupca = (hr) => {
  if (!hr) return 0;
  const raspon = Math.max(maxPuls.value - minPuls.value, 1);
  return Math.max(10, Math.round(((hr - minPuls.value) / raspon) * 120) + 20);
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

const stresRaspodjela = computed(() => {
  const d = najnoviDan.value;
  const ukupno = d.stress_duration_min;
  if (!ukupno) return null;
  return [
    { naziv: 'Mirno', minute: d.rest_stress_min || 0, boja: 'mirno' },
    { naziv: 'Nisko', minute: d.low_stress_min || 0, boja: 'nisko' },
    { naziv: 'Srednje', minute: d.medium_stress_min || 0, boja: 'srednje' },
    { naziv: 'Visoko', minute: d.high_stress_min || 0, boja: 'visoko' }
  ].map(s => ({ ...s, postotak: Math.max((s.minute / ukupno) * 100, 0) }));
});

const koraciProgres = computed(() => {
  const d = najnoviDan.value;
  if (!d.step_goal) return null;
  return Math.min(100, Math.round(((d.steps || 0) / d.step_goal) * 100));
});

const prosjek = (niz, polje) => {
  const vrijednosti = niz.map(d => d[polje]).filter(v => typeof v === 'number');
  return vrijednosti.length ? vrijednosti.reduce((s, v) => s + v, 0) / vrijednosti.length : null;
};

const prosjekKoraci7 = computed(() => prosjek(dani.value.slice(0, 7), 'steps'));
const prosjekKoraci30 = computed(() => prosjek(dani.value.slice(0, 30), 'steps'));
const prosjekSan7 = computed(() => prosjek(dani.value.slice(0, 7), 'sleep_seconds'));
const prosjekPuls7 = computed(() => prosjek(dani.value.slice(0, 7), 'resting_hr'));
const prosjekHrv7 = computed(() => prosjek(dani.value.slice(0, 7), 'hrv_last_night'));
const prosjekStres7 = computed(() => prosjek(dani.value.slice(0, 7), 'avg_stress'));

const ocjenaSnaTekst = (score) => {
  if (score == null) return '';
  if (score >= 90) return 'Izvrstan';
  if (score >= 80) return 'Vrlo dobar';
  if (score >= 60) return 'Dobar';
  if (score >= 40) return 'Loš';
  return 'Vrlo loš';
};

const ocjenaBoja = (score) => {
  if (score == null) return '';
  if (score >= 80) return 'znacka-dobro';
  if (score >= 60) return 'znacka-osrednje';
  return 'znacka-lose';
};

const stresTekst = (vrijednost) => {
  if (vrijednost <= 25) return 'Mirno';
  if (vrijednost <= 50) return 'Nisko';
  if (vrijednost <= 75) return 'Srednje';
  return 'Visoko';
};

const hrvStatusTekst = (status) => ({
  BALANCED: 'Ujednačen',
  UNBALANCED: 'Neujednačen',
  LOW: 'Nizak',
  POOR: 'Slab'
}[status] || status || '-');

const ikonaAktivnosti = (tip) => {
  const mapa = {
    running: 'directions_run', trail_running: 'directions_run', treadmill_running: 'directions_run',
    track_running: 'directions_run',
    cycling: 'directions_bike', mountain_biking: 'directions_bike', road_biking: 'directions_bike',
    indoor_cycling: 'directions_bike', gravel_cycling: 'directions_bike',
    walking: 'directions_walk', casual_walking: 'directions_walk', hiking: 'terrain',
    swimming: 'pool', lap_swimming: 'pool', open_water_swimming: 'pool',
    strength_training: 'fitness_center', indoor_cardio: 'fitness_center',
    yoga: 'self_improvement', breathwork: 'self_improvement'
  };
  return mapa[tip] || 'directions_run';
};

const nazivTipaAktivnosti = (tip) => (tip || '')
  .split('_')
  .map(rijec => rijec.charAt(0).toUpperCase() + rijec.slice(1))
  .join(' ');

const formatUdaljenost = (m) => m ? `${(m / 1000).toFixed(2)} km` : '-';
const formatBrzina = (ms) => ms ? `${(ms * 3.6).toFixed(1)} km/h` : '-';

const formatTrajanje = (s) => {
  if (!s) return '-';
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const formatDatumVrijemeAktivnosti = (str) => {
  if (!str) return '-';
  return new Date(str.replace(' ', 'T')).toLocaleString('hr-HR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

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

const uTijeku = computed(() => zadnjiSync.value?.uTijeku === true);

const pokreniSync = async (parametri) => {
  if (!BACKEND_URL) {
    porukaGreske.value = 'Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).';
    return;
  }
  osvjezavanje.value = true;
  porukaGreske.value = '';
  try {
    const token = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/sync${parametri}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!odgovor.ok) {
      const tekst = await odgovor.text();
      throw new Error(tekst || `Greška ${odgovor.status}`);
    }
  } catch (error) {
    console.error('Greška pri pokretanju sinkronizacije:', error);
    porukaGreske.value = 'Pokretanje nije uspjelo. Prvi poziv na Render može potrajati do minutu (budi se iz mirovanja) - probaj ponovno za malo.';
  } finally {
    osvjezavanje.value = false;
  }
};

const osvjeziSad = () => pokreniSync('?days=3');

const povuciPovijest = () => {
  const godinuDana = new Date();
  godinuDana.setFullYear(godinuDana.getFullYear() - 1);
  const zadano = godinuDana.toISOString().slice(0, 10);
  const od = prompt('Od kojeg datuma povući povijest? (YYYY-MM-DD) - predloženo je točno godinu dana unazad', zadano);
  if (!od) return;
  pokreniSync(`?since=${od}`);
};

const resetirajSync = async () => {
  if (!confirm('Resetirati status sinkronizacije? Koristi samo ako je stvarno zaglavilo (ne radi ništa već dulje vrijeme).')) return;
  try {
    const token = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/sync/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!odgovor.ok) throw new Error(`Greška ${odgovor.status}`);
  } catch (error) {
    console.error('Greška pri resetiranju sinkronizacije:', error);
    alert('Reset nije uspio: ' + error.message);
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.gumb-osvjezi:hover:not(:disabled), .gumb-povijest:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px var(--shadow-color);
}

.gumb-osvjezi:disabled, .gumb-povijest:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gumb-povijest {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.zadnji-sync.u-tijeku {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  font-weight: 500;
}

.zadnji-sync.u-tijeku .material-icons {
  font-size: 18px;
}

.gumb-resetiraj {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
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

/* ==================== KARTICE ==================== */
.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.kartice-dodatne {
  margin-bottom: 25px;
}

.kartica {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 18px;
  animation: pojaviSe 0.35s ease both;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kartica:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

@keyframes pojaviSe {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.kartice-animirane .kartica:nth-child(1) { animation-delay: 0.02s; }
.kartice-animirane .kartica:nth-child(2) { animation-delay: 0.06s; }
.kartice-animirane .kartica:nth-child(3) { animation-delay: 0.10s; }
.kartice-animirane .kartica:nth-child(4) { animation-delay: 0.14s; }
.kartice-animirane .kartica:nth-child(5) { animation-delay: 0.18s; }
.kartice-animirane .kartica:nth-child(6) { animation-delay: 0.22s; }

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

.kartica .podaci {
  min-width: 0;
  flex: 1;
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

.mini-tekst {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.mini-tekst .material-icons {
  font-size: 13px;
}

.mini-progres {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background-color: var(--bg-card-muted);
  margin-top: 6px;
  overflow: hidden;
}

.mini-progres-traka {
  height: 100%;
  background-color: var(--accent);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.mini-znacka {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}

.znacka {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.znacka-dobro, .mini-znacka.znacka-dobro {
  background-color: rgba(46, 125, 50, 0.15);
  color: var(--success);
}

.znacka-osrednje, .mini-znacka.znacka-osrednje {
  background-color: rgba(230, 160, 20, 0.18);
  color: #B8860B;
}

.znacka-lose, .mini-znacka.znacka-lose {
  background-color: rgba(229, 57, 53, 0.15);
  color: var(--danger);
}

/* ==================== SEKCIJE ==================== */
.sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-card);
  padding: 30px;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  margin-bottom: 25px;
}

.sekcija-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.sekcija-zaglavlje h2 {
  color: var(--text-heading);
  margin: 0;
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

.san-dio, .stres-dio {
  transition: width 0.5s ease;
}

.san-duboki { background-color: #1D4ED8; }
.san-lagani { background-color: #60A5FA; }
.san-rem { background-color: #A78BFA; }
.san-budan { background-color: #F87171; }

.stres-mirno { background-color: #60A5FA; }
.stres-nisko { background-color: #34D399; }
.stres-srednje { background-color: #FBBF24; }
.stres-visoko { background-color: #F87171; }

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

.dodatne-mini-stavke {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.dodatne-mini-stavke .mini-tekst {
  font-size: 0.82rem;
  margin-top: 0;
}

.dodatne-mini-stavke .mini-tekst .material-icons {
  font-size: 16px;
}

/* ==================== TRENDOVI ==================== */
.trend-mreza {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}

.trend-stavka {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--bg-card-muted);
  border-radius: var(--radius-small);
  padding: 14px;
}

.trend-naziv {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.trend-vrijednost {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-heading);
}

/* ==================== GRAFOVI ==================== */
.trend-graf {
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
  transition: height 0.4s ease;
}

.traka-puls { background-color: var(--danger); }
.traka-san { background-color: #7C6EF2; }

.dan-naziv {
  color: var(--text-muted);
  font-size: 0.7rem;
}

/* ==================== AKTIVNOSTI ==================== */
.lista-aktivnosti {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aktivnost-kartica {
  display: flex;
  gap: 14px;
  background-color: var(--bg-card-muted);
  border-radius: var(--radius-small);
  padding: 14px 16px;
  transition: transform 0.15s ease;
}

.aktivnost-kartica:hover {
  transform: translateX(2px);
}

.aktivnost-ikona {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.aktivnost-podaci {
  min-width: 0;
  flex: 1;
}

.aktivnost-naslov {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-bottom: 6px;
}

.aktivnost-naziv {
  font-weight: 600;
  color: var(--text-heading);
  text-transform: capitalize;
}

.aktivnost-datum {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.aktivnost-stavke {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

/* ==================== PREGLED PO DANIMA ==================== */
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
    padding: 16px;
    padding-bottom: 100px;
  }

  .zaglavlje {
    flex-direction: column;
    align-items: stretch;
  }

  .naslov {
    font-size: 1.5rem;
  }

  .zaglavlje-akcije {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .zadnji-sync {
    text-align: center;
  }

  .gumb-osvjezi, .gumb-povijest {
    width: 100%;
    justify-content: center;
  }

  .kartice {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .kartica {
    padding: 14px;
    gap: 10px;
  }

  .kartica .ikona {
    width: 36px;
    height: 36px;
  }

  .kartica .ikona .material-icons {
    font-size: 20px;
  }

  .kartica .podaci h3 {
    font-size: 0.72rem;
  }

  .kartica .podaci .iznos {
    font-size: 1.05rem;
  }

  .sekcija {
    padding: 18px;
  }

  .sekcija-zaglavlje h2 {
    font-size: 1.05rem;
  }

  .trend-mreza {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .trend-stavka {
    padding: 10px;
  }

  .aktivnost-kartica {
    flex-direction: column;
    gap: 8px;
  }

  .aktivnost-stavke {
    gap: 8px 12px;
  }

  .redak-dana {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    padding: 10px 4px;
  }

  .redak-datum {
    flex-basis: 100%;
  }

  .redak-stavka {
    font-size: 0.82rem;
  }

  .trend-graf {
    gap: 4px;
  }

  .dan-naziv {
    font-size: 0.62rem;
  }
}

@media (max-width: 380px) {
  .kartice {
    grid-template-columns: 1fr 1fr;
  }

  .trend-mreza {
    grid-template-columns: 1fr 1fr;
  }

  .redak-dana {
    gap: 6px 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kartica, .spinning, .san-dio, .stres-dio, .dan-stupac-traka, .mini-progres-traka {
    animation: none !important;
    transition: none !important;
  }
}
</style>
