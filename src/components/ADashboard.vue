<template>
  <div class="admin-ploca">
    <div class="gornja-traka">
      <div class="traka-sadrzaj">
        <div class="profil-padajuci">
          <div class="profil-ikona" @click="promijeniProfilIzbornik">
            {{ korisnikInicijali }}
          </div>
          <div class="profil-izbornik" v-if="prikaziProfilIzbornik">
            <div class="korisnik-email">{{ korisnikEmail }}</div>
            <div class="izbornik-opcija odjava-opcija" @click="odjaviKorisnika">Odjava</div>
          </div>
        </div>
      </div>
    </div>

    <div class="ploca-sadrzaj">
      <nav class="bocna-navigacija">
        <div class="navigacijske-veze">
          <router-link to="/admin" class="nav-veza" exact-active-class="aktivna">
            Dashboard
          </router-link>
          <router-link to="/admin/prihodi" class="nav-veza" active-class="aktivna">
            Prihodi
          </router-link>
          <router-link to="/admin/oprema" class="nav-veza" active-class="aktivna">
            Oprema
          </router-link>
          <router-link to="/admin/cjenovnik" class="nav-veza" active-class="aktivna">
            Cjenovnik
          </router-link>
          <router-link to="/admin/kalendar" class="nav-veza" active-class="aktivna">
            Kalendar
          </router-link>
          <router-link to="/admin/upload" class="nav-veza" active-class="aktivna">
            Upload
          </router-link>
          <router-link to="/admin/aktivnosti" class="nav-veza" active-class="aktivna">
            Aktivnost
          </router-link>
          <router-link to="/admin/karte" class="nav-veza" active-class="aktivna">
            Karta
          </router-link>
          <router-link to="/admin/korisni-linkovi" class="nav-veza" active-class="aktivna">
            Linkovi
          </router-link>
          <router-link to="/admin/kreativna-zona" class="nav-veza" active-class="aktivna">
            Kreativna zona
          </router-link>
        </div>
      </nav>
      
      <div class="glavni-sadrzaj">
        <div v-if="$route.path === '/admin'" class="dashboard-stranica">

          <div class="nadolazeci-dogadaji">
            <div class="dogadaji-zaglavlje">
              <h2>Nadolazeći događaji</h2>
              <router-link to="/admin/kalendar" class="gumb-kalendar">
                Vidi sve u kalendaru
              </router-link>
            </div>

            <div class="dogadaji-lista">
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

            <div v-if="nadolazeciDogadaji.length === 0" class="nema-dogadaja">
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

            <div class="komentari-lista">
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
                    >
                      {{ komentar.procitan ? '✓' : '○' }}
                    </button>
                    <button 
                      @click="pokreniObrisiKomentar(komentar)"
                      class="gumb-obrisi"
                      title="Obriši komentar"
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

            <div v-if="prikazaniKomentari.length === 0" class="nema-komentara">
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
          <button @click="potvrdiBrisanjeKomentara" class="gumb-potvrdi">Obriši</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';

const router = useRouter();
const { logout: authLogout } = useAuth();

const prikaziProfilIzbornik = ref(false);
const sviKomentari = ref([]);
const statusFiltera = ref('');
const prikaziPotvrdBrisanja = ref(false);
const komentarZaBrisanje = ref(null);
const prikaziSveKomentare = ref(false);
const kalendar = ref([]);


const korisnikEmail = computed(() => 'naddinko@gmail.com');
const korisnikInicijali = computed(() => korisnikEmail.value.charAt(0).toUpperCase());


const brojNeprocetiKomentari = computed(() => {
  return sviKomentari.value.filter(k => !k.procitan).length;
});


