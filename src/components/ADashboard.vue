<template>
  <div class="admin-ploca">
    <div class="bocna-traka" :class="{ 'otvorena': bocnaTrakaOtvorena }">
      <div class="bocna-traka-sadrzaj">
        <button class="zatvori-bocnu-traku" @click="toggleBocnaTraka">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="bocna-profil-sekcija">
          <div class="bocna-profil-ikona">
            {{ korisnikInicijali }}
          </div>
          <div class="bocna-korisnik-info">
            <div class="bocna-korisnik-email">{{ korisnikEmail }}</div>
            <div class="bocna-korisnik-uloga">Administrator</div>
          </div>
          <div class="odjava-sekcija">
            <button class="gumb-odjava" @click="odjaviKorisnika">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Odjava
            </button>
          </div>
        </div>

        <nav class="bocna-navigacija">
       
            <router-link to="/admin" class="nav-stavka" exact-active-class="aktivna">
              Dashboard
            </router-link>
            <router-link to="/admin/prihodi" class="nav-stavka" active-class="aktivna">
              Prihodi
            </router-link>
            <router-link to="/admin/oprema" class="nav-stavka" active-class="aktivna">
              Oprema
            </router-link>
            <router-link to="/admin/cjenovnik" class="nav-stavka" active-class="aktivna">
              Cjenovnik
            </router-link>
            <router-link to="/admin/upload" class="nav-stavka" active-class="aktivna">
              Upload
            </router-link>
            <router-link to="/admin/karte" class="nav-stavka" active-class="aktivna">
              Karta
            </router-link>
            <router-link to="/admin/kalendar" class="nav-stavka" active-class="aktivna">
              Kalendar
            </router-link>
            <router-link to="/admin/aktivnosti" class="nav-stavka" active-class="aktivna">
              Aktivnost
            </router-link>
            <router-link to="/admin/korisni-linkovi" class="nav-stavka" active-class="aktivna">
              Linkovi
            </router-link>
            <router-link to="/admin/kreativna-zona" class="nav-stavka" active-class="aktivna">
              Kreativna zona
            </router-link>
         
        </nav>
      </div>
    </div>

    <div v-if="bocnaTrakaOtvorena" class="bocna-overlay" @click="toggleBocnaTraka"></div>

    <button v-if="!bocnaTrakaOtvorena" class="otvori-bocnu-traku" @click="toggleBocnaTraka">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <div class="glavni-sadrzaj" :class="{ 'pomjeren': bocnaTrakaOtvorena }">
      <div class="sadrzaj-omotac">
        <div v-if="$route.path === '/admin'" class="dashboard-stranica">
          <div class="nadolazeci-dogadaji">
            <div class="dogadaji-zaglavlje">
              <h2>Nadolazeći događaji</h2>
              <router-link to="/admin/kalendar" class="gumb-kalendar">
                Vidi sve u kalendaru
              </router-link>
            </div>

            <div v-if="ucitavaDogadaje" class="ucitavanje">
              <p>Učitavaju se događaji...</p>
            </div>

            <div v-else class="dogadaji-lista">
              <div 
                v-for="dogadaj in nadolazeciDogadaji" 
                :key="dogadaj.id"
                :class="['dogadaj-kartica', `dogadaj-${dogadaj.boja}`]"
              >
                <div class="dogadaj-zaglavlje">
                  <div class="dogadaj-informacije">
                    <div class="dogadaj-klijent">{{ dogadaj.klijent }}</div>
                    <div class="dogadaj-datum">
                      <span v-if="dogadaj.pocetniDatum === dogadaj.zavrsniDatum">
                        {{ formatirajDatumDogadaja(dogadaj.pocetniDatum) }}
                      </span>
                      <span v-else>
                        {{ formatirajDatumDogadaja(dogadaj.pocetniDatum) }} - {{ formatirajDatumDogadaja(dogadaj.zavrsniDatum) }}
                      </span>
                    </div>
                  </div>
                  <div class="dogadaj-oznaka" :class="`oznaka-${dogadaj.boja}`">
                    {{ izracunajDanaDoDogadaja(dogadaj.pocetniDatum) }}
                  </div>
                </div>
                <div class="dogadaj-opis">
                  {{ dogadaj.opis }}
                </div>
              </div>
            </div>

            <div v-if="!ucitavaDogadaje && nadolazeciDogadaji.length === 0" class="nema-dogadaja">
              <div class="prazan-sadrzaj">
                <p>Nema nadolazećih događaja</p>
              </div>
            </div>
          </div>

          <div class="nedavni-komentari">
            <div class="komentari-zaglavlje">
              <h2>Nedavni komentari</h2>
              <div class="komentari-filteri">
                <select v-model="statusFiltera" class="filter-select">
                  <option value="">Svi komentari</option>
                  <option value="neprocitan">Neprocitani</option>
                  <option value="procitan">Procitani</option>
                </select>
              </div>
            </div>

            <div v-if="ucitavaKomentare" class="ucitavanje">
              <p>Učitavaju se komentari...</p>
            </div>

            <div v-else class="komentari-lista">
              <div 
                v-for="komentar in prikazaniKomentari" 
                :key="komentar.id"
                class="komentar-kartica"
                :class="{ 'neprocitan': !komentar.procitan }"
              >
                <div class="komentar-zaglavlje">
                  <div class="komentar-meta">
                    <span class="komentar-autor">{{ komentar.authorEmail }}</span>
                    <span class="komentar-datum">{{ formatirajDatum(komentar.timestamp) }}</span>
                    <span class="komentar-slika">na slici: {{ komentar.imageFileName }}</span>
                  </div>
                  <div class="komentar-akcije">
                    <button 
                      @click="promijeniStatusProcitano(komentar)"
                      class="gumb-procitan"
                      :class="{ 'procitan': komentar.procitan }"
                      :title="komentar.procitan ? 'Označi kao neprocitan' : 'Označi kao procitan'"
                      :disabled="ucitava"
                    >
                      {{ komentar.procitan ? '✓' : '○' }}
                    </button>
                    <button 
                      @click="pokreniObrisiKomentar(komentar)"
                      class="gumb-obrisi"
                      title="Obriši komentar"
                      :disabled="ucitava"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div class="komentar-sadrzaj">
                  <p>{{ komentar.text }}</p>
                </div>
              </div>
            </div>

            <div v-if="!ucitavaKomentare && prikazaniKomentari.length === 0" class="nema-komentara">
              <div class="prazan-sadrzaj">
                <p>{{ sviKomentari.length === 0 ? 'Nema komentara za prikaz' : 'Nema komentara koji odgovaraju filteru' }}</p>
              </div>
            </div>
            <div v-if="filtriraniKomentari.length > 5" class="pokazi-vise">
              <button @click="promijeniPrikazSvihKomentara" class="gumb-pokazi-vise">
                {{ prikaziSveKomentare ? 'Prikaži manje' : `Prikaži sve (${filtriraniKomentari.length})` }}
              </button>
            </div>
          </div>
        </div>
        <router-view v-else></router-view>
      </div>
    </div>
    
    <div v-if="prikaziPotvrdBrisanja" class="potvrda-prekrivka" @click="otkaziPotvrdBrisanja">
      <div class="potvrda-modal" @click.stop>
        <h3>Potvrda brisanja</h3>
        <p>Jeste li sigurni da želite obrisati ovaj komentar?</p>
        <div class="potvrda-gumbovi">
          <button @click="otkaziPotvrdBrisanja" class="gumb-otkazi">Otkaži</button>
          <button @click="potvrdiBrisanjeKomentara" class="gumb-potvrdi" :disabled="ucitava">
            {{ ucitava ? 'Briše...' : 'Obriši' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';
import { db } from '@/services/firebase.js';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  onSnapshot,
  serverTimestamp,
  where
} from 'firebase/firestore';

const router = useRouter();
const { logout: authLogout } = useAuth();

const bocnaTrakaOtvorena = ref(false);
const sviKomentari = ref([]);
const statusFiltera = ref('');
const prikaziPotvrdBrisanja = ref(false);
const komentarZaBrisanje = ref(null);
const prikaziSveKomentare = ref(false);
const kalendar = ref([]);
const ucitava = ref(false);
const ucitavaKomentare = ref(true);
const ucitavaDogadaje = ref(true);

let unsubscribeKomentari = null;
let unsubscribeDogadaji = null;

const korisnikEmail = computed(() => 'naddinko@gmail.com');
const korisnikInicijali = computed(() => korisnikEmail.value.charAt(0).toUpperCase());

const filtriraniKomentari = computed(() => {
  let filtrirani = [...sviKomentari.value];
  
  if (statusFiltera.value === 'neprocitan') {
    filtrirani = filtrirani.filter(k => !k.procitan);
  } else if (statusFiltera.value === 'procitan') {
    filtrirani = filtrirani.filter(k => k.procitan);
  }
  return filtrirani.sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return dateB - dateA;
  });
});

