<template>
  <div class="auto stranica">
    <AZaglavljeStranice naslov="Auto" novac>
      <button class="gumb-dodaj" @click="otvoriModalUnos()">
          <span class="material-icons">add</span> Dodaj unos
        </button>
    </AZaglavljeStranice>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje...</p>
    </div>

    <template v-else>
      <div class="kartica-ukupno">
        <div class="ikona"><span class="material-icons">account_balance_wallet</span></div>
        <div class="podaci">
          <h3>Ukupno potrošeno na auto</h3>
          <p class="iznos">{{ formatCurrency(ukupnoPotroseno) }}</p>
        </div>
      </div>

      <div class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">speed</span></div>
          <div class="podaci">
            <h3>Zadnja kilometraža</h3>
            <p class="iznos">{{ zadnjaKilometraza !== null ? `${zadnjaKilometraza.toLocaleString('hr-HR')} km` : '-' }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">local_gas_station</span></div>
          <div class="podaci">
            <h3>Ukupno gorivo</h3>
            <p class="iznos">{{ formatCurrency(ukupnoGorivo) }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">build</span></div>
          <div class="podaci">
            <h3>Ukupno servisi</h3>
            <p class="iznos">{{ formatCurrency(ukupnoServisi) }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">assignment</span></div>
          <div class="podaci">
            <h3>Ukupno registracije</h3>
            <p class="iznos">{{ formatCurrency(ukupnoRegistracije) }}</p>
          </div>
        </div>
      </div>

      <div class="sekcija-km">
        <div class="sekcija-km-zaglavlje">
          <h2>Mjesečno stanje goriva</h2>
          <button class="gumb-primarni" @click="otvoriModalKm()">
            <span class="material-icons">add</span> Upiši stanje
          </button>
        </div>

        <template v-if="statistikaGoriva">
          <div class="kartice kartice-statistika">
            <div class="kartica">
              <div class="ikona"><span class="material-icons">local_gas_station</span></div>
              <div class="podaci">
                <h3>Prosječna potrošnja</h3>
                <p class="iznos">{{ statistikaGoriva.prosjecnoL100 !== null ? `${formatBroj(statistikaGoriva.prosjecnoL100, 1)} L/100km` : '-' }}</p>
              </div>
            </div>
            <div class="kartica">
              <div class="ikona"><span class="material-icons">payments</span></div>
              <div class="podaci">
                <h3>Trošak po kilometru</h3>
                <p class="iznos">{{ statistikaGoriva.trosakPoKm !== null ? prikaziNovac(`${formatBroj(statistikaGoriva.trosakPoKm, 3)} €/km`) : '-' }}</p>
              </div>
            </div>
            <div class="kartica">
              <div class="ikona"><span class="material-icons">calendar_month</span></div>
              <div class="podaci">
                <h3>Gorivo mjesečno (prosjek)</h3>
                <p class="iznos">{{ statistikaGoriva.prosjecniTrosak !== null ? formatCurrency(statistikaGoriva.prosjecniTrosak) : '-' }}</p>
              </div>
            </div>
            <div class="kartica">
              <div class="ikona"><span class="material-icons">route</span></div>
              <div class="podaci">
                <h3>Kilometara mjesečno (prosjek)</h3>
                <p class="iznos">{{ statistikaGoriva.prosjecniKm !== null ? `${formatBroj(statistikaGoriva.prosjecniKm, 0)} km` : '-' }}</p>
              </div>
            </div>
            <div class="kartica">
              <div class="ikona"><span class="material-icons">event</span></div>
              <div class="podaci">
                <h3>Zadnji mjesec</h3>
                <p class="iznos">{{ statistikaGoriva.zadnji.trosak !== null ? formatCurrency(statistikaGoriva.zadnji.trosak) : '-' }}</p>
                <span class="podnaslov">{{ formatLitre(statistikaGoriva.zadnji.litre) }} L · {{ formatMjesecPuni(statistikaGoriva.zadnji.mjesec) }}</span>
              </div>
            </div>
            <div class="kartica">
              <div class="ikona"><span class="material-icons">trending_up</span></div>
              <div class="podaci">
                <h3>Najskuplji mjesec</h3>
                <p class="iznos">{{ statistikaGoriva.najskuplji ? formatCurrency(statistikaGoriva.najskuplji.trosak) : '-' }}</p>
                <span v-if="statistikaGoriva.najskuplji" class="podnaslov">{{ formatMjesecPuni(statistikaGoriva.najskuplji.mjesec) }}</span>
              </div>
            </div>
          </div>
          <p class="napomena-statistika">Prosjeci se računaju iz mjeseci u kojima postoji razlika između dva unosa (prvi unos se ne računa). Trenutno: {{ statistikaGoriva.brojMjeseci }} mj.</p>
        </template>

        <div v-if="tockeGrafa.length === 0" class="prazno-km">
          <p v-if="ocitanjaKm.length === 0">Na kraju mjeseca upiši stanje brojača litara - razlika između dva mjeseca je potrošnja.</p>
          <p v-else>Graf kilometraže se prikazuje kad upišeš stanje.</p>
        </div>
        <div v-else-if="tockeGrafa.length === 1" class="prazno-km">
          <p>{{ tockeGrafa[0].naziv }}: <strong>{{ tockeGrafa[0].kilometraza.toLocaleString('hr-HR') }} km</strong>. Upiši još jedan mjesec da se prikaže graf.</p>
        </div>
        <div v-else class="linijski-graf">
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" class="graf-svg">
            <polyline :points="polilinijaTocke" class="graf-linija" />
            <circle v-for="t in tockeGrafa" :key="t.mjesec" :cx="t.x" :cy="t.y" r="4" class="graf-tocka" />
          </svg>
          <div class="graf-oznake">
            <div v-for="t in tockeGrafa" :key="t.mjesec" class="graf-oznaka">
              <span class="dan-iznos">{{ t.kilometraza.toLocaleString('hr-HR') }}</span>
              <span class="dan-naziv">{{ t.naziv }}</span>
            </div>
          </div>
        </div>

        <div v-if="ocitanjaKm.length" class="lista-ocitanja">
          <div v-for="o in [...ocitanjaKm].reverse()" :key="o.id" v-svajp class="redak-ocitanje">
            <div class="ocitanje-glavno">
              <span class="ocitanje-mjesec">{{ formatMjesecPuni(o.mjesec) }}</span>
              <span v-if="typeof o.kilometraza === 'number'" class="ocitanje-km">{{ o.kilometraza.toLocaleString('hr-HR') }} km</span>
              <div class="redak-akcije" data-svajp-akcije>
                <button aria-label="Uredi" class="gumb-akcija" title="Uredi" @click="otvoriModalKm(o)">
                  <span class="material-icons">edit</span>
                </button>
                <button aria-label="Obriši" class="gumb-akcija obrisi" title="Obriši" @click="ocitanjeZaBrisanje = o">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
            <div v-if="jeNovoOcitanje(o)" class="ocitanje-gorivo" :class="{ 'ocitanje-greska': izracunZa(o)?.neispravno }">
              <span class="material-icons">local_gas_station</span>
              <template v-if="izracunZa(o)?.neispravno">
                Brojač ({{ o.brojacLitara }} L) je manji od prethodnog ({{ izracunZa(o).prethodniBrojac }} L) - provjeri unos
              </template>
              <template v-else-if="izracunZa(o)">
                <strong>{{ formatLitre(izracunZa(o).potroseno) }} L</strong>
                <span v-if="izracunZa(o).prvi">(prvi unos: cijeli brojač)</span>
                <span v-else>({{ izracunZa(o).prethodniBrojac }} → {{ o.brojacLitara }})</span>
                <template v-if="izracunZa(o).trosak !== null">
                  × {{ prikaziNovac(`${o.cijenaPoLitri} €`) }} = <strong>{{ formatCurrency(izracunZa(o).trosak) }}</strong>
                </template>
                <span v-if="potrosnjaOcitanja(o) !== null" class="redak-potrosnja">{{ potrosnjaOcitanja(o).toFixed(1) }} L/100km</span>
              </template>
            </div>
            <div v-else-if="trosakGorivaOcitanja(o) !== null" class="ocitanje-gorivo">
              <span class="material-icons">local_gas_station</span>
              {{ formatCurrency(trosakGorivaOcitanja(o)) }} ({{ o.litreGoriva }} L × {{ prikaziNovac(`${o.cijenaPoLitri} €`) }})
              <span v-if="potrosnjaOcitanja(o) !== null" class="redak-potrosnja">{{ potrosnjaOcitanja(o).toFixed(1) }} L/100km</span>
            </div>
          </div>
        </div>
      </div>


      <div v-if="filtriraniUnosi.length === 0" class="prazno">
        <p>Nema unosa</p>
      </div>

      <div v-else class="lista-unosa">
        <div v-for="unos in filtriraniUnosi" :key="unos.id" v-svajp class="redak-unosa">
          <div class="redak-glavno">
            <span :class="['oznaka-tipa', `tip-${unos.tip}`]">{{ nazivTipa(unos.tip) }}</span>
            <span class="redak-datum">{{ formatDatum(unos.datum) }}</span>
            <span v-if="unos.iznos !== undefined" class="redak-iznos">{{ formatCurrency(unos.iznos) }}</span>
            <div class="redak-akcije" data-svajp-akcije>
              <button aria-label="Uredi" class="gumb-akcija" title="Uredi" @click="otvoriModalUnos(unos)">
                <span class="material-icons">edit</span>
              </button>
              <button aria-label="Obriši" class="gumb-akcija obrisi" title="Obriši" @click="unosZaBrisanje = unos">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>

          <div class="redak-detalji">
            <template v-if="unos.tip === 'kilometraza'">
              <span class="redak-info">
                {{ unos.pocetnaKilometraza?.toLocaleString('hr-HR') }} km
                <span v-if="unos.konacnaKilometraza"> → {{ unos.konacnaKilometraza.toLocaleString('hr-HR') }} km</span>
              </span>
              <span class="redak-info">
                {{ unos.pocetnaPotrosnja }} L
                <span v-if="unos.konacnaPotrosnja"> → {{ unos.konacnaPotrosnja }} L</span>
              </span>
              <span v-if="potrosnjaUnosa(unos) !== null" class="redak-potrosnja">{{ potrosnjaUnosa(unos).toFixed(1) }} L/100km</span>
            </template>
            <template v-else-if="unos.tip === 'servis'">
              <span v-if="unos.imeOsobe" class="redak-info"><span class="material-icons">person</span>{{ unos.imeOsobe }}</span>
              <span v-if="unos.lokacija" class="redak-info"><span class="material-icons">place</span>{{ unos.lokacija }}</span>
              <span v-if="unos.opis" class="redak-opis">{{ unos.opis }}</span>
            </template>
            <template v-else>
              <span v-if="unos.opis" class="redak-opis">{{ unos.opis }}</span>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== MODAL: DODAJ/UREDI UNOS ==================== -->
    <div v-if="prikaziModalUnos" class="prekrivka-modala" @click="zatvoriModalUnos">
      <div class="modal" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeUnos ? 'Uredi unos' : 'Dodaj unos' }}</h3>
          <button aria-label="Zatvori" class="gumb-zatvaranja" @click="zatvoriModalUnos">&times;</button>
        </div>
        <form class="forma" @submit.prevent="spremiUnos">
          <div class="grupa-polja">
            <label for="aauto-polje-1">Vrsta:</label>
            <select id="aauto-polje-1" v-model="forma.tip">
              <option value="registracija">Registracija</option>
              <option value="servis">Servis</option>
              <option value="kilometraza">Gorivo / potrošnja</option>
            </select>
          </div>
          <div class="grupa-polja">
            <label for="aauto-polje-2">Datum:</label>
            <input autocomplete="off" id="aauto-polje-2" v-model="forma.datum" type="date" required>
          </div>

          <template v-if="forma.tip === 'registracija'">
            <div class="grupa-polja">
              <label for="aauto-polje-3">Iznos (EUR):</label>
              <input autocomplete="off" id="aauto-polje-3" v-model.number="forma.iznos" type="number" step="0.01" min="0" required>
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-4">Opis (napomena):</label>
              <textarea id="aauto-polje-4" v-model="forma.opis" rows="3" placeholder="Npr. tehnički pregled, osiguranje..."></textarea>
            </div>
          </template>

          <template v-else-if="forma.tip === 'servis'">
            <div class="grupa-polja">
              <label for="aauto-polje-5">Iznos (EUR):</label>
              <input autocomplete="off" id="aauto-polje-5" v-model.number="forma.iznos" type="number" step="0.01" min="0" required>
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-6">Ime osobe / servisa:</label>
              <input autocomplete="off" id="aauto-polje-6" v-model="forma.imeOsobe" type="text" placeholder="Npr. Marko, Auto servis Horvat">
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-7">Lokacija:</label>
              <input autocomplete="off" id="aauto-polje-7" v-model="forma.lokacija" type="text" placeholder="Npr. Pula">
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-8">Opis (što se radilo):</label>
              <textarea id="aauto-polje-8" v-model="forma.opis" rows="3" placeholder="Npr. zamjena ulja i filtera, kočione pločice..."></textarea>
            </div>
          </template>

          <template v-else>
            <div class="grupa-polja grupa-vrijeme">
              <div>
                <label for="aauto-polje-9">Početna kilometraža:</label>
                <input autocomplete="off" id="aauto-polje-9" v-model.number="forma.pocetnaKilometraza" type="number" min="0" required>
              </div>
              <div>
                <label for="aauto-polje-10">Konačna kilometraža:</label>
                <input autocomplete="off" id="aauto-polje-10" v-model.number="forma.konacnaKilometraza" type="number" min="0" placeholder="Upiši kad stigneš">
              </div>
            </div>
            <div class="grupa-polja grupa-vrijeme">
              <div>
                <label for="aauto-polje-11">Početna potrošnja (L):</label>
                <input autocomplete="off" id="aauto-polje-11" v-model.number="forma.pocetnaPotrosnja" type="number" step="0.01" min="0" required placeholder="Npr. 80">
              </div>
              <div>
                <label for="aauto-polje-12">Konačna potrošnja (L):</label>
                <input autocomplete="off" id="aauto-polje-12" v-model.number="forma.konacnaPotrosnja" type="number" step="0.01" min="0" placeholder="Npr. 93">
              </div>
            </div>
            <div class="pregled-izracuna" v-if="pregledPotrosnje !== null">
              <span>{{ pregledPotrosnje.toFixed(1) }} L/100km</span>
            </div>
          </template>

          <div class="akcije-forme">
            <button type="button" class="gumb-odustati" @click="zatvoriModalUnos">Odustani</button>
            <button type="submit" class="gumb-spremiti">{{ uredujeUnos ? 'Spremi promjene' : 'Dodaj' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: POTVRDA BRISANJA ==================== -->
    <div v-if="unosZaBrisanje" class="prekrivka-modala" @click="unosZaBrisanje = null">
      <div class="modal-potvrda" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala"><h2>Potvrda brisanja</h2></div>
        <div class="sadrzaj-potvrde">
          <span class="material-icons upozorenje">warning</span>
          <p>Obrisati ovaj unos?</p>
        </div>
        <div class="gumbovi-potvrde">
          <button class="gumb-odustati" @click="unosZaBrisanje = null">Odustani</button>
          <button class="gumb-potvrditi" @click="potvrdiBrisanje">Potvrdi</button>
        </div>
      </div>
    </div>

    <!-- ==================== MODAL: DODAJ/UREDI MJESEČNU KILOMETRAŽU ==================== -->
    <div v-if="prikaziModalKm" class="prekrivka-modala" @click="zatvoriModalKm">
      <div class="modal" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeOcitanje ? 'Uredi stanje' : 'Upiši stanje goriva' }}</h3>
          <button aria-label="Zatvori" class="gumb-zatvaranja" @click="zatvoriModalKm">&times;</button>
        </div>
        <form class="forma" @submit.prevent="spremiOcitanje">
          <div class="grupa-polja">
            <label for="aauto-polje-13">Mjesec:</label>
            <input autocomplete="off" id="aauto-polje-13" v-model="formaKm.mjesec" type="month" required>
          </div>
          <template v-if="formaKm.nacin === 'novi'">
            <div class="grupa-polja">
              <label for="aauto-polje-14">Kilometraža (stanje na kraju mjeseca):</label>
              <input autocomplete="off" id="aauto-polje-14" v-model.number="formaKm.kilometraza" type="number" min="0" inputmode="numeric" placeholder="Npr. 120500" required>
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-15">Stanje brojača litara (zbirno, na kraju mjeseca):</label>
              <input autocomplete="off" id="aauto-polje-15" v-model.number="formaKm.brojacLitara" type="number" step="0.01" min="0" inputmode="decimal" placeholder="Npr. 475" required>
            </div>
            <div class="grupa-polja">
              <label for="aauto-polje-16">Cijena goriva (EUR/L):</label>
              <input autocomplete="off" id="aauto-polje-16" v-model.number="formaKm.cijenaPoLitri" type="number" step="0.001" min="0" inputmode="decimal" placeholder="Npr. 1.45" required>
            </div>
            <div v-if="pregledNovog" class="pregled-izracuna" :class="{ 'pregled-greska': pregledNovog.neispravno }">
              <span v-if="pregledNovog.neispravno">
                Brojač je manji od prethodnog ({{ pregledNovog.prethodniBrojac }} L) - provjeri unos
              </span>
              <span v-else-if="pregledNovog.prvi">
                Prvi unos: cijeli brojač {{ formaKm.brojacLitara }} L
                <template v-if="pregledNovog.trosak !== null"> × {{ prikaziNovac(`${formaKm.cijenaPoLitri} €`) }} = {{ formatCurrency(pregledNovog.trosak) }}</template>
              </span>
              <span v-else>
                Potrošnja mjeseca: {{ formaKm.brojacLitara }} − {{ pregledNovog.prethodniBrojac }} = {{ formatLitre(pregledNovog.potroseno) }} L
                <template v-if="pregledNovog.trosak !== null"> × {{ prikaziNovac(`${formaKm.cijenaPoLitri} €`) }} = {{ formatCurrency(pregledNovog.trosak) }}</template>
              </span>
              <span v-if="pregledLper100 !== null">
                Prijeđeno {{ formaKm.kilometraza - pregledNovog.prethodniKm }} km, potrošnja {{ pregledLper100.toFixed(1) }} L/100km
              </span>
            </div>
          </template>

          <!-- stari unosi (od prije novog načina) uređuju se kao i do sada -->
          <template v-else>
            <div class="grupa-polja">
              <label for="aauto-polje-17">Kilometraža (stanje na kraju mjeseca):</label>
              <input autocomplete="off" id="aauto-polje-17" v-model.number="formaKm.kilometraza" type="number" min="0" required>
            </div>
            <div class="grupa-polja grupa-vrijeme">
              <div>
                <label for="aauto-polje-18">Potrošeno goriva (L):</label>
                <input autocomplete="off" id="aauto-polje-18" v-model.number="formaKm.litreGoriva" type="number" step="0.01" min="0" placeholder="Npr. 85">
              </div>
              <div>
                <label for="aauto-polje-19">Cijena goriva (EUR/L):</label>
                <input autocomplete="off" id="aauto-polje-19" v-model.number="formaKm.cijenaPoLitri" type="number" step="0.001" min="0" placeholder="Npr. 1.45">
              </div>
            </div>
            <div class="pregled-izracuna" v-if="trosakGorivaForme !== null">
              <span>{{ formatCurrency(trosakGorivaForme) }} goriva ovaj mjesec</span>
            </div>
          </template>

          <div class="akcije-forme">
            <button type="button" class="gumb-odustati" @click="zatvoriModalKm">Odustani</button>
            <button type="submit" class="gumb-spremiti">{{ uredujeOcitanje ? 'Spremi promjene' : 'Dodaj' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: POTVRDA BRISANJA OČITANJA ==================== -->
    <div v-if="ocitanjeZaBrisanje" class="prekrivka-modala" @click="ocitanjeZaBrisanje = null">
      <div class="modal-potvrda" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala"><h2>Potvrda brisanja</h2></div>
        <div class="sadrzaj-potvrde">
          <span class="material-icons upozorenje">warning</span>
          <p>Obrisati ovo očitanje kilometraže?</p>
        </div>
        <div class="gumbovi-potvrde">
          <button class="gumb-odustati" @click="ocitanjeZaBrisanje = null">Odustani</button>
          <button class="gumb-potvrditi" @click="potvrdiBrisanjeOcitanja">Potvrdi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { postaviOsvjezavanje } from '@/store/osvjezavanje.js';
import { prikaziNovac } from '@/store/privatnost.js';
import AZaglavljeStranice from './AZaglavljeStranice.vue';
import { obavijesti } from '@/services/obavijest.js';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { db } from '@/services/firebase.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { jeNovoOcitanje, poredajOcitanja, izracunPotrosnje } from '@/utils/gorivo.js';

const ucitava = ref(true);
const unosi = ref([]);
const prikaziModalUnos = ref(false);
const uredujeUnos = ref(null);
const forma = ref(praznaForma());
const unosZaBrisanje = ref(null);

let unsub = null;

function praznaForma() {
  return {
    tip: 'registracija', datum: '', iznos: null, opis: '',
    imeOsobe: '', lokacija: '',
    pocetnaKilometraza: null, konacnaKilometraza: null,
    pocetnaPotrosnja: null, konacnaPotrosnja: null
  };
}

const nazivTipa = (tip) => ({ registracija: 'Registracija', servis: 'Servis', kilometraza: 'Gorivo' }[tip] || tip);
const formatCurrency = (v) => prikaziNovac(`${(parseFloat(v) || 0).toFixed(2)} EUR`);
const formatDatum = (datumString) => datumString ? new Date(datumString).toLocaleDateString('hr-HR') : '';

const filtriraniUnosi = computed(() => {
  const bazniUnosi = unosi.value.filter(u => u.tip !== 'ocitanje-km');
  return [...bazniUnosi].sort((a, b) => b.datum.localeCompare(a.datum));
});

const potrosnjaUnosa = (unos) => {
  const km = (unos.konacnaKilometraza || 0) - (unos.pocetnaKilometraza || 0);
  const litre = (unos.konacnaPotrosnja || 0) - (unos.pocetnaPotrosnja || 0);
  if (km <= 0 || litre <= 0) return null;
  return (litre / km) * 100;
};

const pregledPotrosnje = computed(() => {
  if (forma.value.tip !== 'kilometraza') return null;
  return potrosnjaUnosa(forma.value);
});

const ocitanjaKm = computed(() => poredajOcitanja(unosi.value.filter(u => u.tip === 'ocitanje-km')));

// potrošnja po mjesecima iz zbirnog brojača litara (razlika između uzastopnih unosa)
const izracunNovih = computed(() => izracunPotrosnje(ocitanjaKm.value));
const izracunZa = (ocitanje) => izracunNovih.value.get(ocitanje.id) || null;
const formatLitre = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('hr-HR', { maximumFractionDigits: 2 }));

const SVG_SIRINA = 600;
const SVG_VISINA = 160;
const SVG_PADDING = 16;

const tockeGrafa = computed(() => {
  const lista = ocitanjaKm.value.filter(o => typeof o.kilometraza === 'number').slice(-12);
  const n = lista.length;
  if (n === 0) return [];
  const vrijednosti = lista.map(o => o.kilometraza);
  const min = Math.min(...vrijednosti);
  const max = Math.max(...vrijednosti);
  const raspon = Math.max(max - min, 1);
  return lista.map((o, i) => {
    const x = n === 1 ? SVG_SIRINA / 2 : (i / (n - 1)) * SVG_SIRINA;
    const y = SVG_VISINA - SVG_PADDING - ((o.kilometraza - min) / raspon) * (SVG_VISINA - SVG_PADDING * 2);
    return { mjesec: o.mjesec, naziv: formatMjesecKratko(o.mjesec), kilometraza: o.kilometraza, x, y };
  });
});

const polilinijaTocke = computed(() => tockeGrafa.value.map(t => `${t.x},${t.y}`).join(' '));

const nazviMjeseciKratki = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];
const nazviMjeseciPuni = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];