const filtriraniKomentari = computed(() => {
  let filtrirani = [...sviKomentari.value];
  
  if (statusFiltera.value === 'neprocitan') {
    filtrirani = filtrirani.filter(k => !k.procitan);
  } else if (statusFiltera.value === 'procitan') {
    filtrirani = filtrirani.filter(k => k.procitan);
  }
  return filtrirani.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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

const promijeniProfilIzbornik = () => {
  prikaziProfilIzbornik.value = !prikaziProfilIzbornik.value;
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
  try {
    const spremljeniKomentari = localStorage.getItem('image_comments');
    if (spremljeniKomentari) {
      sviKomentari.value = JSON.parse(spremljeniKomentari).map(komentar => ({
        ...komentar,
        timestamp: new Date(komentar.timestamp),
        procitan: komentar.procitan || false
      }));
    }
  } catch (error) {
    console.error('Greška pri učitavanju komentara:', error);
    sviKomentari.value = [];
  }
};

const ucitajKalendar = () => {
  try {
    let spremljeniDogadaji = localStorage.getItem('kalendar-dogadaji');
    if (!spremljeniDogadaji) {
      spremljeniDogadaji = localStorage.getItem('calendar-events');
    }
    
    if (spremljeniDogadaji) {
      const dogadaji = JSON.parse(spremljeniDogadaji);

      kalendar.value = dogadaji.map(dogadaj => ({
        id: dogadaj.id,
        klijent: dogadaj.klijent || dogadaj.client,
        pocetniDatum: dogadaj.pocetniDatum || dogadaj.startDate,
        zavrsniDatum: dogadaj.zavrsniDatum || dogadaj.endDate,
        opis: dogadaj.opis || dogadaj.description,
        boja: dogadaj.boja || dogadaj.color
      }));
    }
  } catch (error) {
    console.error('Greška pri učitavanju kalendara:', error);
    kalendar.value = [];
  }
};

const spremiKomentare = () => {
  try {
    localStorage.setItem('image_comments', JSON.stringify(sviKomentari.value));
  } catch (error) {
    console.error('Greška pri spremanju komentara:', error);
  }
};

const promijeniStatusProcitano = (komentar) => {
  komentar.procitan = !komentar.procitan;
  spremiKomentare();
};

const pokreniObrisiKomentar = (komentar) => {
  komentarZaBrisanje.value = komentar;
  prikaziPotvrdBrisanja.value = true;
};

const potvrdiBrisanjeKomentara = () => {
  if (komentarZaBrisanje.value) {
    const indeks = sviKomentari.value.findIndex(k => k.id === komentarZaBrisanje.value.id);
    if (indeks > -1) {
      sviKomentari.value.splice(indeks, 1);
      spremiKomentare();
    }
  }
  otkaziPotvrdBrisanja();
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
    const datum = timestamp instanceof Date ? timestamp : new Date(timestamp);
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
  
 
  setInterval(() => {
    ucitajKomentare();
    ucitajKalendar();
  }, 30000);
});
</script>

<style scoped>
.admin-ploca {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
}

.gornja-traka {
  height: 50px;
  z-index: 10;
  position: absolute;
  top: 0;
  right: 0;
  padding: 10px 20px;
}

.traka-sadrzaj {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.profil-padajuci {
  position: relative;
}

.profil-ikona {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #123458;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.profil-ikona:hover {
  transform: scale(1.05);
}

.profil-izbornik {
  position: absolute;
  top: 50px;
  right: 0;
  width: 200px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: slideDown 0.3s ease;
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

.korisnik-email {
  padding: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
  font-size: 0.9rem;
  text-align: center;
}

.izbornik-opcija {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.izbornik-opcija:hover {
  background-color: #f56358;
}

.odjava-opcija {
  color: white;
  font-weight: bold;
  background-color: #f44336;
  text-align: center;
}

.ploca-sadrzaj {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.bocna-navigacija {
  width: 250px;
  background-color: #123458;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.navigacijske-veze {
  display: flex;
  flex-direction: column;
}

.nav-veza {
  padding: 15px;
  text-decoration: none;
  color: #ecf0f1;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.nav-veza:hover {
  background-color: rgba(255,255,255,0.1);
  transform: translateX(5px);
}

.nav-veza.aktivna {
  background-color: #2261a5;
}

.nav-veza.router-link-active:not(.aktivna) {
  background-color: transparent;
}

.glavni-sadrzaj {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #F1EFEC;
  margin: 0;
}

.dashboard-stranica {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.nadolazeci-dogadaji {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
  margin-bottom: 30px;
}

.dogadaji-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.dogadaji-zaglavlje h2 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
}

.gumb-kalendar {
  padding: 8px 16px;
  background-color: #123458;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gumb-kalendar:hover {
  background-color: #1c4c80;
}

.dogadaji-lista {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dogadaj-kartica {
  background-color: #F1EFEC;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid;
  transition: all 0.2s ease;
}

.dogadaj-kartica:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.nema-dogadaja {
  padding: 40px 20px;
  text-align: center;
}

.nema-dogadaja .prazan-sadrzaj {
  color: #123458;
}

.nema-dogadaja .prazan-ikona {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.6;
}

.nema-dogadaja .prazan-sadrzaj p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.nedavni-komentari {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.komentari-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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

.nedavni-komentari h2 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
}

.komentari-lista {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.gumb-procitan:hover {
  background-color: #123458;
  color: white;
}

.gumb-procitan.procitan {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.gumb-procitan.procitan:hover {
  background-color: #218838;
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

.gumb-obrisi:hover {
  background-color: #c62828;
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

.nema-komentara {
  padding: 40px 20px;
  text-align: center;
}

.prazan-sadrzaj {
  color: #123458;
}

.prazan-ikona {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.6;
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

.gumb-potvrdi:hover {
  background-color: #c62828;
}

@media (max-width: 768px) {
  .dashboard-stranica {
    padding: 20px;
  }

  .nadolazeci-dogadaji,
  .nedavni-komentari {
    padding: 20px;
  }

  .dogadaji-zaglavlje,
  .komentari-zaglavlje {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .dogadaj-zaglavlje {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .dogadaj-oznaka {
    align-self: flex-start;
  }

  .komentar-zaglavlje {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .komentar-akcije {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .dashboard-stranica {
    padding: 15px;
  }

  .nadolazeci-dogadaji,
  .nedavni-komentari {
    padding: 20px;
  }

  .dogadaj-kartica,
  .komentar-kartica {
    padding: 12px;
  }

  .dogadaj-klijent {
    font-size: 1rem;
  }

  .dogadaj-datum {
    font-size: 0.8rem;
  }

  .komentar-meta {
    gap: 2px;
  }

  .komentar-autor {
    font-size: 0.85rem;
  }

  .komentar-datum,
  .komentar-slika {
    font-size: 0.75rem;
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
} </style> 