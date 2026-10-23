<template>
  <div class="kalendar-stranica">
    <div class="zaglavlje">
      <h1 class="naslov">Kalendar</h1>
      <div class="zaglavlje-akcije">
        <span class="zadnja-sink">{{ zadnjaSinkronizacijaTekst }}</span>
        <button class="gumb-osvjezi" :disabled="osvjezavanje" @click="osvjeziSad">
          <span class="material-icons" :class="{ spinning: osvjezavanje }">sync</span>
          Osvježi sad
        </button>
      </div>
    </div>

    <p v-if="porukaGreske" class="poruka-greska">{{ porukaGreske }}</p>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje...</p>
    </div>

    <div v-else-if="grupiraniEventi.length === 0" class="prazno">
      <span class="material-icons">event_busy</span>
      <p>Nema nadolazećih eventa. Klikni "Osvježi sad" ako si tek povezao kalendare.</p>
    </div>

    <template v-else>
      <div v-for="grupa in grupiraniEventi" :key="grupa.dan" class="sekcija">
        <div class="sekcija-zaglavlje"><h2>{{ grupa.naslov }}</h2></div>
        <div class="lista-eventi">
          <div v-for="e in grupa.eventi" :key="e.id" class="event-kartica">
            <div class="event-vrijeme">
              <span v-if="e.cijeliDan" class="event-cijeli-dan">Cijeli dan</span>
              <span v-else>{{ formatSat(e.pocetak) }}</span>
            </div>
            <div class="event-podaci">
              <div class="event-naslov-red">
                <span class="event-naslov">{{ e.naslov }}</span>
                <span class="event-kalendar-oznaka" :style="{ backgroundColor: bojaZaKalendar(e.kalendar) }">{{ e.kalendar }}</span>
              </div>
              <span v-if="e.lokacija" class="event-lokacija"><span class="material-icons">place</span>{{ e.lokacija }}</span>
            </div>
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
const IZOSTAVI_KALENDAR = 'Biznis baza';

const ucitava = ref(true);
const eventi = ref([]);
const zadnjaSink = ref(null);
const osvjezavanje = ref(false);
const porukaGreske = ref('');

let unsubEventi = null;
let unsubMeta = null;

const danStringLokalno = (d) => {
  const godina = d.getFullYear();
  const mjesec = String(d.getMonth() + 1).padStart(2, '0');
  const dan = String(d.getDate()).padStart(2, '0');
  return `${godina}-${mjesec}-${dan}`;
};

onMounted(() => {
  const danasStr = danStringLokalno(new Date());

  const qEventi = query(collection(db, 'kalendar-eventi'), orderBy('pocetak'), limit(300));
  unsubEventi = onSnapshot(qEventi, (snap) => {
    eventi.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.kalendar !== IZOSTAVI_KALENDAR && e.dan >= danasStr);
    ucitava.value = false;
  }, (error) => {
    console.error('Greška pri čitanju kalendar eventa:', error);
    ucitava.value = false;
  });

  unsubMeta = onSnapshot(doc(db, 'kalendar-meta', 'zadnja-sinkronizacija'), (snap) => {
    zadnjaSink.value = snap.exists() ? snap.data() : null;
  });
});

onBeforeUnmount(() => {
  if (unsubEventi) unsubEventi();
  if (unsubMeta) unsubMeta();
});

const zadnjaSinkronizacijaTekst = computed(() => {
  if (!zadnjaSink.value?.vrijeme?.seconds) return 'Još nije sinkronizirano';
  const datum = new Date(zadnjaSink.value.vrijeme.seconds * 1000);
  return `Zadnje osvježeno: ${datum.toLocaleString('hr-HR')}`;
});

const BOJE_KALENDARA = ['#123458', '#5D8AA8', '#2E7D32', '#9C7A54', '#7C6EF2', '#B8860B'];
const bojaZaKalendar = (naziv) => {
  let hash = 0;
  for (let i = 0; i < naziv.length; i++) hash = naziv.charCodeAt(i) + ((hash << 5) - hash);
  return BOJE_KALENDARA[Math.abs(hash) % BOJE_KALENDARA.length];
};

const formatSat = (pocetakIso) => {
  if (!pocetakIso || pocetakIso.length < 16) return '';
  return pocetakIso.slice(11, 16);
};

const formatNazivDana = (danStr) => {
  const danas = new Date();
  danas.setHours(0, 0, 0, 0);
  const sutra = new Date(danas);
  sutra.setDate(sutra.getDate() + 1);
  const [godina, mjesec, dan] = danStr.split('-').map(Number);
  const datum = new Date(godina, mjesec - 1, dan);

  if (danStringLokalno(datum) === danStringLokalno(danas)) return 'Danas';
  if (danStringLokalno(datum) === danStringLokalno(sutra)) return 'Sutra';
  return datum.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const grupiraniEventi = computed(() => {
  const grupe = {};
  eventi.value.forEach(e => {
    if (!grupe[e.dan]) grupe[e.dan] = [];
    grupe[e.dan].push(e);
  });
  return Object.keys(grupe).sort().map(dan => ({
    dan,
    naslov: formatNazivDana(dan),
    eventi: grupe[dan].sort((a, b) => (a.pocetak || '').localeCompare(b.pocetak || ''))
  }));
});

const osvjeziSad = async () => {
  if (!BACKEND_URL) {
    porukaGreske.value = 'Backend adresa nije postavljena (VITE_GARMIN_BACKEND_URL u .env).';
    return;
  }
  osvjezavanje.value = true;
  porukaGreske.value = '';
  try {
    const token = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/kalendar/osvjezi-rucno`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!odgovor.ok) {
      const tekst = await odgovor.text();
      throw new Error(tekst || `Greška ${odgovor.status}`);
    }
  } catch (error) {
    console.error('Greška pri osvježavanju kalendara:', error);
    porukaGreske.value = 'Osvježavanje nije uspjelo. Prvi poziv na Render može potrajati do minutu - probaj ponovno za malo.';
  } finally {
    osvjezavanje.value = false;
  }
};
</script>

<style scoped>
.kalendar-stranica {
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
  margin-bottom: 25px;
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

.zadnja-sink {
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

.sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  margin-bottom: 20px;
}

.sekcija-zaglavlje h2 {
  color: var(--text-heading);
  margin: 0 0 16px;
  font-weight: 600;
  font-size: 1.1rem;
  text-transform: capitalize;
}

.lista-eventi {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-kartica {
  display: flex;
  gap: 14px;
  background-color: var(--bg-card-muted);
  border-radius: var(--radius-small);
  padding: 12px 14px;
}

.event-vrijeme {
  flex-shrink: 0;
  min-width: 48px;
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.9rem;
}

.event-cijeli-dan {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.event-podaci {
  min-width: 0;
  flex: 1;
}

.event-naslov-red {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.event-naslov {
  color: var(--text-heading);
  font-weight: 600;
}

.event-kalendar-oznaka {
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.event-lokacija {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: 4px;
}

.event-lokacija .material-icons {
  font-size: 14px;
}

@media (max-width: 768px) {
  .kalendar-stranica {
    padding: 16px;
    padding-bottom: 100px;
  }

  .zaglavlje {
    flex-direction: column;
    align-items: stretch;
  }

  .zaglavlje-akcije {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .zadnja-sink {
    text-align: center;
  }

  .gumb-osvjezi {
    width: 100%;
    justify-content: center;
  }

  .sekcija {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none !important;
  }
}
</style>