const formatMjesecKratko = (mjesecString) => {
  const [godina, mjesec] = mjesecString.split('-');
  return `${nazviMjeseciKratki[parseInt(mjesec, 10) - 1]} ${godina.slice(2)}`;
};

const formatMjesecPuni = (mjesecString) => {
  const [godina, mjesec] = mjesecString.split('-');
  return `${nazviMjeseciPuni[parseInt(mjesec, 10) - 1]} ${godina}`;
};

const zadnjaKilometraza = computed(() => {
  const izGoriva = unosi.value
    .filter(u => u.tip === 'kilometraza')
    .flatMap(u => [u.pocetnaKilometraza, u.konacnaKilometraza])
    .filter(v => typeof v === 'number');
  const izOcitanja = ocitanjaKm.value.map(o => o.kilometraza).filter(v => typeof v === 'number');
  const sve = [...izGoriva, ...izOcitanja];
  return sve.length ? Math.max(...sve) : null;
});

const ukupnoServisi = computed(() => unosi.value.filter(u => u.tip === 'servis').reduce((s, u) => s + (parseFloat(u.iznos) || 0), 0));
const ukupnoRegistracije = computed(() => unosi.value.filter(u => u.tip === 'registracija').reduce((s, u) => s + (parseFloat(u.iznos) || 0), 0));

