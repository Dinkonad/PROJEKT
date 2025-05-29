<template>
  <div class="karte-container">
    <div class="page-header">
      <h2 class="naslov">Karta</h2>
    </div>
    
    <div class="glavni-sadrzaj">
      <div class="mapa-container">
        <div class="mapa-header">
          <h3>Karta evenata prikazana po lokacijama</h3>
          <div class="mapa-kontrole">
            <button @click="prikaziSveLokacije" class="btn-sve-lokacije">
               Prikaži sve
            </button>
          </div>
        </div>
        <div class="mapa-wrapper">
          <div id="mapa" class="mapa"></div>
          
    
          <div class="mapa-legenda">
            <div class="legenda-item">
              <div class="legenda-marker" style="background-color: #123458;">📍</div>
              <span>Event lokacije</span>
            </div>
          </div>
          
   
          <div v-if="mapaUcitava" class="mapa-loading">
            <div class="loading-spinner"></div>
            <p>Učitavam mapu...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';


const prihodi = ref([]);
const mapaUcitava = ref(true);
const mapa = ref(null);
const markeri = ref([]);
const odabraniEvent = ref(null);

const ucitajPrihode = () => {
  const pohranjeniPrihodi = localStorage.getItem('prihodi');
  if (pohranjeniPrihodi) {
    prihodi.value = JSON.parse(pohranjeniPrihodi);
    console.log('Učitao prihode:', prihodi.value.length);
  } else {
    console.log('Nema prihoda u localStorage');
  }
};

const formatCurrency = (value) => {
  return `${parseFloat(value).toFixed(2)} EUR`;
};

const formatDatum = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const resetirajFiltre = () => {

};

const prikaziEventDetalje = (event) => {
  odabraniEvent.value = event;
};

const initMapa = async () => {
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

const stvoriMapu = () => {
  try {
  
    const pulaLat = 44.8719;
    const pulaLng = 13.8481;
    
    mapa.value = L.map('mapa').setView([pulaLat, pulaLng], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapa.value);
    
    mapaUcitava.value = false;
  
    azurirajMarkere();
  } catch (error) {
    console.error('Greška pri stvaranju mape:', error);
    mapaUcitava.value = false;
  }
};

const geokodirajLokaciju = async (lokacijaNaziv) => {
  try {
    console.log('Geokoding za:', lokacijaNaziv);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lokacijaNaziv)}&countrycodes=hr&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log('Pronašao koordinate:', data[0].lat, data[0].lon);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } else {
      console.log('Nema rezultata za:', lokacijaNaziv);
    }
  } catch (error) {
    console.error('Greška pri geokodiranju:', error);
  }
  return null;
};

