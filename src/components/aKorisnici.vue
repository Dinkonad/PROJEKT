<template>
  <div class="korisnici-container">
    <h2 class="naslov">Pregled korisnika</h2>
    
    <div class="status-filter">
      <button 
        class="filter-button" 
        :class="{ 'active': odabraniFilter === 'svi' }"
        @click="odabraniFilter = 'svi'"
      >
        Svi korisnici
      </button>
      <button 
        class="filter-button" 
        :class="{ 'active': odabraniFilter === 'online' }"
        @click="odabraniFilter = 'online'"
      >
        Online
      </button>
      <button 
        class="filter-button" 
        :class="{ 'active': odabraniFilter === 'offline' }"
        @click="odabraniFilter = 'offline'"
      >
        Offline
      </button>
    </div>

    <div v-if="ucitavanje" class="ucitavanje">
      Učitavanje korisnika...
    </div>
    
    <div v-else-if="filtriranKorisnici.length === 0" class="nema-korisnika">
      Nema pronađenih korisnika
    </div>
    
    <div v-else class="korisnici-tablica-wrapper">
      <table class="korisnici-tablica">
        <thead>
          <tr>
            <th>Status</th>
            <th>Ime</th>
            <th>Email</th>
            <th>Zadnja aktivnost</th>
            <th>Uloga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="korisnik in filtriranKorisnici" :key="korisnik.id" class="korisnik-red">
            <td>
              <div class="status-indikator" :class="{ 'online': korisnik.status === 'online' }"></div>
            </td>
            <td>{{ korisnik.name || korisnik.email.split('@')[0] }}</td>
            <td>{{ korisnik.email }}</td>
            <td>{{ formatLastActive(korisnik.lastActive) }}</td>
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

const korisnici = ref([]);
const ucitavanje = ref(true);
const odabraniFilter = ref('svi');
let unsubscribe = null;

// Filtrirani korisnici prema odabranom filteru
const filtriranKorisnici = computed(() => {
  if (odabraniFilter.value === 'svi') {
    return korisnici.value;
  } else if (odabraniFilter.value === 'online') {
    return korisnici.value.filter(korisnik => korisnik.status === 'online');
  } else if (odabraniFilter.value === 'offline') {
    return korisnici.value.filter(korisnik => korisnik.status === 'offline' || !korisnik.status);
  }
  return korisnici.value;
});

// Funkcija za formatiranje vremena zadnje aktivnosti
const formatLastActive = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'Nepoznato';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Upravo sada';
  if (diffMinutes < 60) return `Prije ${diffMinutes} min`;
  if (diffMinutes < 1440) { // manje od 24 sata
    const hours = Math.floor(diffMinutes / 60);
    return `Prije ${hours} ${hours === 1 ? 'sat' : hours < 5 ? 'sata' : 'sati'}`;
  }
  
  return new Intl.DateTimeFormat('hr', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

onMounted(() => {
  // Dohvaćamo sve korisnike umjesto samo aktivnih
  const usersRef = collection(db, 'users');
  const korisniciQuery = query(usersRef, orderBy('lastActive', 'desc'));
  
  ucitavanje.value = true;
  
  unsubscribe = onSnapshot(korisniciQuery, (snapshot) => {
    const korisniciLista = [];
    snapshot.forEach((doc) => {
      korisniciLista.push({ id: doc.id, ...doc.data() });
    });
    korisnici.value = korisniciLista;
    ucitavanje.value = false;
  }, (error) => {
    console.error("Greška pri dohvaćanju korisnika:", error);
    ucitavanje.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
.korisnici-container {
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

.status-filter {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.filter-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #f2f2f2;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background-color: #e6e6e6;
}

.filter-button.active {
  background-color: #123458;
  color: white;
}

.korisnici-tablica-wrapper {
  overflow-x: auto;
}

.korisnici-tablica {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.korisnici-tablica th {
  text-align: left;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.korisnici-tablica td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
}

.korisnik-red:hover {
  background-color: #f8f9fa;
}

.status-indikator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #adb5bd;
  display: inline-block;
}

.status-indikator.online {
  background-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

.ucitavanje, .nema-korisnika {
  text-align: center;
  padding: 30px;
  color: #6c757d;
  font-style: italic;
}
</style>