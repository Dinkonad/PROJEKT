<template>
    <div class="cjenovnik">
      <h1 class="naslov">Cjenovnik snimanja</h1>
      
      <div class="glavni-sadrzaj">
        <div class="forma-okvir">
          <div class="forma-grupa">
            <label>Satnica (EUR):</label>
            <input type="number" v-model.number="satnica" min="0" placeholder="Koliko ide po satu..." />
          </div>
          
          <div class="forma-grupa">
            <label>Broj sati:</label>
            <input type="number" v-model.number="brojSati" min="0"  placeholder="Upisi koliko se sati radi..."/>
          </div>
          
          <div class="forma-grupa">
            <label>Polazni grad:</label>
            <input type="text" v-model="polazniGrad" @blur="izracunajUdaljenost" placeholder="Upiši polazni grad..." />
          </div>
          
          <div class="forma-grupa">
            <label>Odredišni grad:</label>
            <input type="text" v-model="odredisniGrad" @blur="izracunajUdaljenost"  placeholder="Upiši odredišnji grad grad..."/>
          </div>
          
          <div class="forma-grupa">
            <label>Udaljenost (km):</label>
            <div class="udaljenost-wrapper">
              <input type="number" v-model.number="udaljenost" min="0" placeholder="Udaljenost..." />
              <span v-if="ucitavanjeUdaljenosti" class="status-text">Izračunavanje...</span>
            </div>
          </div>
          
          <div class="opcije-container">
            <h3>Dodatne opcije</h3>
            
            <div class="opcija-red">
              <button class="gumb-opcija" :class="{ aktivno: dron }" @click="dron = !dron">
                <span class="material-icons">{{ dron ? 'check_circle' : 'add_circle' }}</span>
                Snimanje dronom (+50 EUR)
              </button>
            </div>
            
            <div class="opcija-red">
              <button class="gumb-opcija" :class="{ aktivno: edit }" @click="edit = !edit">
                <span class="material-icons">{{ edit ? 'check_circle' : 'add_circle' }}</span>
                Editiranje (+50 EUR)
              </button>
            </div>
          </div>
        </div>
        
        <div class="izracun-okvir">
          <h2>Pregled izračuna</h2>
          
          <div class="pregled-container">
            <div class="stavka-red" v-if="polazniGrad && odredisniGrad">
              <span>Lokacija:</span>
              <span>{{ polazniGrad }} - {{ odredisniGrad }}</span>
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
            
            <div class="stavka-red" v-if="edit">
              <span>Editiranje:</span>
              <span>50 EUR</span>
            </div>
            
            <div class="stavka-red ukupno">
              <span>UKUPNO:</span>
              <span>{{ ukupnaCijena }} EUR</span>
            </div>
          </div>
          
          <button @click="preuzmiPDF" class="gumb-preuzmi">
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
  
  const dron = ref(false)
  const edit = ref(false)
  
  const osnovnaCijena = computed(() => {
    return satnica.value * brojSati.value
  })
  
  const putniTroskovi = computed(() => {
    return Math.round(udaljenost.value * 0.4 * 2 * 100) / 100
  })
  
  const ukupnaCijena = computed(() => {
    let cijena = osnovnaCijena.value + putniTroskovi.value
    
    if (dron.value) cijena += 50
    if (edit.value) cijena += 50
    
    return Math.round(cijena * 100) / 100
  })
  
  const dohvatiKoordinate = async (adresa) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresa)}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        }
      }
      return null
    } catch (error) {
      console.error('Greška pri dohvaćanju koordinata:', error)
      return null
    }
  }
  
  const toRad = (value) => {
    return value * Math.PI / 180
  }
  
  const izracunajHaversineUdaljenost = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    
    return d * 1.3
  }
  
  const izracunajUdaljenost = async () => {
    if (!polazniGrad.value || !odredisniGrad.value) {
      return
    }
    
    ucitavanjeUdaljenosti.value = true
    
    try {
      const koordinate1 = await dohvatiKoordinate(polazniGrad.value)
      const koordinate2 = await dohvatiKoordinate(odredisniGrad.value)
      
      if (koordinate1 && koordinate2) {
        const izracunataUdaljenost = izracunajHaversineUdaljenost(
          koordinate1.lat, koordinate1.lon,
          koordinate2.lat, koordinate2.lon
        )
        
        udaljenost.value = Math.round(izracunataUdaljenost)
      } else {
        console.error('Nije moguće pronaći jedan ili oba grada')
        alert('Nije moguće izračunati udaljenost. Molimo provjerite nazive gradova ili unesite udaljenost ručno.')
      }
    } catch (error) {
      console.error('Greška pri izračunu udaljenosti:', error)
      alert('Došlo je do greške pri izračunu udaljenosti. Molimo unesite udaljenost ručno.')
    } finally {
      ucitavanjeUdaljenosti.value = false
    }
  }
  
  const preuzmiPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
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
    y += lineHeight;
  
    if (polazniGrad.value && odredisniGrad.value) {
      doc.text(`Lokacija: ${polazniGrad.value} - ${odredisniGrad.value}`, margin, y);
      y += lineHeight;
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
  
    if (edit.value) {
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
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('neki tekst moze biti', margin, y);
    y += 5;
   
  
 
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
        izracunajUdaljenost()
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
  
  .forma-okvir, .izracun-okvir {
    flex: 1;
    padding: 24px;
    border-radius: 12px;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .forma-okvir:hover, .izracun-okvir:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
  
  .forma-grupa {
    margin-bottom: 20px;
  }
  
  .forma-grupa label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #123458;
  }
  
  .forma-grupa input[type="text"],
  .forma-grupa input[type="number"] {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #D4C9BE;
    background-color: white;
    font-family: 'Roboto', sans-serif;
    font-size: 16px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  
  .forma-grupa input:focus {
    outline: none;
    border-color: #123458;
    box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
  }
  
  .udaljenost-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .status-text {
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
  
  .opcije-container {
    margin-top: 25px;
  }
  
  .opcije-container h3 {
    color: #123458;
    font-size: 1.2rem;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #D4C9BE;
  }
  
  .opcija-red {
    margin-bottom: 12px;
  }
  
  .gumb-opcija {
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
  
  .gumb-opcija .material-icons {
    color: #123458;
    font-size: 20px;
  }
  
  .gumb-opcija:hover {
    background-color: #c5b7a9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .gumb-opcija.aktivno {
    background-color: #123458;
    color: #F1EFEC;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .gumb-opcija.aktivno .material-icons {
    color: #F1EFEC;
  }
  
  .gumb-opcija.aktivno:hover {
    background-color: #1c4c80;
  }
  
  .pregled-container {
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
  
  .gumb-preuzmi {
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
  
  .gumb-preuzmi:hover {
    background-color: #1c4c80;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .gumb-preuzmi .material-icons {
    font-size: 20px;
  }
  
  @media (max-width: 768px) {
    .glavni-sadrzaj {
      flex-direction: column;
    }
    
    .naslov {
      font-size: 1.5rem;
      margin-bottom: 30px;
    }
    
    .forma-okvir, .izracun-okvir {
      padding: 20px;
    }
  }
  </style>