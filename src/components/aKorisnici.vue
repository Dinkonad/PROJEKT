<template>
  <div class="pregled-korisnika">
    <h1 class="naslov">Pregled korisnika</h1>
    
    <div class="filteri-status">
      <button 
        class="gumb-filter" 
        :class="{ 'aktivan': odabraniFilter === 'svi' }"
        @click="odabraniFilter = 'svi'"
      >
        Svi korisnici
      </button>
      <button 
        class="gumb-filter" 
        :class="{ 'aktivan': odabraniFilter === 'online' }"
        @click="odabraniFilter = 'online'"
      >
        Online
      </button>
      <button 
        class="gumb-filter" 
        :class="{ 'aktivan': odabraniFilter === 'offline' }"
        @click="odabraniFilter = 'offline'"
      >
        Offline
      </button>
    </div>

    <div v-if="ucitavanje" class="poruka-ucitavanje">
      Učitavanje korisnika...
    </div>
    
    <div v-else-if="filtrirani.length === 0" class="poruka-prazno">
      Nema pronađenih korisnika
    </div>
    
    <div v-else class="tablica-omotac">
      <table class="tablica-korisnici">
        <thead>
          <tr>
            <th>Trenutni status</th>
            <th>Ime</th>
            <th>Email</th>
            <th>Zadnja aktivnost</th>
            <th>Broj preuzimanja</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="korisnik in filtrirani" :key="korisnik.id" class="red-korisnik">
            <td>
              <div class="trenutni-status" :class="jeAktivan(korisnik.lastActive) ? 'online' : 'offline'">
                <div class="indikator-status-mali" :class="{ 'online': jeAktivan(korisnik.lastActive) }"></div>
                <span>{{ jeAktivan(korisnik.lastActive) ? 'Aktivan' : 'Neaktivan' }}</span>
              </div>
            </td>
            <td>{{ korisnik.name || korisnik.email.split('@')[0] }}</td>
            <td>{{ korisnik.email }}</td>
            <td>{{ formatirajZadnjuAktivnost(korisnik.lastActive) }}</td>
            <td>
              <div class="statistike-preuzimanja">
                <span class="broj-preuzimanja">{{ dohvatiBrojPreuzimanja(korisnik.email) }}</span>
                <span class="oznaka-preuzimanja">preuzimanja</span>
              </div>
            </td>
            <td>
              <button 
                class="gumb-brisi"
                @click="potvrdiBrisanje(korisnik)"
                :disabled="brisanjeUTijeku"
                title="Obriši korisnika"
              >
                <span class="material-icons">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="fade">
      <div v-if="prikaziModal" class="pozadina" @click="zatvoriModal">
        <div class="modal-potvrda" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Potvrda brisanja</h2>
          </div>
          <div class="potvrda-sadrzaj">
            <span class="material-icons upozorenje">warning</span>
            <p>Jeste li sigurni da želite obrisati korisnika:</p>
            <div class="korisnik-info">
              <strong>{{ korisnikZaBrisanje?.name || korisnikZaBrisanje?.email?.split('@')[0] }}</strong>
              <br>
              <span class="email-korisnika">{{ korisnikZaBrisanje?.email }}</span>
            </div>
            <p class="upozorenje-tekst">Ova akcija se ne može poništiti!</p>
          </div>
          <div class="potvrda-gumbi">
            <button class="gumb-odustani" @click="zatvoriModal">Odustani</button>
            <button 
              class="gumb-potvrdi" 
              @click="obrisiKorisnika"
              :disabled="brisanjeUTijeku"
            >
              {{ brisanjeUTijeku ? 'Brisanje...' : 'Potvrdi' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="toastPoruka" class="toast" :class="toastTip">
        {{ toastPoruka }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';

const listaKorisnika = ref([]);
const ucitavanje = ref(true);
const odabraniFilter = ref('svi');
const statistikePreuzimanja = ref({});
const prikaziModal = ref(false);
const korisnikZaBrisanje = ref(null);
const brisanjeUTijeku = ref(false);
const toastPoruka = ref('');
const toastTip = ref('');
let prekiniPracenje = null;

const ucitajStatistike = () => {
  try {
    const spremljeno = localStorage.getItem('download_stats');
    if (spremljeno) {
      statistikePreuzimanja.value = JSON.parse(spremljeno);
    } else {
      statistikePreuzimanja.value = {};
    }
  } catch (greska) {
    console.error('Greška pri učitavanju statistika preuzimanja:', greska);
    statistikePreuzimanja.value = {};
  }
};

const dohvatiBrojPreuzimanja = (emailKorisnika) => {
  return statistikePreuzimanja.value[emailKorisnika] || 0;
};

const korisniciFiltriraniPoAdminu = computed(() => {
  return listaKorisnika.value.filter(korisnik => korisnik.email !== 'naddinko@gmail.com');
});

const filtrirani = computed(() => {
  if (odabraniFilter.value === 'svi') {
    return korisniciFiltriraniPoAdminu.value;
  } else if (odabraniFilter.value === 'online') {
    return korisniciFiltriraniPoAdminu.value.filter(korisnik => jeAktivan(korisnik.lastActive));
  } else if (odabraniFilter.value === 'offline') {
    return korisniciFiltriraniPoAdminu.value.filter(korisnik => !jeAktivan(korisnik.lastActive));
  }
  return korisniciFiltriraniPoAdminu.value;
});

const jeAktivan = (vremenskiZig) => {
  if (!vremenskiZig || !vremenskiZig.toDate) return false;
  
  const datum = vremenskiZig.toDate();
  const sada = new Date();
  const razlikaMinute = Math.floor((sada - datum) / (1000 * 60));
  
  return razlikaMinute < 2;
};

const formatirajZadnjuAktivnost = (vremenskiZig) => {
  if (!vremenskiZig || !vremenskiZig.toDate) return 'Nepoznato';
  
  const datum = vremenskiZig.toDate();
  const sada = new Date();
  const razlikaMinute = Math.floor((sada - datum) / (1000 * 60));
  
  if (razlikaMinute < 1) return 'Upravo sada';
  if (razlikaMinute < 60) return `Prije ${razlikaMinute} min`;
  if (razlikaMinute < 1440) { 
    const sati = Math.floor(razlikaMinute / 60);
    return `Prije ${sati} ${sati === 1 ? 'sat' : sati < 5 ? 'sata' : 'sati'}`;
  }
  
  return new Intl.DateTimeFormat('hr', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(datum);
};

const potvrdiBrisanje = (korisnik) => {
  korisnikZaBrisanje.value = korisnik;
  prikaziModal.value = true;
};

const zatvoriModal = () => {
  prikaziModal.value = false;
  korisnikZaBrisanje.value = null;
};

const obrisiKorisnika = async () => {
  if (!korisnikZaBrisanje.value) return;
  
  brisanjeUTijeku.value = true;
  
  try {
    await deleteDoc(doc(db, 'users', korisnikZaBrisanje.value.id));
    
    const novaStatistika = { ...statistikePreuzimanja.value };
    delete novaStatistika[korisnikZaBrisanje.value.email];
    statistikePreuzimanja.value = novaStatistika;
    localStorage.setItem('download_stats', JSON.stringify(novaStatistika));
    zatvoriModal();
  } catch (greska) {
    console.error('Greška pri brisanju korisnika:', greska);
    prikaziToast('Greška pri brisanju korisnika. Pokušajte ponovno.', 'greska');
  } finally {
    brisanjeUTijeku.value = false;
  }
};

const prikaziToast = (poruka, tip) => {
  toastPoruka.value = poruka;
  toastTip.value = tip;
  
  setTimeout(() => {
    toastPoruka.value = '';
    toastTip.value = '';
  }, 4000);
};

const rukujPromjenom = (dogadaj) => {
  if (dogadaj.key === 'download_stats') {
    ucitajStatistike();
  }
};

onMounted(() => {
  ucitajStatistike();
  
  window.addEventListener('storage', rukujPromjenom);
  
  const intervalStatistika = setInterval(() => {
    ucitajStatistike();
  }, 2000);
  
  const referenceKorisnika = collection(db, 'users');
  const upitKorisnici = query(referenceKorisnika, orderBy('lastActive', 'desc'));
  
  ucitavanje.value = true;
  
  prekiniPracenje = onSnapshot(upitKorisnici, (snimka) => {
    const novaLista = [];
    snimka.forEach((dokument) => {
      novaLista.push({ id: dokument.id, ...dokument.data() });
    });
    listaKorisnika.value = novaLista;
    ucitavanje.value = false;
  }, (greska) => {
    console.error("Greška pri dohvaćanju korisnika:", greska);
    ucitavanje.value = false;
  });
  
  onUnmounted(() => {
    clearInterval(intervalStatistika);
  });
});

onUnmounted(() => {
  if (prekiniPracenje) {
    prekiniPracenje();
  }
  window.removeEventListener('storage', rukujPromjenom);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.pregled-korisnika {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.naslov {
  text-align: center;
  color: #123458;
  margin-bottom: 40px;
  font-weight: 700;
  position: relative;
}

.naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.filteri-status {
  display: flex;
  margin-bottom: 30px;
  gap: 10px;
  justify-content: center;
}

.gumb-filter {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background-color: #D4C9BE;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #123458;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gumb-filter:hover {
  background-color: #c5b7a9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.gumb-filter.aktivan {
  background-color: #123458;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.gumb-filter.aktivan:hover {
  background-color: #1c4c80;
}

.tablica-omotac {
  overflow-x: auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tablica-korisnici {
  width: 100%;
  border-collapse: collapse;
}

.tablica-korisnici th {
  text-align: left;
  padding: 15px;
  background-color: #123458;
  color: white;
  font-weight: 600;
  border-bottom: none;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.tablica-korisnici th:first-child {
  border-radius: 8px 0 0 0;
}

.tablica-korisnici th:last-child {
  border-radius: 0 8px 0 0;
}

.tablica-korisnici td {
  padding: 15px;
  border-bottom: 1px solid #D4C9BE;
  color: #495057;
  background-color: white;
}

.red-korisnik:hover {
  background-color: #f8f9fa;
}

.red-korisnik:hover td {
  background-color: #f8f9fa;
}

.red-korisnik:last-child td:first-child {
  border-radius: 0 0 0 8px;
}

.red-korisnik:last-child td:last-child {
  border-radius: 0 0 8px 0;
}

.trenutni-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.trenutni-status.online {
  color: #4CAF50;
}

.trenutni-status.offline {
  color: #6c757d;
}

.indikator-status-mali {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #adb5bd;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.indikator-status-mali.online {
  background-color: #4CAF50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
  animation: pulziraj 2s infinite;
}

.statistike-preuzimanja {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.broj-preuzimanja {
  font-size: 1.3rem;
  font-weight: 700;
  color: #123458;
  transition: color 0.3s ease;
}

.red-korisnik:hover .broj-preuzimanja {
  color: #007bff;
}

.oznaka-preuzimanja {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

.poruka-ucitavanje, 
.poruka-prazno {
  text-align: center;
  padding: 60px 30px;
  color: #6c757d;
  font-style: italic;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 1.1rem;
}

.gumb-brisi {
  background-color: #E53935;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gumb-brisi:hover:not(:disabled) {
  background-color: #C62828;
}

.gumb-brisi:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.pozadina {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(3, 3, 3, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-potvrda {
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-zaglavlje {
  background-color: #123458;
  color: #F1EFEC;
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-zaglavlje h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.potvrda-sadrzaj {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
}

.upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
}

.potvrda-sadrzaj p {
  margin: 0 0 16px 0;
  color: #495057;
}

.korisnik-info {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  border-left: 4px solid #123458;
  width: 100%;
  box-sizing: border-box;
}

.email-korisnika {
  color: #6c757d;
  font-size: 0.9rem;
}

.upozorenje-tekst {
  color: #E53935;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 16px !important;
}

.potvrda-gumbi {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 24px 24px;
}

.gumb-odustani {
  background-color: #9CA3AF;
  color: #F1EFEC;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.gumb-odustani:hover {
  background-color: #6B7280;
}

.gumb-potvrdi {
  background-color: #E53935;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 500;
}

.gumb-potvrdi:hover:not(:disabled) {
  background-color: #C62828;
}

.gumb-potvrdi:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1100;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.uspjeh {
  background-color: #28a745;
}

.toast.greska {
  background-color: #dc3545;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulziraj {
  0% {
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
  50% {
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.9);
  }
  100% {
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
}

@media (max-width: 768px) {
  .pregled-korisnika {
    padding: 20px;
  }
  
  .filteri-status {
    justify-content: stretch;
  }
  
  .tablica-omotac {
    font-size: 0.9rem;
    padding: 15px;
  }
  
  .tablica-korisnici th,
  .tablica-korisnici td {
    padding: 10px 8px;
  }
  
  .broj-preuzimanja {
    font-size: 1.1rem;
  }
  
  .oznaka-preuzimanja {
    font-size: 0.7rem;
  }

  .modal-potvrda {
    width: 95%;
    margin: 20px;
  }

  .toast {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .tablica-korisnici {
    font-size: 0.8rem;
  }
  
  .tablica-korisnici th,
  .tablica-korisnici td {
    padding: 8px 6px;
  }
  
  .statistike-preuzimanja {
    gap: 2px;
  }
  
  .broj-preuzimanja {
    font-size: 1rem;
  }
  
  .oznaka-preuzimanja {
    font-size: 0.65rem;
  }

  .filteri-status {
    flex-direction: column;
    gap: 8px;
  }

  .gumb-filter {
    width: 100%;
    text-align: center;
  }
  
  .naslov {
    font-size: 1.5rem;
  }

  .gumb-brisi {
    padding: 6px;
    font-size: 0.8rem;
  }
}

.red-korisnik {
  transition: all 0.3s ease;
}

.gumb-filter:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.tablica-korisnici th {
  user-select: none;
}
</style>