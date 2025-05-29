<template>
  <div class="pregled-korisnika">
    <h2 class="naslov">Pregled korisnika</h2>
    
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
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin: 20px;
}

.naslov {
  color: #123458;
  margin-bottom: 20px;
  font-weight: 600;
  border-bottom: 2px solid #f2f2f2;
  padding-bottom: 10px;
}

.filteri-status {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.gumb-filter {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #f2f2f2;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.gumb-filter:hover {
  background-color: #e6e6e6;
}

.gumb-filter.aktivan {
  background-color: #123458;
  color: white;
}

.tablica-omotac {
  overflow-x: auto;
}

.tablica-korisnici {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.tablica-korisnici th {
  text-align: left;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.tablica-korisnici td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.red-korisnik:hover {
  background-color: #f8f9fa;
}

.indikator-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #adb5bd;
  display: inline-block;
}

.indikator-status.online {
  background-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

.statistike-preuzimanja {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.broj-preuzimanja {
  font-size: 1.2rem;
  font-weight: 600;
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
  padding: 30px;
  color: #6c757d;
  font-style: italic;
}

@media (max-width: 768px) {
  .tablica-omotac {
    font-size: 0.9rem;
  }
  
  .tablica-korisnici th,
  .tablica-korisnici td {
    padding: 8px 10px;
  }
  
  .broj-preuzimanja {
    font-size: 1rem;
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
    padding: 6px 8px;
  }
  
  .statistike-preuzimanja {
    gap: 1px;
  }
  
  .broj-preuzimanja {
    font-size: 0.9rem;
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
}

.red-korisnik {
  transition: background-color 0.2s ease;
}

.indikator-status {
  transition: all 0.3s ease;
}

.indikator-status.online {
  animation: pulziraj 2s infinite;
}

@keyframes pulziraj {
  0% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  }
}

.broj-preuzimanja {
  transition: color 0.2s ease;
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