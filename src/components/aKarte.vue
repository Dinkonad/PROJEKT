<template>
  <div class="karta">
    <div class="naslov-sekcija">
      <h2 class="glavni-naslov">Karta</h2>
    </div>
    
    <div class="sadrzaj">
      <div class="mapa-okvir">
        <div class="mapa-zaglavlje">
          <h3>Karta evenata prikazana po lokacijama</h3>
          <div class="mapa-gumbovi">
            <button @click="prikaziSveLokacije" class="prikazuj-sve-gumb">
               Prikaži sve
            </button>
          </div>
        </div>
        <div class="mapa-wrapper">
          <div id="mapa" class="mapa"></div>
          
          <div class="legenda">
            <div class="legenda-stavka">
              <div class="legenda-oznaka" style="background-color: #123458;">📍</div>
              <span>Event lokacije ({{ prihodi.length }})</span>
            </div>
          </div>
          
          <div v-if="mapaUcitava" class="ucitavanje">
            <div class="spinner"></div>
            <p>Učitavam mapu...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const prihodi = ref([]);
const mapaUcitava = ref(true);
const mapa = ref(null);
const markeri = ref([]);
let unsubscribe = null;

const ucitajPrihode = async () => {
  try {
    prihodi.value = [];
    const prihodiCollection = collection(db, 'prihodi');
    const snapshot = await getDocs(prihodiCollection);
    
    const firestoreData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    prihodi.value = firestoreData;
    return firestoreData;
  } catch (error) {
    console.error('Greška pri učitavanju prihoda:', error);
    return [];
  }
};

const postaviRealtimeListener = () => {
  try {
    const prihodiCollection = collection(db, 'prihodi');
    
    unsubscribe = onSnapshot(prihodiCollection, (snapshot) => {
      prihodi.value = [];
      
      const noviPodaci = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      prihodi.value = noviPodaci;
      
      if (mapa.value) {
        azurirajMarkere();
      }
    });
  } catch (error) {
    console.error('Greška pri postavljanju listenera:', error);
  }
};

const formatirajDatum = (dateString) => {
  if (!dateString) return 'Nepoznat datum';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (error) {
    return 'Neispravnan datum';
  }
};

const pokretniMapa = async () => {
  try {
    mapaUcitava.value = true;
    await nextTick();
    
    if (typeof L === 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setTimeout(stvoriMapu, 100);
      };
      document.head.appendChild(script);
    } else {
      stvoriMapu();
    }
  } catch (error) {
    console.error('Greška pri inicijalizaciji mape:', error);
    mapaUcitava.value = false;
  }
};

const stvoriMapu = async () => {
  try {
    const pulaLat = 44.8719;
    const pulaLng = 13.8481;
    
    mapa.value = L.map('mapa').setView([pulaLat, pulaLng], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapa.value);
    
    mapaUcitava.value = false;
    
    if (prihodi.value.length > 0) {
      await azurirajMarkere();
    }
  } catch (error) {
    console.error('Greška pri stvaranju mape:', error);
    mapaUcitava.value = false;
  }
};

const pronadjiKoordinate = async (lokacijaNaziv) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lokacijaNaziv)}&countrycodes=hr&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error('Greška pri geokodiranju:', error);
  }
  return null;
};

const azurirajMarkere = async () => {
  markeri.value.forEach(marker => {
    if (mapa.value) {
      mapa.value.removeLayer(marker);
    }
  });
  markeri.value = [];
  
  if (!mapa.value) return;

  const eventiPoLokaciji = new Map();
  
  prihodi.value.forEach(event => {
    const lokacijaNaziv = event.lokacija?.trim();
    
    if (!lokacijaNaziv) return;

    if (!eventiPoLokaciji.has(lokacijaNaziv)) {
      eventiPoLokaciji.set(lokacijaNaziv, []);
    }
    eventiPoLokaciji.get(lokacijaNaziv).push(event);
  });

  const koordinateCache = new Map();
  
  for (const [lokacijaNaziv, eventi] of eventiPoLokaciji) {
    if (!koordinateCache.has(lokacijaNaziv)) {
      const koordinate = await pronadjiKoordinate(lokacijaNaziv);
      koordinateCache.set(lokacijaNaziv, koordinate);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const koordinate = koordinateCache.get(lokacijaNaziv);
    if (koordinate) {
      dodajGrupiraniMarker(lokacijaNaziv, eventi, koordinate);
    }
  }
};

const dodajGrupiraniMarker = (lokacijaNaziv, eventi, koordinate) => {
  if (!mapa.value || !koordinate) return;

  const brojEventova = eventi.length;
  const markerColor = brojEventova > 1 ? '#d9534f' : '#123458';

  const markerIcon = L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div class="event-marker-pin" style="background-color: ${markerColor};">
        <span class="marker-ikona">${brojEventova > 1 ? brojEventova : '📍'}</span>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });
  
  const marker = L.marker([koordinate.lat, koordinate.lng], {
    icon: markerIcon
  }).addTo(mapa.value);
  
  let popupSadrzaj = `
    <div class="popup-sadrzaj">
      <div class="popup-zaglavlje">
        <h4>${lokacijaNaziv}</h4>
        <span class="event-brojac">${brojEventova} event${brojEventova > 1 ? 'a' : ''}</span>
      </div>
      <div class="popup-detalji">
  `;
  
  eventi.forEach((event, index) => {
    popupSadrzaj += `
      <div class="event-kartica">
        <div class="event-naslov">${event.nazivEventa || 'Nepoznat event'}</div>
        <div class="event-info">
          <span class="info-label">Klijent:</span>
          <span class="info-value">${event.imeIPrezime || 'Nepoznat klijent'}</span>
        </div>
        <div class="event-info">
          <span class="info-label">Datum:</span>
          <span class="info-value">${formatirajDatum(event.datumSnimanja)}</span>
        </div>
      </div>
      ${index < eventi.length - 1 ? '<hr class="event-separator">' : ''}
    `;
  });
  
  popupSadrzaj += '</div></div>';
  
  marker.bindPopup(popupSadrzaj, {
    maxWidth: 400,
    maxHeight: 300,
    className: 'custom-popup'
  });
  
  markeri.value.push(marker);
};

