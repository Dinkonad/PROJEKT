<template>
  <div class="sifre">
    <h1 class="naslov">Šifre</h1>

    <div v-if="ucitavaProvjera" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje...</p>
    </div>

    <!-- ==================== PRVO POSTAVLJANJE PIN-a ==================== -->
    <div v-else-if="!postavljenPin" class="pin-kartica">
      <span class="material-icons pin-ikona">lock_open</span>
      <h2>Postavi PIN za vault</h2>
      <p class="pin-opis">Ovaj PIN štiti tvoje šifre (odvojen je od Face ID-a). Ne sprema se nigdje - ako ga zaboraviš, stare šifre se ne mogu dešifrirati.</p>
      <form class="pin-forma" @submit.prevent="postaviPin">
        <input v-model="noviPin" type="password" inputmode="numeric" placeholder="Novi PIN (min. 4 znamenke)" minlength="4" required>
        <input v-model="potvrdaPin" type="password" inputmode="numeric" placeholder="Potvrdi PIN" minlength="4" required>
        <p v-if="pinGreska" class="pin-greska">{{ pinGreska }}</p>
        <button type="submit" class="gumb-pin">Postavi PIN</button>
      </form>
    </div>

    <!-- ==================== OTKLJUČAVANJE FACE ID-om (ako je PIN već zapamćen na ovom uređaju) ==================== -->
    <div v-else-if="koristiFaceIdOtvaranje && !otkljucano" class="pin-kartica">
      <span class="material-icons pin-ikona">face</span>
      <h2>Šifre su zaključane</h2>
      <p v-if="stanjeFaceId === 'traje'" class="pin-opis">Potvrdi Face ID / Touch ID...</p>
      <p v-else-if="stanjeFaceId === 'greska'" class="pin-greska">Nije uspjelo. Pokušaj ponovno ili koristi PIN.</p>
      <button class="gumb-pin" :disabled="stanjeFaceId === 'traje'" @click="pokusajFaceId">
        <span class="material-icons">fingerprint</span> Pokušaj ponovno
      </button>
      <button class="gumb-koristi-pin" @click="koristiFaceIdOtvaranje = false">Koristi PIN umjesto</button>
    </div>

    <!-- ==================== OTKLJUČAVANJE PIN-om ==================== -->
    <div v-else-if="!otkljucano" class="pin-kartica">
      <span class="material-icons pin-ikona">lock</span>
      <h2>Vault je zaključan</h2>
      <form class="pin-forma" @submit.prevent="otkljucajVault">
        <input v-model="unosPin" type="password" inputmode="numeric" placeholder="Unesi PIN" required autofocus>
        <p v-if="pinGreska" class="pin-greska">{{ pinGreska }}</p>
        <button type="submit" class="gumb-pin">Otključaj</button>
      </form>
      <p v-if="faceIdCredentiali.length > 0" class="pin-opis">Na mobitelu će nakon ovog unosa biti dovoljan samo Face ID. Na laptopu/desktopu PIN se traži svaki put.</p>
    </div>

    <!-- ==================== VAULT ==================== -->
    <template v-else>
      <div class="akcije-zaglavlje">
        <button class="gumb-dodaj" @click="otvoriModalUnos()">
          <span class="material-icons">add</span> Dodaj šifru
        </button>
        <button class="gumb-zakljucaj" @click="zakljucajVault">
          <span class="material-icons">lock</span> Zaključaj
        </button>
      </div>

      <button v-if="imaZapamcenPinNaUredaju" class="gumb-zaboravi-pin" @click="zaboraviPinNaUredaju">
        Zaboravi brzo Face ID otključavanje na ovom uređaju
      </button>

      <div v-if="unosi.length === 0" class="prazno">
        <p>Nema spremljenih šifri</p>
      </div>

      <div v-else class="lista-unosa">
        <div v-for="unos in unosi" :key="unos.id" class="redak-unosa">
          <div class="redak-glavno">
            <span class="redak-naziv">{{ unos.naziv }}</span>
            <span class="redak-korisnik">{{ dekriptirano[unos.id]?.korisnickoIme || '...' }}</span>
          </div>
          <div class="redak-lozinka">
            <span>{{ prikazaneLozinke.has(unos.id) ? (dekriptirano[unos.id]?.lozinka || '...') : '••••••••' }}</span>
            <button class="gumb-akcija" title="Prikaži/sakrij" @click="togglePrikaz(unos.id)">
              <span class="material-icons">{{ prikazaneLozinke.has(unos.id) ? 'visibility_off' : 'visibility' }}</span>
            </button>
            <button class="gumb-akcija" title="Kopiraj lozinku" @click="kopirajLozinku(unos.id)">
              <span class="material-icons">content_copy</span>
            </button>
          </div>
          <div v-if="dekriptirano[unos.id]?.napomena" class="redak-napomena">{{ dekriptirano[unos.id].napomena }}</div>
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
    </template>

    <!-- ==================== MODAL: DODAJ/UREDI ŠIFRU ==================== -->
    <div v-if="prikaziModalUnos" class="prekrivka-modala" @click="zatvoriModalUnos">
      <div class="modal" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeUnos ? 'Uredi šifru' : 'Dodaj šifru' }}</h3>
          <button class="gumb-zatvaranja" @click="zatvoriModalUnos">&times;</button>
        </div>
        <form class="forma" @submit.prevent="spremiUnos">
          <div class="grupa-polja">
            <label>Platforma / naziv:</label>
            <input v-model="forma.naziv" type="text" required placeholder="Npr. Gmail">
          </div>
          <div class="grupa-polja">
            <label>Korisničko ime / email:</label>
            <input v-model="forma.korisnickoIme" type="text">
          </div>
          <div class="grupa-polja">
            <label>Lozinka:</label>
            <input v-model="forma.lozinka" type="text">
          </div>
          <div class="grupa-polja">
            <label>Napomena:</label>
            <input v-model="forma.napomena" type="text">
          </div>
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
          <p>Obrisati šifru za "{{ unosZaBrisanje.naziv }}"?</p>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { db } from '@/services/firebase.js';