const prikazaniKomentari = computed(() => {
  if (prikaziSveKomentare.value) {
    return filtriraniKomentari.value;
  }
  return filtriraniKomentari.value.slice(0, 5);
});

const nadolazeciDogadaji = computed(() => {
  const danas = new Date();
  const sljedecihSedam = new Date();
  sljedecihSedam.setDate(danas.getDate() + 7);
  
  return kalendar.value
    .filter(dogadaj => {
      const datumDogadaja = new Date(dogadaj.pocetniDatum);
      return datumDogadaja >= danas && datumDogadaja <= sljedecihSedam;
    })
    .sort((a, b) => new Date(a.pocetniDatum) - new Date(b.pocetniDatum));
});

const toggleBocnaTraka = () => {
  bocnaTrakaOtvorena.value = !bocnaTrakaOtvorena.value;
};

const odjaviKorisnika = async () => {
  try {
    await authLogout();
    router.push('/login');
  } catch (error) {
    console.error('Greška prilikom odjave:', error);
  }
};

const ucitajKomentare = () => {
  ucitavaKomentare.value = true;
  
  try {
    const q = query(collection(db, 'komentari'), orderBy('timestamp', 'desc'));
    unsubscribeKomentari = onSnapshot(q, (snapshot) => {
      sviKomentari.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      ucitavaKomentare.value = false;
    }, (error) => {
      console.error('Greška pri učitavanju komentara:', error);
      ucitavaKomentare.value = false;
    });
  } catch (error) {
    console.error('Greška pri postavljanju listenera za komentare:', error);
    ucitavaKomentare.value = false;
  }
};

