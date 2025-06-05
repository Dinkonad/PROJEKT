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
            <th>Status</th>
            <th>Ime</th>
            <th>Email</th>
            <th>Zadnja aktivnost</th>
            <th>Broj preuzimanja</th>
            <th>Uloga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="korisnik in filtrirani" :key="korisnik.id" class="red-korisnik">
            <td>
              <div class="indikator-status" :class="{ 'online': korisnik.status === 'online' }"></div>
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
            <td>{{ korisnik.email === 'naddinko@gmail.com' ? 'Admin' : 'Korisnik' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  Timestamp,
  orderBy
} from 'firebase/firestore';

const listaKorisnika = ref([]);
const ucitavanje = ref(true);
const odabraniFilter = ref('svi');
const statistikePreuzimanja = ref({});
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

const filtrirani = computed(() => {
  if (odabraniFilter.value === 'svi') {
    return listaKorisnika.value;
  } else if (odabraniFilter.value === 'online') {
    return listaKorisnika.value.filter(korisnik => korisnik.status === 'online');
  } else if (odabraniFilter.value === 'offline') {
    return listaKorisnika.value.filter(korisnik => korisnik.status === 'offline' || !korisnik.status);
  }
  return listaKorisnika.value;
});

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

.indikator-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #adb5bd;
  display: inline-block;
  margin: 0 auto;
}

.indikator-status.online {
  background-color: #4CAF50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
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
}

.red-korisnik {
  transition: all 0.3s ease;
}

.indikator-status {
  transition: all 0.3s ease;
}

.indikator-status.online {
  animation: pulziraj 2s infinite;
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

.broj-preuzimanja {
  transition: color 0.3s ease;
}

.red-korisnik:hover .broj-preuzimanja {
  color: #007bff;
}

.gumb-filter:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.tablica-korisnici th {
  user-select: none;
}
</style>