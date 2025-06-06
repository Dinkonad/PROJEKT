<template>
  <div class="cjenovnik">
    <h1 class="naslov">Cjenovnik snimanja</h1>
    
    <div class="glavni-sadrzaj">
      <div class="unos-okvir">
        <div class="grupa">
          <label>Satnica (EUR):</label>
          <input type="number" v-model.number="satnica" min="0" placeholder="Koliko ide po satu..." />
        </div>
        
        <div class="grupa">
          <label>Broj sati:</label>
          <input type="number" v-model.number="brojSati" min="0" placeholder="Upisi koliko se sati radi..."/>
        </div>
        
        <div class="grupa">
          <label>Polazni grad:</label>
          <div class="unos-sa-prijedlozima">
            <input 
              type="text" 
              v-model="polazniGrad" 
              @input="traziGradove('polazni')" 
              @blur="zatvoriFokus('polazni')" 
              placeholder="Upiši polazni grad..." />
            <div v-if="prijedloziPolazni.length > 0" class="prijedlozi-dropdown">
              <div 
                v-for="(grad, index) in prijedloziPolazni" 
                :key="index" 
                class="prijedlog-stavka"
                @mousedown="odaberiGrad('polazni', grad)">
                {{ grad.name }}, {{ grad.country }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="grupa">
          <label>Odredišni grad:</label>
          <div class="unos-sa-prijedlozima">
            <input 
              type="text" 
              v-model="odredisniGrad" 
              @input="traziGradove('odredisni')" 
              @blur="zatvoriFokus('odredisni')" 
              placeholder="Upiši odredišnji grad..." />
            <div v-if="prijedloziOdredisni.length > 0" class="prijedlozi-dropdown">
              <div 
                v-for="(grad, index) in prijedloziOdredisni" 
                :key="index" 
                class="prijedlog-stavka"
                @mousedown="odaberiGrad('odredisni', grad)">
                {{ grad.name }}, {{ grad.country }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="grupa">
          <label>Udaljenost (km):</label>
          <div class="udaljenost-wrapper">
            <input type="number" v-model.number="udaljenost" min="0" placeholder="Udaljenost..." />
            <span v-if="ucitavanjeUdaljenosti" class="status-tekst">Izračunavanje...</span>
          </div>
        </div>
        
        <div class="opcije-kontejner">
          <h3>Dodatne opcije</h3>
          
          <div class="opcija-red">
            <button class="opcija-gumb" :class="{ aktivno: dron }" @click="dron = !dron">
              <span class="material-icons">{{ dron ? 'check_circle' : 'add_circle' }}</span>
              Snimanje dronom (+50 EUR)
            </button>
          </div>
          
          <div class="opcija-red">
            <button class="opcija-gumb" :class="{ aktivno: editiranje }" @click="editiranje = !editiranje">
              <span class="material-icons">{{ editiranje ? 'check_circle' : 'add_circle' }}</span>
              Editiranje (+50 EUR)
            </button>
          </div>
        </div>
      </div>
      
      <div class="pregled-okvir">
        <h2>Pregled izračuna</h2>
        
        <div class="pregled-kontejner">
          <div class="stavka-red" v-if="puniPolazniGrad && puniOdredisniGrad">
            <span>Lokacija:</span>
            <span>{{ puniPolazniGrad }} - {{ puniOdredisniGrad }}</span>
          </div>
          
          <div class="stavka-red">
            <span>Snimanje:</span>
            <span>{{ brojSati }} h × {{ satnica }} EUR = {{ osnovnaCijena }} EUR</span>
          </div>
          
          <div class="stavka-red" v-if="udaljenost > 0">
            <span>Putni troškovi:</span>
            <span>{{ udaljenost }} km × 2 × 0.4 = {{ putniTroskovi }} EUR</span> 
          </div>
          
          <div class="stavka-red" v-if="dron">
            <span>Snimanje dronom:</span>
            <span>50 EUR</span>
          </div>
          
          <div class="stavka-red" v-if="editiranje">
            <span>Editiranje:</span>
            <span>50 EUR</span>
          </div>
          
          <div class="stavka-red ukupno">
            <span>UKUPNO:</span>
            <span>{{ ukupnaCijena }} EUR</span>
          </div>
        </div>
        
        <button @click="preuzmiPDF" class="preuzmi-gumb">
          <span class="material-icons">download</span> Preuzmi PDF
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { jsPDF } from 'jspdf'

const satnica = ref(0)
const brojSati = ref(0)
const polazniGrad = ref('')
const odredisniGrad = ref('')
const udaljenost = ref(0)
const ucitavanjeUdaljenosti = ref(false)

const prijedloziPolazni = ref([])
const prijedloziOdredisni = ref([])
const puniPolazniGrad = ref('')
const puniOdredisniGrad = ref('')

const polazneKoordinate = ref(null)
const odredisneKoordinate = ref(null)

let tajmerID = null

const dron = ref(false)
const editiranje = ref(false)

const osnovnaCijena = computed(() => {
  return satnica.value * brojSati.value
})

const putniTroskovi = computed(() => {
  return Math.round(udaljenost.value * 0.4 * 2 * 100) / 100
})

const ukupnaCijena = computed(() => {
  let cijena = osnovnaCijena.value + putniTroskovi.value
  
  if (dron.value) cijena += 50
  if (editiranje.value) cijena += 50
  
  return Math.round(cijena * 100) / 100
})

const traziGradove = async (tip) => {
  const upit = tip === 'polazni' ? polazniGrad.value : odredisniGrad.value
  
  if (upit.length < 2) {
    if (tip === 'polazni') prijedloziPolazni.value = []
    else prijedloziOdredisni.value = []
    return
  }
  
  clearTimeout(tajmerID)
  tajmerID = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(upit)}&countrycodes=hr,si,it,at,hu,ba,rs,me,de,fr,es,ch,be,nl&limit=5`
      const response = await fetch(url)
      const data = await response.json()
      
      const gradovi = data
        .filter(item => item.type === 'city' || item.type === 'town' || item.type === 'administrative' || item.type === 'village')
        .map(item => {
          let country = item.display_name.split(', ').pop()
          
          const prijevodi = {
            'Italy': 'Italija',
            'Croatia': 'Hrvatska',
            'Slovenia': 'Slovenija',
            'Austria': 'Austrija',
            'Hungary': 'Mađarska',
            'Bosnia and Herzegovina': 'Bosna i Hercegovina',
            'Serbia': 'Srbija',
            'Montenegro': 'Crna Gora',
            'Germany': 'Njemačka',
            'France': 'Francuska',
            'Spain': 'Španjolska',
            'Switzerland': 'Švicarska',
            'Belgium': 'Belgija',
            'Netherlands': 'Nizozemska'
          }
          
          if (prijevodi[country]) {
            country = prijevodi[country]
          }
          
          return {
            name: item.name,
            country: country,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }
        })
      
      if (tip === 'polazni') {
        prijedloziPolazni.value = gradovi
      } else {
        prijedloziOdredisni.value = gradovi
      }
    } catch (error) {
      console.error('Greška pri pretraživanju gradova:', error)
    }
  }, 300)
}

const odaberiGrad = (tip, grad) => {
  if (tip === 'polazni') {
    polazniGrad.value = grad.name
    puniPolazniGrad.value = `${grad.name}, ${grad.country}`
    polazneKoordinate.value = { lat: grad.lat, lon: grad.lon }
    prijedloziPolazni.value = []
  } else {
    odredisniGrad.value = grad.name
    puniOdredisniGrad.value = `${grad.name}, ${grad.country}`
    odredisneKoordinate.value = { lat: grad.lat, lon: grad.lon }
    prijedloziOdredisni.value = []
  }
  
  if (polazneKoordinate.value && odredisneKoordinate.value) {
    izracunajUdaljenost()
  }
}

const zatvoriFokus = (tip) => {
  setTimeout(() => {
    if (tip === 'polazni') prijedloziPolazni.value = []
    else prijedloziOdredisni.value = []
  }, 150)
}

const izracunajUdaljenost = async () => {
  ucitavanjeUdaljenosti.value = true
  
  try {
    const cestovnaUdaljenost = await dohvatiCestovnuUdaljenost(
      polazneKoordinate.value.lon, polazneKoordinate.value.lat,
      odredisneKoordinate.value.lon, odredisneKoordinate.value.lat
    )
    
    if (cestovnaUdaljenost) {
      udaljenost.value = Math.round(cestovnaUdaljenost)
    } else {
      const izracunataUdaljenost = izracunajHaversineUdaljenost(
        polazneKoordinate.value.lat, polazneKoordinate.value.lon,
        odredisneKoordinate.value.lat, odredisneKoordinate.value.lon
      )
      
      udaljenost.value = Math.round(izracunataUdaljenost)
    }
  } catch (error) {
    console.error('Greška pri izračunu cestovne udaljenosti:', error)
    const izracunataUdaljenost = izracunajHaversineUdaljenost(
      polazneKoordinate.value.lat, polazneKoordinate.value.lon,
      odredisneKoordinate.value.lat, odredisneKoordinate.value.lon
    )
    
    udaljenost.value = Math.round(izracunataUdaljenost)
  } finally {
    ucitavanjeUdaljenosti.value = false
  }
}

const izracunajHaversineUdaljenost = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  
  return d * 1.3
}

const dohvatiCestovnuUdaljenost = async (lon1, lat1, lon2, lat2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000
    }
    return null
  } catch (error) {
    console.error('Greška pri dohvaćanju cestovne udaljenosti:', error)
    return null
  }
}

const preuzmiPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 30;

  doc.setFontSize(22);
  doc.setTextColor(18, 52, 88);
  doc.setFont('helvetica', 'bold');
  doc.text('PONUDA ZA SNIMANJE', pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setDrawColor(18, 52, 88);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const datum = new Date().toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  doc.text(`Datum: ${datum}`, margin, y);
  y += 7;

  if (puniPolazniGrad.value && puniOdredisniGrad.value) {
    doc.text(`Lokacija: ${puniPolazniGrad.value} - ${puniOdredisniGrad.value}`, margin, y);
    y += 7;
  } else if (polazniGrad.value && odredisniGrad.value) {
    doc.text(`Lokacija: ${polazniGrad.value} - ${odredisniGrad.value}`, margin, y);
    y += 7;
  }

  y += 10;

  const stavke = [
    { naziv: 'Snimanje', vrijednost: `${brojSati.value} h × ${satnica.value} EUR`, iznos: `${osnovnaCijena.value} EUR` }
  ];

  if (udaljenost.value > 0) {
    stavke.push({
      naziv: 'Putni troškovi',
      vrijednost: `${udaljenost.value} km × 0.4 × 2`,
      iznos: `${putniTroskovi.value} EUR`
    });
  }

  if (dron.value) {
    stavke.push({ naziv: 'Snimanje dronom', vrijednost: '', iznos: '50 EUR' });
  }

  if (editiranje.value) {
    stavke.push({ naziv: 'Editiranje', vrijednost: '', iznos: '50 EUR' });
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(18, 52, 88);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  doc.text('Opis', margin + 5, y + 7);
  doc.text('Detalji', pageWidth / 2 - 20, y + 7);
  doc.text('Iznos', pageWidth - margin - 25, y + 7);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  stavke.forEach(stavka => {
    doc.text(stavka.naziv, margin + 5, y + 7);
    doc.text(stavka.vrijednost, pageWidth / 2 - 20, y + 7);
    doc.text(stavka.iznos, pageWidth - margin - 25, y + 7);

    doc.setDrawColor(212, 201, 190);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 10, pageWidth - margin, y + 10);
    y += 12;
  });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 52, 88);
  doc.text('UKUPNO:', pageWidth - margin - 55, y + 10);
  doc.text(`${ukupnaCijena.value} EUR`, pageWidth - margin - 25, y + 10);
  
  doc.setDrawColor(18, 52, 88);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 60, y + 5, pageWidth - margin, y + 5);
  y += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 52, 88);
  doc.text('Kontakt:', margin, doc.internal.pageSize.getHeight() - 20);
  doc.setFont('helvetica', 'normal');
  doc.text('Email: naddinko@gmail.com | Tel: +385 99 873 5190', margin, doc.internal.pageSize.getHeight() - 15);

  doc.save(`Ponuda-snimanje-${datum.replace(/\./g, '-')}.pdf`);
};

watch([polazniGrad, odredisniGrad], () => {
  if (polazniGrad.value && odredisniGrad.value) {
    setTimeout(() => {
      if (polazneKoordinate.value && odredisneKoordinate.value) {
        izracunajUdaljenost()
      }
    }, 500)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.cjenovnik {
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

.glavni-sadrzaj {
  display: flex;
  gap: 30px;
}

.unos-okvir, .pregled-okvir {
  flex: 1;
  padding: 24px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.unos-okvir:hover, .pregled-okvir:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.grupa {
  margin-bottom: 20px;
}

.grupa label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #123458;
}

.grupa input[type="text"],
.grupa input[type="number"] {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
  background-color: white;
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.grupa input:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.unos-sa-prijedlozima {
  position: relative;
}

.prijedlozi-dropdown {
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #D4C9BE;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.prijedlog-stavka {
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.prijedlog-stavka:hover {
  background-color: #f5f5f5;
}

.udaljenost-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.status-tekst {
  margin-left: 10px;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.opcije-kontejner {
  margin-top: 25px;
}

.opcije-kontejner h3 {
  color: #123458;
  font-size: 1.2rem;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #D4C9BE;
}

.opcija-red {
  margin-bottom: 12px;
}

.opcija-gumb {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #D4C9BE;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #123458;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.opcija-gumb .material-icons {
  color: #123458;
  font-size: 20px;
}

.opcija-gumb:hover {
  background-color: #c5b7a9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.opcija-gumb.aktivno {
  background-color: #123458;
  color: #F1EFEC;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.opcija-gumb.aktivno .material-icons {
  color: #F1EFEC;
}

.opcija-gumb.aktivno:hover {
  background-color: #1c4c80;
}

.pregled-kontejner {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #D4C9BE;
  margin-bottom: 20px;
}

.stavka-red {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #D4C9BE;
}

.ukupno {
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 15px;
  border-top: 2px solid #123458;
  border-bottom: none;
  padding-top: 10px;
  color: #123458;
}

.preuzmi-gumb {
  background-color: #123458;
  color: #F1EFEC;
  border: none;
  padding: 14px 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.preuzmi-gumb:hover {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.preuzmi-gumb .material-icons {
  font-size: 20px;
}

@media (max-width: 1024px) {
  .cjenovnik {
    padding: 25px;
  }

  .glavni-sadrzaj {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .cjenovnik {
    padding: 20px;
  }

  .naslov {
    font-size: 1.8rem;
    margin-bottom: 30px;
  }

  .glavni-sadrzaj {
    flex-direction: column;
    gap: 20px;
  }
  
  .unos-okvir, .pregled-okvir {
    padding: 20px;
  }
  
  .prijedlozi-dropdown {
    max-height: 150px;
  }

  .opcije-kontejner {
    margin-top: 20px;
  }

  .opcija-gumb {
    padding: 10px 14px;
    font-size: 14px;
  }

  .opcija-gumb .material-icons {
    font-size: 18px;
  }

  .pregled-kontejner {
    padding: 16px;
  }

  .stavka-red {
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  .ukupno {
    font-size: 1.1rem;
    margin-top: 12px;
    padding-top: 8px;
  }

  .preuzmi-gumb {
    padding: 12px 0;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .cjenovnik {
    padding: 15px;
  }

  .naslov {
    font-size: 1.5rem;
    margin-bottom: 25px;
  }

  .glavni-sadrzaj {
    gap: 15px;
  }

  .unos-okvir, .pregled-okvir {
    padding: 16px;
  }

  .grupa {
    margin-bottom: 16px;
  }

  .grupa label {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .grupa input {
    padding: 10px;
    font-size: 14px;
  }

  .prijedlozi-dropdown {
    max-height: 120px;
  }

  .prijedlog-stavka {
    padding: 8px 10px;
    font-size: 14px;
  }

  .status-tekst {
    font-size: 0.8rem;
    margin-left: 8px;
  }

  .opcije-kontejner {
    margin-top: 16px;
  }

  .opcije-kontejner h3 {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }

  .opcija-red {
    margin-bottom: 10px;
  }

  .opcija-gumb {
    padding: 8px 12px;
    font-size: 13px;
  }

  .opcija-gumb .material-icons {
    font-size: 16px;
  }

  .pregled-okvir h2 {
    font-size: 1.3rem;
    margin-bottom: 16px;
  }

  .pregled-kontejner {
    padding: 12px;
  }

  .stavka-red {
    font-size: 14px;
    margin-bottom: 8px;
    padding-bottom: 6px;
  }

  .ukupno {
    font-size: 1rem;
    margin-top: 10px;
    padding-top: 6px;
  }

  .preuzmi-gumb {
    padding: 10px 0;
    font-size: 13px;
  }

  .preuzmi-gumb .material-icons {
    font-size: 18px;
  }
} </style>