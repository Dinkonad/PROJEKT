<template>
  <div class="auto">
    <h1 class="naslov">Auto</h1>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje...</p>
    </div>

    <template v-else>
      <div class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">speed</span></div>
          <div class="podaci">
            <h3>Zadnja kilometraža</h3>
            <p class="iznos">{{ zadnjaKilometraza !== null ? `${zadnjaKilometraza.toLocaleString('hr-HR')} km` : '-' }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">build</span></div>
          <div class="podaci">
            <h3>Ukupno servisi</h3>
            <p class="iznos">{{ formatCurrency(ukupnoServisi) }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">assignment</span></div>
          <div class="podaci">
            <h3>Ukupno registracije</h3>
            <p class="iznos">{{ formatCurrency(ukupnoRegistracije) }}</p>
          </div>
        </div>
      </div>

      <div class="tab-navigacija">
        <button
          v-for="t in tabovi"
          :key="t.vrijednost"
          :class="['tab-gumb', { aktivan: aktivniTab === t.vrijednost }]"
          @click="aktivniTab = t.vrijednost"
        >
          {{ t.naziv }}
        </button>
        <button class="gumb-dodaj" @click="otvoriModalUnos()">
          <span class="material-icons">add</span> Dodaj unos
        </button>
      </div>

      <div v-if="filtriraniUnosi.length === 0" class="prazno">
        <p>Nema unosa</p>
      </div>

      <div v-else class="lista-unosa">
        <div v-for="unos in filtriraniUnosi" :key="unos.id" class="redak-unosa">
          <div class="redak-glavno">
            <span :class="['oznaka-tipa', `tip-${unos.tip}`]">{{ nazivTipa(unos.tip) }}</span>
            <span class="redak-datum">{{ formatDatum(unos.datum) }}</span>
            <div class="redak-desno">
              <span v-if="unos.iznos !== undefined" class="redak-iznos">{{ formatCurrency(unos.iznos) }}</span>
              <div class="redak-akcije">
                <button class="gumb-akcija" title="Uredi" @click="otvoriModalUnos(unos)">
                  <span class="material-icons">edit</span>
                </button>
                <button class="gumb-akcija obrisi" title="Obriši" @click="unosZaBrisanje = unos">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>

          <div class="redak-detalji">
            <template v-if="unos.tip === 'kilometraza'">
              <span class="redak-info">
                {{ unos.pocetnaKilometraza?.toLocaleString('hr-HR') }} km
                <span v-if="unos.konacnaKilometraza"> → {{ unos.konacnaKilometraza.toLocaleString('hr-HR') }} km</span>
              </span>
              <span class="redak-info">
                {{ unos.pocetnaPotrosnja }} L
                <span v-if="unos.konacnaPotrosnja"> → {{ unos.konacnaPotrosnja }} L</span>
              </span>
              <span v-if="potrosnjaUnosa(unos) !== null" class="redak-potrosnja">{{ potrosnjaUnosa(unos).toFixed(1) }} L/100km</span>
            </template>
            <template v-else-if="unos.tip === 'servis'">
              <span v-if="unos.imeOsobe" class="redak-info"><span class="material-icons">person</span>{{ unos.imeOsobe }}</span>
              <span v-if="unos.lokacija" class="redak-info"><span class="material-icons">place</span>{{ unos.lokacija }}</span>
              <span v-if="unos.opis" class="redak-opis">{{ unos.opis }}</span>
            </template>
            <template v-else>
              <span v-if="unos.opis" class="redak-opis">{{ unos.opis }}</span>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== MODAL: DODAJ/UREDI UNOS ==================== -->
    <div v-if="prikaziModalUnos" class="prekrivka-modala" @click="zatvoriModalUnos">
      <div class="modal" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeUnos ? 'Uredi unos' : 'Dodaj unos' }}</h3>
          <button class="gumb-zatvaranja" @click="zatvoriModalUnos">&times;</button>
        </div>
        <form class="forma" @submit.prevent="spremiUnos">
          <div class="grupa-polja">
            <label>Vrsta:</label>
            <select v-model="forma.tip">
              <option value="registracija">Registracija</option>
              <option value="servis">Servis</option>
              <option value="kilometraza">Gorivo / potrošnja</option>
            </select>
          </div>
          <div class="grupa-polja">
            <label>Datum:</label>
            <input v-model="forma.datum" type="date" required>
          </div>

          <template v-if="forma.tip === 'registracija'">
            <div class="grupa-polja">
              <label>Iznos (EUR):</label>
              <input v-model.number="forma.iznos" type="number" step="0.01" min="0" required>
            </div>
            <div class="grupa-polja">
              <label>Opis (napomena):</label>
              <textarea v-model="forma.opis" rows="3" placeholder="Npr. tehnički pregled, osiguranje..."></textarea>
            </div>
          </template>

          <template v-else-if="forma.tip === 'servis'">
            <div class="grupa-polja">
              <label>Iznos (EUR):</label>
              <input v-model.number="forma.iznos" type="number" step="0.01" min="0" required>
            </div>
            <div class="grupa-polja">
              <label>Ime osobe / servisa:</label>
              <input v-model="forma.imeOsobe" type="text" placeholder="Npr. Marko, Auto servis Horvat">
            </div>
            <div class="grupa-polja">
              <label>Lokacija:</label>
              <input v-model="forma.lokacija" type="text" placeholder="Npr. Pula">
            </div>
            <div class="grupa-polja">
              <label>Opis (što se radilo):</label>
              <textarea v-model="forma.opis" rows="3" placeholder="Npr. zamjena ulja i filtera, kočione pločice..."></textarea>
            </div>
          </template>

          <template v-else>
            <div class="grupa-polja grupa-vrijeme">
              <div>
                <label>Početna kilometraža:</label>
                <input v-model.number="forma.pocetnaKilometraza" type="number" min="0" required>
              </div>
              <div>
                <label>Konačna kilometraža:</label>
                <input v-model.number="forma.konacnaKilometraza" type="number" min="0" placeholder="Upiši kad stigneš">
              </div>
            </div>
            <div class="grupa-polja grupa-vrijeme">
              <div>
                <label>Početna potrošnja (L):</label>
                <input v-model.number="forma.pocetnaPotrosnja" type="number" step="0.01" min="0" required placeholder="Npr. 80">
              </div>
              <div>
                <label>Konačna potrošnja (L):</label>
                <input v-model.number="forma.konacnaPotrosnja" type="number" step="0.01" min="0" placeholder="Npr. 93">
              </div>
            </div>
            <div class="pregled-izracuna" v-if="pregledPotrosnje !== null">
              <span>{{ pregledPotrosnje.toFixed(1) }} L/100km</span>
            </div>
          </template>

          <div class="akcije-forme">
            <button type="button" class="gumb-odustati" @click="zatvoriModalUnos">Odustani</button>
            <button type="submit" class="gumb-spremiti">{{ uredujeUnos ? 'Spremi promjene' : 'Dodaj' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: POTVRDA BRISANJA ==================== -->
    <div v-if="unosZaBrisanje" class="prekrivka-modala" @click="unosZaBrisanje = null">
      <div class="modal-potvrda" @click.stop>
        <div class="zaglavlje-modala"><h2>Potvrda brisanja</h2></div>
        <div class="sadrzaj-potvrde">
          <span class="material-icons upozorenje">warning</span>
          <p>Obrisati ovaj unos?</p>
        </div>
        <div class="gumbovi-potvrde">
          <button class="gumb-odustati" @click="unosZaBrisanje = null">Odustani</button>
          <button class="gumb-potvrditi" @click="potvrdiBrisanje">Potvrdi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { db } from '@/services/firebase.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const ucitava = ref(true);
const unosi = ref([]);
const aktivniTab = ref('sve');

const prikaziModalUnos = ref(false);
const uredujeUnos = ref(null);
const forma = ref(praznaForma());
const unosZaBrisanje = ref(null);

let unsub = null;

const tabovi = [
  { vrijednost: 'sve', naziv: 'Sve' },
  { vrijednost: 'registracija', naziv: 'Registracija' },
  { vrijednost: 'servis', naziv: 'Servis' },
  { vrijednost: 'kilometraza', naziv: 'Gorivo' }
];

function praznaForma() {
  return {
    tip: 'registracija', datum: '', iznos: null, opis: '',
    imeOsobe: '', lokacija: '',
    pocetnaKilometraza: null, konacnaKilometraza: null,
    pocetnaPotrosnja: null, konacnaPotrosnja: null
  };
}

const nazivTipa = (tip) => ({ registracija: 'Registracija', servis: 'Servis', kilometraza: 'Gorivo' }[tip] || tip);
const formatCurrency = (v) => `${(parseFloat(v) || 0).toFixed(2)} EUR`;
const formatDatum = (datumString) => datumString ? new Date(datumString).toLocaleDateString('hr-HR') : '';

const filtriraniUnosi = computed(() => {
  const lista = aktivniTab.value === 'sve' ? unosi.value : unosi.value.filter(u => u.tip === aktivniTab.value);
  return [...lista].sort((a, b) => b.datum.localeCompare(a.datum));
});

const potrosnjaUnosa = (unos) => {
  const km = (unos.konacnaKilometraza || 0) - (unos.pocetnaKilometraza || 0);
  const litre = (unos.konacnaPotrosnja || 0) - (unos.pocetnaPotrosnja || 0);
  if (km <= 0 || litre <= 0) return null;
  return (litre / km) * 100;
};

const pregledPotrosnje = computed(() => {
  if (forma.value.tip !== 'kilometraza') return null;
  return potrosnjaUnosa(forma.value);
});

const zadnjaKilometraza = computed(() => {
  const sveKilometraze = unosi.value
    .filter(u => u.tip === 'kilometraza')
    .flatMap(u => [u.pocetnaKilometraza, u.konacnaKilometraza])
    .filter(v => typeof v === 'number');
  return sveKilometraze.length ? Math.max(...sveKilometraze) : null;
});

const ukupnoServisi = computed(() => unosi.value.filter(u => u.tip === 'servis').reduce((s, u) => s + (parseFloat(u.iznos) || 0), 0));
const ukupnoRegistracije = computed(() => unosi.value.filter(u => u.tip === 'registracija').reduce((s, u) => s + (parseFloat(u.iznos) || 0), 0));

onMounted(() => {
  unsub = onSnapshot(collection(db, 'auto'), (snapshot) => {
    unosi.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    ucitava.value = false;
  });
});

onBeforeUnmount(() => {
  if (unsub) unsub();
});

const otvoriModalUnos = (unos = null) => {
  uredujeUnos.value = unos;
  forma.value = unos ? { ...praznaForma(), ...unos } : praznaForma();
  prikaziModalUnos.value = true;
};

const zatvoriModalUnos = () => {
  prikaziModalUnos.value = false;
  uredujeUnos.value = null;
};

const spremiUnos = async () => {
  const podaci = { tip: forma.value.tip, datum: forma.value.datum };
  if (forma.value.tip === 'registracija') {
    podaci.iznos = forma.value.iznos || 0;
    podaci.opis = forma.value.opis || '';
  } else if (forma.value.tip === 'servis') {
    podaci.iznos = forma.value.iznos || 0;
    podaci.imeOsobe = forma.value.imeOsobe || '';
    podaci.lokacija = forma.value.lokacija || '';
    podaci.opis = forma.value.opis || '';
  } else {
    podaci.pocetnaKilometraza = forma.value.pocetnaKilometraza || 0;
    podaci.konacnaKilometraza = forma.value.konacnaKilometraza || null;
    podaci.pocetnaPotrosnja = forma.value.pocetnaPotrosnja || 0;
    podaci.konacnaPotrosnja = forma.value.konacnaPotrosnja || null;
  }

  try {
    if (uredujeUnos.value) {
      await updateDoc(doc(db, 'auto', uredujeUnos.value.id), podaci);
    } else {
      await addDoc(collection(db, 'auto'), podaci);
    }
    zatvoriModalUnos();
  } catch (error) {
    console.error('Greška pri spremanju unosa:', error);
    alert('Greška pri spremanju unosa.');
  }
};

const potvrdiBrisanje = async () => {
  if (!unosZaBrisanje.value) return;
  try {
    await deleteDoc(doc(db, 'auto', unosZaBrisanje.value.id));
  } catch (error) {
    console.error('Greška pri brisanju unosa:', error);
  } finally {
    unosZaBrisanje.value = null;
  }
};
</script>

<style scoped>
.auto {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
  font-family: 'Roboto', sans-serif;
}

.naslov {
  color: var(--text-heading);
  font-weight: 700;
  margin-bottom: 30px;
}

.loading-container {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
  font-size: 28px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.kartica .podaci .iznos {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-heading);
}

.tab-navigacija {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

.tab-gumb {
  background: none;
  border: 1px solid transparent;
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.tab-gumb.aktivan {
  background-color: var(--accent);
  color: white;
}

.gumb-dodaj {
  margin-left: auto;
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

.prazno {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.lista-unosa {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.redak-unosa {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 16px;
}

.redak-glavno {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.oznaka-tipa {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: white;
}

.tip-registracija { background-color: var(--accent); }
.tip-servis { background-color: var(--danger); }
.tip-kilometraza { background-color: var(--success); }

.redak-datum {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 0.9rem;
}

.redak-desno {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.redak-iznos {
  color: var(--success);
  font-weight: 700;
  white-space: nowrap;
}

.redak-detalji {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
}

.redak-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.redak-info .material-icons {
  font-size: 15px;
}

.redak-opis {
  color: var(--text-muted);
  font-size: 0.85rem;
  flex-basis: 100%;
}

.redak-potrosnja {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 20px;
}

.redak-akcije {
  display: flex;
  gap: 2px;
}

.gumb-akcija {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 6px;
  border-radius: 6px;
  display: flex;
}

.gumb-akcija:hover {
  background-color: var(--bg-card-muted);
  color: var(--accent);
}

.gumb-akcija.obrisi:hover {
  color: var(--danger);
}

/* ==================== MODALI ==================== */
.prekrivka-modala {
  position: fixed;
  inset: 0;
  background: rgba(3, 3, 3, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: var(--bg-card);
  border-radius: 10px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
}

.zaglavlje-modala {
  background: var(--accent);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zaglavlje-modala h3, .zaglavlje-modala h2 {
  margin: 0;
  font-size: 18px;
}

.gumb-zatvaranja {
  background: transparent;
  color: white;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

.forma {
  padding: 20px;
}

.grupa-polja {
  margin-bottom: 16px;
}

.grupa-polja label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-heading);
  font-size: 14px;
}

.grupa-polja input,
.grupa-polja select,
.grupa-polja textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Roboto', sans-serif;
  background: var(--bg-page);
  color: var(--text-body);
  resize: vertical;
}

.grupa-vrijeme {
  display: flex;
  gap: 12px;
}

.grupa-vrijeme > div {
  flex: 1;
  min-width: 0;
}

.pregled-izracuna {
  display: flex;
  justify-content: center;
  background: var(--bg-card-muted);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-weight: 700;
  color: var(--text-heading);
}

.akcije-forme {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.gumb-odustati, .gumb-spremiti, .gumb-potvrditi {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.gumb-odustati {
  background: var(--bg-card-muted);
  color: var(--text-heading);
}

.gumb-spremiti {
  background: var(--accent);
  color: white;
}

.modal-potvrda {
  background: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  overflow: hidden;
}

.sadrzaj-potvrde {
  padding: 24px;
  text-align: center;
}

.sadrzaj-potvrde .upozorenje {
  font-size: 44px;
  color: var(--danger);
  margin-bottom: 10px;
  display: block;
}

.sadrzaj-potvrde p {
  color: var(--text-body);
}

.gumbovi-potvrde {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 24px 24px;
}

.gumb-potvrditi {
  background: var(--danger);
  color: white;
}

@media (max-width: 900px) {
  .auto {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .auto {
    padding: 20px;
    padding-bottom: 100px;
  }

  .kartice {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .kartica {
    flex-direction: column;
    text-align: center;
    padding: 14px 8px;
    gap: 8px;
  }

  .kartica .podaci h3 {
    font-size: 0.68rem;
  }

  .kartica .podaci .iznos {
    font-size: 0.95rem;
  }

  .redak-glavno {
    gap: 8px;
  }

  .redak-iznos {
    font-size: 0.85rem;
  }

  .redak-desno {
    gap: 6px;
  }

  .tab-navigacija {
    gap: 6px;
  }

  .gumb-dodaj {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    order: 99;
  }

  .grupa-vrijeme {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .auto {
    padding: 14px;
    padding-bottom: 100px;
  }

  .naslov {
    font-size: 1.5rem;
  }

  .kartice {
    gap: 8px;
  }

  .kartica {
    padding: 10px 4px;
    gap: 6px;
  }

  .kartica .ikona {
    width: 32px;
    height: 32px;
  }

  .kartica .ikona .material-icons {
    font-size: 18px;
  }

  .kartica .podaci h3 {
    font-size: 0.62rem;
  }

  .kartica .podaci .iznos {
    font-size: 0.85rem;
  }

  .redak-info, .redak-opis {
    font-size: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kartica { animation: none !important; transition: none !important; }
}
</style>