const azurirajMarkere = async () => {

  markeri.value.forEach(marker => {
    mapa.value.removeLayer(marker);
  });
  markeri.value = [];
  
  if (!mapa.value) return;
  
  console.log('Ažuriram markere. Ukupno prihoda:', prihodi.value.length);

  const koordinateCache = new Map();

  const sviPrihodi = [...prihodi.value];
  
  console.log('Prikazujem sve prihode:', sviPrihodi.length);
  

  for (const event of sviPrihodi) {
    const lokacijaNaziv = event.lokacija.trim();
    

    if (!koordinateCache.has(lokacijaNaziv)) {
      const koordinate = await geokodirajLokaciju(lokacijaNaziv);
      koordinateCache.set(lokacijaNaziv, koordinate);
 
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const koordinate = koordinateCache.get(lokacijaNaziv);
    if (koordinate) {
      dodajEventMarker(event, koordinate);
    }
  }
  
  console.log('Dodano markera:', markeri.value.length);
};

const dodajEventMarker = (event, koordinate) => {
  if (!mapa.value || !koordinate) return;
  

  const markerIcon = L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div class="event-marker-pin" style="background-color: #123458;">
        <span class="marker-ikona">📍</span>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });
  const offsetLat = (Math.random() - 0.5) * 0.002;
  const offsetLng = (Math.random() - 0.5) * 0.002;
  
  const marker = L.marker([koordinate.lat + offsetLat, koordinate.lng + offsetLng], {
    icon: markerIcon
  }).addTo(mapa.value);
  
  const popupSadrzaj = `
    <div class="popup-sadrzaj">
      <div class="popup-header">
        <h4>${event.nazivEventa}</h4>
      </div>
      <div class="popup-event-details">
        <div class="popup-row">
          <span class="popup-icon">👤</span>
          <div class="popup-info">
            <span class="popup-label">Klijent</span>
            <span class="popup-value">${event.imeIPrezime}</span>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon">📍</span>
          <div class="popup-info">
            <span class="popup-label">Lokacija</span>
            <span class="popup-value">${event.lokacija}</span>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon">📅</span>
          <div class="popup-info">
            <span class="popup-label">Datum</span>
            <span class="popup-value">${formatDatum(event.datumSnimanja)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  marker.bindPopup(popupSadrzaj);
  
  marker.on('click', () => {
    prikaziEventDetalje({
      ...event,
      id: `${event.nazivEventa}_${event.datumSnimanja}_${event.imeIPrezime}`
    });
  });
  
  markeri.value.push(marker);
};

const centrirajNaLokaciju = (lokacija) => {
};

const prikaziSveLokacije = () => {
  if (mapa.value && markeri.value.length > 0) {
    const group = new L.featureGroup(markeri.value);
    mapa.value.fitBounds(group.getBounds().pad(0.1));
  }
};

onMounted(() => {
  ucitajPrihode();

  window.addEventListener('storage', (e) => {
    if (e.key === 'prihodi') {
      console.log('localStorage promijenjen, ponovno učitavam...');
      ucitajPrihode();
      if (mapa.value) {
        azurirajMarkere();
      }
    }
  });
  initMapa();
  
  const interval = setInterval(() => {
    const trenutniPrihodi = localStorage.getItem('prihodi');
    if (trenutniPrihodi && JSON.parse(trenutniPrihodi).length !== prihodi.value.length) {
      console.log('Detektirana promjena prihoda...');
      ucitajPrihode();
      if (mapa.value) {
        azurirajMarkere();
      }
    }
  }, 2000);
  
  onUnmounted(() => {
    clearInterval(interval);
  });
});

onUnmounted(() => {
  window.removeEventListener('storage', ucitajPrihode);
  
  if (mapa.value) {
    mapa.value.remove();
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.karte-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.naslov {
  color: #123458;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2rem;
  position: relative;
  display: inline-block;
}

.naslov::after {
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

.glavni-sadrzaj {
  margin-bottom: 30px;
}

.statistike-panel {
  display: none;
}

.stat-kartica {
  display: none;
}

.stat-ikona {
  display: none;
}

.stat-podaci h4 {
  display: none;
}

.stat-podaci p {
  display: none;
}

.mapa-container {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.mapa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.mapa-header h3 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
}

.mapa-kontrole {
  display: flex;
  gap: 8px;
}

.btn-sve-lokacije {
  padding: 6px 10px;
  background-color: #5D8AA8;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sve-lokacije:hover {
  background-color: #4a7089;
  transform: translateY(-1px);
}

.mapa-wrapper {
  position: relative;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #D4C9BE;
}

.mapa {
  width: 100%;
  height: 100%;
}

.mapa-loading {
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #D4C9BE;
  border-top: 4px solid #123458;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lokacije-lista {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.lista-naslov {
  color: #123458;
  margin: 0 0 20px 0;
  font-weight: 600;
  font-size: 1.2rem;
  text-align: center;
  position: relative;
}

.lista-naslov::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background-color: #123458;
  border-radius: 2px;
}

.prazna-lista {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.prazna-lista .podnaslov {
  font-size: 0.9rem;
  margin-top: 10px;
}

.lokacije-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.lokacija-kartica {
  background-color: white;
  border: 2px solid #D4C9BE;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.lokacija-kartica:hover {
  border-color: #123458;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(18, 52, 88, 0.15);
}

.kartica-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #D4C9BE;
}

.lokacija-naziv {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  flex: 1;
  margin-right: 10px;
}

.event-broj {
  background-color: #123458;
  color: white;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.lokacija-detalji {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.prihod-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(18, 52, 88, 0.05);
  padding: 10px;
  border-radius: 6px;
}

.ukupan-prihod {
  font-weight: 600;
  color: #123458;
  font-size: 1rem;
}

.prosjecna-cijena {
  font-size: 0.85rem;
  color: #5D8AA8;
}

.eventi-lista h5 {
  margin: 0 0 10px 0;
  color: #123458;
  font-size: 0.9rem;
  font-weight: 600;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 6px;
  background-color: rgba(212, 201, 190, 0.1);
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
}

.event-item:hover {
  background-color: rgba(212, 201, 190, 0.2);
  transform: translateX(5px);
}

.event-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.event-naziv {
  font-weight: 500;
  color: #123458;
  font-size: 0.9rem;
}

.event-datum {
  font-size: 0.75rem;
  color: #5D8AA8;
  margin-top: 2px;
}

.event-cijena {
  font-weight: 600;
  font-size: 0.9rem;
}

.placeno {
  color: #10B981;
}

.neplaceno {
  color: #E53935;
}

.vise-evenata {
  text-align: center;
  color: #5D8AA8;
  font-style: italic;
  font-size: 0.8rem;
  padding: 8px;
  background-color: rgba(93, 138, 168, 0.1);
  border-radius: 6px;
  margin-top: 8px;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-sadrzaj {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 15px;
  border-bottom: 1px solid #D4C9BE;
}

.modal-header h4 {
  color: #123458;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #e53935;
}

.modal-body {
  padding: 20px;
}

.event-detalj {
  margin-bottom: 15px;
}

.event-detalj label {
  display: block;
  font-weight: 600;
  color: #123458;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.event-detalj p {
  margin: 0;
  padding: 10px;
  background-color: #F1EFEC;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
}

.cijena-display {
  font-weight: 600;
  font-size: 1.1rem;
  color: #123458;
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

:global(.marker-ikona) {
  transform: rotate(45deg);
  font-size: 12px;
}
:global(.popup-sadrzaj) {
  font-family: 'Roboto', sans-serif;
  min-width: 280px;
  max-width: 350px;
}

:global(.popup-header) {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #123458;
}

:global(.popup-header h4) {
  color: #123458;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.3;
}

:global(.popup-status) {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

:global(.popup-status.placeno) {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10B981;
  border: 1px solid #10B981;
}

:global(.popup-status.neplaceno) {
  background-color: rgba(229, 57, 53, 0.15);
  color: #E53935;
  border: 1px solid #E53935;
}

:global(.popup-event-details) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:global(.popup-row) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  background-color: rgba(241, 239, 236, 0.5);
  border-radius: 8px;
  border-left: 3px solid #123458;
}

:global(.popup-icon) {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

:global(.popup-info) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

:global(.popup-label) {
  font-size: 0.75rem;
  color: #123458;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:global(.popup-value) {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
  line-height: 1.3;
}

.mapa-legenda {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-size: 0.8rem;
}

.legenda-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legenda-item:last-child {
  margin-bottom: 0;
}

.legenda-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

:global(.popup-sadrzaj) {
  font-family: 'Roboto', sans-serif;
  min-width: 200px;
}

:global(.popup-sadrzaj h4) {
  color: #123458;
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #D4C9BE;
  padding-bottom: 5px;
}

:global(.popup-sadrzaj p) {
  margin: 5px 0;
  font-size: 0.85rem;
  color: #333;
}

:global(.popup-eventi) {
  margin-top: 10px;
  border-top: 1px solid #D4C9BE;
  padding-top: 8px;
}

:global(.popup-event) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 0.8rem;
}

:global(.popup-event span) {
  font-weight: 500;
  color: #123458;
}

:global(.popup-event small) {
  color: #5D8AA8;
  font-size: 0.7rem;
}

@media (max-width: 1024px) {
  .mapa-wrapper {
    height: 450px;
  }
}

@media (max-width: 768px) {
  .karte-container {
    padding: 15px;
  }
  
  .mapa-wrapper {
    height: 350px;
  }
  
  .modal-sadrzaj {
    width: 95%;
    margin: 10px;
  }
  
  .mapa-kontrole {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .btn-sve-lokacije {
    font-size: 0.7rem;
    padding: 5px 8px;
  }
}

@media (max-width: 480px) {
  .mapa-wrapper {
    height: 300px;
  }
} </style>