const trosakGorivaOcitanja = (ocitanje) => {
  if (!ocitanje) return null;
  if (jeNovoOcitanje(ocitanje)) return izracunZa(ocitanje)?.trosak ?? null;
  if (!ocitanje.litreGoriva || !ocitanje.cijenaPoLitri) return null;
  return ocitanje.litreGoriva * ocitanje.cijenaPoLitri;
};

const potrosnjaOcitanja = (ocitanje) => {
  if (!ocitanje) return null;

  if (jeNovoOcitanje(ocitanje)) {
    const izracun = izracunZa(ocitanje);
    if (!izracun || izracun.prvi || izracun.neispravno) return null;
    if (typeof ocitanje.kilometraza !== 'number' || izracun.prethodniKm === null) return null;
    const km = ocitanje.kilometraza - izracun.prethodniKm;
    return km > 0 ? (izracun.potroseno / km) * 100 : null;
  }

  if (!ocitanje.litreGoriva) return null;
  const lista = ocitanjaKm.value;
  const indeks = lista.findIndex(o => o.id === ocitanje.id);
  if (indeks <= 0) return null;
  const prijasnji = lista[indeks - 1];
  if (typeof ocitanje.kilometraza !== 'number' || typeof prijasnji.kilometraza !== 'number') return null;
  const km = ocitanje.kilometraza - prijasnji.kilometraza;
  if (km <= 0) return null;
  return (ocitanje.litreGoriva / km) * 100;
};

