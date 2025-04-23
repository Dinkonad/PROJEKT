<template>
    <div class="prihodi-container">
      <h1 class="prihodi-title">Prikaz svih prihoda</h1>
      
      <div class="summary-container">
        <div class="summary-box paid">
          <div class="summary-icon">
            <span class="material-icons">check_circle</span>
          </div>
          <div class="summary-details">
            <h3>Ukupno plaćeno</h3>
            <p class="amount">{{ formatCurrency(ukupnoPlaceno) }}</p>
          </div>
        </div>
        
        <div class="summary-box unpaid">
          <div class="summary-icon">
            <span class="material-icons">pending</span>
          </div>
          <div class="summary-details">
            <h3>Ukupno neplaćeno</h3>
            <p class="amount">{{ formatCurrency(ukupnoNePlaceno) }}</p>
          </div>
        </div>
        
        <div class="summary-box expenses">
          <div class="summary-icon">
            <span class="material-icons">directions_car</span>
          </div>
          <div class="summary-details">
            <h3>Ukupno putni troškovi</h3>
            <p class="amount">{{ formatCurrency(ukupnoPutniTroskovi) }}</p>
          </div>
        </div>
      </div>
      <div class="table-container">
        <table class="prihodi-table">
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
            <tr v-for="(prihod, index) in sortiraniPrihodi" :key="index" @click="showDetails(prihod)" class="prihod-row">
              <td>{{ prihod.nazivEventa }}</td>
              <td>{{ prihod.imeIPrezime }}</td>
              <td>{{ formatDate(prihod.datumSnimanja) }}</td>
              <td>{{ formatCurrency(prihod.cijena) }}</td>
              <td>
                <div v-if="prihod.placeno" class="status placeno">
                  <span class="material-icons">check_circle</span> Plaćeno
                </div>
                <button v-else class="btn-oznaci" @click.stop="oznaciKaoPlaceno(index)">
                  <span class="material-icons">payments</span> Označi kao plaćeno
                </button>
              </td>
              <td>
                <button class="btn-obrisi" @click.stop="potvrdiZaBrisanje(index)">
                  <span class="material-icons">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="add-button-container">
        <button class="btn-dodaj" @click="showNoviPrihodForm = true">
          <span class="material-icons">add</span> Dodaj novi prihod
        </button>
      </div>
      <transition name="fade">
        <div class="overlay" v-if="prihodDetails" @click="prihodDetails = null">
          <div class="details-modal" @click.stop>
            <div class="modal-header">
              <h2>Detalji prihoda</h2>
              <button class="btn-close" @click="prihodDetails = null">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="details-content">
              <div class="detail-row">
                <label>Naziv eventa:</label>
                <p>{{ prihodDetails.nazivEventa }}</p>
              </div>
              <div class="detail-row">
                <label>Ime i prezime:</label>
                <p>{{ prihodDetails.imeIPrezime }}</p>
              </div>
              <div class="detail-row">
                <label>Lokacija:</label>
                <p>{{ prihodDetails.lokacija }}</p>
              </div>
              <div class="detail-row">
                <label>Datum snimanja:</label>
                <p>{{ formatDate(prihodDetails.datumSnimanja) }}</p>
              </div>
              <div class="detail-row">
                <label>Cijena:</label>
                <p>{{ formatCurrency(prihodDetails.cijena) }}</p>
              </div>
              <div class="detail-row">
                <label>Putni trošak:</label>
                <p>{{ formatCurrency(prihodDetails.putniTrosak || 0) }}</p>
              </div>
              <div class="detail-row">
                <label>Status:</label>
                <p :class="prihodDetails.placeno ? 'placeno' : 'neplaceno'">
                  <span class="material-icons">{{ prihodDetails.placeno ? 'check_circle' : 'pending' }}</span>
                  {{ prihodDetails.placeno ? 'Plaćeno' : 'Nije plaćeno' }}
                </p>
              </div>
              <div class="detail-row" v-if="prihodDetails.opisSnimanja">
                <label>Opis snimanja:</label>
                <p>{{ prihodDetails.opisSnimanja }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div class="overlay" v-if="showNoviPrihodForm" @click="showNoviPrihodForm = false">
          <div class="form-modal" @click.stop>
            <div class="modal-header">
              <h2>Novi prihod</h2>
              <button class="btn-close" @click="showNoviPrihodForm = false">
                <span class="material-icons">close</span>
              </button>
            </div>
            <form @submit.prevent="dodajNoviPrihod">
              <div class="form-group">
                <label for="nazivEventa">Naziv eventa:</label>
                <input type="text" id="nazivEventa" v-model="noviPrihod.nazivEventa" required placeholder="Npr. Vjenčanje, Rođendan, Konferencija...">
              </div>
              
              <div class="form-group">
                <label for="imeIPrezime">Ime i prezime:</label>
                <input type="text" id="imeIPrezime" v-model="noviPrihod.imeIPrezime" required placeholder="Ime i prezime klijenta">
              </div>
              
              <div class="form-group">
                <label for="lokacija">Lokacija:</label>
                <input type="text" id="lokacija" v-model="noviPrihod.lokacija" required placeholder="Mjesto održavanja eventa">
              </div>
              
              <div class="form-group">
                <label for="datumSnimanja">Datum snimanja:</label>
                <input type="date" id="datumSnimanja" v-model="noviPrihod.datumSnimanja" required>
              </div>
              
              <div class="form-group">
                <label for="cijena">Cijena (EUR):</label>
                <input type="number" id="cijena" v-model="noviPrihod.cijena" step="1.00" min="0" required>
              </div>
              
              <div class="form-group">
                <label for="putniTrosak">Putni trošak (EUR):</label>
                <input type="number" id="putniTrosak" v-model="noviPrihod.putniTrosak" step="1.00" min="0" placeholder="0.00">
              </div>
              
              <div class="form-group">
                <label for="opisSnimanja">Opis snimanja:</label>
                <textarea id="opisSnimanja" v-model="noviPrihod.opisSnimanja" placeholder="Detalji o snimanju, posebni zahtjevi..."></textarea>
              </div>
              
              <div class="form-group checkbox">
                <label class="toggle">
                  <input type="checkbox" id="placeno" v-model="noviPrihod.placeno">
                  <span class="slider"></span>
                  <span class="toggle-label">Plaćeno</span>
                </label>
              </div>
              
              <div class="form-buttons">
                <button type="button" class="btn-cancel" @click="showNoviPrihodForm = false">Odustani</button>
                <button type="submit" class="btn-save">Spremi</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div class="overlay" v-if="deleteIndex !== null" @click="deleteIndex = null">
          <div class="confirm-modal" @click.stop>
            <div class="modal-header">
              <h2>Potvrda brisanja</h2>
            </div>
            <div class="confirm-content">
              <span class="material-icons warning">warning</span>
              <p>Jeste li sigurni da želite obrisati ovaj prihod?</p>
            </div>
            <div class="confirm-buttons">
              <button class="btn-cancel" @click="deleteIndex = null">Odustani</button>
              <button class="btn-confirm" @click="obrisiPrihod">Potvrdi</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PrihodiView',
    data() {
      return {
        prihodi: JSON.parse(localStorage.getItem('prihodi')) || [
          { 
            nazivEventa: 'Vjenčanje Marko i Ana', 
            imeIPrezime: 'Marko Marković', 
            lokacija: 'Hotel Panorama, Zagreb', 
            datumSnimanja: '2025-06-15', 
            cijena: 800.0, 
            putniTrosak: 50.0,
            placeno: false, 
            opisSnimanja: 'Cjelodnevno snimanje vjenčanja od 10h do ponoći' 
          },
          { 
            nazivEventa: 'Korporativni event', 
            imeIPrezime: 'Ivana Horvat', 
            lokacija: 'Poslovni centar Delta, Split', 
            datumSnimanja: '2025-05-10', 
            cijena: 1200.0, 
            putniTrosak: 120.0,
            placeno: true, 
            opisSnimanja: 'Snimanje konferencije i team building aktivnosti' 
          }
        ],
        prihodDetails: null,
        showNoviPrihodForm: false,
        noviPrihod: {
          nazivEventa: '',
          imeIPrezime: '',
          lokacija: '',
          datumSnimanja: '',
          cijena: 0,
          putniTrosak: 0,
          placeno: false,
          opisSnimanja: ''
        },
        deleteIndex: null
      }
    },
    computed: {
      ukupnoPlaceno() {
        return this.prihodi
          .filter(prihod => prihod.placeno)
          .reduce((sum, prihod) => sum + parseFloat(prihod.cijena), 0)
      },
      ukupnoNePlaceno() {
        return this.prihodi
          .filter(prihod => !prihod.placeno)
          .reduce((sum, prihod) => sum + parseFloat(prihod.cijena), 0)
      },
      ukupnoPutniTroskovi() {
        return this.prihodi
          .reduce((sum, prihod) => sum + parseFloat(prihod.putniTrosak || 0), 0)
      },
      sortiraniPrihodi() {
        // Sortiranje prihoda po datumu (najnoviji na vrhu)
        return [...this.prihodi].sort((a, b) => {
          return new Date(b.datumSnimanja) - new Date(a.datumSnimanja);
        });
      }
    },
    created() {
      if (!localStorage.getItem('prihodi')) {
        this.saveToLocalStorage();
      }
    },
    methods: {
      saveToLocalStorage() {
        localStorage.setItem('prihodi', JSON.stringify(this.prihodi));
      },
      formatCurrency(value) {
        return `${parseFloat(value).toFixed(2)} EUR`
      },
      formatDate(dateString) {
        // Formatiranje datuma kao DD.MM.YYYY
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      },
      showDetails(prihod) {
        this.prihodDetails = { ...prihod }
      },
      oznaciKaoPlaceno(index) {
        // Trebamo naći pravi indeks u originalnom nizu prihodi
        const realIndex = this.prihodi.findIndex(p => 
          p.nazivEventa === this.sortiraniPrihodi[index].nazivEventa && 
          p.datumSnimanja === this.sortiraniPrihodi[index].datumSnimanja &&
          p.imeIPrezime === this.sortiraniPrihodi[index].imeIPrezime
        );
        
        if (realIndex !== -1) {
          this.prihodi[realIndex].placeno = true;
          this.saveToLocalStorage();
        }
      },
      potvrdiZaBrisanje(index) {
        // Trebamo spremiti referentni objekt za kasnije brisanje
        this.deleteIndex = this.sortiraniPrihodi[index];
      },
      obrisiPrihod() {
        if (this.deleteIndex) {
          const realIndex = this.prihodi.findIndex(p => 
            p.nazivEventa === this.deleteIndex.nazivEventa && 
            p.datumSnimanja === this.deleteIndex.datumSnimanja &&
            p.imeIPrezime === this.deleteIndex.imeIPrezime
          );
          
          if (realIndex !== -1) {
            this.prihodi.splice(realIndex, 1);
            this.saveToLocalStorage();
          }
          this.deleteIndex = null;
        }
      },
      dodajNoviPrihod() {
        this.prihodi.push({
          nazivEventa: this.noviPrihod.nazivEventa,
          imeIPrezime: this.noviPrihod.imeIPrezime,
          lokacija: this.noviPrihod.lokacija,
          datumSnimanja: this.noviPrihod.datumSnimanja,
          cijena: parseFloat(this.noviPrihod.cijena),
          putniTrosak: parseFloat(this.noviPrihod.putniTrosak) || 0,
          placeno: this.noviPrihod.placeno,
          opisSnimanja: this.noviPrihod.opisSnimanja
        });
        
        this.saveToLocalStorage();
        
        this.noviPrihod = {
          nazivEventa: '',
          imeIPrezime: '',
          lokacija: '',
          datumSnimanja: '',
          cijena: 0,
          putniTrosak: 0,
          placeno: false,
          opisSnimanja: ''
        }
        this.showNoviPrihodForm = false
      }
    }
  }
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
  
  .prihodi-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px;
    font-family: 'Roboto', sans-serif;
    color: #030303;
    background-color: #F1EFEC;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .prihodi-title {
    text-align: center;
    color: #123458;
    margin-bottom: 40px;
    font-weight: 700;
    position: relative;
  }
  
  .prihodi-title::after {
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
  
  .summary-container {
    display: flex;
    gap: 20px;
    margin-bottom: 40px;
    flex-wrap: wrap;
  }
  
  .summary-box {
    flex: 1;
    min-width: 250px;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .summary-box:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
  
  .summary-box.paid {
    background-color: #123458;
    color: #F1EFEC;
  }
  
  .summary-box.unpaid {
    background-color: #D4C9BE;
    color: #123458;
  }
  
  .summary-box.expenses {
    background-color: #5D8AA8;
    color: #F1EFEC;
  }
  
  .summary-icon {
    margin-right: 20px;
  }
  
  .summary-icon .material-icons {
    font-size: 36px;
  }
  
  .summary-details h3 {
    margin: 0 0 8px 0;
    font-weight: 500;
    font-size: 16px;
  }
  
  .summary-details .amount {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  
  .table-container {
    overflow-x: auto;
    margin-bottom: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    background-color: white;
  }
  
  .prihodi-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .prihodi-table th {
    background-color: #123458;
    color: #F1EFEC;
    padding: 16px;
    text-align: left;
    font-weight: 500;
  }
  
  .prihodi-table td {
    padding: 16px;
    border-bottom: 1px solid #D4C9BE;
  }
  
  .prihod-row {
    transition: background-color 0.3s ease;
  }
  
  .prihod-row:hover {
    background-color: rgba(212, 201, 190, 0.1);
    cursor: pointer;
  }
  
  .prihod-row:last-child td {
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
  
  .btn-oznaci {
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
  
  .btn-oznaci:hover {
    background-color: #1c4c80;
  }
  
  .btn-obrisi {
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
  
  .btn-obrisi:hover {
    background-color: #C62828;
  }
  
  .add-button-container {
    display: flex;
    justify-content: center;
    margin: 30px 0;
  }
  
  .btn-dodaj {
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
  
  .btn-dodaj:hover {
    background-color: #1c4c80;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }
  
  .overlay {
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
  
  .details-modal, .form-modal, .confirm-modal {
    background-color: #F1EFEC;
    border-radius: 12px;
    padding: 0;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  
  .modal-header {
    background-color: #123458;
    color: #F1EFEC;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }
  
  .btn-close {
    background: transparent;
    color: #F1EFEC;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  }
  
  .btn-close:hover {
    transform: rotate(90deg);
  }
  
  .details-content {
    padding: 24px;
  }
  
  .detail-row {
    margin-bottom: 18px;
  }
  
  .detail-row:last-child {
    margin-bottom: 0;
  }
  
  .detail-row label {
    font-weight: 500;
    display: block;
    margin-bottom: 6px;
    color: #123458;
  }
  
  .detail-row p {
    margin: 0;
    padding: 8px 12px;
    background-color: white;
    border-radius: 6px;
    border: 1px solid #D4C9BE;
  }
  
  form {
    padding: 24px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #123458;
  }
  
  .form-group input[type="text"], 
  .form-group input[type="number"], 
  .form-group input[type="date"],
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #D4C9BE;
    background-color: white;
    font-family: 'Roboto', sans-serif;
    font-size: 16px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  
  .form-group input:focus, 
  .form-group textarea:focus {
    outline: none;
    border-color: #123458;
    box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
  }
  
  .form-group textarea {
    height: 100px;
    resize: vertical;
  }
  
  .form-group.checkbox {
    display: flex;
    align-items: center;
  }
  
  .toggle {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }
  
  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
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
  
  .slider:before {
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
  
  input:checked + .slider {
    background-color: #123458;
  }
  
  input:checked + .slider:before {
    transform: translateX(24px);
  }
  
  .toggle-label {
    vertical-align: middle;
  }
  .form-buttons, .confirm-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
  
  .btn-cancel, .btn-save, .btn-confirm {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .btn-cancel {
    background-color: #D4C9BE;
    color: #123458;
  }
  
  .btn-cancel:hover {
    background-color: #c5b7a9;
  }
  
  .btn-save, .btn-confirm {
    background-color: #123458;
    color: #F1EFEC;
  }
  
  .btn-save:hover, .btn-confirm:hover {
    background-color: #1c4c80;
  }
  
  .btn-confirm {
    background-color: #E53935;
  }
  
  .btn-confirm:hover {
    background-color: #C62828;
  }
  
  .confirm-content {
    padding: 24px;
    text-align: center;
  }
  
  .confirm-content .warning {
    font-size: 48px;
    color: #E53935;
    margin-bottom: 16px;
  }
  
  .confirm-content p {
    margin: 0 0 24px 0;
    font-size: 18px;
  }
  
  .confirm-buttons {
    padding: 0 24px 24px;
    justify-content: center;
  }
  
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  
  @media (max-width: 768px) {
    .summary-container {
      flex-direction: column;
    }
    
    .prihodi-container {
      padding: 15px;
    }
    
    .form-modal {
      width: 95%;
    }
  }
  
  .form-modal {
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .form-buttons {
    position: sticky;
    bottom: 0;
    background-color: #F1EFEC;
    padding: 15px;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  }
  </style>