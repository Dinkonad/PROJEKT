<template>
    <div class="oprema">
      <h1 class="naslov">Evidencija opreme</h1>
      <div class="kartice-container">
        <div class="kartice-red">

            <div class="kartica sveukupno">
            <div class="ikona">
              <span class="material-icons">history</span>
            </div>
            <div class="podaci">
              <h3>Ukupno kupljeno ikada</h3>
              <p class="iznos">{{ formatCurrency(ukupnoKupljenoIkada) }}</p>
            </div>



          </div>
            <div class="kartica placeno">
            <div class="ikona">
              <span class="material-icons">photo_camera</span>
            </div>
            <div class="podaci">
              <h3>Vrijednost opreme trenutno</h3>
              <p class="iznos">{{ formatCurrency(ukupnaVrijednost) }}</p>
            </div>
          </div>



          <div class="kartica prodano">
            <div class="ikona">
              <span class="material-icons">sell</span>
            </div>
            <div class="podaci">
              <h3>Ukupno prodano</h3>
              <p class="iznos">{{ formatCurrency(ukupnoProdano) }}</p>
            </div>
          </div>
        </div>
        


        <div class="kartice-red">
          <div class="kartica neplaceno">
            <div class="ikona">
              <span class="material-icons">person</span>
            </div>
            <div class="podaci">
              <h3>Moja oprema</h3>
              <p class="iznos">{{ formatCurrency(mojaVrijednost) }}</p>
            </div>
          </div>

 <div class="kartica placeno pola">
            <div class="ikona">
              <span class="material-icons">handshake</span>
            </div>
            <div class="podaci">
              <h3>Zajednička oprema</h3>
              <p class="iznos">{{ formatCurrency(zajednickaVrijednost) }}</p>
            </div>
          </div>

          <div class="kartica trosak">
            <div class="ikona">
              <span class="material-icons">groups</span>
            </div>
            <div class="podaci">
              <h3>Obiteljska oprema</h3>
              <p class="iznos">{{ formatCurrency(obiteljskaVrijednost) }}</p>
            </div>
          </div>
          
         
          
        </div>
      </div>
      
      <div class="tablica-okvir">
        <table class="tablica">
          <thead>
            <tr>
              <th>Naziv opreme</th>
              <th>Cijena</th>
              <th>Plaćeno</th>
              <th>Datum kupnje</th>
              <th>Status</th>
              <th>Akcija</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(oprema, index) in sortiranaOprema" :key="index" 
                @click="prikaziDetalje(oprema)" 
                class="red" 
                :class="{ 'prodano-red': oprema.prodano }">
              <td>{{ oprema.naziv }}</td>
              <td>{{ formatCurrency(oprema.cijena) }}</td>
              <td>{{ vlasnistvo(oprema.tip) }}</td>
              <td>{{ formatDatum(oprema.datumKupnje) }}</td>
              <td>
                <div v-if="oprema.prodano" class="status prodano">
                  <span class="material-icons">sell</span> Prodano
                </div>
                <button v-else class="gumb-prodaj" @click.stop="prikaziProdajuFormu(index)">
                  <span class="material-icons">sell</span> Označi kao prodano
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
          <span class="material-icons">add</span> Dodaj novu opremu
        </button>
      </div>
      
      <Transition name="fade">
        <div class="pozadina" v-if="detalji" @click="detalji = null">
          <div class="modal-detalji" @click.stop>
            <div class="modal-zaglavlje">
              <h2>Detalji opreme</h2>
              <button class="gumb-zatvori" @click="detalji = null">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-sadrzaj">
              <div class="podatak-red">
                <label>Naziv opreme:</label>
                <p>{{ detalji.naziv }}</p>
              </div>
              <div class="podatak-red">
                <label>Cijena:</label>
                <p>{{ formatCurrency(detalji.cijena) }}</p>
              </div>
              <div class="podatak-red">
                <label>Plaćeno:</label>
                <p>{{ vlasnistvo(detalji.tip) }}</p>
              </div>
              <div class="podatak-red">
                <label>Datum kupnje:</label>
                <p>{{ formatDatum(detalji.datumKupnje) }}</p>
              </div>
              <div class="podatak-red">
                <label>Status:</label>
                <p :class="detalji.prodano ? 'prodano' : 'aktivno'">
                  <span class="material-icons">{{ detalji.prodano ? 'sell' : 'check_circle' }}</span>
                  {{ detalji.prodano ? 'Prodano' : 'Aktivno' }}
                </p>
              </div>
              <div class="podatak-red" v-if="detalji.prodano">
                <label>Prodajna cijena:</label>
                <p>{{ formatCurrency(detalji.prodajnaCijena) }}</p>
              </div>
              <div class="podatak-red" v-if="detalji.prodano">
                <label>Datum prodaje:</label>
                <p>{{ formatDatum(detalji.datumProdaje) }}</p>
              </div>
              <div class="podatak-red" v-if="detalji.opis">
                <label>Opis opreme:</label>
                <p>{{ detalji.opis }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      
      <Transition name="fade">
        <div class="pozadina" v-if="prikaziFormu" @click="prikaziFormu = false">
          <div class="modal-forma" @click.stop>
            <div class="modal-zaglavlje">
              <h2>Nova oprema</h2>
              <button class="gumb-zatvori" @click="prikaziFormu = false">
                <span class="material-icons">close</span>
              </button>
            </div>
            <form @submit.prevent="dodajNovuOpremu">
              <div class="forma-grupa">
                <label for="naziv">Naziv opreme:</label>
                <input type="text" id="naziv" v-model="novaOprema.naziv" required placeholder="Npr. Fotoaparat, Objektiv, Stativ...">
              </div>
              
              <div class="forma-grupa">
                <label for="cijena">Cijena (EUR):</label>
                <input type="number" id="cijena" v-model="novaOprema.cijena" step="1.00" min="0" required>
              </div>
              
              <div class="forma-grupa">
                <label for="tip">Plaćeno:</label>
                <select id="tip" v-model="novaOprema.tip" required>
                  <option value="ja">Osobno</option>
                  <option value="obitelj">Obiteljski</option>
                  <option value="pola">Pola-pola (brat)</option>
                </select>
              </div>
              
              <div class="forma-grupa">
                <label for="datumKupnje">Datum kupnje:</label>
                <input type="date" id="datumKupnje" v-model="novaOprema.datumKupnje" required>
              </div>
              
              <div class="forma-grupa">
                <label for="opis">Opis opreme:</label>
                <textarea id="opis" v-model="novaOprema.opis" placeholder="Specifikacije, serijski broj, bilješke..."></textarea>
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
        <div class="pozadina" v-if="prodajaIndex !== null" @click="prodajaIndex = null">
          <div class="modal-forma" @click.stop>
            <div class="modal-zaglavlje">
              <h2>Označite kao prodano</h2>
              <button class="gumb-zatvori" @click="prodajaIndex = null">
                <span class="material-icons">close</span>
              </button>
            </div>
            <form @submit.prevent="oznaciKaoProdano">
              <div class="forma-grupa">
                <label for="prodajnaCijena">Prodajna cijena (EUR):</label>
                <input type="number" id="prodajnaCijena" v-model="prodajaPodaci.prodajnaCijena" step="1.00" min="0" required>
              </div>
              
              <div class="forma-grupa">
                <label for="datumProdaje">Datum prodaje:</label>
                <input type="date" id="datumProdaje" v-model="prodajaPodaci.datumProdaje" required>
              </div>
              
              <div class="forma-gumbi">
                <button type="button" class="gumb-odustani" @click="prodajaIndex = null">Odustani</button>
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
              <p>Jeste li sigurni da želite obrisati ovu opremu?</p>
            </div>
            <div class="potvrda-gumbi">
              <button class="gumb-odustani" @click="brisanjeIndeks = null">Odustani</button>
              <button class="gumb-potvrdi" @click="obrisiOpremu">Potvrdi</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const oprema = ref(JSON.parse(localStorage.getItem('oprema')) || []);
  
  const detalji = ref(null);
  const prikaziFormu = ref(false);
  const brisanjeIndeks = ref(null);
  const prodajaIndex = ref(null);
  
  const novaOprema = ref({
    naziv: '',
    cijena: 0,
    tip: 'ja', 
    datumKupnje: '',
    prodano: false,
    opis: ''
  });
  
  const prodajaPodaci = ref({
    prodajnaCijena: 0,
    datumProdaje: new Date().toISOString().split('T')[0]
  });
  
  const ukupnaVrijednost = computed(() => {
    return oprema.value
      .filter(item => !item.prodano)
      .reduce((sum, item) => sum + parseFloat(item.cijena), 0);
  });
  
  const ukupnoKupljenoIkada = computed(() => {
    return oprema.value.reduce((sum, item) => sum + parseFloat(item.cijena), 0);
  });
  
  const mojaVrijednost = computed(() => {
    return oprema.value
      .filter(item => !item.prodano)
      .reduce((sum, item) => {
        if (item.tip === 'ja') {
          return sum + parseFloat(item.cijena);
        } else if (item.tip === 'pola') {
          return sum + parseFloat(item.cijena / 2);
        }
        return sum;
      }, 0);
  });
  
  const obiteljskaVrijednost = computed(() => {
    return oprema.value
      .filter(item => !item.prodano && item.tip === 'obitelj')
      .reduce((sum, item) => sum + parseFloat(item.cijena), 0);
  });
  
  const zajednickaVrijednost = computed(() => {
    return oprema.value
      .filter(item => !item.prodano && item.tip === 'pola')
      .reduce((sum, item) => sum + parseFloat(item.cijena / 2), 0); 
  });
  
  const ukupnoProdano = computed(() => {
    return oprema.value
      .filter(item => item.prodano)
      .reduce((sum, item) => sum + parseFloat(item.prodajnaCijena || 0), 0);
  });
  
  const sortiranaOprema = computed(() => {
    return [...oprema.value].sort((a, b) => {
      
      if (a.prodano !== b.prodano) {
        return a.prodano ? 1 : -1; 
      }

      return new Date(b.datumKupnje) - new Date(a.datumKupnje);
    });
  });
  
  onMounted(() => {
    if (!localStorage.getItem('oprema')) {
      spremiULocalStorage();
    }
  });
  
  const spremiULocalStorage = () => {
    localStorage.setItem('oprema', JSON.stringify(oprema.value));
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
  
  const vlasnistvo = (tip) => {
    switch (tip) {
      case 'ja': return 'Osobno';
      case 'obitelj': return 'Obiteljski';
      case 'pola': return 'Pola-pola (brat)';
      default: return 'Nepoznato';
    }
  };
  
  const prikaziDetalje = (item) => {
    detalji.value = { ...item };
  };
  
  const prikaziProdajuFormu = (index) => {
    prodajaIndex.value = sortiranaOprema.value[index];
    prodajaPodaci.value.prodajnaCijena = prodajaIndex.value.cijena; 
    prodajaPodaci.value.datumProdaje = new Date().toISOString().split('T')[0]; 
  };
  
  const oznaciKaoProdano = () => {
    if (prodajaIndex.value) {
      const realIndex = oprema.value.findIndex(item => 
        item.naziv === prodajaIndex.value.naziv && 
        item.datumKupnje === prodajaIndex.value.datumKupnje &&
        item.cijena === prodajaIndex.value.cijena
      );
      
      if (realIndex !== -1) {
        oprema.value[realIndex].prodano = true;
        oprema.value[realIndex].prodajnaCijena = parseFloat(prodajaPodaci.value.prodajnaCijena);
        oprema.value[realIndex].datumProdaje = prodajaPodaci.value.datumProdaje;
        spremiULocalStorage();
      }
      prodajaIndex.value = null;
    }
  };
  
  const potvrdiZaBrisanje = (index) => {
    brisanjeIndeks.value = sortiranaOprema.value[index];
  };
  
  const obrisiOpremu = () => {
    if (brisanjeIndeks.value) {
      const realIndex = oprema.value.findIndex(item => 
        item.naziv === brisanjeIndeks.value.naziv && 
        item.datumKupnje === brisanjeIndeks.value.datumKupnje &&
        item.cijena === brisanjeIndeks.value.cijena
      );
      
      if (realIndex !== -1) {
        oprema.value.splice(realIndex, 1);
        spremiULocalStorage();
      }
      brisanjeIndeks.value = null;
    }
  };
  
  const dodajNovuOpremu = () => {
    oprema.value.push({
      naziv: novaOprema.value.naziv,
      cijena: parseFloat(novaOprema.value.cijena),
      tip: novaOprema.value.tip,
      datumKupnje: novaOprema.value.datumKupnje,
      opis: novaOprema.value.opis,
      prodano: false
    });
    
    spremiULocalStorage();
    
    novaOprema.value = {
      naziv: '',
      cijena: 0,
      tip: 'ja',
      datumKupnje: '',
      opis: ''
    };
    
    prikaziFormu.value = false;
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
  
  .oprema {
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
  
  .kartice-container {
    margin-bottom: 30px;
  }
  
  .kartice-red {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    justify-content: space-between;
  }
  
  .kartica {
    flex: 1;
    min-width: 0; 
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
    background-color: #5D8AA8;
    color: #F1EFEC;
  }
  .kartica.placeno.pola {
    background-color: #5D8AA8;
    color: #F1EFEC;
  }

 
  .kartica.neplaceno {
    background-color: #D4C9BE;
    color: #123458;
  }
  
  .kartica.trosak {
    background-color: #123458;
    color: #F1EFEC;
  }
  
  .kartica.sveukupno {
    background-color: #123458; 
    color: #F1EFEC;
  }
  
  .kartica.prodano {
    background-color: #6B7280;
    color: #F1EFEC;
  }
  
  .ikona {
    margin-right: 20px;
    flex-shrink: 0;
  }
  
  .ikona .material-icons {
    font-size: 36px;
  }
  
  .podaci {
    min-width: 0; 
  }
  
  .podaci h3 {
    margin: 0 0 8px 0;
    font-weight: 500;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .podaci .iznos {
    margin: 0;
    font-size: 24px;
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
  
  .prodano-red {
    background-color: rgba(107, 114, 128, 0.1);
    color: #6B7280;
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
  
  .status.prodano {
    color: #6B7280;
    font-weight: 500;
  }
  
  .placeno {
    color: #123458;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .aktivno {
    color: #10B981;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .prodano {
    color: #6B7280;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .gumb-prodaj {
    background-color: #6B7280;
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
  
  .gumb-prodaj:hover {
    background-color: #4B5563;
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
  .forma-grupa textarea,
  .forma-grupa select {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #D4C9BE;
    background-color: white;
    font-family: 'Roboto', sans-serif;
  }
  
  .forma-grupa textarea {
    height: 100px;
    resize: vertical;
  }
  
  .forma-gumbi {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
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
  
  .gumb-spremi {
    background-color: #123458;
    color: #F1EFEC;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-weight: 500;
  }
  
  .gumb-spremi:hover {
    background-color: #1c4c80;
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

.potvrda-gumbi {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 24px 24px;
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

.gumb-potvrdi:hover {
  background-color: #C62828;
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>