const ukupnoGorivo = computed(() =>
  ocitanjaKm.value.reduce((s, o) => s + (trosakGorivaOcitanja(o) || 0), 0)
);

const formatBroj = (v, decimale = 1) =>
  Number(v).toLocaleString('hr-HR', { minimumFractionDigits: decimale, maximumFractionDigits: decimale });

// po mjesecima: litre, prijeđeni km (ako su poznati) i trošak - samo za unose s razlikom prema prethodnom
const mjeseciPotrosnje = computed(() => {
  const lista = ocitanjaKm.value;
  return lista.map((o, i) => {
    let litre = null;
    let km = null;
    if (jeNovoOcitanje(o)) {
      const izracun = izracunZa(o);
      if (!izracun || izracun.prvi || izracun.neispravno) return null;
      litre = izracun.potroseno;
      if (typeof o.kilometraza === 'number' && izracun.prethodniKm !== null) km = o.kilometraza - izracun.prethodniKm;
    } else {
      litre = o.litreGoriva || null;
      const prije = lista[i - 1];
      if (prije && typeof o.kilometraza === 'number' && typeof prije.kilometraza === 'number') km = o.kilometraza - prije.kilometraza;
    }
    if (litre === null) return null;
    return { mjesec: o.mjesec, litre, km: km > 0 ? km : null, trosak: trosakGorivaOcitanja(o) };
  }).filter(Boolean);
});