import { enkriptiraj, dekriptiraj } from '@/services/crypto.js';
import { dohvatiRegistrirane, potvrdiCredential, jePodrzano } from '@/services/webauthn.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const POSTAVKE_DOC = doc(db, 'sifre-postavke', 'trenutna');
// PIN se po uspješnom unosu zapamti ovdje (samo na ovom uređaju) da sljedeći put
// bude dovoljan Face ID - isti nivo zaštite kao i za ulazak u ostatak aplikacije.
const PIN_KLJUC_LOCALSTORAGE = 'nagyphotos_sifre_pin';

const ucitavaProvjera = ref(true);
const postavljenPin = ref(false);
const otkljucano = ref(false);
const pin = ref(null);

const noviPin = ref('');
const potvrdaPin = ref('');
const unosPin = ref('');
const pinGreska = ref('');

const faceIdCredentiali = ref([]);
const koristiFaceIdOtvaranje = ref(false);
const stanjeFaceId = ref('cekanje'); // cekanje | traje | greska
const imaZapamcenPinNaUredaju = computed(() => !!localStorage.getItem(PIN_KLJUC_LOCALSTORAGE));
// mobitel (telefon) = otključavanje samo Face ID-om; laptop/desktop = uvijek PIN
const jeMobilniUredaj = () => window.matchMedia('(max-width: 768px)').matches;

const unosi = ref([]);
const dekriptirano = ref({});
const prikazaneLozinke = ref(new Set());

const prikaziModalUnos = ref(false);
const uredujeUnos = ref(null);
const forma = ref({ naziv: '', korisnickoIme: '', lozinka: '', napomena: '' });
const unosZaBrisanje = ref(null);

let unsubUnosi = null;

onMounted(async () => {
  try {
    const snap = await getDoc(POSTAVKE_DOC);
    postavljenPin.value = snap.exists() && !!snap.data().provjera;

    if (jePodrzano()) {
      faceIdCredentiali.value = await dohvatiRegistrirane();
    }

    if (postavljenPin.value && jeMobilniUredaj() && faceIdCredentiali.value.length > 0 && imaZapamcenPinNaUredaju.value) {
      koristiFaceIdOtvaranje.value = true;
      pokusajFaceId();
    }
  } catch (error) {
    console.error('Greška pri provjeri PIN postavke:', error);
  } finally {
    ucitavaProvjera.value = false;
  }
});

onBeforeUnmount(() => {
  if (unsubUnosi) unsubUnosi();
});

