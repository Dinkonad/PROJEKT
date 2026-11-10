<template>
  <div class="sekcija rute">
    <div class="sekcija-zaglavlje rute-zaglavlje">
      <h2>Rute na karti</h2>
      <button
        type="button"
        class="gumb-sekundarni"
        :disabled="meta?.uTijeku || pokrece"
        @click="povuciRute"
      >
        <span class="material-icons" :class="{ vrti: meta?.uTijeku || pokrece }">{{ meta?.uTijeku || pokrece ? 'sync' : 'cloud_download' }}</span>
        {{ meta?.uTijeku || pokrece ? 'Povlačim...' : 'Povuci rute' }}
      </button>
    </div>

    <p v-if="meta?.uTijeku" class="rute-info">
      Povlačim rute s Garmin Connecta: povučeno {{ meta.povuceno || 0 }}<template v-if="meta.preostalo != null">, još {{ meta.preostalo }}</template>.
      Možeš ostati na stranici, karta se sama nadopunjuje.
    </p>
    <p v-else-if="meta?.greska" class="rute-info rute-greska">{{ meta.greska }}</p>

    <div class="rute-filteri">
      <div class="tabovi" role="tablist">
        <button
          v-for="t in TIPOVI"
          :key="t.kljuc"
          type="button"
          role="tab"
          class="tab"
          :class="{ aktivan: tip === t.kljuc }"
          @click="tip = t.kljuc"
        >
          <span v-if="t.boja" class="tockica" :style="{ backgroundColor: t.boja }"></span>
          {{ t.naziv }}
        </button>
      </div>
      <select v-model="godina" class="rute-godina" aria-label="Godina">
        <option value="sve">Sve godine</option>
        <option v-for="g in godine" :key="g" :value="String(g)">{{ g }}</option>
      </select>
    </div>

    <p class="rute-sazetak">
      <strong>{{ filtrirane.length }}</strong> {{ nazivRuta }}
      <template v-if="filtrirane.length"> · <strong>{{ ukupnoKm }}</strong> km</template>
    </p>

    <div class="mapa-omotac">
      <div ref="mapaEl" class="mapa-rute"></div>
      <p v-if="greskaKarte" class="rute-info rute-greska mapa-poruka">{{ greskaKarte }}</p>
      <p v-else-if="ucitano && !filtrirane.length" class="mapa-prazno">
        <span v-if="!sveRute.length">Još nema ruta. Klikni "Povuci rute" da se povuku iz Garmin Connecta.</span>
        <span v-else>Nema ruta za odabrani filter.</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { db, auth } from '@/services/firebase.js';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { obavijesti } from '@/services/obavijest.js';
import { ucitajLeaflet } from '@/utils/leaflet.js';
import { dekodirajPolyline } from '@/utils/polyline.js';

const BACKEND_URL = import.meta.env.VITE_GARMIN_BACKEND_URL || '';

const BOJA_HODANJE = '#2E8B57';
const BOJA_TRCANJE = '#E4572E';
const TIPOVI = [
  { kljuc: 'sve', naziv: 'Sve', boja: null },
  { kljuc: 'hodanje', naziv: 'Hodanje', boja: BOJA_HODANJE },
  { kljuc: 'trcanje', naziv: 'Trčanje', boja: BOJA_TRCANJE }
];

const sveRute = ref([]);
const meta = ref(null);
const tip = ref('sve');
const godina = ref('sve');
const ucitano = ref(false);
const pokrece = ref(false);
const greskaKarte = ref('');
const mapaEl = ref(null);

let L = null;
let mapa = null;
let sloj = null;
let unsubRute = null;
let unsubMeta = null;

const vrstaTipa = (t) => ((t || '').toLowerCase().includes('run') ? 'trcanje' : 'hodanje');

const godine = computed(() => {
  const g = new Set(sveRute.value.map(r => parseInt((r.start_time || '').slice(0, 4), 10)).filter(Number.isFinite));
  return [...g].sort((a, b) => b - a);
});

const filtrirane = computed(() =>
  sveRute.value.filter(r =>
    (tip.value === 'sve' || vrstaTipa(r.type) === tip.value) &&
    (godina.value === 'sve' || (r.start_time || '').startsWith(godina.value))
  )
);

// 1 ruta, 2-4 rute, 5+ ruta (11-14 su "ruta")
const nazivRuta = computed(() => {
  const n = filtrirane.value.length;
  return n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? 'rute' : 'ruta';
});

const ukupnoKm = computed(() => {
  const m = filtrirane.value.reduce((s, r) => s + (r.distance_m || 0), 0);
  return (m / 1000).toLocaleString('hr-HR', { maximumFractionDigits: 1 });
});

const formatDatum = (s) => {
  const [g, m, d] = (s || '').slice(0, 10).split('-');
  return g ? `${d}.${m}.${g}.` : '';
};

const formatTrajanje = (sek) => {
  if (!sek) return '';
  const h = Math.floor(sek / 3600);
  const min = Math.round((sek % 3600) / 60);
  return h ? `${h} h ${String(min).padStart(2, '0')} min` : `${min} min`;
};

const formatTempo = (ms) => {
  if (!ms) return '';
  const po_km = 1000 / ms / 60;
  const min = Math.floor(po_km);
  const sek = Math.round((po_km - min) * 60);
  return `${min}:${String(sek === 60 ? 0 : sek).padStart(2, '0')} min/km`;
};

const escapeHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const opisRute = (r) => {
  const dijelovi = [
    `<strong>${escapeHtml(r.name || (vrstaTipa(r.type) === 'trcanje' ? 'Trčanje' : 'Hodanje'))}</strong>`,
    escapeHtml(formatDatum(r.start_time)),
    [r.distance_m ? `${(r.distance_m / 1000).toFixed(2)} km` : '', formatTrajanje(r.duration_s), formatTempo(r.avg_speed)].filter(Boolean).join(' · ')
  ];
  return dijelovi.filter(Boolean).join('<br>');
};

const nacrtaj = () => {
  if (!mapa || !L) return;
  sloj.clearLayers();
  const granice = [];

  filtrirane.value.forEach((r) => {
    const tocke = dekodirajPolyline(r.tocke);
    if (tocke.length < 2) return;
    const boja = vrstaTipa(r.type) === 'trcanje' ? BOJA_TRCANJE : BOJA_HODANJE;
    const linija = L.polyline(tocke, { color: boja, weight: 3, opacity: 0.7, lineJoin: 'round' }).addTo(sloj);
    linija.bindPopup(opisRute(r));
    linija.on('mouseover', () => linija.setStyle({ weight: 6, opacity: 1 }));
    linija.on('mouseout', () => linija.setStyle({ weight: 3, opacity: 0.7 }));
    granice.push(...tocke);
  });

  if (granice.length) mapa.fitBounds(L.latLngBounds(granice), { padding: [24, 24], maxZoom: 15 });
};

watch(filtrirane, () => nacrtaj());

onMounted(async () => {
  unsubRute = onSnapshot(
    query(collection(db, 'zdravlje-rute'), orderBy('start_time', 'desc'), limit(1000)),
    (snap) => {
      sveRute.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.bezRute === false && typeof r.tocke === 'string');
      ucitano.value = true;
    },
    (error) => {
      console.error('Greška pri čitanju ruta:', error);
      ucitano.value = true;
    }
  );

  unsubMeta = onSnapshot(doc(db, 'zdravlje-meta', 'rute'), (snap) => {
    meta.value = snap.exists() ? snap.data() : null;
  });

  try {
    L = await ucitajLeaflet();
    await nextTick();
    mapa = L.map(mapaEl.value, { scrollWheelZoom: false }).setView([45.8, 16.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);
    sloj = L.layerGroup().addTo(mapa);
    nacrtaj();
  } catch (error) {
    greskaKarte.value = error.message;
  }
});

onBeforeUnmount(() => {
  if (unsubRute) unsubRute();
  if (unsubMeta) unsubMeta();
  if (mapa) mapa.remove();
});

const povuciRute = async () => {
  if (!BACKEND_URL) {
    obavijesti('Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).');
    return;
  }
  pokrece.value = true;
  try {
    const token = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/zdravlje/rute/povuci`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (odgovor.status === 409) {
      obavijesti('Povlačenje ruta je već u tijeku.', 'info');
      return;
    }
    if (odgovor.status === 404) {
      obavijesti('Server još nema ovu funkciju. Pushaj backend (garmin/garmin) i pričekaj da se Render ponovno pokrene.');
      return;
    }
    if (odgovor.status === 401 || odgovor.status === 403) {
      obavijesti('Server je odbio zahtjev (prijava). Odjavi se i prijavi ponovno.');
      return;
    }
    if (!odgovor.ok) {
      const tekst = await odgovor.text();
      throw new Error(`Greška ${odgovor.status}: ${tekst.slice(0, 200)}`);
    }
    obavijesti('Povlačenje ruta je pokrenuto. Prvi put može potrajati nekoliko minuta.', 'info');
  } catch (error) {
    console.error('Greška pri pokretanju povlačenja ruta:', error);
    // fetch baca TypeError kad nema veze s serverom (npr. Render se budi iz mirovanja)
    obavijesti(error instanceof TypeError
      ? 'Nema odgovora od servera. Ako se Render budi iz mirovanja, to traje do minutu - probaj ponovno za malo.'
      : `Pokretanje nije uspjelo. ${error.message}`);
  } finally {
    pokrece.value = false;
  }
};
</script>

<style scoped>
.rute-zaglavlje h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--text-heading);
}

.rute-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.rute-info {
  margin: 0 0 var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-small);
  background-color: var(--bg-card-muted);
  border-left: 4px solid var(--accent-soft);
  font-size: 0.88rem;
  color: var(--text-body);
}

.rute-greska {
  border-left-color: var(--danger);
}

.rute-filteri {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.rute-filteri .tabovi {
  margin-bottom: var(--space-3);
}

.tockica {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.rute-godina {
  min-height: var(--touch);
  padding: 0 var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  background: var(--bg-page);
  color: var(--text-body);
  font-size: 0.95rem;
}

.rute-sazetak {
  margin: 0 0 var(--space-3);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.rute-sazetak strong {
  color: var(--text-heading);
}

.mapa-omotac {
  position: relative;
}

.mapa-rute {
  height: 460px;
  width: 100%;
  border-radius: var(--radius-small);
  border: 1px solid var(--border-color);
  overflow: hidden;
  z-index: 0;
}

.mapa-prazno,
.mapa-poruka {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 85%;
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-small);
  background-color: var(--bg-card);
  box-shadow: var(--glass-shadow);
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-body);
  z-index: 500;
}

.vrti {
  animation: rute-vrti 1s linear infinite;
}

@keyframes rute-vrti {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .mapa-rute {
    height: 360px;
  }
}
</style>