const statistikaGoriva = computed(() => {
  const m = mjeseciPotrosnje.value;
  if (!m.length) return null;
  const zbroj = (arr, polje) => arr.reduce((s, x) => s + x[polje], 0);
  const sTroskom = m.filter(x => x.trosak !== null);
  const sKm = m.filter(x => x.km !== null);
  const sKmITroskom = sKm.filter(x => x.trosak !== null);
  const najskuplji = sTroskom.length ? sTroskom.reduce((a, b) => (b.trosak > a.trosak ? b : a)) : null;
  return {
    brojMjeseci: m.length,
    prosjecnoL100: sKm.length ? (zbroj(sKm, 'litre') / zbroj(sKm, 'km')) * 100 : null,
    trosakPoKm: sKmITroskom.length ? zbroj(sKmITroskom, 'trosak') / zbroj(sKmITroskom, 'km') : null,
    prosjecniTrosak: sTroskom.length ? zbroj(sTroskom, 'trosak') / sTroskom.length : null,
    prosjecniKm: sKm.length ? zbroj(sKm, 'km') / sKm.length : null,
    zadnji: m[m.length - 1],
    najskuplji
  };
});

const ukupnoPotroseno = computed(() => ukupnoGorivo.value + ukupnoServisi.value + ukupnoRegistracije.value);