const prikaziSveLokacije = () => {
  if (mapa.value && markeri.value.length > 0) {
    const group = new L.featureGroup(markeri.value);
    mapa.value.fitBounds(group.getBounds().pad(0.1));
  }
};

onMounted(async () => {
  await ucitajPrihode();
  postaviRealtimeListener();
  await pokretniMapa();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  
  if (mapa.value) {
    mapa.value.remove();
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.karta {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.naslov-sekcija {
  text-align: center;
  margin-bottom: 30px;
}

.glavni-naslov {
  color: #123458;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2rem;
  position: relative;
  display: inline-block;
}

.glavni-naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .karta {
    padding: 15px;
    margin: 10px;
  }
  
  .glavni-naslov {
    font-size: 1.5rem;
  }
  
  .naslov-sekcija {
    margin-bottom: 20px;
  }
}

.sadrzaj {
  margin-bottom: 30px;
}

.mapa-okvir {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

@media (max-width: 768px) {
  .mapa-okvir {
    padding: 15px;
  }
}

.mapa-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .mapa-zaglavlje {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}

.mapa-zaglavlje h3 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .mapa-zaglavlje h3 {
    font-size: 1rem;
    margin-bottom: 10px;
  }
}

.mapa-gumbovi {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.prikazuj-sve-gumb {
  padding: 8px 12px;
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

@media (max-width: 768px) {
  .prikazuj-sve-gumb {
    padding: 10px 16px;
    font-size: 0.85rem;
    width: 100%;
  }
}

.prikazuj-sve-gumb:hover {
  background-color: #1c4c80;
  transform: translateY(-1px);
}

.mapa-wrapper {
  position: relative;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #D4C9BE;
}

@media (max-width: 1024px) {
  .mapa-wrapper {
    height: 450px;
  }
}

@media (max-width: 768px) {
  .mapa-wrapper {
    height: 400px;
  }
}

@media (max-width: 480px) {
  .mapa-wrapper {
    height: 300px;
  }
}

.mapa {
  width: 100%;
  height: 100%;
}

.ucitavanje {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #D4C9BE;
  border-top: 4px solid #123458;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .spinner {
    width: 30px;
    height: 30px;
    border-width: 3px;
    margin-bottom: 10px;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ucitavanje p {
  color: #123458;
  font-weight: 500;
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .ucitavanje p {
    font-size: 0.8rem;
  }
}

.legenda {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: white;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .legenda {
    bottom: 8px;
    left: 8px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }
}

.legenda-stavka {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.legenda-stavka:last-child {
  margin-bottom: 0;
}

.legenda-oznaka {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 8px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .legenda-oznaka {
    width: 14px;
    height: 14px;
    font-size: 7px;
    margin-right: 5px;
  }
}

:global(.custom-event-marker) {
  background: transparent;
  border: none;
}

:global(.event-marker-pin) {
  width: 35px;
  height: 35px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  border: 3px solid white;
  position: relative;
}

@media (max-width: 768px) {
  :global(.event-marker-pin) {
    width: 28px;
    height: 28px;
    font-size: 12px;
    border-width: 2px;
  }
}

:global(.event-marker-pin::after) {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background-color: inherit;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
}

@media (max-width: 768px) {
  :global(.event-marker-pin::after) {
    bottom: -6px;
    width: 6px;
    height: 6px;
  }
}

:global(.marker-ikona) {
  transform: rotate(45deg);
  font-size: 12px;
}

@media (max-width: 768px) {
  :global(.marker-ikona) {
    font-size: 10px;
  }
}

:global(.popup-sadrzaj) {
  font-family: 'Roboto', sans-serif;
  min-width: 280px;
  max-width: 350px;
}

@media (max-width: 768px) {
  :global(.popup-sadrzaj) {
    min-width: 250px;
    max-width: 300px;
  }
}

:global(.popup-zaglavlje) {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #123458;
}

@media (max-width: 768px) {
  :global(.popup-zaglavlje) {
    margin-bottom: 10px;
    padding-bottom: 6px;
  }
}

:global(.popup-zaglavlje h4) {
  color: #123458;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
}

@media (max-width: 768px) {
  :global(.popup-zaglavlje h4) {
    font-size: 1rem;
  }
}

:global(.popup-detalji) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  :global(.popup-detalji) {
    gap: 8px;
  }
}

:global(.event-brojac) {
  background-color: #123458;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.6rem;
  font-weight: 500;
}

:global(.event-kartica) {
  margin-bottom: 8px;
}

:global(.event-naslov) {
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

:global(.event-info) {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 0.75rem;
}

:global(.info-label) {
  color: #666;
  font-weight: 500;
}

:global(.info-value) {
  color: #333;
  font-weight: 400;
}

:global(.event-separator) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 8px 0;
}

:global(.custom-popup .leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>