const ucitajKalendar = () => {
  ucitavaDogadaje.value = true;
  
  try {
    const q = query(collection(db, 'kalendar-dogadaji'), orderBy('pocetniDatum', 'asc'));
    unsubscribeDogadaji = onSnapshot(q, (snapshot) => {
      kalendar.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      ucitavaDogadaje.value = false;
    }, (error) => {
      console.error('Greška pri učitavanju događaja:', error);
      ucitavaDogadaje.value = false;
    });
  } catch (error) {
    console.error('Greška pri postavljanju listenera za događaje:', error);
    ucitavaDogadaje.value = false;
  }
};

const promijeniStatusProcitano = async (komentar) => {
  if (ucitava.value) return;

  ucitava.value = true;

  try {
    const komentarRef = doc(db, 'komentari', komentar.id);
    await updateDoc(komentarRef, {
      procitan: !komentar.procitan
    });
  } catch (error) {
    console.error('Greška pri ažuriranju statusa komentara:', error);
    alert('Greška pri ažuriranju statusa. Pokušajte ponovno.');
  } finally {
    ucitava.value = false;
  }
};

const pokreniObrisiKomentar = (komentar) => {
  komentarZaBrisanje.value = komentar;
  prikaziPotvrdBrisanja.value = true;
};

const potvrdiBrisanjeKomentara = async () => {
  if (!komentarZaBrisanje.value || ucitava.value) {
    return;
  }

  ucitava.value = true;

  try {
    await deleteDoc(doc(db, 'komentari', komentarZaBrisanje.value.id));
    otkaziPotvrdBrisanja();
  } catch (error) {
    console.error('Greška pri brisanju komentara:', error);
    alert('Greška pri brisanju komentara. Pokušajte ponovno.');
  } finally {
    ucitava.value = false;
  }
};