onMounted(() => {
  unsub = onSnapshot(collection(db, 'auto'), (snapshot) => {
    unosi.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    ucitava.value = false;
  });
});

onBeforeUnmount(() => {
  if (unsub) unsub();
});

const otvoriModalUnos = (unos = null) => {
  uredujeUnos.value = unos;
  forma.value = unos ? { ...praznaForma(), ...unos } : praznaForma();
  prikaziModalUnos.value = true;
};

const zatvoriModalUnos = () => {
  prikaziModalUnos.value = false;
  uredujeUnos.value = null;
};

const spremiUnos = async () => {
  const podaci = { tip: forma.value.tip, datum: forma.value.datum };
  if (forma.value.tip === 'registracija') {
    podaci.iznos = forma.value.iznos || 0;
    podaci.opis = forma.value.opis || '';
  } else if (forma.value.tip === 'servis') {
    podaci.iznos = forma.value.iznos || 0;
    podaci.imeOsobe = forma.value.imeOsobe || '';
    podaci.lokacija = forma.value.lokacija || '';
    podaci.opis = forma.value.opis || '';
  } else {
    podaci.pocetnaKilometraza = forma.value.pocetnaKilometraza || 0;
    podaci.konacnaKilometraza = forma.value.konacnaKilometraza || null;
    podaci.pocetnaPotrosnja = forma.value.pocetnaPotrosnja || 0;
    podaci.konacnaPotrosnja = forma.value.konacnaPotrosnja || null;
  }

  try {
    if (uredujeUnos.value) {
      await updateDoc(doc(db, 'auto', uredujeUnos.value.id), podaci);
    } else {
      await addDoc(collection(db, 'auto'), podaci);
    }
    zatvoriModalUnos();
  } catch (error) {
    console.error('Greška pri spremanju unosa:', error);
    obavijesti('Greška pri spremanju unosa.');
  }
};

const potvrdiBrisanje = async () => {
  if (!unosZaBrisanje.value) return;
  try {
    await deleteDoc(doc(db, 'auto', unosZaBrisanje.value.id));
  } catch (error) {
    console.error('Greška pri brisanju unosa:', error);
  } finally {
    unosZaBrisanje.value = null;
  }
};

const prikaziModalKm = ref(false);
const uredujeOcitanje = ref(null);
const formaKm = ref({ nacin: 'novi', mjesec: '', brojacLitara: null, kilometraza: null, litreGoriva: null, cijenaPoLitri: null });
const ocitanjeZaBrisanje = ref(null);

const trosakGorivaForme = computed(() => {
  if (!formaKm.value.litreGoriva || !formaKm.value.cijenaPoLitri) return null;
  return formaKm.value.litreGoriva * formaKm.value.cijenaPoLitri;
});

// uživo pregled u formi: što će ovaj unos izračunati s obzirom na prethodni
const pregledNovog = computed(() => {
  const f = formaKm.value;
  if (f.nacin !== 'novi' || typeof f.brojacLitara !== 'number' || !f.mjesec) return null;
  const ostali = ocitanjaKm.value.filter(o => o.id !== uredujeOcitanje.value?.id);
  const probni = {
    id: '__forma__',
    tip: 'ocitanje-km',
    mjesec: f.mjesec,
    brojacLitara: f.brojacLitara,
    cijenaPoLitri: f.cijenaPoLitri,
    kilometraza: typeof f.kilometraza === 'number' ? f.kilometraza : null,
    kreirano: uredujeOcitanje.value?.kreirano ?? Number.MAX_SAFE_INTEGER
  };
  return izracunPotrosnje([...ostali, probni]).get('__forma__') || null;
});

