<template>
  <div class="prihodi">
    <h1 class="naslov">Prikaz svih prihoda</h1>
    
    <div class="kartice">
      <div class="kartica placeno">
        <div class="ikona">
          <span class="material-icons">check_circle</span>
        </div>
        <div class="podaci">
          <h3>Ukupno plaćeno</h3>
          <p class="iznos">{{ formatCurrency(ukupnoPlaceno) }}</p>
        </div>
      </div>
      
      <div class="kartica neplaceno">
        <div class="ikona">
          <span class="material-icons">pending</span>
        </div>
        <div class="podaci">
          <h3>Ukupno neplaćeno</h3>
          <p class="iznos">{{ formatCurrency(ukupnoNePlaceno) }}</p>
        </div>
      </div>
      
      <div class="kartica trosak">
        <div class="ikona">
          <span class="material-icons">directions_car</span>
        </div>
        <div class="podaci">
          <h3>Ukupno putni troškovi</h3>
          <p class="iznos">{{ formatCurrency(ukupnoPutniTroskovi) }}</p>
        </div>
      </div>
    </div>

    <div class="tablica-okvir">
      <table class="tablica">
        <thead>
          <tr>
            <th>Naziv eventa</th>
            <th>Ime i prezime</th>
            <th>Datum</th>
            <th>Cijena</th>
            <th>Status Plaćanja</th>
            <th>Akcija</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(prihod, index) in sortiraniPrihodi" :key="index" @click="prikaziDetalje(prihod)" class="red">
            <td>{{ prihod.nazivEventa }}</td>
            <td>{{ prihod.imeIPrezime }}</td>
            <td>{{ formatDatum(prihod.datumSnimanja) }}</td>
            <td>{{ formatCurrency(prihod.cijena) }}</td>
            <td>
              <div v-if="prihod.placeno" class="status placeno">
                <span class="material-icons">check_circle</span> Plaćeno
              </div>
              <button v-else class="gumb-plati" @click.stop="oznaciKaoPlaceno(index)">
                <span class="material-icons">payments</span> Označi kao plaćeno
              </button>
            </td>
            <td>
              <button class="gumb-brisi" @click.stop="potvrdiZaBrisanje(index)">
                <span class="material-icons">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="dodaj-okvir">
      <button class="gumb-dodaj" @click="prikaziFormu = true">
        <span class="material-icons">add</span> Dodaj novi prihod
      </button>
    </div>

    <Transition name="fade">
      <div class="pozadina" v-if="detalji" @click="detalji = null">
        <div class="modal-detalji" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Detalji prihoda</h2>
            <button class="gumb-zatvori" @click="detalji = null">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-sadrzaj">
            <div class="podatak-red">
              <label>Naziv eventa:</label>
              <p>{{ detalji.nazivEventa }}</p>
            </div>
            <div class="podatak-red">
              <label>Ime i prezime:</label>
              <p>{{ detalji.imeIPrezime }}</p>
            </div>
            <div class="podatak-red">
              <label>Adresa lokacije:</label>
              <p>{{ detalji.lokacija }}</p>
            </div>
            <div class="podatak-red">
              <label>Datum snimanja:</label>
              <p>{{ formatDatum(detalji.datumSnimanja) }}</p>
            </div>
            <div class="podatak-red">
              <label>Cijena:</label>
              <p>{{ formatCurrency(detalji.cijena) }}</p>
            </div>
            <div class="podatak-red">
              <label>Putni trošak:</label>
              <p>{{ formatCurrency(detalji.putniTrosak || 0) }}</p>
            </div>
            <div class="podatak-red">
              <label>Status:</label>
              <p :class="detalji.placeno ? 'placeno' : 'neplaceno'">
                <span class="material-icons">{{ detalji.placeno ? 'check_circle' : 'pending' }}</span>
                {{ detalji.placeno ? 'Plaćeno' : 'Nije plaćeno' }}
              </p>
            </div>
            <div class="podatak-red" v-if="detalji.opisSnimanja">
              <label>Opis snimanja:</label>
              <p>{{ detalji.opisSnimanja }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div class="pozadina" v-if="prikaziFormu" @click="prikaziFormu = false">
        <div class="modal-forma" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Novi prihod</h2>
            <button class="gumb-zatvori" @click="prikaziFormu = false">
              <span class="material-icons">close</span>
            </button>
          </div>
          <form @submit.prevent="dodajNoviPrihod">
            <div class="forma-grupa">
              <label for="nazivEventa">Naziv eventa:</label>
              <input type="text" id="nazivEventa" v-model="noviPrihod.nazivEventa" required placeholder="Npr. Vjenčanje, Rođendan, Konferencija...">
            </div>
            
            <div class="forma-grupa">
              <label for="imeIPrezime">Ime i prezime:</label>
              <input type="text" id="imeIPrezime" v-model="noviPrihod.imeIPrezime" required placeholder="Ime i prezime klijenta">
            </div>
            
            <div class="forma-grupa">
              <label for="lokacija">Adresa lokacije:</label>
              <div class="adresa-autocomplete">
                <input 
                  type="text" 
                  id="lokacija" 
                  v-model="noviPrihod.lokacija" 
                  required 
                  @input="pretraziAdrese"
                  @blur="sakrijPrijedloge"
                  @focus="prikaziPrijedloge"
                  @keydown="navigirajPrijedloge"
                  class="adresa-input"
                  autocomplete="off"
                >
                
                <div v-if="prijedloziVisible && prijedloziAdresa.length > 0" class="adresa-dropdown">
                  <div 
                    v-for="(prijedlog, index) in prijedloziAdresa" 
                    :key="index"
                    :class="['dropdown-item', { 'selected': selectedIndex === index }]"
                    @mousedown="odaberiAdresu(prijedlog)"
                    @mouseenter="selectedIndex = index"
                  >
                    <div class="adresa-naziv">{{ prijedlog.display_name.split(',')[0] }}</div>
                    <div class="adresa-detalji">{{ prijedlog.display_name }}</div>
                  </div>
                  
                  <div v-if="pretragaUTijeku" class="dropdown-loading">
                    <span class="material-icons spinning">sync</span>
                    Pretražujem...
                  </div>
                </div>
              </div>
            </div>
            
            <div class="forma-grupa">
              <label for="datumSnimanja">Datum snimanja:</label>
              <input type="date" id="datumSnimanja" v-model="noviPrihod.datumSnimanja" required>
            </div>
            
            <div class="forma-grupa">
              <label for="cijena">Cijena (EUR):</label>
              <input type="number" id="cijena" v-model="noviPrihod.cijena" step="1.00" min="0" required>
            </div>
            
            <div class="forma-grupa">
              <label for="putniTrosak">Putni trošak (EUR):</label>
              <input type="number" id="putniTrosak" v-model="noviPrihod.putniTrosak" step="1.00" min="0" placeholder="0.00">
            </div>
            
            <div class="forma-grupa">
              <label for="opisSnimanja">Opis snimanja:</label>
              <textarea id="opisSnimanja" v-model="noviPrihod.opisSnimanja" placeholder="Detalji o snimanju, posebni zahtjevi..."></textarea>
            </div>
            
            <div class="forma-grupa checkbox">
              <label class="prekidac">
                <input type="checkbox" id="placeno" v-model="noviPrihod.placeno">
                <span class="klizac"></span>
                <span class="prekidac-tekst">Plaćeno</span>
              </label>
            </div>
            
            <div class="forma-gumbi">
              <button type="button" class="gumb-odustani" @click="prikaziFormu = false">Odustani</button>
              <button type="submit" class="gumb-spremi">Spremi</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div class="pozadina" v-if="brisanjeIndeks !== null" @click="brisanjeIndeks = null">
        <div class="modal-potvrda" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Potvrda brisanja</h2>
          </div>
          <div class="potvrda-sadrzaj">
            <span class="material-icons upozorenje">warning</span>
            <p>Jeste li sigurni da želite obrisati ovaj prihod?</p>
          </div>
          <div class="potvrda-gumbi">
            <button class="gumb-odustani" @click="brisanjeIndeks = null">Odustani</button>
            <button class="gumb-potvrdi" @click="obrisiPrihod">Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const prihodi = ref(JSON.parse(localStorage.getItem('prihodi')) || []);
const detalji = ref(null);
const prikaziFormu = ref(false);
const brisanjeIndeks = ref(null);
const prijedloziAdresa = ref([]);
const prijedloziVisible = ref(false);
const pretragaUTijeku = ref(false);
const selectedIndex = ref(-1);
const pretragaTimeout = ref(null);

const noviPrihod = ref({
  nazivEventa: '',
  imeIPrezime: '',
  lokacija: '',
  datumSnimanja: '',
  cijena: 0,
  putniTrosak: 0,
  placeno: false,
  opisSnimanja: ''
});

const ukupnoPlaceno = computed(() => {
  return prihodi.value
    .filter(prihod => prihod.placeno)
    .reduce((sum, prihod) => sum + parseFloat(prihod.cijena), 0);
});

const ukupnoNePlaceno = computed(() => {
  return prihodi.value
    .filter(prihod => !prihod.placeno)
    .reduce((sum, prihod) => sum + parseFloat(prihod.cijena), 0);
});

const ukupnoPutniTroskovi = computed(() => {
  return prihodi.value
    .reduce((sum, prihod) => sum + parseFloat(prihod.putniTrosak || 0), 0);
});

const sortiraniPrihodi = computed(() => {
  return [...prihodi.value].sort((a, b) => {
    return new Date(b.datumSnimanja) - new Date(a.datumSnimanja);
  });
});

onMounted(() => {
  if (!localStorage.getItem('prihodi')) {
    spremiULocalStorage();
  }
});

const spremiULocalStorage = () => {
  localStorage.setItem('prihodi', JSON.stringify(prihodi.value));
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

const pretraziAdrese = async () => {
  const query = noviPrihod.value.lokacija.trim();
  selectedIndex.value = -1;
  
  if (query.length < 3) {
    prijedloziAdresa.value = [];
    prijedloziVisible.value = false;
    return;
  }
  
  if (pretragaTimeout.value) {
    clearTimeout(pretragaTimeout.value);
  }
  
  pretragaTimeout.value = setTimeout(async () => {
    try {
      pretragaUTijeku.value = true;
      prijedloziVisible.value = true;
 
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=hr&limit=8`
      );
      const data = await response.json();
      
      prijedloziAdresa.value = data || [];
      
    } catch (error) {
      console.error('Greška pri pretraživanju adresa:', error);
      prijedloziAdresa.value = [];
    } finally {
      pretragaUTijeku.value = false;
    }
  }, 300);
};

const odaberiAdresu = (prijedlog) => {
  noviPrihod.value.lokacija = prijedlog.display_name;
  prijedloziVisible.value = false;
  prijedloziAdresa.value = [];
  selectedIndex.value = -1;
};

const navigirajPrijedloge = (event) => {
  if (!prijedloziVisible.value || prijedloziAdresa.value.length === 0) return;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, prijedloziAdresa.value.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0 && selectedIndex.value < prijedloziAdresa.value.length) {
        odaberiAdresu(prijedloziAdresa.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      sakrijPrijedloge();
      break;
  }
};

const prikaziPrijedloge = () => {
  if (prijedloziAdresa.value.length > 0) {
    prijedloziVisible.value = true;
  }
};

const sakrijPrijedloge = () => {
  setTimeout(() => {
    prijedloziVisible.value = false;
    selectedIndex.value = -1;
  }, 150);
};

const prikaziDetalje = (prihod) => {
  detalji.value = { ...prihod };
};

const oznaciKaoPlaceno = (index) => {
  const realIndex = prihodi.value.findIndex(p => 
    p.nazivEventa === sortiraniPrihodi.value[index].nazivEventa && 
    p.datumSnimanja === sortiraniPrihodi.value[index].datumSnimanja &&
    p.imeIPrezime === sortiraniPrihodi.value[index].imeIPrezime
  );
  
  if (realIndex !== -1) {
    prihodi.value[realIndex].placeno = true;
    spremiULocalStorage();
  }
};

const potvrdiZaBrisanje = (index) => {
  brisanjeIndeks.value = sortiraniPrihodi.value[index];
};

const obrisiPrihod = () => {
  if (brisanjeIndeks.value) {
    const realIndex = prihodi.value.findIndex(p => 
      p.nazivEventa === brisanjeIndeks.value.nazivEventa && 
      p.datumSnimanja === brisanjeIndeks.value.datumSnimanja &&
      p.imeIPrezime === brisanjeIndeks.value.imeIPrezime
    );
    
    if (realIndex !== -1) {
      prihodi.value.splice(realIndex, 1);
      spremiULocalStorage();
    }
    brisanjeIndeks.value = null;
  }
};

const dodajNoviPrihod = () => {
  prihodi.value.push({
    nazivEventa: noviPrihod.value.nazivEventa,
    imeIPrezime: noviPrihod.value.imeIPrezime,
    lokacija: noviPrihod.value.lokacija,
    datumSnimanja: noviPrihod.value.datumSnimanja,
    cijena: parseFloat(noviPrihod.value.cijena),
    putniTrosak: parseFloat(noviPrihod.value.putniTrosak) || 0,
    placeno: noviPrihod.value.placeno,
    opisSnimanja: noviPrihod.value.opisSnimanja
  });
  
  spremiULocalStorage();
  
  noviPrihod.value = {
    nazivEventa: '',
    imeIPrezime: '',
    lokacija: '',
    datumSnimanja: '',
    cijena: 0,
    putniTrosak: 0,
    placeno: false,
    opisSnimanja: ''
  };
  
  prijedloziAdresa.value = [];
  prijedloziVisible.value = false;
  selectedIndex.value = -1;
  prikaziFormu.value = false;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.prihodi {
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

.kartice {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.kartica {
  flex: 1;
  min-width: 250px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kartica:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.kartica.placeno {
  background-color: #123458;
  color: #F1EFEC;
}

.kartica.neplaceno {
  background-color: #D4C9BE;
  color: #123458;
}

.kartica.trosak {
  background-color: #5D8AA8;
  color: #F1EFEC;
}

.ikona {
  margin-right: 20px;
}

.ikona .material-icons {
  font-size: 36px;
}

.podaci h3 {
  margin: 0 0 8px 0;
  font-weight: 500;
  font-size: 16px;
}

.podaci .iznos {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.tablica-okvir {
  overflow-x: auto;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.tablica {
  width: 100%;
  border-collapse: collapse;
}

.tablica th {
  background-color: #123458;
  color: #F1EFEC;
  padding: 16px;
  text-align: left;
  font-weight: 500;
}

.tablica td {
  padding: 16px;
  border-bottom: 1px solid #D4C9BE;
}

.red {
  transition: background-color 0.3s ease;
}

.red:hover {
  background-color: rgba(212, 201, 190, 0.1);
  cursor: pointer;
}

.red:last-child td {
  border-bottom: none;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
}

.status .material-icons {
  font-size: 18px;
}

.placeno {
  color: #123458;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.neplaceno {
  color: #E53935;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gumb-plati {
  background-color: #123458;
  color: #F1EFEC;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.gumb-plati:hover {
  background-color: #1c4c80;
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

.gumb-brisi:hover {
  background-color: #C62828;
}

.dodaj-okvir {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.gumb-dodaj {
  background-color: #123458;
  color: #F1EFEC;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.gumb-dodaj:hover {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
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

.modal-detalji, .modal-forma, .modal-potvrda {
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
  justify-content: space-between;
  align-items: center;
}

.modal-zaglavlje h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.gumb-zatvori {
  background: transparent;
  color: #F1EFEC;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.gumb-zatvori:hover {
  transform: rotate(90deg);
}

.modal-sadrzaj {
  padding: 24px;
}

.podatak-red {
  margin-bottom: 18px;
}

.podatak-red:last-child {
  margin-bottom: 0;
}

.podatak-red label {
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
  color: #123458;
}

.podatak-red p {
  margin: 0;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
}

form {
  padding: 24px;
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
.forma-grupa input[type="number"], 
.forma-grupa input[type="date"],
.forma-grupa textarea {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
  background-color: white;
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.adresa-input {
  border: 2px solid #D4C9BE !important;
}

.adresa-input:focus {
  border-color: #123458 !important;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2) !important;
}

.forma-grupa input:focus, 
.forma-grupa textarea:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.forma-grupa textarea {
  height: 100px;
  resize: vertical;
}

.adresa-autocomplete {
  position: relative;
}

.adresa-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #D4C9BE;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #F1EFEC;
  transition: all 0.2s ease;
}

.dropdown-item:hover,
.dropdown-item.selected {
  background-color: rgba(18, 52, 88, 0.05);
  border-left: 3px solid #123458;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.adresa-naziv {
  font-weight: 600;
  color: #123458;
  font-size: 1rem;
}

.adresa-detalji {
  color: #5D8AA8;
  font-size: 0.85rem;
  line-height: 1.3;
}

.dropdown-loading {
  padding: 16px;
  text-align: center;
  color: #5D8AA8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.forma-grupa.checkbox {
  display: flex;
  align-items: center;
}

.prekidac {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.prekidac input {
  opacity: 0;
  width: 0;
  height: 0;
}

.klizac {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  background-color: #D4C9BE;
  border-radius: 34px;
  transition: .4s;
  margin-right: 10px;
  vertical-align: middle;
}

.klizac:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .klizac {
  background-color: #123458;
}

input:checked + .klizac:before {
  transform: translateX(24px);
}

.prekidac-tekst {
  vertical-align: middle;
}

.forma-gumbi, .potvrda-gumbi {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.gumb-odustani, .gumb-spremi, .gumb-potvrdi {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.gumb-odustani {
  background-color: #D4C9BE;
  color: #123458;
}

.gumb-odustani:hover {
  background-color: #c5b7a9;
}

.gumb-spremi, .gumb-potvrdi {
  background-color: #123458;
  color: #F1EFEC;
}

.gumb-spremi:hover, .gumb-potvrdi:hover {
  background-color: #1c4c80;
}

.gumb-potvrdi {
  background-color: #E53935;
}

.gumb-potvrdi:hover {
  background-color: #C62828;
}

.potvrda-sadrzaj {
  padding: 24px;
  text-align: center;
}

.potvrda-sadrzaj .upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
}

.potvrda-sadrzaj p {
  margin: 0 0 24px 0;
  font-size: 18px;
}

.potvrda-gumbi {
  padding: 0 24px 24px;
  justify-content: center;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.modal-forma {
  max-height: 90vh;
  overflow-y: auto;
}

.forma-gumbi {
  position: sticky;
  bottom: 0;
  background-color: #F1EFEC;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

@media (max-width: 1024px) {
  .prihodi {
    padding: 25px;
  }

  .kartice {
    flex-direction: column;
  }

  .kartica {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .prihodi {
    padding: 20px;
  }

  .naslov {
    font-size: 1.8rem;
    margin-bottom: 30px;
  }

  .kartice {
    gap: 15px;
    margin-bottom: 30px;
  }

  .kartica {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .ikona {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .podaci .iznos {
    font-size: 24px;
  }

  .tablica-okvir {
    margin-bottom: 20px;
  }

  .tablica th,
  .tablica td {
    padding: 12px 8px;
    font-size: 14px;
  }

  .gumb-plati {
    padding: 6px 12px;
    font-size: 12px;
  }

  .gumb-plati .material-icons {
    font-size: 16px;
  }

  .gumb-brisi {
    padding: 6px;
  }

  .gumb-brisi .material-icons {
    font-size: 18px;
  }

  .modal-detalji, .modal-forma, .modal-potvrda {
    width: 95%;
    margin: 10px;
  }

  .modal-zaglavlje {
    padding: 12px 16px;
  }

  .modal-zaglavlje h2 {
    font-size: 18px;
  }

  .modal-sadrzaj {
    padding: 20px;
  }

  form {
    padding: 20px;
  }

  .forma-grupa {
    margin-bottom: 16px;
  }

  .forma-grupa input,
  .forma-grupa textarea {
    padding: 10px;
    font-size: 16px;
  }

  .forma-gumbi {
    padding: 12px;
    flex-direction: column;
    gap: 10px;
  }

  .gumb-odustani,
  .gumb-spremi {
    width: 100%;
    padding: 12px;
  }

  .potvrda-sadrzaj {
    padding: 20px;
  }

  .potvrda-sadrzaj .upozorenje {
    font-size: 36px;
  }

  .potvrda-sadrzaj p {
    font-size: 16px;
  }

  .potvrda-gumbi {
    padding: 0 20px 20px;
    flex-direction: column;
    gap: 10px;
  }

  .gumb-potvrdi {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .prihodi {
    padding: 15px;
  }

  .naslov {
    font-size: 1.5rem;
    margin-bottom: 25px;
  }

  .kartice {
    gap: 12px;
    margin-bottom: 25px;
  }

  .kartica {
    padding: 16px;
  }

  .podaci h3 {
    font-size: 14px;
  }

  .podaci .iznos {
    font-size: 20px;
  }

  .ikona .material-icons {
    font-size: 28px;
  }

  .tablica th,
  .tablica td {
    padding: 8px 6px;
    font-size: 12px;
  }

  .gumb-plati {
    padding: 4px 8px;
    font-size: 11px;
  }

  .gumb-plati .material-icons {
    font-size: 14px;
  }

  .gumb-brisi {
    padding: 4px;
  }

  .gumb-brisi .material-icons {
    font-size: 16px;
  }

  .gumb-dodaj {
    padding: 10px 20px;
    font-size: 14px;
  }

  .modal-detalji, .modal-forma, .modal-potvrda {
    width: 98%;
    margin: 5px;
  }

  .modal-zaglavlje {
    padding: 10px 12px;
  }

  .modal-zaglavlje h2 {
    font-size: 16px;
  }

  .modal-sadrzaj {
    padding: 16px;
  }

  form {
    padding: 16px;
  }

  .forma-grupa {
    margin-bottom: 14px;
  }

  .forma-grupa label {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .forma-grupa input,
  .forma-grupa textarea {
    padding: 8px;
    font-size: 14px;
  }

  .forma-grupa textarea {
    height: 80px;
  }

  .adresa-dropdown {
    max-height: 200px;
  }

  .dropdown-item {
    padding: 10px 12px;
  }

  .adresa-naziv {
    font-size: 0.9rem;
  }

  .adresa-detalji {
    font-size: 0.8rem;
  }

  .dropdown-loading {
    padding: 12px;
  }

  .klizac {
    width: 40px;
    height: 22px;
  }

  .klizac:before {
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 4px;
  }

  input:checked + .klizac:before {
    transform: translateX(18px);
  }

  .forma-gumbi {
    padding: 10px;
  }

  .gumb-odustani,
  .gumb-spremi {
    padding: 10px;
    font-size: 14px;
  }

  .potvrda-sadrzaj {
    padding: 16px;
  }

  .potvrda-sadrzaj .upozorenje {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .potvrda-sadrzaj p {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .potvrda-gumbi {
    padding: 0 16px 16px;
  }

  .podatak-red {
    margin-bottom: 14px;
  }

  .podatak-red label {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .podatak-red p {
    padding: 6px 10px;
    font-size: 14px;
  }
} </style>