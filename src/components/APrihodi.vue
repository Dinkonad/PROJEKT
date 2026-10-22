<template>
  <div class="prihodi">
    <h1 class="naslov">Prikaz svih prihoda</h1>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje prihoda...</p>
    </div>

    <!-- Tab navigacija -->
    <div v-if="!ucitava" class="tab-navigacija">
      <button
        :class="['tab-gumb', { aktivan: aktivniTab === 'prihodi' }]"
        @click="aktivniTab = 'prihodi'">
        <span class="material-icons">receipt_long</span> Svi prihodi
      </button>
      <button
        :class="['tab-gumb', { aktivan: aktivniTab === 'osobe' }]"
        @click="aktivniTab = 'osobe'">
        <span class="material-icons">people</span> Po osobama
      </button>
      <div class="akcije-desno">
        <router-link to="/admin/karte" class="gumb-karta">
          <span class="material-icons">map</span> Karta
        </router-link>
        <button class="gumb-pdf" @click="izvezuPDF" :disabled="prihodi.length === 0">
          <span class="material-icons">picture_as_pdf</span> Preuzmi PDF backup
        </button>
      </div>
    </div>

    <div v-if="!ucitava" class="kartice">
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

      <div class="kartica bratu">
        <div class="ikona">
          <span class="material-icons">volunteer_activism</span>
        </div>
        <div class="podaci">
          <h3>Dano bratu</h3>
          <p class="iznos">{{ formatCurrency(ukupnoDanoBratu) }}</p>
        </div>
      </div>

      <div class="kartica neto">
        <div class="ikona">
          <span class="material-icons">savings</span>
        </div>
        <div class="podaci">
          <h3>Moj neto prihod</h3>
          <p class="iznos">{{ formatCurrency(mojNetoPrihod) }}</p>
        </div>
      </div>
    </div>

    <!-- ==================== TAB: PO OSOBAMA ==================== -->
    <div v-if="aktivniTab === 'osobe' && !ucitava" class="osobe-okvir">
      <div v-if="prihodiPoOsobama.length === 0" class="nema-rezultata">
        <span class="material-icons">people_outline</span>
        <p>Nema podataka</p>
      </div>

      <div v-for="osoba in prihodiPoOsobama" :key="osoba.imeIPrezime" class="osoba-kartica">
        <div class="osoba-zaglavlje">
          <div class="osoba-ime">
            <span class="material-icons">person</span>
            <h3>{{ osoba.imeIPrezime }}</h3>
          </div>
          <div class="osoba-snimanja">{{ osoba.brojSnimanja }} {{ osoba.brojSnimanja === 1 ? 'snimanje' : 'snimanja' }}</div>
        </div>
        <div class="osoba-financije">
          <div class="fin-red">
            <span class="label">Ukupno zarađeno:</span>
            <span class="vrijednost total">{{ formatCurrency(osoba.ukupnoCijena) }}</span>
          </div>
          <div class="fin-red">
            <span class="label">Plaćeno:</span>
            <span class="vrijednost placeno-tekst">{{ formatCurrency(osoba.ukupnoPlaceno) }}</span>
          </div>
          <div class="fin-red" v-if="osoba.ukupnoNePlaceno > 0">
            <span class="label">Neplaćeno:</span>
            <span class="vrijednost neplaceno-tekst">{{ formatCurrency(osoba.ukupnoNePlaceno) }}</span>
          </div>
          <div class="fin-red" v-if="osoba.ukupnoPutniTroskovi > 0">
            <span class="label">Putni troškovi:</span>
            <span class="vrijednost trosak-tekst">{{ formatCurrency(osoba.ukupnoPutniTroskovi) }}</span>
          </div>
          <div class="fin-red" v-if="osoba.ukupnoDanoBratu > 0">
            <span class="label">Dano bratu:</span>
            <span class="vrijednost bratu-tekst">{{ formatCurrency(osoba.ukupnoDanoBratu) }}</span>
          </div>
        </div>
        <div class="osoba-eventi">
          <span v-for="(event, i) in osoba.eventi" :key="i" class="event-tag">{{ event }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== TAB: SVI PRIHODI ==================== -->
    <template v-if="aktivniTab === 'prihodi'">

      <!-- Filteri za sortiranje -->
      <div v-if="!ucitava" class="filteri-okvir">
        <div class="filter-grupa">
          <label for="godina-filter">Godina:</label>
          <select id="godina-filter" v-model="odabranaGodina" @change="resetirajMjesec">
            <option value="">Sve godine</option>
            <option v-for="godina in dostupneGodine" :key="godina" :value="godina">{{ godina }}</option>
          </select>
        </div>

        <div class="filter-grupa" v-if="odabranaGodina">
          <label for="mjesec-filter">Mjesec:</label>
          <select id="mjesec-filter" v-model="odabraniMjesec">
            <option value="">Svi mjeseci</option>
            <option v-for="(nazivMjeseca, mjesec) in dostupniMjeseci" :key="mjesec" :value="mjesec">{{ nazivMjeseca }}</option>
          </select>
        </div>

        <button class="gumb-reset" @click="resetirajFiltere" v-if="odabranaGodina || odabraniMjesec">
          <span class="material-icons">clear</span> Resetuj filtere
        </button>
      </div>

      <!-- Mjesečni pregled ako je odabrana godina -->
      <div v-if="!ucitava && odabranaGodina && !odabraniMjesec" class="mjesecni-pregled">
        <h2>Pregled po mjesecima - {{ odabranaGodina }}</h2>
        <div class="mjesecni-kartice">
          <div v-for="podaci in mjesecniPodaci" :key="podaci.mjesec"
     class="mjesecna-kartica"
     @click="odaberiMjesec(podaci.mjesec)">
  <div class="mjesec-zaglavlje">
    <h3>{{ podaci.naziv }}</h3>
              <span class="broj-prihoda">{{ podaci.brojPrihoda }} prihoda</span>
            </div>
            <div class="mjesec-podaci">
              <div class="podatak-red">
                <span class="label">Plaćeno:</span>
                <span class="vrijednost placeno">{{ formatCurrency(podaci.placeno) }}</span>
              </div>
              <div class="podatak-red">
                <span class="label">Neplaćeno:</span>
                <span class="vrijednost neplaceno">{{ formatCurrency(podaci.neplaceno) }}</span>
              </div>
              <div class="podatak-red">
                <span class="label">Put. troškovi:</span>
                <span class="vrijednost trosak">{{ formatCurrency(podaci.putniTroskovi) }}</span>
              </div>
              <div class="podatak-red" v-if="podaci.danoBratu > 0">
                <span class="label">Dano bratu:</span>
                <span class="vrijednost bratu">{{ formatCurrency(podaci.danoBratu) }}</span>
              </div>
              <div class="podatak-red ukupno">
                <span class="label">Ukupno:</span>
                <span class="vrijednost">{{ formatCurrency(podaci.ukupno) }}</span>
              </div>
              <div class="podatak-red neto">
                <span class="label">Moj neto:</span>
                <span class="vrijednost">{{ formatCurrency(podaci.neto) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!ucitava" class="dodaj-okvir">
        <button class="gumb-dodaj" @click="prikaziFormu = true" :disabled="sprema">
          <span class="material-icons">add</span> Dodaj novi prihod
        </button>
      </div>

      <div v-if="!ucitava" class="tablica-okvir">
        <div class="filter-info" v-if="odabranaGodina || odabraniMjesec">
          <span class="material-icons">filter_list</span>
          <span>Prikaz za:
            <strong v-if="odabranaGodina && odabraniMjesec">{{ nazviMjeseci[odabraniMjesec] }} {{ odabranaGodina }}</strong>
            <strong v-else-if="odabranaGodina">{{ odabranaGodina }}</strong>
          </span>
          <span class="rezultati-broj">({{ filtriraniPrihodi.length }} rezultata)</span>
        </div>

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
            <tr v-for="prihod in filtriraniPrihodi" :key="prihod.id" @click="prikaziDetalje(prihod)" class="red">
              <td>{{ prihod.nazivEventa }}</td>
              <td>
                <div class="celija-stog">
                  <span>{{ prihod.imeIPrezime }}</span>
                  <span class="oznaka-red" v-if="suradniciZaPrihod(prihod).length">
                    <span
                      v-for="s in suradniciZaPrihod(prihod)"
                      :key="s"
                      class="suradnik-oznaka"
                      :style="{ backgroundColor: bojaZaSuradnika(s) }"
                    >{{ s }}</span>
                  </span>
                </div>
              </td>
              <td>
                <div class="celija-stog">
                  <span>{{ formatDatumRaspon(prihod) }}</span>
                  <span v-if="brojDana(prihod) > 1" class="broj-dana-oznaka">{{ brojDana(prihod) }} dana</span>
                </div>
              </td>
              <td>{{ formatCurrency(prihod.cijena) }}</td>
              <td>
                <div v-if="prihod.placeno" class="status placeno">
                  <span class="material-icons">check_circle</span> Plaćeno
                </div>
                <button v-else class="gumb-plati" @click.stop="oznaciKaoPlaceno(prihod.id)" :disabled="sprema">
                  <span class="material-icons">payments</span> Označi kao plaćeno
                </button>
              </td>
             <td>
  <div class="akcija-gumbi">
    <button class="gumb-uredi" @click.stop="otvoriUredivanje(prihod)" :disabled="sprema">
      <span class="material-icons">edit</span>
    </button>
    <button class="gumb-brisi" @click.stop="potvrdiZaBrisanje(prihod)" :disabled="sprema">
      <span class="material-icons">delete</span>
    </button>
  </div>
</td>
            </tr>
            <tr v-if="filtriraniPrihodi.length === 0">
              <td colspan="6" class="nema-rezultata">
                <span class="material-icons">search_off</span>
                <p>Nema prihoda za odabrane kriterije</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>
    <!-- ==================== KRAJ TABA: SVI PRIHODI ==================== -->

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
            <div class="podatak-red" v-if="suradniciZaPrihod(detalji).length > 0">
              <label>S kime si radio:</label>
              <p class="oznaka-red">
                <span
                  v-for="s in suradniciZaPrihod(detalji)"
                  :key="s"
                  class="suradnik-oznaka"
                  :style="{ backgroundColor: bojaZaSuradnika(s) }"
                >{{ s }}</span>
              </p>
            </div>
            <div class="podatak-red">
              <label>Adresa lokacije:</label>
              <p>{{ detalji.lokacija }}</p>
            </div>
            <div class="podatak-red">
              <label>Datum snimanja:</label>
              <p>{{ formatDatumRaspon(detalji) }} <span v-if="brojDana(detalji) > 1">({{ brojDana(detalji) }} dana)</span></p>
            </div>
            <div class="podatak-red">
              <label>Cijena:</label>
              <p>{{ formatCurrency(detalji.cijena) }}</p>
            </div>
            <div class="podatak-red">
              <label>Putni trošak:</label>
              <p>{{ formatCurrency(detalji.putniTrosak || 0) }}</p>
            </div>
            <div class="podatak-red" v-if="detalji.danoBratu">
              <label>Dano bratu:</label>
              <p>{{ formatCurrency(detalji.danoBratu || 0) }}</p>
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
              <div class="adresa-autocomplete">
                <input
                  type="text"
                  id="imeIPrezime"
                  v-model="noviPrihod.imeIPrezime"
                  required
                  @focus="klijentDropdownOtvoren = true"
                  @input="klijentDropdownOtvoren = true"
                  @blur="sakrijKlijentDropdown"
                  class="adresa-input"
                  autocomplete="off"
                  placeholder="Odaberi postojećeg ili upiši novog klijenta..."
                >
                <div v-if="klijentDropdownOtvoren && filtriraniKlijenti.length > 0" class="adresa-dropdown">
                  <div
                    v-for="k in filtriraniKlijenti"
                    :key="k"
                    class="dropdown-item"
                    @mousedown="odaberiKlijenta(k)"
                  >
                    <div class="adresa-naziv">{{ k }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="forma-grupa">
              <label for="suradnik">S kime radiš (opcionalno, možeš dodati više):</label>
              <div class="adresa-autocomplete">
                <input
                  type="text"
                  id="suradnik"
                  v-model="noviSuradnikUnos"
                  @focus="suradnikDropdownOtvoren = true"
                  @input="suradnikDropdownOtvoren = true"
                  @keydown.enter.prevent="dodajSuradnika()"
                  @blur="sakrijSuradnikDropdown"
                  class="adresa-input"
                  autocomplete="off"
                  placeholder="Upiši ili odaberi ime, pa Enter za dodavanje..."
                >
                <div v-if="suradnikDropdownOtvoren && filtriraniSuradnici.length > 0" class="adresa-dropdown">
                  <div
                    v-for="s in filtriraniSuradnici"
                    :key="s"
                    class="dropdown-item suradnik-item"
                    @mousedown="dodajSuradnika(s)"
                  >
                    <span class="suradnik-tockica" :style="{ backgroundColor: bojaZaSuradnika(s) }"></span>
                    <div class="adresa-naziv">{{ s }}</div>
                  </div>
                </div>
              </div>
              <div class="suradnik-chipovi" v-if="noviPrihod.suradnici.length > 0">
                <span
                  v-for="(s, i) in noviPrihod.suradnici"
                  :key="s"
                  class="suradnik-chip"
                  :style="{ backgroundColor: bojaZaSuradnika(s) }"
                >
                  {{ s }}
                  <button type="button" class="suradnik-chip-x" @click="ukloniSuradnika(i)">×</button>
                </span>
              </div>
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
              <label for="datumSnimanja">Datum snimanja (početak):</label>
              <input type="date" id="datumSnimanja" v-model="noviPrihod.datumSnimanja" required>
            </div>

            <div class="forma-grupa checkbox">
              <label class="prekidac">
                <input type="checkbox" v-model="viseDanaNoviPrihod">
                <span class="klizac"></span>
                <span class="prekidac-tekst">Radio sam više dana</span>
              </label>
            </div>

            <div class="forma-grupa" v-if="viseDanaNoviPrihod">
              <label for="datumZavrsetak">Datum završetka:</label>
              <input type="date" id="datumZavrsetak" v-model="noviPrihod.datumZavrsetak" :min="noviPrihod.datumSnimanja" required>
            </div>

            <div class="forma-grupa">
              <label for="cijena">Cijena (EUR):</label>
              <input type="number" id="cijena" v-model="noviPrihod.cijena" step="1.00" min="0" required>
            </div>

            <div class="forma-grupa">
              <label for="putniTrosak">Putni trošak (EUR):</label>
              <input type="number" id="putniTrosak" v-model="noviPrihod.putniTrosak" step="1.00" min="0" placeholder="0.00">
            </div>

            <div class="forma-grupa checkbox">
              <label class="prekidac">
                <input type="checkbox" v-model="daoBratuNoviPrihod">
                <span class="klizac"></span>
                <span class="prekidac-tekst">Dao si nešto bratu s ovog posla</span>
              </label>
            </div>

            <div class="forma-grupa" v-if="daoBratuNoviPrihod">
              <label for="danoBratu">Koliko si dao bratu (EUR):</label>
              <input type="number" id="danoBratu" v-model="noviPrihod.danoBratu" step="1.00" min="0" placeholder="0.00">
              <small class="napomena">Ovaj iznos ide isključivo bratu - ne računa se nigdje kao tvoja zarada.</small>
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
              <button type="submit" class="gumb-spremi" :disabled="sprema">Spremi</button>
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
            <button class="gumb-potvrdi" @click="obrisiPrihod" :disabled="sprema">Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
  <div class="pozadina" v-if="uredivanjePrihod" @click="uredivanjePrihod = null">
    <div class="modal-forma" @click.stop>
      <div class="modal-zaglavlje">
        <h2>Uredi prihod</h2>
        <button class="gumb-zatvori" @click="uredivanjePrihod = null">
          <span class="material-icons">close</span>
        </button>
      </div>
      <form @submit.prevent="spremiUredivanje">
        <div class="forma-grupa">
          <label>Naziv eventa:</label>
          <input type="text" v-model="uredivanjePrihod.nazivEventa" required placeholder="Npr. Vjenčanje, Rođendan...">
        </div>
        <div class="forma-grupa">
          <label>Ime i prezime:</label>
          <div class="adresa-autocomplete">
            <input
              type="text"
              v-model="uredivanjePrihod.imeIPrezime"
              required
              @focus="klijentDropdownOtvorenUredi = true"
              @input="klijentDropdownOtvorenUredi = true"
              @blur="sakrijKlijentDropdownUredi"
              class="adresa-input"
              autocomplete="off"
              placeholder="Odaberi postojećeg ili upiši novog klijenta..."
            >
            <div v-if="klijentDropdownOtvorenUredi && filtriraniKlijentiUredi.length > 0" class="adresa-dropdown">
              <div
                v-for="k in filtriraniKlijentiUredi"
                :key="k"
                class="dropdown-item"
                @mousedown="odaberiKlijentaUredi(k)"
              >
                <div class="adresa-naziv">{{ k }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="forma-grupa">
          <label>S kime radiš (opcionalno, možeš dodati više):</label>
          <div class="adresa-autocomplete">
            <input
              type="text"
              v-model="uredivanjeSuradnikUnos"
              @focus="suradnikDropdownOtvorenUredi = true"
              @input="suradnikDropdownOtvorenUredi = true"
              @keydown.enter.prevent="dodajSuradnikaUredi()"
              @blur="sakrijSuradnikDropdownUredi"
              class="adresa-input"
              autocomplete="off"
              placeholder="Upiši ili odaberi ime, pa Enter za dodavanje..."
            >
            <div v-if="suradnikDropdownOtvorenUredi && filtriraniSuradniciUredi.length > 0" class="adresa-dropdown">
              <div
                v-for="s in filtriraniSuradniciUredi"
                :key="s"
                class="dropdown-item suradnik-item"
                @mousedown="dodajSuradnikaUredi(s)"
              >
                <span class="suradnik-tockica" :style="{ backgroundColor: bojaZaSuradnika(s) }"></span>
                <div class="adresa-naziv">{{ s }}</div>
              </div>
            </div>
          </div>
          <div class="suradnik-chipovi" v-if="uredivanjePrihod.suradnici && uredivanjePrihod.suradnici.length > 0">
            <span
              v-for="(s, i) in uredivanjePrihod.suradnici"
              :key="s"
              class="suradnik-chip"
              :style="{ backgroundColor: bojaZaSuradnika(s) }"
            >
              {{ s }}
              <button type="button" class="suradnik-chip-x" @click="ukloniSuradnikaUredi(i)">×</button>
            </span>
          </div>
        </div>
        <div class="forma-grupa">
          <label>Adresa lokacije:</label>
          <input type="text" v-model="uredivanjePrihod.lokacija" required>
        </div>
        <div class="forma-grupa">
          <label>Datum snimanja (početak):</label>
          <input type="date" v-model="uredivanjePrihod.datumSnimanja" required>
        </div>
        <div class="forma-grupa">
          <label>Datum završetka (ostavi prazno ako je jedan dan):</label>
          <input type="date" v-model="uredivanjePrihod.datumZavrsetak" :min="uredivanjePrihod.datumSnimanja">
        </div>
        <div class="forma-grupa">
          <label>Cijena (EUR):</label>
          <input type="number" v-model="uredivanjePrihod.cijena" step="1.00" min="0" required>
        </div>
        <div class="forma-grupa">
          <label>Putni trošak (EUR):</label>
          <input type="number" v-model="uredivanjePrihod.putniTrosak" step="1.00" min="0">
        </div>
        <div class="forma-grupa checkbox">
          <label class="prekidac">
            <input type="checkbox" v-model="daoBratuUredi">
            <span class="klizac"></span>
            <span class="prekidac-tekst">Dao si nešto bratu s ovog posla</span>
          </label>
        </div>
        <div class="forma-grupa" v-if="daoBratuUredi">
          <label>Koliko si dao bratu (EUR):</label>
          <input type="number" v-model="uredivanjePrihod.danoBratu" step="1.00" min="0">
          <small class="napomena">Ovaj iznos ide isključivo bratu - ne računa se nigdje kao tvoja zarada.</small>
        </div>
        <div class="forma-grupa">
          <label>Opis snimanja:</label>
          <textarea v-model="uredivanjePrihod.opisSnimanja" placeholder="Detalji o snimanju..."></textarea>
        </div>
        <div class="forma-grupa checkbox">
          <label class="prekidac">
            <input type="checkbox" v-model="uredivanjePrihod.placeno">
            <span class="klizac"></span>
            <span class="prekidac-tekst">Plaćeno</span>
          </label>
        </div>
        <div class="forma-gumbi">
          <button type="button" class="gumb-odustani" @click="uredivanjePrihod = null">Odustani</button>
          <button type="submit" class="gumb-spremi" :disabled="sprema">Spremi izmjene</button>
        </div>
      </form>
    </div>
  </div>
</Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { db } from '@/services/firebase.js';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

const prihodi = ref([]);
const detalji = ref(null);
const prikaziFormu = ref(false);
const brisanjeIndeks = ref(null);
const prijedloziAdresa = ref([]);
const prijedloziVisible = ref(false);
const pretragaUTijeku = ref(false);
const selectedIndex = ref(-1);
const pretragaTimeout = ref(null);
const ucitava = ref(true);
const sprema = ref(false);
const uredivanjePrihod = ref(null);

// Tab navigacija
const aktivniTab = ref('prihodi'); // 'prihodi' | 'osobe'

// Filtriranje
const odabranaGodina = ref('');
const odabraniMjesec = ref('');

const nazviMjeseci = {
  '01': 'Siječanj',
  '02': 'Veljača',
  '03': 'Ožujak',
  '04': 'Travanj',
  '05': 'Svibanj',
  '06': 'Lipanj',
  '07': 'Srpanj',
  '08': 'Kolovoz',
  '09': 'Rujan',
  '10': 'Listopad',
  '11': 'Studeni',
  '12': 'Prosinac'
};

const noviPrihod = ref({
  nazivEventa: '',
  imeIPrezime: '',
  suradnici: [],
  lokacija: '',
  datumSnimanja: '',
  datumZavrsetak: '',
  cijena: 0,
  putniTrosak: 0,
  danoBratu: 0,
  placeno: false,
  opisSnimanja: ''
});

const viseDanaNoviPrihod = ref(false);
const daoBratuNoviPrihod = ref(false);
const daoBratuUredi = ref(false);

// svaka osoba dobiva boju prema svom redoslijedu u abecednoj listi svih poznatih suradnika
// (ne po hashu imena) - to garantira da su boje razlicite dok god ima manje ljudi nego boja u paleti
const paletaBojaSuradnika = [
  '#5D8AA8', '#9C7A54', '#8E44AD', '#E67E22', '#16A085', '#3949AB', '#C2185B', '#6D4C41',
  '#00838F', '#AD1457', '#558B2F', '#4527A0', '#D84315', '#00695C', '#757575', '#1565C0'
];

const bojaZaSuradnika = (ime) => {
  if (!ime) return paletaBojaSuradnika[0];
  const indeks = postojeciSuradnici.value.indexOf(ime);
  if (indeks === -1) return paletaBojaSuradnika[0];
  return paletaBojaSuradnika[indeks % paletaBojaSuradnika.length];
};

// stariji prihodi imaju jednog suradnika kao string (suradnik), noviji kao niz (suradnici) - ujednacavamo
const suradniciZaPrihod = (prihod) => {
  if (Array.isArray(prihod?.suradnici) && prihod.suradnici.length) return prihod.suradnici;
  if (prihod?.suradnik?.trim()) return [prihod.suradnik.trim()];
  return [];
};

// broj radnih dana za prihod (ako ima datumZavrsetak, racuna raspon, inace 1 dan)
const brojDana = (prihod) => {
  if (!prihod?.datumZavrsetak || !prihod?.datumSnimanja) return 1;
  const pocetak = new Date(prihod.datumSnimanja);
  const kraj = new Date(prihod.datumZavrsetak);
  const dani = Math.round((kraj - pocetak) / (1000 * 60 * 60 * 24)) + 1;
  return dani > 0 ? dani : 1;
};

const formatDatumRaspon = (prihod) => {
  if (!prihod?.datumSnimanja) return '-';
  if (prihod.datumZavrsetak && prihod.datumZavrsetak !== prihod.datumSnimanja) {
    return `${formatDatum(prihod.datumSnimanja)} - ${formatDatum(prihod.datumZavrsetak)}`;
  }
  return formatDatum(prihod.datumSnimanja);
};

// ==================== COMPUTED ====================

const postojeciSuradnici = computed(() => {
  const skup = new Set();
  prihodi.value.forEach(p => {
    suradniciZaPrihod(p).forEach(ime => skup.add(ime));
  });
  return Array.from(skup).sort((a, b) => a.localeCompare(b, 'hr'));
});

const suradnikDropdownOtvoren = ref(false);
const suradnikDropdownOtvorenUredi = ref(false);
const noviSuradnikUnos = ref('');
const uredivanjeSuradnikUnos = ref('');

const filtriraniSuradnici = computed(() => {
  const upit = noviSuradnikUnos.value.trim().toLowerCase();
  return postojeciSuradnici.value.filter(s =>
    !noviPrihod.value.suradnici.includes(s) && (!upit || s.toLowerCase().includes(upit))
  );
});

const filtriraniSuradniciUredi = computed(() => {
  const upit = uredivanjeSuradnikUnos.value.trim().toLowerCase();
  const vecDodani = uredivanjePrihod.value?.suradnici || [];
  return postojeciSuradnici.value.filter(s =>
    !vecDodani.includes(s) && (!upit || s.toLowerCase().includes(upit))
  );
});

const dodajSuradnika = (ime) => {
  const cisto = (ime ?? noviSuradnikUnos.value).trim();
  if (!cisto || noviPrihod.value.suradnici.includes(cisto)) {
    noviSuradnikUnos.value = '';
    suradnikDropdownOtvoren.value = false;
    return;
  }
  noviPrihod.value.suradnici.push(cisto);
  noviSuradnikUnos.value = '';
  suradnikDropdownOtvoren.value = false;
};

const ukloniSuradnika = (indeks) => {
  noviPrihod.value.suradnici.splice(indeks, 1);
};

const sakrijSuradnikDropdown = () => {
  setTimeout(() => {
    suradnikDropdownOtvoren.value = false;
  }, 150);
};

const dodajSuradnikaUredi = (ime) => {
  const cisto = (ime ?? uredivanjeSuradnikUnos.value).trim();
  if (!cisto || uredivanjePrihod.value.suradnici.includes(cisto)) {
    uredivanjeSuradnikUnos.value = '';
    suradnikDropdownOtvorenUredi.value = false;
    return;
  }
  uredivanjePrihod.value.suradnici.push(cisto);
  uredivanjeSuradnikUnos.value = '';
  suradnikDropdownOtvorenUredi.value = false;
};

const ukloniSuradnikaUredi = (indeks) => {
  uredivanjePrihod.value.suradnici.splice(indeks, 1);
};

const sakrijSuradnikDropdownUredi = () => {
  setTimeout(() => {
    suradnikDropdownOtvorenUredi.value = false;
  }, 150);
};

// ==================== ODABIR KLIJENTA (ime i prezime) ====================
const postojeciKlijenti = computed(() => {
  const skup = new Set();
  prihodi.value.forEach(p => {
    if (p.imeIPrezime?.trim()) {
      skup.add(p.imeIPrezime.trim());
    }
  });
  return Array.from(skup).sort((a, b) => a.localeCompare(b, 'hr'));
});

const klijentDropdownOtvoren = ref(false);
const klijentDropdownOtvorenUredi = ref(false);

const filtriraniKlijenti = computed(() => {
  const upit = (noviPrihod.value.imeIPrezime || '').trim().toLowerCase();
  if (!upit) return postojeciKlijenti.value;
  return postojeciKlijenti.value.filter(k => k.toLowerCase().includes(upit));
});

const filtriraniKlijentiUredi = computed(() => {
  const upit = (uredivanjePrihod.value?.imeIPrezime || '').trim().toLowerCase();
  if (!upit) return postojeciKlijenti.value;
  return postojeciKlijenti.value.filter(k => k.toLowerCase().includes(upit));
});

const odaberiKlijenta = (ime) => {
  noviPrihod.value.imeIPrezime = ime;
  klijentDropdownOtvoren.value = false;
};

const sakrijKlijentDropdown = () => {
  setTimeout(() => {
    klijentDropdownOtvoren.value = false;
  }, 150);
};

const odaberiKlijentaUredi = (ime) => {
  uredivanjePrihod.value.imeIPrezime = ime;
  klijentDropdownOtvorenUredi.value = false;
};

const sakrijKlijentDropdownUredi = () => {
  setTimeout(() => {
    klijentDropdownOtvorenUredi.value = false;
  }, 150);
};

const filtriraniPrihodi = computed(() => {
  let filtrirani = [...prihodi.value];

  if (odabranaGodina.value) {
    filtrirani = filtrirani.filter(prihod => {
      const godina = new Date(prihod.datumSnimanja).getFullYear().toString();
      return godina === odabranaGodina.value;
    });
  }

  if (odabraniMjesec.value) {
    filtrirani = filtrirani.filter(prihod => {
      const mjesec = (new Date(prihod.datumSnimanja).getMonth() + 1).toString().padStart(2, '0');
      return mjesec === odabraniMjesec.value;
    });
  }

  return filtrirani.sort((a, b) => new Date(b.datumSnimanja) - new Date(a.datumSnimanja));
});

const dostupneGodine = computed(() => {
  const godine = new Set();
  prihodi.value.forEach(prihod => {
    const godina = new Date(prihod.datumSnimanja).getFullYear();
    godine.add(godina.toString());
  });
  return Array.from(godine).sort((a, b) => b - a);
});

const dostupniMjeseci = computed(() => {
  if (!odabranaGodina.value) return {};

  const mjeseci = new Set();
  prihodi.value.forEach(prihod => {
    const datum = new Date(prihod.datumSnimanja);
    const godina = datum.getFullYear().toString();
    const mjesec = (datum.getMonth() + 1).toString().padStart(2, '0');

    if (godina === odabranaGodina.value) {
      mjeseci.add(mjesec);
    }
  });

  const rezultat = {};
  Array.from(mjeseci).sort().forEach(mjesec => {
    rezultat[mjesec] = nazviMjeseci[mjesec];
  });

  return rezultat;
});

const mjesecniPodaci = computed(() => {
  if (!odabranaGodina.value) return [];

  const podaci = {};

  Object.keys(nazviMjeseci).forEach(mjesec => {
    podaci[mjesec] = {
      mjesec,
      naziv: nazviMjeseci[mjesec],
      placeno: 0,
      neplaceno: 0,
      putniTroskovi: 0,
      danoBratu: 0,
      ukupno: 0,
      neto: 0,
      brojPrihoda: 0
    };
  });

  prihodi.value.forEach(prihod => {
    const datum = new Date(prihod.datumSnimanja);
    const godina = datum.getFullYear().toString();
    const mjesec = (datum.getMonth() + 1).toString().padStart(2, '0');

    if (godina === odabranaGodina.value) {
      const cijena = parseFloat(prihod.cijena) || 0;
      const putniTrosak = parseFloat(prihod.putniTrosak) || 0;
      const danoBratu = parseFloat(prihod.danoBratu) || 0;

      podaci[mjesec].brojPrihoda++;
      podaci[mjesec].putniTroskovi += putniTrosak;
      podaci[mjesec].danoBratu += danoBratu;

      if (prihod.placeno) {
        podaci[mjesec].placeno += cijena;
      } else {
        podaci[mjesec].neplaceno += cijena;
      }

      podaci[mjesec].ukupno = podaci[mjesec].placeno + podaci[mjesec].neplaceno;
      podaci[mjesec].neto = podaci[mjesec].ukupno - podaci[mjesec].putniTroskovi - podaci[mjesec].danoBratu;
    }
  });

  return Object.values(podaci)
    .filter(p => p.brojPrihoda > 0)
    .sort((a, b) => a.mjesec.localeCompare(b.mjesec));
});

const ukupnoPlaceno = computed(() => {
  return filtriraniPrihodi.value
    .filter(prihod => prihod.placeno)
    .reduce((sum, prihod) => sum + parseFloat(prihod.cijena) - parseFloat(prihod.danoBratu || 0), 0);
});

const ukupnoNePlaceno = computed(() => {
  return filtriraniPrihodi.value
    .filter(prihod => !prihod.placeno)
    .reduce((sum, prihod) => sum + parseFloat(prihod.cijena) - parseFloat(prihod.danoBratu || 0), 0);
});

const ukupnoPutniTroskovi = computed(() => {
  return filtriraniPrihodi.value
    .reduce((sum, prihod) => sum + parseFloat(prihod.putniTrosak || 0), 0);
});

const ukupnoDanoBratu = computed(() => {
  return filtriraniPrihodi.value
    .reduce((sum, prihod) => sum + parseFloat(prihod.danoBratu || 0), 0);
});

const mojNetoPrihod = computed(() => {
  return filtriraniPrihodi.value
    .reduce((sum, prihod) => sum + parseFloat(prihod.cijena || 0) - parseFloat(prihod.putniTrosak || 0) - parseFloat(prihod.danoBratu || 0), 0);
});

// ==================== NOVO: PO OSOBAMA ====================
const prihodiPoOsobama = computed(() => {
  const mapa = {};

  prihodi.value.forEach(prihod => {
    const ime = prihod.imeIPrezime?.trim() || 'Nepoznato';

    if (!mapa[ime]) {
      mapa[ime] = {
        imeIPrezime: ime,
        ukupnoCijena: 0,
        ukupnoPlaceno: 0,
        ukupnoNePlaceno: 0,
        ukupnoPutniTroskovi: 0,
        ukupnoDanoBratu: 0,
        brojSnimanja: 0,
        eventi: []
      };
    }

    const cijena = parseFloat(prihod.cijena) || 0;
    const putniTrosak = parseFloat(prihod.putniTrosak) || 0;
    const danoBratu = parseFloat(prihod.danoBratu) || 0;

    mapa[ime].ukupnoCijena += cijena;
    mapa[ime].ukupnoPutniTroskovi += putniTrosak;
    mapa[ime].ukupnoDanoBratu += danoBratu;
    mapa[ime].brojSnimanja++;
    mapa[ime].eventi.push(prihod.nazivEventa);

    if (prihod.placeno) {
      mapa[ime].ukupnoPlaceno += cijena;
    } else {
      mapa[ime].ukupnoNePlaceno += cijena;
    }
  });

  // Sortiraj po ukupnoj cijeni (od najveće)
  return Object.values(mapa).sort((a, b) => b.ukupnoCijena - a.ukupnoCijena);
});

// ==================== FIRESTORE ====================

const ucitajPrihodeiFirestore = async () => {
  try {
    ucitava.value = true;
    const q = query(collection(db, 'prihodi'), orderBy('datumSnimanja', 'desc'));
    const querySnapshot = await getDocs(q);

    prihodi.value = [];
    querySnapshot.forEach((doc) => {
      prihodi.value.push({
        id: doc.id,
        ...doc.data()
      });
    });
  } catch (error) {
    console.error('Greška pri učitavanju prihoda:', error);
  } finally {
    ucitava.value = false;
  }
};

const dodajPrihodUFirestore = async (prihodData) => {
  try {
    sprema.value = true;
    const docRef = await addDoc(collection(db, 'prihodi'), prihodData);

    prihodi.value.push({
      id: docRef.id,
      ...prihodData
    });
  } catch (error) {
    console.error('Greška pri dodavanju prihoda:', error);
    throw error;
  } finally {
    sprema.value = false;
  }
};

const azurirajPrihodUFirestore = async (id, updateData) => {
  try {
    sprema.value = true;
    const prihodRef = doc(db, 'prihodi', id);
    await updateDoc(prihodRef, updateData);

    const index = prihodi.value.findIndex(p => p.id === id);
    if (index !== -1) {
      prihodi.value[index] = { ...prihodi.value[index], ...updateData };
    }
  } catch (error) {
    console.error('Greška pri ažuriranju prihoda:', error);
    throw error;
  } finally {
    sprema.value = false;
  }
};

const obrisiPrihodIzFirestore = async (id) => {
  try {
    sprema.value = true;
    await deleteDoc(doc(db, 'prihodi', id));

    const index = prihodi.value.findIndex(p => p.id === id);
    if (index !== -1) {
      prihodi.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Greška pri brisanju prihoda:', error);
    throw error;
  } finally {
    sprema.value = false;
  }
};

// ==================== FILTERI ====================

const resetirajMjesec = () => {
  odabraniMjesec.value = '';
};

const resetirajFiltere = () => {
  odabranaGodina.value = '';
  odabraniMjesec.value = '';
};

const odaberiMjesec = (mjesec) => {
  odabraniMjesec.value = mjesec;
};

onMounted(() => {
  ucitajPrihodeiFirestore();
});


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

// ==================== PDF BACKUP ====================
// jsPDF-ovi standardni fontovi ne podrzavaju hrvatske dijakritike (č,ć,đ,š,ž),
// zato ih transliteriramo prije ispisa u PDF kako se ne bi prikazali kao krive znakovke.
const bezDijakritika = (tekst) => {
  if (!tekst) return '';
  return String(tekst)
    .replace(/[čć]/g, 'c').replace(/[ČĆ]/g, 'C')
    .replace(/đ/g, 'dj').replace(/Đ/g, 'Dj')
    .replace(/š/g, 's').replace(/Š/g, 'S')
    .replace(/ž/g, 'z').replace(/Ž/g, 'Z');
};

const izvezuPDF = () => {
  if (prihodi.value.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const sviSortirano = [...prihodi.value].sort((a, b) => new Date(b.datumSnimanja) - new Date(a.datumSnimanja));

  const kolone = [
    { naziv: 'Event', x: 14 },
    { naziv: 'Ime i prezime', x: 70 },
    { naziv: 'Datum', x: 130 },
    { naziv: 'Cijena', x: 160 },
    { naziv: 'Putni tr.', x: 190 },
    { naziv: 'Dano bratu', x: 220 },
    { naziv: 'Status', x: 255 }
  ];
  const donjaGranica = 195;

  const ispisiZaglavljeTablice = (y) => {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    kolone.forEach(k => doc.text(k.naziv, k.x, y));
    doc.setFont(undefined, 'normal');
    doc.line(14, y + 2, 283, y + 2);
    return y + 8;
  };

  doc.setFontSize(16);
  doc.text('Backup svih prihoda', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generirano: ${new Date().toLocaleDateString('hr-HR')} ${new Date().toLocaleTimeString('hr-HR')}`, 14, 21);
  doc.text(`Ukupno stavki: ${sviSortirano.length}`, 14, 26);

  let y = ispisiZaglavljeTablice(34);

  sviSortirano.forEach(prihod => {
    if (y > donjaGranica) {
      doc.addPage();
      y = ispisiZaglavljeTablice(20);
    }

    doc.setFontSize(9);
    doc.text(bezDijakritika(prihod.nazivEventa || '-'), kolone[0].x, y, { maxWidth: 54 });
    doc.text(bezDijakritika(prihod.imeIPrezime || '-'), kolone[1].x, y, { maxWidth: 58 });
    doc.text(formatDatumRaspon(prihod), kolone[2].x, y, { maxWidth: 28 });
    doc.text(formatCurrency(prihod.cijena), kolone[3].x, y);
    doc.text(formatCurrency(prihod.putniTrosak || 0), kolone[4].x, y);
    doc.text(formatCurrency(prihod.danoBratu || 0), kolone[5].x, y);
    doc.text(prihod.placeno ? 'Placeno' : 'Nije placeno', kolone[6].x, y);
    y += 7;
  });

  y += 8;
  if (y > donjaGranica) {
    doc.addPage();
    y = 20;
  }

  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Sazetak', 14, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);

  const ukupnoPlacenoSve = sviSortirano.filter(p => p.placeno).reduce((s, p) => s + (parseFloat(p.cijena) || 0) - (parseFloat(p.danoBratu) || 0), 0);
  const ukupnoNeplacenoSve = sviSortirano.filter(p => !p.placeno).reduce((s, p) => s + (parseFloat(p.cijena) || 0) - (parseFloat(p.danoBratu) || 0), 0);
  const ukupnoPutniSve = sviSortirano.reduce((s, p) => s + (parseFloat(p.putniTrosak) || 0), 0);
  const ukupnoBratuSve = sviSortirano.reduce((s, p) => s + (parseFloat(p.danoBratu) || 0), 0);
  const netoSve = sviSortirano.reduce((s, p) => s + (parseFloat(p.cijena) || 0) - (parseFloat(p.putniTrosak) || 0) - (parseFloat(p.danoBratu) || 0), 0);

  doc.text(`Ukupno placeno: ${formatCurrency(ukupnoPlacenoSve)}`, 14, y); y += 6;
  doc.text(`Ukupno neplaceno: ${formatCurrency(ukupnoNeplacenoSve)}`, 14, y); y += 6;
  doc.text(`Ukupno putni troskovi: ${formatCurrency(ukupnoPutniSve)}`, 14, y); y += 6;
  doc.text(`Ukupno dano bratu: ${formatCurrency(ukupnoBratuSve)}`, 14, y); y += 6;
  doc.text(`Moj neto prihod: ${formatCurrency(netoSve)}`, 14, y);

  doc.save(`prihodi-backup-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ==================== ADRESA AUTOCOMPLETE ====================

const pretraziAdrese = async () => {
  const q = noviPrihod.value.lokacija.trim();
  selectedIndex.value = -1;

  if (q.length < 3) {
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=hr&limit=8`
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

// ==================== AKCIJE ====================

const prikaziDetalje = (prihod) => {
  detalji.value = { ...prihod };
};

const oznaciKaoPlaceno = async (id) => {
  try {
    await azurirajPrihodUFirestore(id, { placeno: true });
  } catch (error) {
    console.error('Greška pri označavanju kao plaćeno:', error);
  }
};

const potvrdiZaBrisanje = (prihod) => {
  brisanjeIndeks.value = prihod;
};

const obrisiPrihod = async () => {
  if (brisanjeIndeks.value) {
    try {
      await obrisiPrihodIzFirestore(brisanjeIndeks.value.id);
      brisanjeIndeks.value = null;
    } catch (error) {
      console.error('Greška pri brisanju prihoda:', error);
    }
  }
};

const dodajNoviPrihod = async () => {
  try {
    const prihodData = {
      nazivEventa: noviPrihod.value.nazivEventa,
      imeIPrezime: noviPrihod.value.imeIPrezime,
      suradnici: [...noviPrihod.value.suradnici],
      lokacija: noviPrihod.value.lokacija,
      datumSnimanja: noviPrihod.value.datumSnimanja,
      datumZavrsetak: viseDanaNoviPrihod.value ? noviPrihod.value.datumZavrsetak : '',
      cijena: parseFloat(noviPrihod.value.cijena),
      putniTrosak: parseFloat(noviPrihod.value.putniTrosak) || 0,
      danoBratu: daoBratuNoviPrihod.value ? (parseFloat(noviPrihod.value.danoBratu) || 0) : 0,
      placeno: noviPrihod.value.placeno,
      opisSnimanja: noviPrihod.value.opisSnimanja,
      created: new Date()
    };

    await dodajPrihodUFirestore(prihodData);

    noviPrihod.value = {
      nazivEventa: '',
      imeIPrezime: '',
      suradnici: [],
      lokacija: '',
      datumSnimanja: '',
      datumZavrsetak: '',
      cijena: 0,
      putniTrosak: 0,
      danoBratu: 0,
      placeno: false,
      opisSnimanja: ''
    };
    viseDanaNoviPrihod.value = false;
    daoBratuNoviPrihod.value = false;
    noviSuradnikUnos.value = '';

    prijedloziAdresa.value = [];
    prijedloziVisible.value = false;
    selectedIndex.value = -1;
    prikaziFormu.value = false;

  } catch (error) {
    console.error('Greška pri dodavanju novog prihoda:', error);
  }
};


const otvoriUredivanje = (prihod) => {
  uredivanjePrihod.value = { ...prihod, suradnici: suradniciZaPrihod(prihod) };
  uredivanjeSuradnikUnos.value = '';
  daoBratuUredi.value = (parseFloat(prihod.danoBratu) || 0) > 0;
};

const spremiUredivanje = async () => {
  try {
    const { id, ...podaci } = uredivanjePrihod.value;
    await azurirajPrihodUFirestore(id, {
      nazivEventa: podaci.nazivEventa,
      imeIPrezime: podaci.imeIPrezime,
      suradnici: [...podaci.suradnici],
      lokacija: podaci.lokacija,
      datumSnimanja: podaci.datumSnimanja,
      datumZavrsetak: podaci.datumZavrsetak || '',
      cijena: parseFloat(podaci.cijena),
      putniTrosak: parseFloat(podaci.putniTrosak) || 0,
      danoBratu: daoBratuUredi.value ? (parseFloat(podaci.danoBratu) || 0) : 0,
      placeno: podaci.placeno,
      opisSnimanja: podaci.opisSnimanja
    });
    uredivanjePrihod.value = null;
  } catch (error) {
    console.error('Greška pri uređivanju prihoda:', error);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.loading-container {
  text-align: center;
  padding: 50px;
  color: var(--text-heading);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.prihodi {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Roboto', sans-serif;
  color: var(--text-body);
  background-color: var(--bg-page);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.naslov {
  text-align: center;
  color: var(--text-heading);
  margin-bottom: 40px;
  font-weight: 700;
  position: relative;
}
.akcija-gumbi {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}
.naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background-color: var(--accent);
  border-radius: 2px;
}

/* ==================== TAB NAVIGACIJA ==================== */
.tab-navigacija {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0;
}

.tab-gumb {
  background: none;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  color: var(--text-muted);
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
}

.tab-gumb:hover {
  color: var(--text-heading);
}

.tab-gumb.aktivan {
  color: var(--text-heading);
  border-bottom-color: var(--accent);
}

.akcije-desno {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.gumb-karta {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 18px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.gumb-karta:hover {
  background-color: var(--border-color);
}

.gumb-pdf {
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  align-self: center;
}

.gumb-pdf:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.gumb-pdf:disabled {
  background-color: var(--gray-muted);
  cursor: not-allowed;
}

/* ==================== KARTICE (summary) ==================== */
.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.kartica {
  min-width: 0;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 18px;
  box-shadow: var(--glass-shadow);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: pojaviSe 0.35s ease both;
}

@keyframes pojaviSe {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.kartica:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.ikona {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-card-muted);
  color: var(--accent);
  flex-shrink: 0;
}

.ikona .material-icons {
  font-size: 22px;
}

.podaci {
  min-width: 0;
}

.podaci h3 {
  margin: 0 0 4px 0;
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.podaci .iznos {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-heading);
}

/* ==================== PO OSOBAMA ==================== */
.osobe-okvir {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.osoba-kartica {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.osoba-kartica:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.osoba-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--bg-card-muted);
}

.osoba-ime {
  display: flex;
  align-items: center;
  gap: 8px;
}

.osoba-ime .material-icons {
  color: var(--text-muted);
  font-size: 22px;
}

.osoba-ime h3 {
  margin: 0;
  color: var(--text-heading);
  font-size: 16px;
  font-weight: 600;
}

.osoba-snimanja {
  background: var(--accent-soft);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.osoba-financije {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.fin-red {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fin-red .label {
  color: var(--text-muted);
  font-size: 14px;
}

.fin-red .vrijednost {
  font-weight: 600;
  font-size: 14px;
}

.fin-red .total {
  color: var(--text-heading);
  font-size: 16px;
}

.fin-red .placeno-tekst { color: var(--success); }
.fin-red .neplaceno-tekst { color: var(--danger); }
.fin-red .trosak-tekst { color: var(--text-muted); }
.fin-red .bratu-tekst { color: #9C7A54; }

.osoba-eventi {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-tag {
  background: var(--bg-card-muted);
  color: var(--text-heading);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid var(--border-color);
}

/* ==================== FILTERI ==================== */
.filteri-okvir {
  display: flex;
  align-items: end;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.filter-grupa {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-grupa label {
  font-weight: 500;
  color: var(--text-heading);
  font-size: 14px;
}

.filter-grupa select {
  padding: 10px 15px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-card);
  color: var(--text-heading);
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-width: 150px;
}

.filter-grupa select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.gumb-reset {
  background-color: var(--accent-soft);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  height: fit-content;
}

.gumb-reset:hover {
  background-color: var(--accent-soft-hover);
}

/* ==================== MJESEČNI PREGLED ==================== */
.mjesecni-pregled {
  margin-bottom: 40px;
}

.mjesecni-pregled h2 {
  color: var(--text-heading);
  margin-bottom: 20px;
  font-weight: 600;
}

.mjesecni-kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.mjesecna-kartica {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.mjesecna-kartica:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: var(--accent);
}

.mjesec-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--bg-card-muted);
}

.mjesec-zaglavlje h3 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
}

.broj-prihoda {
  background-color: var(--accent-soft);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.mjesec-podaci {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.podatak-red {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.podatak-red.ukupno {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  font-weight: 600;
}

.podatak-red .label {
  color: var(--text-muted);
  font-size: 14px;
}

.podatak-red .vrijednost {
  font-weight: 600;
  color: var(--text-heading);
}

.podatak-red .vrijednost.placeno {
  color: var(--success);
}

.podatak-red .vrijednost.neplaceno {
  color: var(--danger);
}

.podatak-red .vrijednost.trosak {
  color: var(--text-muted);
}

.podatak-red .vrijednost.bratu {
  color: #9C7A54;
}

.podatak-red.neto .vrijednost {
  color: var(--success);
}

.napomena {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 400;
}

/* ==================== FILTER INFO ==================== */
.filter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(18, 52, 88, 0.05);
  border-left: 4px solid var(--accent);
  margin-bottom: 15px;
  border-radius: 0 6px 6px 0;
}

.filter-info .material-icons {
  color: var(--text-heading);
  font-size: 18px;
}

.filter-info span {
  color: var(--text-heading);
  font-size: 14px;
}

.rezultati-broj {
  color: var(--text-muted);
  font-style: italic;
}

/* ==================== TABLICA ==================== */
.tablica-okvir {
  overflow-x: auto;
  margin-bottom: 30px;
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
}

.tablica {
  width: 100%;
  border-collapse: collapse;
}

.tablica th {
  background-color: var(--accent);
  color: #F1EFEC;
  padding: 16px;
  text-align: left;
  font-weight: 500;
}

.tablica td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
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

.nema-rezultata {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.nema-rezultata .material-icons {
  font-size: 48px;
  margin-bottom: 10px;
  display: block;
}

.nema-rezultata p {
  margin: 0;
  font-style: italic;
}

.celija-stog {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.oznaka-red {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.broj-dana-oznaka {
  display: inline-block;
  background-color: var(--accent-soft);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.suradnik-oznaka {
  display: inline-block;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.suradnik-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.suradnik-tockica {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.suradnik-chipovi {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.suradnik-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: white;
  padding: 4px 6px 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.suradnik-chip-x {
  background: rgba(255, 255, 255, 0.25);
  border: none;
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.suradnik-chip-x:hover {
  background: rgba(255, 255, 255, 0.4);
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
  color: var(--text-heading);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.neplaceno {
  color: var(--danger);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gumb-plati {
  background-color: var(--accent);
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
  background-color: var(--accent-hover);
}

.gumb-uredi {
  background-color: var(--accent-soft);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
}

.gumb-uredi:hover {
  background-color: var(--accent-soft-hover);
}

.gumb-brisi {
  background-color: var(--danger);
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
  background-color: var(--danger-hover);
}

/* ==================== DODAJ GUMB ==================== */
.dodaj-okvir {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.gumb-dodaj {
  background-color: var(--accent);
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
  background-color: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

/* ==================== MODALI ==================== */
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
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 0;
  width: 500px;
  max-width: 90%;
  box-shadow: var(--glass-shadow);
  overflow: hidden;
}

.modal-zaglavlje {
  background-color: var(--accent);
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

.modal-sadrzaj .podatak-red {
  margin-bottom: 18px;
}

.modal-sadrzaj .podatak-red:last-child {
  margin-bottom: 0;
}

.modal-sadrzaj .podatak-red label {
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
  color: var(--text-heading);
}

.modal-sadrzaj .podatak-red p {
  margin: 0;
  padding: 8px 12px;
  background-color: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* ==================== FORMA ==================== */
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
  color: var(--text-heading);
}

.forma-grupa input[type="text"],
.forma-grupa input[type="number"],
.forma-grupa input[type="date"],
.forma-grupa textarea {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.adresa-input {
  border: 2px solid var(--border-color) !important;
}

.adresa-input:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2) !important;
}

.forma-grupa input:focus,
.forma-grupa textarea:focus {
  outline: none;
  border-color: var(--accent);
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
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
  border-bottom: 1px solid var(--bg-card-muted);
  transition: all 0.2s ease;
}

.dropdown-item:hover,
.dropdown-item.selected {
  background-color: rgba(18, 52, 88, 0.05);
  border-left: 3px solid var(--accent);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.adresa-naziv {
  font-weight: 600;
  color: var(--text-heading);
  font-size: 1rem;
}

.adresa-detalji {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.3;
}

.dropdown-loading {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
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
  background-color: var(--border-color);
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
  background-color: var(--accent);
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
  background-color: var(--border-color);
  color: var(--text-heading);
}

.gumb-odustani:hover {
  background-color: #c5b7a9;
}

.gumb-spremi, .gumb-potvrdi {
  background-color: var(--accent);
  color: #F1EFEC;
}

.gumb-spremi:hover, .gumb-potvrdi:hover {
  background-color: var(--accent-hover);
}

.gumb-potvrdi {
  background-color: var(--danger);
}

.gumb-potvrdi:hover {
  background-color: var(--danger-hover);
}

.potvrda-sadrzaj {
  padding: 24px;
  text-align: center;
}

.potvrda-sadrzaj .upozorenje {
  font-size: 48px;
  color: var(--danger);
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

/* ==================== TRANZICIJE ==================== */
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
  background-color: var(--bg-card);
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .prihodi {
    padding: 25px;
  }

  .mjesecni-kartice {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .osobe-okvir {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .prihodi {
    padding: 20px;
  }

  .tab-navigacija {
    gap: 5px;
    flex-wrap: wrap;
  }

  .tab-gumb {
    padding: 8px 14px;
    font-size: 13px;
  }

  .akcije-desno {
    margin-left: 0;
    width: 100%;
    margin-top: 8px;
    order: 3;
    flex-direction: column;
  }

  .gumb-karta,
  .gumb-pdf {
    width: 100%;
    justify-content: center;
  }

  .filteri-okvir {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .filter-grupa {
    width: 100%;
  }

  .filter-grupa select {
    min-width: auto;
    width: 100%;
  }

  .gumb-reset {
    align-self: center;
    width: fit-content;
  }

  .osobe-okvir {
    grid-template-columns: 1fr;
  }

  .mjesecni-kartice {
    grid-template-columns: 1fr;
  }

  .mjesecna-kartica {
    padding: 16px;
  }

  .mjesec-zaglavlje {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .naslov {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .kartice {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .kartica.neto {
    grid-column: 1 / -1;
  }

  .kartica {
    padding: 14px;
    gap: 10px;
  }

  .ikona {
    width: 36px;
    height: 36px;
  }

  .ikona .material-icons {
    font-size: 20px;
  }

  .podaci h3 {
    font-size: 0.72rem;
  }

  .podaci .iznos {
    font-size: 1.05rem;
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
    padding: 10px 14px;
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
}

@media (max-width: 480px) {
  .prihodi {
    padding: 15px;
  }

  .tab-gumb {
    padding: 8px 10px;
    font-size: 12px;
    gap: 4px;
  }

  .filter-grupa select {
    font-size: 14px;
    padding: 8px 12px;
  }

  .mjesecni-pregled h2 {
    font-size: 1.3rem;
  }

  .mjesecna-kartica {
    padding: 12px;
  }

  .mjesec-zaglavlje h3 {
    font-size: 1rem;
  }

  .broj-prihoda {
    font-size: 11px;
    padding: 3px 6px;
  }

  .podatak-red .label,
  .podatak-red .vrijednost {
    font-size: 13px;
  }

  .filter-info {
    padding: 10px 12px;
    font-size: 12px;
  }

  .nema-rezultata .material-icons {
    font-size: 36px;
  }

  .nema-rezultata p {
    font-size: 14px;
  }

  .osoba-kartica {
    padding: 14px;
  }

  .osoba-ime h3 {
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kartica { animation: none !important; transition: none !important; }
}
</style>