const pregledLper100 = computed(() => {
  const p = pregledNovog.value;
  const km = formaKm.value.kilometraza;
  if (!p || p.prvi || p.neispravno || p.prethodniKm === null || typeof km !== 'number') return null;
  return km > p.prethodniKm ? (p.potroseno / (km - p.prethodniKm)) * 100 : null;
});

const trenutniMjesec = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const otvoriModalKm = (ocitanje = null) => {
  uredujeOcitanje.value = ocitanje;
  if (!ocitanje) {
    // zadnja upisana cijena je dobar prijedlog za sljedeći mjesec
    const zadnjeNovo = [...ocitanjaKm.value].reverse().find(jeNovoOcitanje);
    formaKm.value = {
      nacin: 'novi', mjesec: trenutniMjesec(), brojacLitara: null, kilometraza: null, litreGoriva: null,
      cijenaPoLitri: zadnjeNovo?.cijenaPoLitri ?? null
    };
  } else if (jeNovoOcitanje(ocitanje)) {
    formaKm.value = {
      nacin: 'novi', mjesec: ocitanje.mjesec, brojacLitara: ocitanje.brojacLitara,
      kilometraza: typeof ocitanje.kilometraza === 'number' ? ocitanje.kilometraza : null,
      litreGoriva: null, cijenaPoLitri: ocitanje.cijenaPoLitri ?? null
    };
  } else {
    formaKm.value = {
      nacin: 'stari', mjesec: ocitanje.mjesec, brojacLitara: null, kilometraza: ocitanje.kilometraza,
      litreGoriva: ocitanje.litreGoriva ?? null, cijenaPoLitri: ocitanje.cijenaPoLitri ?? null
    };
  }
  prikaziModalKm.value = true;
};

const zatvoriModalKm = () => {
  prikaziModalKm.value = false;
  uredujeOcitanje.value = null;
};

const spremiOcitanje = async () => {
  const f = formaKm.value;
  let podaci;

  if (f.nacin === 'novi') {
    if (pregledNovog.value?.neispravno) {
      obavijesti('Brojač litara je manji od prethodnog unosa - provjeri broj.');
      return;
    }
    podaci = {
      tip: 'ocitanje-km',
      mjesec: f.mjesec,
      brojacLitara: f.brojacLitara,
      cijenaPoLitri: f.cijenaPoLitri || null,
      kilometraza: f.kilometraza,
      datum: `${f.mjesec}-01`
    };
    if (!uredujeOcitanje.value) podaci.kreirano = Date.now();
  } else {
    podaci = {
      tip: 'ocitanje-km',
      mjesec: f.mjesec,
      kilometraza: f.kilometraza,
      litreGoriva: f.litreGoriva || null,
      cijenaPoLitri: f.cijenaPoLitri || null,
      datum: `${f.mjesec}-01`
    };
  }

  try {
    if (uredujeOcitanje.value) {
      await updateDoc(doc(db, 'auto', uredujeOcitanje.value.id), podaci);
    } else {
      await addDoc(collection(db, 'auto'), podaci);
    }
    zatvoriModalKm();
  } catch (error) {
    console.error('Greška pri spremanju očitanja:', error);
    obavijesti('Greška pri spremanju očitanja kilometraže.');
  }
};

const potvrdiBrisanjeOcitanja = async () => {
  if (!ocitanjeZaBrisanje.value) return;
  try {
    await deleteDoc(doc(db, 'auto', ocitanjeZaBrisanje.value.id));
  } catch (error) {
    console.error('Greška pri brisanju očitanja:', error);
  } finally {
    ocitanjeZaBrisanje.value = null;
  }
};

// povuci prema dolje za osvježavanje (mobitel)
// podaci ove stranice se već osvježavaju uživo - nema što dodatno povlačiti
const odjaviOsvjezavanje = postaviOsvjezavanje(async () => {});
onBeforeUnmount(odjaviOsvjezavanje);
</script>

<style scoped>
.auto {
  font-family: var(--font-sans);
}

.loading-container {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
  font-size: 28px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.kartica-ukupno {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  border-radius: var(--radius-card);
  box-shadow: 0 6px 18px rgba(18, 52, 88, 0.35);
  padding: 12px 22px;
  margin-bottom: 16px;
  color: var(--on-accent);
}

.kartica-ukupno .ikona {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.22);
  color: var(--on-accent);
  flex-shrink: 0;
}

.kartica-ukupno .ikona .material-icons {
  font-size: 20px;
}

.kartica-ukupno .podaci h3 {
  margin: 0 0 2px;
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kartica-ukupno .podaci .iznos {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--on-accent);
}