const postaviPin = async () => {
  pinGreska.value = '';
  if (noviPin.value.length < 4) {
    pinGreska.value = 'PIN mora imati najmanje 4 znamenke.';
    return;
  }
  if (noviPin.value !== potvrdaPin.value) {
    pinGreska.value = 'PIN-ovi se ne podudaraju.';
    return;
  }
  try {
    const provjera = await enkriptiraj('OK', noviPin.value);
    await setDoc(POSTAVKE_DOC, { provjera }, { merge: true });
    postavljenPin.value = true;
    otkljucaj(noviPin.value);
  } catch (error) {
    console.error('Greška pri postavljanju PIN-a:', error);
    pinGreska.value = 'Greška pri spremanju PIN-a.';
  }
};

const provjeriPin = async (vrijednostPin) => {
  const snap = await getDoc(POSTAVKE_DOC);
  const provjera = snap.data()?.provjera;
  const rezultat = await dekriptiraj(provjera, vrijednostPin);
  return rezultat === 'OK';
};

const otkljucaj = (vrijednostPin) => {
  pin.value = vrijednostPin;
  otkljucano.value = true;
  unosPin.value = '';
  // na mobitelu zapamti PIN da sljedeći put bude dovoljan Face ID; na laptopu/desktopu uvijek traži PIN
  if (jeMobilniUredaj() && faceIdCredentiali.value.length > 0) {
    localStorage.setItem(PIN_KLJUC_LOCALSTORAGE, vrijednostPin);
  }
  pokreniListener();
};

const otkljucajVault = async () => {
  pinGreska.value = '';
  try {
    const ispravan = await provjeriPin(unosPin.value);
    if (!ispravan) throw new Error('pogresan pin');
    otkljucaj(unosPin.value);
  } catch (error) {
    pinGreska.value = 'Pogrešan PIN.';
  }
};

const pokusajFaceId = async () => {
  stanjeFaceId.value = 'traje';
  try {
    const uspjeh = await potvrdiCredential(faceIdCredentiali.value);
    if (!uspjeh) {
      stanjeFaceId.value = 'greska';
      return;
    }
    const zapamceniPin = localStorage.getItem(PIN_KLJUC_LOCALSTORAGE);
    if (zapamceniPin && await provjeriPin(zapamceniPin)) {
      otkljucaj(zapamceniPin);
    } else {
      // zapamćeni PIN više ne vrijedi - vrati se na ručni unos
      localStorage.removeItem(PIN_KLJUC_LOCALSTORAGE);
      koristiFaceIdOtvaranje.value = false;
    }
  } catch (error) {
    console.error('Face ID potvrda nije uspjela:', error);
    stanjeFaceId.value = 'greska';
  }
};

const zaboraviPinNaUredaju = () => {
  localStorage.removeItem(PIN_KLJUC_LOCALSTORAGE);
};

const zakljucajVault = () => {
  otkljucano.value = false;
  pin.value = null;
  dekriptirano.value = {};
  prikazaneLozinke.value = new Set();
  koristiFaceIdOtvaranje.value = postavljenPin.value && jeMobilniUredaj() && faceIdCredentiali.value.length > 0 && imaZapamcenPinNaUredaju.value;
  if (unsubUnosi) { unsubUnosi(); unsubUnosi = null; }
};

const pokreniListener = () => {
  if (unsubUnosi) return;
  unsubUnosi = onSnapshot(collection(db, 'sifre'), (snapshot) => {
    unosi.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  });
};

const osvjeziDekriptirano = async () => {
  if (!pin.value) return;
  const novaMapa = {};
  for (const u of unosi.value) {
    try {
      novaMapa[u.id] = {
        korisnickoIme: u.korisnickoIme ? await dekriptiraj(u.korisnickoIme, pin.value) : '',
        lozinka: u.lozinka ? await dekriptiraj(u.lozinka, pin.value) : '',
        napomena: u.napomena ? await dekriptiraj(u.napomena, pin.value) : ''
      };
    } catch (error) {
      novaMapa[u.id] = { korisnickoIme: '(greška)', lozinka: '(greška)', napomena: '' };
    }
  }
  dekriptirano.value = novaMapa;
};

watch(unosi, osvjeziDekriptirano);

const togglePrikaz = (id) => {
  const novi = new Set(prikazaneLozinke.value);
  if (novi.has(id)) novi.delete(id); else novi.add(id);
  prikazaneLozinke.value = novi;
};