const otkaziPotvrdBrisanja = () => {
  prikaziPotvrdBrisanja.value = false;
  komentarZaBrisanje.value = null;
};

const promijeniPrikazSvihKomentara = () => {
  prikaziSveKomentare.value = !prikaziSveKomentare.value;
};

const formatirajDatum = (timestamp) => {
  if (!timestamp) return 'Nepoznat datum';
  
  try {
    const datum = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return datum.toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Greška datuma';
  }
};

const formatirajDatumDogadaja = (datumString) => {
  const datum = new Date(datumString);
  return datum.toLocaleDateString('hr-HR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

const izracunajDanaDoDogadaja = (datumString) => {
  const danas = new Date();
  const datumDogadaja = new Date(datumString);
  const razlikaVremena = datumDogadaja - danas;
  const razlikaDana = Math.ceil(razlikaVremena / (1000 * 60 * 60 * 24));
  
  if (razlikaDana === 0) return 'Danas';
  if (razlikaDana === 1) return 'Sutra';
  return `Za ${razlikaDana} dana`;
};

onMounted(() => {
  ucitajKomentare();
  ucitajKalendar();
});

onBeforeUnmount(() => {
  if (unsubscribeKomentari) {
    unsubscribeKomentari();
  }
  if (unsubscribeDogadaji) {
    unsubscribeDogadaji();
  }
});
</script>

<style scoped>
.admin-ploca {
  display: flex;
  height: 100vh;
  background-color: #F1EFEC;
  font-family: 'Roboto', sans-serif;
  position: relative;
}

.bocna-traka {
  position: fixed;
  left: -250px;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: #123458;
  color: white;
  transition: left 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.bocna-traka.otvorena {
  left: 0;
}

.bocna-traka-sadrzaj {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.zatvori-bocnu-traku {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.zatvori-bocnu-traku:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.bocna-profil-sekcija {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.bocna-profil-ikona {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
  margin: 0 auto;
}

.bocna-korisnik-info {
  text-align: center;
}

.bocna-korisnik-email {
  font-size: 0.9rem;
  opacity: 0.9;
  word-break: break-word;
  margin-bottom: 4px;
}

.bocna-korisnik-uloga {
  font-size: 0.8rem;
  opacity: 0.7;
  color: #D4C9BE;
}

.odjava-sekcija {
  display: flex;
  justify-content: center;
}

.gumb-odjava {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gumb-odjava:hover {
  background-color: #c62828;
}

.bocna-navigacija {
  flex: 1;
  margin-bottom: 10px;
}

.nav-stavka {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 5px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  cursor: pointer;
  text-align: center;
}

.nav-stavka:hover,
.nav-stavka.aktivna {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-stavka.aktivna {
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid #D4C9BE;
}

.bocna-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

.otvori-bocnu-traku {
  position: fixed;
  top: 15px;
  left: 15px;
  background-color: #123458;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.otvori-bocnu-traku:hover {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.glavni-sadrzaj {
  flex: 1;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
}

.glavni-sadrzaj.pomjeren {
  margin-left: 250px;
}

.glavni-sadrzaj.pomjeren {
  margin-left: 300px;
}

.sadrzaj-omotac {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

.dashboard-stranica {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.nadolazeci-dogadaji,
.nedavni-komentari {
  background-color: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #D4C9BE;
}

.ucitavanje {
  padding: 40px 20px;
  text-align: center;
  color: #5D8AA8;
  font-size: 1.1rem;
}

.dogadaji-zaglavlje,
.komentari-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dogadaji-zaglavlje h2,
.komentari-zaglavlje h2 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.8rem;
}

.gumb-kalendar {
  padding: 12px 20px;
  background-color: #123458;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gumb-kalendar:hover {
  background-color: #1c4c80;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dogadaji-lista,
.komentari-lista {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dogadaj-kartica {
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.dogadaj-kartica:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.dogadaj-kartica.dogadaj-zuta { border-left-color: #ffc107; }
.dogadaj-kartica.dogadaj-zelena { border-left-color: #4caf50; }
.dogadaj-kartica.dogadaj-plava { border-left-color: #2196f3; }
.dogadaj-kartica.dogadaj-narancasta { border-left-color: #ff9800; }
.dogadaj-kartica.dogadaj-ljubicasta { border-left-color: #9c27b0; }
.dogadaj-kartica.dogadaj-crvena { border-left-color: #f44336; }
.dogadaj-kartica.dogadaj-tirkizna { border-left-color: #009688; }
.dogadaj-kartica.dogadaj-ruzicasta { border-left-color: #e91e63; }

.dogadaj-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.dogadaj-informacije {
  flex: 1;
}

.dogadaj-klijent {
  font-weight: 600;
  color: #123458;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.dogadaj-datum {
  color: #5D8AA8;
  font-size: 0.9rem;
  font-weight: 500;
}

.dogadaj-oznaka {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.oznaka-zuta { background-color: #ffc107; color: #000; }
.oznaka-zelena { background-color: #4caf50; }
.oznaka-plava { background-color: #2196f3; }
.oznaka-narancasta { background-color: #ff9800; }
.oznaka-ljubicasta { background-color: #9c27b0; }
.oznaka-crvena { background-color: #f44336; }
.oznaka-tirkizna { background-color: #009688; }
.oznaka-ruzicasta { background-color: #e91e63; }

.dogadaj-opis {
  color: #030303;
  font-size: 0.9rem;
  line-height: 1.4;
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
}

.komentari-filteri {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
  color: #123458;
  font-weight: 500;
}

.filter-select:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 2px rgba(18, 52, 88, 0.1);
}

.komentar-kartica {
  background-color: #F1EFEC;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #D4C9BE;
  transition: all 0.2s ease;
}

.komentar-kartica.neprocitan {
  border-left: 4px solid #e53935;
  background-color: #fff8f8;
}

.komentar-kartica:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.komentar-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.komentar-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.komentar-autor {
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
}

.komentar-datum {
  font-size: 0.8rem;
  color: #6c757d;
}

.komentar-slika {
  font-size: 0.8rem;
  color: #123458;
  font-style: italic;
}

.komentar-akcije {
  display: flex;
  gap: 8px;
}

.gumb-procitan {
  width: 28px;
  height: 28px;
  border: 1px solid #123458;
  background-color: white;
  color: #123458;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gumb-procitan:hover:not(:disabled) {
  background-color: #123458;
  color: white;
}

.gumb-procitan.procitan {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.gumb-procitan.procitan:hover:not(:disabled) {
  background-color: #218838;
}

.gumb-procitan:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gumb-obrisi {
  width: 28px;
  height: 28px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gumb-obrisi:hover:not(:disabled) {
  background-color: #c62828;
}

.gumb-obrisi:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.komentar-sadrzaj {
  background-color: white;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #D4C9BE;
}

.komentar-sadrzaj p {
  margin: 0;
  color: #333;
  line-height: 1.4;
  font-size: 0.9rem;
}

.pokazi-vise {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #D4C9BE;
}

.gumb-pokazi-vise {
  padding: 10px 20px;
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.gumb-pokazi-vise:hover {
  background-color: #1c4c80;
}

.nema-dogadaja,
.nema-komentara {
  padding: 40px 20px;
  text-align: center;
}

.prazan-sadrzaj {
  color: #123458;
}

.prazan-sadrzaj p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.potvrda-prekrivka {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.potvrda-modal {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: fadeInScale 0.3s ease;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.potvrda-modal h3 {
  color: #123458;
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.potvrda-modal p {
  color: #333;
  margin: 0 0 25px 0;
  line-height: 1.5;
}

.potvrda-gumbovi {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.gumb-otkazi {
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.gumb-otkazi:hover {
  background-color: #5a6268;
}

.gumb-potvrdi {
  padding: 10px 20px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.gumb-potvrdi:hover:not(:disabled) {
  background-color: #c62828;
}

.gumb-potvrdi:disabled {
  background-color: #D4C9BE;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .gornja-traka.pomjerena {
    left: 0;
  }
  
  .glavni-sadrzaj.pomjeren {
    margin-left: 0;
  }
  
  .bocna-overlay {
    display: block;
  }

  .sadrzaj-omotac {
    padding: 30px;
  }

  .nadolazeci-dogadaji,
  .nedavni-komentari {
    padding: 30px;
  }
}

@media (max-width: 768px) {
  .sadrzaj-omotac {
    padding: 20px;
  }
  
  .nadolazeci-dogadaji,
  .nedavni-komentari {
    padding: 20px;
    border-radius: 12px;
  }

  .dogadaji-zaglavlje h2,
  .komentari-zaglavlje h2 {
    font-size: 1.4rem;
  }
  
  .dogadaji-zaglavlje,
  .komentari-zaglavlje {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .gumb-kalendar {
    text-align: center;
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .dogadaj-zaglavlje {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .dogadaj-oznaka {
    align-self: flex-start;
  }

  .dogadaj-klijent {
    font-size: 1.2rem;
  }

  .dogadaj-datum {
    font-size: 0.9rem;
  }

  .dogadaj-opis {
    font-size: 0.9rem;
    padding: 12px;
  }

  .komentar-zaglavlje {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .komentar-akcije {
    align-self: flex-end;
  }

  .komentar-autor {
    font-size: 0.95rem;
  }

  .komentar-datum,
  .komentar-slika {
    font-size: 0.85rem;
  }

  .komentar-sadrzaj p {
    font-size: 0.9rem;
  }

  .bocna-traka {
    width: 100%;
    left: -100%;
  }

  .bocna-traka.otvorena {
    left: 0;
  }

  .traka-sadrzaj {
    padding: 0 20px;
  }
}

@media (max-width: 480px) {
  .sadrzaj-omotac {
    padding: 15px;
  }

  .dashboard-stranica {
    gap: 25px;
  }

  .nadolazeci-dogadaji,
  .nedavni-komentari {
    padding: 15px;
    border-radius: 10px;
  }

  .dogadaji-zaglavlje h2,
  .komentari-zaglavlje h2 {
    font-size: 1.2rem;
  }

  .dogadaj-kartica,
  .komentar-kartica {
    padding: 15px;
  }

  .dogadaj-klijent {
    font-size: 1.1rem;
  }

  .dogadaj-datum {
    font-size: 0.85rem;
  }

  .dogadaj-opis {
    font-size: 0.85rem;
    padding: 10px;
  }

  .komentar-meta {
    gap: 2px;
  }

  .komentar-autor {
    font-size: 0.9rem;
  }

  .komentar-datum,
  .komentar-slika {
    font-size: 0.8rem;
  }

  .komentar-sadrzaj {
    padding: 12px;
  }

  .komentar-sadrzaj p {
    font-size: 0.85rem;
  }

  .potvrda-modal {
    padding: 20px;
    margin: 10px;
  }

  .potvrda-gumbovi {
    flex-direction: column;
    gap: 10px;
  }

  .gumb-otkazi,
  .gumb-potvrdi {
    width: 100%;
  }

  .traka-sadrzaj {
    padding: 0 15px;
  }

  .bocna-traka-sadrzaj {
    padding: 15px;
  }

  .gumb-kalendar {
    padding: 8px 14px;
    font-size: 0.85rem;
  }

  .dogadaj-oznaka {
    padding: 6px 12px;
    font-size: 0.8rem;
  }

  .gumb-procitan,
  .gumb-obrisi {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }

  .pokazi-vise {
    margin-top: 15px;
    padding-top: 15px;
  }

  .gumb-pokazi-vise {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .filter-select {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .nema-dogadaja,
  .nema-komentara {
    padding: 30px 15px;
  }

  .prazan-sadrzaj p {
    font-size: 0.9rem;
  }
}
</style>