@keyframes pojaviSe {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.kartice-statistika {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: var(--space-2);
}

@media (max-width: 768px) {
  .kartice-statistika {
    grid-template-columns: repeat(2, 1fr);
  }
}

.napomena-statistika {
  margin: 0 0 18px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.kartica .podnaslov {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sekcija-km {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 20px;
  margin-bottom: 25px;
}

.sekcija-km-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.sekcija-km-zaglavlje h2 {
  margin: 0;
  color: var(--text-heading);
  font-size: 1.1rem;
  font-weight: 600;
}

.gumb-dodaj-km .material-icons {
  font-size: 18px;
}

.prazno-km {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
  padding: 16px 0;
}

.linijski-graf {
  padding-top: 10px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

.graf-svg {
  width: 100%;
  height: 140px;
  display: block;
}

.graf-linija {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.graf-tocka {
  fill: var(--accent);
}

.graf-oznake {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 6px;
}

.graf-oznaka {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dan-iznos {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-heading);
  white-space: nowrap;
}

.dan-naziv {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.lista-ocitanja {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}

.redak-ocitanje {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  padding: 10px 12px;
}

.ocitanje-glavno {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.ocitanje-mjesec {
  flex: 1;
  color: var(--text-heading);
  font-weight: 500;
  font-size: 0.85rem;
}

.ocitanje-km {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.ocitanje-gorivo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.ocitanje-gorivo .material-icons {
  font-size: 15px;
  color: var(--accent);
}

.prazno {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.lista-unosa {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.redak-unosa {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  padding: 14px 16px;
}

.redak-glavno {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin-bottom: 8px;
}

.oznaka-tipa {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  color: white;
  flex-shrink: 0;
}

.tip-registracija { background-color: var(--accent); }
.tip-servis { background-color: var(--danger); }
.tip-kilometraza { background-color: var(--success); }

.redak-datum {
  color: var(--text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.redak-iznos {
  color: var(--success);
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
}

.redak-detalji {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.redak-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.redak-info .material-icons {
  font-size: 15px;
}

.redak-opis {
  color: var(--text-muted);
  font-size: 0.85rem;
  flex-basis: 100%;
}

.redak-potrosnja {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 20px;
}

.redak-akcije {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;
}

.gumb-akcija {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  display: flex;
}

.gumb-akcija .material-icons {
  font-size: 18px;
}

.gumb-akcija:hover {
  background-color: var(--bg-card-muted);
  color: var(--accent);
}

.gumb-akcija.obrisi:hover {
  color: var(--danger);
}

/* ==================== MODALI ==================== */
.prekrivka-modala {
  position: fixed;
  inset: 0;
  background: rgba(3, 3, 3, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background-color: var(--bg-card);
  border: none;
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
  width: 100%;
  max-width: 440px;
  max-height: 100%;
  overflow-y: auto;
}

.zaglavlje-modala {
  background: var(--accent);
  color: var(--on-accent);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zaglavlje-modala h3, .zaglavlje-modala h2 {
  margin: 0;
  font-size: 18px;
}

.gumb-zatvaranja {
  background: transparent;
  color: white;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

.forma {
  padding: 20px;
}

.grupa-polja {
  margin-bottom: 16px;
}

.grupa-polja label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-heading);
  font-size: 14px;
}

.grupa-polja input,
.grupa-polja select,
.grupa-polja textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--font-sans);
  background: var(--bg-page);
  color: var(--text-body);
  resize: vertical;
}

.grupa-vrijeme {
  display: flex;
  gap: 12px;
}

.grupa-vrijeme > div {
  flex: 1;
  min-width: 0;
}

.pregled-izracuna.pregled-greska {
  background: rgba(229, 57, 53, 0.12);
  color: var(--danger);
}

.ocitanje-greska {
  color: var(--danger);
}

.ocitanje-greska .material-icons {
  color: var(--danger);
}

.pregled-izracuna {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
  background: var(--bg-card-muted);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-weight: 700;
  color: var(--text-heading);
}

.akcije-forme {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.gumb-odustati, .gumb-spremiti, .gumb-potvrditi {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.gumb-odustati {
  background: var(--bg-card-muted);
  color: var(--text-heading);
}

.gumb-spremiti {
  background: var(--accent);
  color: var(--on-accent);
}

.modal-potvrda {
  background-color: var(--bg-card);
  border: none;
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
  width: 90%;
  max-width: 420px;
  overflow: hidden;
}

.sadrzaj-potvrde {
  padding: 24px;
  text-align: center;
}

.sadrzaj-potvrde .upozorenje {
  font-size: 44px;
  color: var(--danger);
  margin-bottom: 10px;
  display: block;
}

.sadrzaj-potvrde p {
  color: var(--text-body);
}

.gumbovi-potvrde {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 24px 24px;
}

.gumb-potvrditi {
  background: var(--danger);
  color: white;
}

@media (max-width: 900px) {
}

@media (max-width: 768px) {
  .redak-glavno {
    gap: 6px;
  }

  .sekcija-km {
    padding: 16px;
  }

  .sekcija-km-zaglavlje {
    flex-direction: column;
    align-items: stretch;
  }

  .dan-stupac {
    min-width: 24px;
  }

  .grupa-vrijeme {
    flex-direction: column;
    gap: 16px;
  }

  /* iOS Safari automatski zumira stranicu kad se fokusira polje s fontom < 16px */
  .grupa-polja input,
  .grupa-polja select,
  .grupa-polja textarea {
    font-size: 16px;
    min-height: 44px;
  }

  .modal {
    max-height: 100%;
  }

  /* prsti: gumbi za uredi/obriši bili su samo 26x26 px */
  .gumb-akcija {
    padding: 0;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
  }

  .gumb-akcija .material-icons {
    font-size: 22px;
  }

  .gumb-dodaj-km,
  .gumb-dodaj,
  .gumb-odustati,
  .gumb-spremiti,
  .gumb-potvrditi {
    min-height: 44px;
  }

  /* 12 mjeseci oznaka ne stane u širinu: pokaži iznose samo u listi ispod, a mjesec svaki treći */
  .graf-oznaka .dan-iznos {
    display: none;
  }

  .graf-oznaka .dan-naziv {
    font-size: 0.7rem;
    white-space: nowrap;
  }

  .graf-oznaka:not(:nth-child(3n + 1)) .dan-naziv {
    visibility: hidden;
  }
}

@media (max-width: 480px) {
  .redak-info, .redak-opis {
    font-size: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
}
</style>