const kopirajLozinku = async (id) => {
  const lozinka = dekriptirano.value[id]?.lozinka;
  if (!lozinka) return;
  try {
    await navigator.clipboard.writeText(lozinka);
  } catch (error) {
    console.error('Kopiranje nije uspjelo:', error);
  }
};

const resetirajFormu = () => {
  forma.value = { naziv: '', korisnickoIme: '', lozinka: '', napomena: '' };
};

const otvoriModalUnos = (unos = null) => {
  uredujeUnos.value = unos;
  forma.value = unos
    ? { naziv: unos.naziv, ...dekriptirano.value[unos.id] }
    : { naziv: '', korisnickoIme: '', lozinka: '', napomena: '' };
  prikaziModalUnos.value = true;
};

const zatvoriModalUnos = () => {
  prikaziModalUnos.value = false;
  uredujeUnos.value = null;
  resetirajFormu();
};

const spremiUnos = async () => {
  try {
    const podaci = {
      naziv: forma.value.naziv,
      korisnickoIme: await enkriptiraj(forma.value.korisnickoIme || '', pin.value),
      lozinka: await enkriptiraj(forma.value.lozinka || '', pin.value),
      napomena: await enkriptiraj(forma.value.napomena || '', pin.value)
    };

    if (uredujeUnos.value) {
      await updateDoc(doc(db, 'sifre', uredujeUnos.value.id), podaci);
    } else {
      await addDoc(collection(db, 'sifre'), podaci);
    }
    zatvoriModalUnos();
  } catch (error) {
    console.error('Greška pri spremanju šifre:', error);
    alert('Greška pri spremanju šifre.');
  }
};

const potvrdiBrisanje = async () => {
  if (!unosZaBrisanje.value) return;
  try {
    await deleteDoc(doc(db, 'sifre', unosZaBrisanje.value.id));
  } catch (error) {
    console.error('Greška pri brisanju šifre:', error);
  } finally {
    unosZaBrisanje.value = null;
  }
};
</script>

<style scoped>
.sifre {
  max-width: 700px;
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

.pin-kartica {
  max-width: 360px;
  margin: 40px auto;
  text-align: center;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
  padding: 32px 24px;
}

.pin-ikona {
  font-size: 44px;
  color: var(--accent);
  margin-bottom: 8px;
}

.pin-kartica h2 {
  color: var(--text-heading);
  margin-bottom: 8px;
}

.pin-opis {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.pin-forma {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pin-forma input {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  text-align: center;
  background: var(--bg-page);
  color: var(--text-body);
}

.pin-greska {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 0;
}

.gumb-pin {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.gumb-pin:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gumb-koristi-pin {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  margin-top: 12px;
}

.gumb-zaboravi-pin {
  display: block;
  margin: -10px 0 20px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
}

.akcije-zaglavlje {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.gumb-dodaj {
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

.gumb-zakljucaj {
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
  margin-left: auto;
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
  background: var(--bg-card-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  padding: 16px;
}

.redak-glavno {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 4px 12px;
  margin-bottom: 6px;
}

.redak-naziv {
  font-weight: 700;
  color: var(--text-heading);
  overflow-wrap: anywhere;
}

.redak-korisnik {
  color: var(--text-muted);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
  min-width: 0;
}

.redak-lozinka {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  color: var(--text-body);
  margin-bottom: 6px;
}

.redak-lozinka span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.redak-napomena {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-style: italic;
  margin-bottom: 6px;
}

.redak-akcije {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
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

/* ==================== MODALI (zajednički s ostatkom appa) ==================== */
.prekrivka-modala {
  position: fixed;
  inset: 0;
  background: rgba(3, 3, 3, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
  width: 90%;
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

.grupa-polja input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-page);
  color: var(--text-body);
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
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
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

@media (max-width: 768px) {
  .sifre {
    padding: 16px;
    padding-bottom: 100px;
  }

  .naslov {
    font-size: 1.5rem;
  }

  .pin-kartica {
    margin: 24px auto;
    padding: 28px 18px;
  }

  .akcije-zaglavlje {
    gap: 8px;
  }

  .gumb-dodaj, .gumb-zakljucaj {
    flex: 1;
    justify-content: center;
  }

  .redak-unosa {
    padding: 14px;
  }
}
</style>
