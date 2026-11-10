<template>
  <div class="biznisbaza stranica">
    <AZaglavljeStranice naslov="BiznisBaza" novac>
      <button class="gumb-sekundarni" @click="otvoriModalTjedan">
          <span class="material-icons">date_range</span> Tjedni alati
        </button>
      <button
          v-if="mozePrebaciti"
          class="gumb-uspjeh"
          @click="prebaciUPrihode"
          :disabled="prebacivanjeUTijeku"
        >
          <span class="material-icons">arrow_forward</span>
          {{ prebacivanjeUTijeku ? 'Prebacujem...' : 'Prebaci u Prihodi' }}
        </button>
        <span v-else-if="mjesecPrebacen" class="oznaka-prebaceno">
          <span class="material-icons">check_circle</span> Ovaj mjesec je prebačen u Prihode
        </span>
      <button class="gumb-dodaj" @click="otvoriModalUnos()">
          <span class="material-icons">add</span> Dodaj dan
        </button>
    </AZaglavljeStranice>

    <div v-if="ucitava" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Učitavanje rasporeda...</p>
    </div>

    <template v-else>
      <div class="kartice">
        <div class="kartica sati">
          <div class="ikona"><span class="material-icons">schedule</span></div>
          <div class="podaci">
            <h3>Sati ovaj mjesec</h3>
            <p class="iznos">{{ formatSati(ukupnoSatiMjesec) }}</p>
          </div>
        </div>
        <div class="kartica zarada">
          <div class="ikona"><span class="material-icons">payments</span></div>
          <div class="podaci">
            <h3>Projicirana zarada</h3>
            <p class="iznos">{{ formatCurrency(ukupnoZaradaMjesec) }}</p>
          </div>
        </div>
        <div class="kartica zaradeno">
          <div class="ikona"><span class="material-icons">savings</span></div>
          <div class="podaci">
            <h3>Zarađeno do sada</h3>
            <p class="iznos">{{ formatCurrency(zaradenoDoSada.zarada) }}</p>
            <span class="podnaslov">{{ formatSati(zaradenoDoSada.sati) }} od {{ formatSati(ukupnoSatiMjesec) }}</span>
            <span v-if="danasCekaDo" class="podnaslov">današnji dan se pribraja nakon {{ danasCekaDo }}</span>
          </div>
        </div>
        <div class="kartica videa">
          <div class="ikona"><span class="material-icons">movie</span></div>
          <div class="podaci">
            <h3>Napravljeno videa ovaj mjesec</h3>
            <p class="iznos">{{ videaMjesec.length }}</p>
          </div>
        </div>
      </div>

      <div v-if="iphoneEventi.length > 0" class="iphone-eventi">
        <div class="iphone-eventi-zaglavlje">
          <span class="material-icons">event</span> Iz iPhone kalendara "Biznis baza"
        </div>
        <div class="iphone-eventi-lista">
          <div v-for="e in iphoneEventi" :key="e.id" class="iphone-event-redak">
            <span class="iphone-event-datum">{{ formatKratkiDatumIso(e.dan) }}</span>
            <span class="iphone-event-naslov">{{ e.naslov }}</span>
          </div>
        </div>
      </div>

      <div class="navigacija-mjeseca">
        <button class="gumb-navigacije" @click="prethodniMjesec">&lt;</button>
        <h3>{{ nazivMjesecaGodina }}</h3>
        <button class="gumb-navigacije" @click="sljedeciMjesec">&gt;</button>
      </div>


      <!-- ==================== KALENDARSKA MREŽA ==================== -->
      <div class="mreza-kalendara">
        <div class="zaglavlje-dana" v-for="dan in kraticeDanaPon" :key="dan">{{ dan }}</div>

        <div
          v-for="dan in daniKalendara"
          :key="dan.datum"
          :class="['dan-kalendara', {
            'drugi-mjesec': !dan.jeTrenutniMjesec,
            'danas': dan.jeDanas,
            'ima-unose': dan.unosi.length > 0,
            'odabran': dan.datum === odabraniDanDatum
          }]"
          @click="odaberiDan(dan)"
        >
          <span class="broj-dana">{{ dan.brojDana }}</span>
          <div class="pregled-unosa">
            <div v-for="unos in dan.unosi.slice(0, 2)" :key="unos.id" class="tocka-unosa" :title="unos.opis">
              {{ unos.terenSat ? '📍 ' : '' }}{{ (unos.opis || 'Rad').substring(0, 12) }}
            </div>
            <div v-if="dan.unosi.length > 2" class="vise-unosa">+{{ dan.unosi.length - 2 }} više</div>
          </div>
        </div>
      </div>

      <div v-if="odabraniDanDatum" class="dani-odabranog-dana">
        <h3>{{ formatDugiDatum(odabraniDanDatum) }}</h3>

        <div class="videa-dan">
          <div class="videa-dan-info">
            <span class="material-icons">movie</span>
            <div class="videa-dan-tekst">
              <span class="videa-dan-naziv">Videa taj dan</span>
              <span class="videa-dan-broj">{{ videaOdabranogDana }}</span>
            </div>
          </div>
          <div class="videa-dan-akcije">
            <button type="button" class="gumb-video-dodaj" @click="dodajVideo(odabraniDanDatum)">
              <span class="material-icons">add</span> Dodaj video
            </button>
            <button aria-label="Makni jedan video"
              type="button"
              class="gumb-video-makni"
              title="Makni jedan video"
              :disabled="videaOdabranogDana === 0"
              @click="makniVideoZaDan(odabraniDanDatum)"
            >
              <span class="material-icons">remove</span>
            </button>
          </div>
        </div>

        <div v-if="odabraniDanUnosi.length === 0" class="prazno">
          <p>Nema unosa za ovaj dan</p>
        </div>

        <div v-else class="lista-unosa">
          <div v-for="unos in odabraniDanUnosi" :key="unos.id" v-svajp class="redak-unosa">
            <div class="redak-detalji">
              <div class="redak-vrijeme">{{ unos.pocetnoVrijeme }} - {{ unos.zavrsnoVrijeme }}</div>
              <div class="redak-opis">{{ unos.opis || 'Bez opisa' }}</div>
              <div v-if="unos.terenSat" class="redak-teren">
                <span class="material-icons">place</span>
                Teren {{ unos.terenSat }}<template v-if="unos.terenNapomena"> · {{ unos.terenNapomena }}</template>
              </div>
            </div>
            <div class="redak-brojevi">
              <span class="redak-sati">{{ formatSati(unos.satiRada) }}</span>
              <span class="redak-zarada">{{ formatCurrency(unos.zarada) }}</span>
            </div>
            <div class="redak-akcije" data-svajp-akcije>
              <button aria-label="Dodaj u kalendar" class="gumb-akcija" title="Dodaj u kalendar" @click="preuzmiUKalendar(unos)">
                <span class="material-icons">event</span>
              </button>
              <button class="gumb-akcija" :title="unos.terenSat ? 'Uredi teren' : 'Dodaj teren'" @click="otvoriModalUnos(unos, true)">
                <span class="material-icons">{{ unos.terenSat ? 'edit_location_alt' : 'add_location_alt' }}</span>
              </button>
              <button aria-label="Uredi" class="gumb-akcija" title="Uredi" @click="otvoriModalUnos(unos)">
                <span class="material-icons">edit</span>
              </button>
              <button aria-label="Obriši" class="gumb-akcija obrisi" title="Obriši" @click="unosZaBrisanje = unos">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="satnica-traka">
        <span class="satnica-oznaka">Trenutna plaća</span>
        <span class="satnica-iznos">{{ formatCurrency(trenutnaSatnica) }} / sat</span>
        <button class="gumb-satnica" @click="otvoriModalSatnicu">
          <span class="material-icons">edit</span> Promijeni plaću
        </button>
      </div>

      <!-- ==================== VIDEA PO MJESECIMA (dno stranice) ==================== -->
      <div class="videa-povijest">
        <div class="vp-zaglavlje">
          <div class="vp-naslov">
            <span class="material-icons">movie</span>
            <h3>Koliko sam videa napravio</h3>
          </div>
          <div class="vp-godina">
            <button class="gumb-navigacije" @click="godinaVidea--">&lt;</button>
            <span>{{ godinaVidea }}.</span>
            <button class="gumb-navigacije" @click="godinaVidea++">&gt;</button>
          </div>
        </div>

        <div class="vp-lista">
          <div
            v-for="m in videaPoMjesecimaGodine"
            :key="m.kljuc"
            class="vp-redak"
            :class="{ prazan: m.broj === 0, aktivan: m.kljuc === mjesecKljuc }"
          >
            <span class="vp-mjesec">{{ m.naziv }}</span>
            <span class="vp-traka"><span class="vp-traka-ispuna" :style="{ width: m.postotak + '%' }"></span></span>
            <span class="vp-broj">{{ m.broj }}</span>
          </div>
        </div>

        <div class="vp-ukupno">
          <span>Ukupno u {{ godinaVidea }}.</span>
          <strong>{{ videaGodinaUkupno }}</strong>
        </div>
      </div>
    </template>

    <!-- ==================== MODAL: DODAJ/UREDI DAN ==================== -->
    <div v-if="prikaziModalUnos" class="prekrivka-modala" @click="zatvoriModalUnos">
      <div class="modal" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeUnos ? 'Uredi dan' : 'Dodaj dan' }}</h3>
          <button aria-label="Zatvori" class="gumb-zatvaranja" @click="zatvoriModalUnos">&times;</button>
        </div>

        <form class="forma" @submit.prevent="spremiUnos">
          <div class="grupa-polja">
            <label for="abiznisbaza-polje-1">Datum:</label>
            <input autocomplete="off" id="abiznisbaza-polje-1" v-model="forma.datum" type="date" required>
          </div>
          <div class="grupa-polja grupa-vrijeme">
            <div>
              <label for="abiznisbaza-polje-2">Od:</label>
              <select id="abiznisbaza-polje-2" v-model="forma.pocetnoVrijeme" required>
                <option value="" disabled>Odaberi sat</option>
                <option v-for="sat in satoviDana" :key="sat" :value="sat">{{ sat }}</option>
              </select>
            </div>
            <div>
              <label for="abiznisbaza-polje-3">Do:</label>
              <select id="abiznisbaza-polje-3" v-model="forma.zavrsnoVrijeme" required>
                <option value="" disabled>Odaberi sat</option>
                <option v-for="sat in satoviDana" :key="sat" :value="sat">{{ sat }}</option>
              </select>
            </div>
          </div>
          <div class="grupa-polja">
            <label for="abiznisbaza-polje-4">Opis (klijent/event):</label>
            <input autocomplete="off" id="abiznisbaza-polje-4" v-model="forma.opis" type="text" placeholder="Npr. vjenčanje - Ana i Marko">
          </div>

          <div class="grupa-polja">
            <label class="prekidac">
              <input v-model="forma.teren" type="checkbox">
              <span>Teren u sklopu ovog radnog dana</span>
            </label>
          </div>
          <div v-if="forma.teren" class="grupa-polja grupa-vrijeme">
            <div>
              <label for="abiznisbaza-polje-5">Teren u:</label>
              <input autocomplete="off" id="abiznisbaza-polje-5" v-model="forma.terenSat" type="time" required>
            </div>
            <div>
              <label for="abiznisbaza-polje-6">Mjesto / napomena:</label>
              <input autocomplete="off" id="abiznisbaza-polje-6" v-model="forma.terenNapomena" type="text" placeholder="Neobavezno">
            </div>
          </div>

          <div class="pregled-izracuna" v-if="pregledSati !== null">
            <span>{{ formatSati(pregledSati) }} sati</span>
            <span>≈ {{ formatCurrency(pregledSati * trenutnaSatnica) }}</span>
          </div>

          <div class="akcije-forme">
            <button type="button" class="gumb-odustati" @click="zatvoriModalUnos">Odustani</button>
            <button type="submit" class="gumb-spremiti">{{ uredujeUnos ? 'Spremi promjene' : 'Dodaj' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: SATNICA ==================== -->
    <div v-if="prikaziModalSatnicu" class="prekrivka-modala" @click="prikaziModalSatnicu = false">
      <div class="modal" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h3>Promijeni plaću</h3>
          <button aria-label="Zatvori" class="gumb-zatvaranja" @click="prikaziModalSatnicu = false">&times;</button>
        </div>
        <form class="forma" @submit.prevent="spremiSatnicu">
          <div class="grupa-polja">
            <label for="abiznisbaza-polje-7">Nova satnica (EUR/sat):</label>
            <input autocomplete="off" id="abiznisbaza-polje-7" v-model.number="novaSatnica" type="number" step="0.5" min="0" required>
          </div>
          <p class="napomena-satnica">Nova satnica vrijedi samo za dane koje tek unosiš - već upisani dani zadržavaju svoju staru satnicu.</p>
          <div class="akcije-forme">
            <button type="button" class="gumb-odustati" @click="prikaziModalSatnicu = false">Odustani</button>
            <button type="submit" class="gumb-spremiti">Spremi</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: POTVRDA BRISANJA ==================== -->
    <div v-if="unosZaBrisanje" class="prekrivka-modala" @click="unosZaBrisanje = null">
      <div class="modal-potvrda" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h2>Potvrda brisanja</h2>
        </div>
        <div class="sadrzaj-potvrde">
          <span class="material-icons upozorenje">warning</span>
          <p>Obrisati unos za {{ unosZaBrisanje.datum }}?</p>
        </div>
        <div class="gumbovi-potvrde">
          <button class="gumb-odustati" @click="unosZaBrisanje = null">Odustani</button>
          <button class="gumb-potvrditi" @click="potvrdiBrisanje">Potvrdi</button>
        </div>
      </div>
    </div>

    <!-- ==================== MODAL: TJEDNI ALATI ==================== -->
    <div v-if="prikaziModalTjedan" class="prekrivka-modala" @click="prikaziModalTjedan = false">
      <div class="modal modal-siroki" role="dialog" aria-modal="true" @click.stop>
        <div class="zaglavlje-modala">
          <h3>Tjedni alati</h3>
          <button aria-label="Zatvori" class="gumb-zatvaranja" @click="prikaziModalTjedan = false">&times;</button>
        </div>

        <div class="forma">
          <div class="grupa-polja grupa-vrijeme">
            <div>
              <label for="abiznisbaza-polje-8">Od:</label>
              <input autocomplete="off" id="abiznisbaza-polje-8" v-model="tjedanOd" type="date">
            </div>
            <div>
              <label for="abiznisbaza-polje-9">Do:</label>
              <input autocomplete="off" id="abiznisbaza-polje-9" v-model="tjedanDo" type="date">
            </div>
          </div>

          <div v-if="unosiZaTjedan.length === 0" class="prazno">
            <p>Nema unosa u ovom periodu</p>
          </div>
          <div v-else class="tjedni-pregled">
            <div v-for="unos in unosiZaTjedan" :key="unos.id" class="tjedni-redak">
              <span>{{ formatKratkiDatum(unos.datum) }}</span>
              <span>{{ unos.pocetnoVrijeme }}-{{ unos.zavrsnoVrijeme }}</span>
              <span class="tjedni-opis">{{ unos.opis || '-' }}<template v-if="unos.terenSat"> · 📍 teren {{ unos.terenSat }}</template></span>
            </div>
            <div class="tjedni-ukupno">Ukupno: {{ formatSati(ukupnoSatiTjedan) }} · {{ formatCurrency(ukupnoZaradaTjedan) }}</div>
          </div>

          <div class="akcije-tjedna">
            <button class="gumb-spremiti" :disabled="unosiZaTjedan.length === 0" @click="dodajTjedanUKalendar">
              <span class="material-icons">event</span> Dodaj sve u kalendar
            </button>
            <button class="gumb-odustati" :disabled="unosiZaTjedan.length === 0" @click="kopirajIzvjestaj">
              <span class="material-icons">content_copy</span> Kopiraj izvještaj za šefa
            </button>
          </div>
          <p v-if="porukaKopiranja" class="napomena-satnica">{{ porukaKopiranja }}</p>
          <textarea v-if="prikazTekstaIzvjestaja" class="pregled-izvjestaja" readonly :value="prikazTekstaIzvjestaja"></textarea>

          <div class="razdjelnik-predlozaka"></div>

          <h4>Predlošci tjedna</h4>
          <p class="napomena-satnica">Spremi ovaj raspored (Od-Do gore) kao predložak, pa ga ubuduće primijeni na bilo koji drugi tjedan jednim klikom.</p>

          <button class="gumb-odustati gumb-puna-sirina" :disabled="unosiZaTjedan.length === 0" @click="spremiKaoPredlozak">
            <span class="material-icons">bookmark_add</span> Spremi ovaj tjedan kao predložak
          </button>

          <div v-if="predlosci.length > 0" class="lista-predlozaka">
            <div v-for="predlozak in predlosci" :key="predlozak.id" class="predlozak-redak">
              <span class="predlozak-naziv">{{ predlozak.naziv }}</span>
              <span class="predlozak-info">{{ predlozak.dani.length }} dana</span>
              <button class="gumb-akcija" title="Primijeni na odabrani tjedan (Od gore)" @click="primijeniPredlozak(predlozak)">
                <span class="material-icons">play_arrow</span>
              </button>
              <button aria-label="Obriši predložak" class="gumb-akcija obrisi" title="Obriši predložak" @click="obrisiPredlozak(predlozak)">
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="poruka" :class="['poruka-rezultat', poruka.uspjeh ? 'uspjeh' : 'greska']">
      {{ poruka.tekst }}
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
import { preuzmiICS, preuzmiVisestrukiICS } from '@/utils/ics.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
  onSnapshot, serverTimestamp, query, where, orderBy, limit
} from 'firebase/firestore';

const ucitava = ref(true);
const unosi = ref([]);
const trenutnaSatnica = ref(0);
const prebacivanja = ref({});
const prikazaniMjesec = ref(new Date());
const odabraniDanDatum = ref(null);

const prikaziModalUnos = ref(false);
const uredujeUnos = ref(null);
const praznaForma = () => ({ datum: '', pocetnoVrijeme: '', zavrsnoVrijeme: '', opis: '', teren: false, terenSat: '', terenNapomena: '' });
const forma = ref(praznaForma());

const prikaziModalSatnicu = ref(false);
const novaSatnica = ref(0);

const unosZaBrisanje = ref(null);
const prebacivanjeUTijeku = ref(false);
const poruka = ref(null);

const prikaziModalTjedan = ref(false);
const tjedanOd = ref('');
const tjedanDo = ref('');
const predlosci = ref([]);
const porukaKopiranja = ref('');
const prikazTekstaIzvjestaja = ref('');

let unsubUnosi = null;
let unsubPrebacivanja = null;
let unsubPredlosci = null;
let unsubIphoneEventi = null;
let unsubVidea = null;

const videa = ref([]);

const iphoneEventi = ref([]);

const nazviMjeseci = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
];
const kraticeDanaPon = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
const satoviDana = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const kraticeDanaTjedna = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

const uISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const nazivMjesecaGodina = computed(() => `${nazviMjeseci[prikazaniMjesec.value.getMonth()]} ${prikazaniMjesec.value.getFullYear()}`);

const mjesecKljuc = computed(() => {
  const g = prikazaniMjesec.value.getFullYear();
  const m = String(prikazaniMjesec.value.getMonth() + 1).padStart(2, '0');
  return `${g}-${m}`;
});

// "sada" se osvježava svakih 30 s i čim se vratiš u app (iPhone zaustavi sat dok je app u pozadini)
const sada = ref(new Date());
let satInterval = null;
const osvjeziSada = () => { sada.value = new Date(); };

// trenutak kad radni dan završava (rad preko ponoći završava idući dan)
const krajUnosa = (u) => {
  const [g, m, d] = u.datum.split('-').map(Number);
  const [zh, zm] = u.zavrsnoVrijeme.split(':').map(Number);
  const [ph, pm] = u.pocetnoVrijeme.split(':').map(Number);
  const kraj = new Date(g, m - 1, d, zh, zm);
  if (zh * 60 + zm <= ph * 60 + pm) kraj.setDate(kraj.getDate() + 1);
  return kraj;
};

const unosiZaMjesec = computed(() => unosi.value.filter(u => u.datum && u.datum.startsWith(mjesecKljuc.value)));

const ukupnoSatiMjesec = computed(() => unosiZaMjesec.value.reduce((s, u) => s + (u.satiRada || 0), 0));
const ukupnoZaradaMjesec = computed(() => unosiZaMjesec.value.reduce((s, u) => s + (u.zarada || 0), 0));

// zarađeno do ovog trenutka: samo radni dani koji su po rasporedu ZAVRŠENI (današnji se pribroji nakon kraja smjene)
const zaradenoDoSada = computed(() => {
  const gotovi = unosiZaMjesec.value.filter(u => krajUnosa(u) <= sada.value);
  return {
    zarada: gotovi.reduce((s, u) => s + (u.zarada || 0), 0),
    sati: gotovi.reduce((s, u) => s + (u.satiRada || 0), 0)
  };
});

// ako danas ima radni dan koji još traje: do kad čekamo da se pribroji
const danasCekaDo = computed(() => {
  const danas = uISO(sada.value);
  const cekaju = unosiZaMjesec.value.filter(u => u.datum === danas && krajUnosa(u) > sada.value);
  if (!cekaju.length) return null;
  return cekaju.map(u => u.zavrsnoVrijeme).sort().pop();
});

const mjesecPrebacen = computed(() => !!prebacivanja.value[mjesecKljuc.value]);
const mozePrebaciti = computed(() => unosiZaMjesec.value.length > 0 && !mjesecPrebacen.value);

const daniKalendara = computed(() => {
  const godina = prikazaniMjesec.value.getFullYear();
  const mjesec = prikazaniMjesec.value.getMonth();
  const danasString = uISO(new Date());

  const prviDanMjeseca = new Date(godina, mjesec, 1);
  const danTjedna = prviDanMjeseca.getDay();
  const danaZaOduzeti = danTjedna === 0 ? 6 : danTjedna - 1;
  const pocetniDatum = new Date(prviDanMjeseca);
  pocetniDatum.setDate(prviDanMjeseca.getDate() - danaZaOduzeti);

  const dani = [];
  for (let i = 0; i < 42; i++) {
    const trenutni = new Date(pocetniDatum);
    trenutni.setDate(pocetniDatum.getDate() + i);
    const datumString = uISO(trenutni);

    dani.push({
      datum: datumString,
      brojDana: trenutni.getDate(),
      jeTrenutniMjesec: trenutni.getMonth() === mjesec,
      jeDanas: datumString === danasString,
      unosi: unosi.value
        .filter(u => u.datum === datumString)
        .sort((a, b) => a.pocetnoVrijeme.localeCompare(b.pocetnoVrijeme))
    });
  }
  return dani;
});

const odabraniDanUnosi = computed(() => {
  if (!odabraniDanDatum.value) return [];
  return unosi.value
    .filter(u => u.datum === odabraniDanDatum.value)
    .sort((a, b) => a.pocetnoVrijeme.localeCompare(b.pocetnoVrijeme));
});

const pregledSati = computed(() => {
  if (!forma.value.pocetnoVrijeme || !forma.value.zavrsnoVrijeme) return null;
  const sati = izracunajSate(forma.value.pocetnoVrijeme, forma.value.zavrsnoVrijeme);
  return sati > 0 ? sati : null;
});

function izracunajSate(pocetno, zavrsno) {
  const [pSat, pMin] = pocetno.split(':').map(Number);
  const [zSat, zMin] = zavrsno.split(':').map(Number);
  let minute = (zSat * 60 + zMin) - (pSat * 60 + pMin);
  if (minute <= 0) minute += 24 * 60; // rad preko ponoći
  return Math.round((minute / 60) * 100) / 100;
}

const formatSati = (v) => `${(parseFloat(v) || 0).toFixed(2)} h`;
const formatCurrency = (v) => prikaziNovac(`${(parseFloat(v) || 0).toFixed(2)} EUR`);
const formatKratkiDatumIso = (danStr) => new Date(danStr).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });
const formatDugiDatum = (datumString) => new Date(datumString).toLocaleDateString('hr-HR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});
const formatKratkiDatum = (datumString) => new Date(datumString).toLocaleDateString('hr-HR', {
  weekday: 'short', day: 'numeric', month: 'numeric'
});

const unosiZaTjedan = computed(() => {
  if (!tjedanOd.value || !tjedanDo.value) return [];
  return unosi.value
    .filter(u => u.datum >= tjedanOd.value && u.datum <= tjedanDo.value)
    .sort((a, b) => a.datum.localeCompare(b.datum) || a.pocetnoVrijeme.localeCompare(b.pocetnoVrijeme));
});
const ukupnoSatiTjedan = computed(() => unosiZaTjedan.value.reduce((s, u) => s + (u.satiRada || 0), 0));
const ukupnoZaradaTjedan = computed(() => unosiZaTjedan.value.reduce((s, u) => s + (u.zarada || 0), 0));

const odaberiDan = (dan) => {
  odabraniDanDatum.value = odabraniDanDatum.value === dan.datum ? null : dan.datum;
};

const prethodniMjesec = () => {
  prikazaniMjesec.value = new Date(prikazaniMjesec.value.getFullYear(), prikazaniMjesec.value.getMonth() - 1, 1);
  odabraniDanDatum.value = null;
};
const sljedeciMjesec = () => {
  prikazaniMjesec.value = new Date(prikazaniMjesec.value.getFullYear(), prikazaniMjesec.value.getMonth() + 1, 1);
  odabraniDanDatum.value = null;
};

const ucitajSatnicu = async () => {
  try {
    const snap = await getDoc(doc(db, 'placa-postavke', 'trenutna'));
    trenutnaSatnica.value = snap.exists() ? (snap.data().eurPoSatu || 0) : 0;
  } catch (error) {
    console.error('Greška pri učitavanju satnice:', error);
  }
};

const postaviRealtimeListenere = () => {
  unsubUnosi = onSnapshot(collection(db, 'raspored-aktivnosti'), (snapshot) => {
    unosi.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  });
  unsubPrebacivanja = onSnapshot(collection(db, 'biznisbaza-prebacivanja'), (snapshot) => {
    const mapa = {};
    snapshot.docs.forEach(d => { mapa[d.id] = d.data().prebaceno === true; });
    prebacivanja.value = mapa;
  });
  unsubPredlosci = onSnapshot(collection(db, 'biznisbaza-predlosci'), (snapshot) => {
    predlosci.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  unsubVidea = onSnapshot(collection(db, 'videa'), (snapshot) => {
    videa.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  const danasDatum = new Date();
  const danasStr = `${danasDatum.getFullYear()}-${String(danasDatum.getMonth() + 1).padStart(2, '0')}-${String(danasDatum.getDate()).padStart(2, '0')}`;
  const qIphoneEventi = query(
    collection(db, 'kalendar-eventi'),
    where('kalendar', '==', 'Biznis baza'),
    orderBy('pocetak'),
    limit(10)
  );
  unsubIphoneEventi = onSnapshot(qIphoneEventi, (snapshot) => {
    iphoneEventi.value = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.dan >= danasStr);
  }, (error) => {
    console.error('Greška pri čitanju iPhone eventa:', error);
  });
};

onMounted(async () => {
  satInterval = setInterval(osvjeziSada, 30000);
  document.addEventListener('visibilitychange', osvjeziSada);
  window.addEventListener('focus', osvjeziSada);
  ucitava.value = true;
  await ucitajSatnicu();
  postaviRealtimeListenere();
  ucitava.value = false;
});

onBeforeUnmount(() => {
  clearInterval(satInterval);
  document.removeEventListener('visibilitychange', osvjeziSada);
  window.removeEventListener('focus', osvjeziSada);
  if (unsubUnosi) unsubUnosi();
  if (unsubPrebacivanja) unsubPrebacivanja();
  if (unsubPredlosci) unsubPredlosci();
  if (unsubIphoneEventi) unsubIphoneEventi();
  if (unsubVidea) unsubVidea();
});

// ==================== VIDEA ====================
const videaMjesec = computed(() => videa.value.filter(v => v.datum && v.datum.startsWith(mjesecKljuc.value)));
const videaOdabranogDana = computed(() => videa.value.filter(v => v.datum === odabraniDanDatum.value).length);

// zbroj videa za svaki mjesec odabrane godine (prikaz na dnu stranice)
const godinaVidea = ref(new Date().getFullYear());
const videaPoMjesecimaGodine = computed(() => {
  const mjeseci = nazviMjeseci.map((naziv, indeks) => {
    const kljuc = `${godinaVidea.value}-${String(indeks + 1).padStart(2, '0')}`;
    return { kljuc, naziv, broj: videa.value.filter(v => v.datum && v.datum.startsWith(kljuc)).length };
  });
  const najvise = Math.max(1, ...mjeseci.map(m => m.broj));
  return mjeseci.map(m => ({ ...m, postotak: m.broj > 0 ? Math.max(4, Math.round((m.broj / najvise) * 100)) : 0 }));
});
const videaGodinaUkupno = computed(() => videaPoMjesecimaGodine.value.reduce((zbroj, m) => zbroj + m.broj, 0));

const dodajVideo = async (datum) => {
  if (!datum) return;
  try {
    await addDoc(collection(db, 'videa'), { datum, kreirano: serverTimestamp() });
  } catch (error) {
    console.error('Greška pri dodavanju videa:', error);
    obavijesti('Greška pri spremanju videa.');
  }
};

// zadnje dodani video iz liste (serverTimestamp je kratko null dok se ne potvrdi - taj je najnoviji)
const najnoviji = (lista) => lista.reduce((a, b) => {
  const ka = a.kreirano?.seconds ?? Number.MAX_SAFE_INTEGER;
  const kb = b.kreirano?.seconds ?? Number.MAX_SAFE_INTEGER;
  return b.datum > a.datum || (b.datum === a.datum && kb >= ka) ? b : a;
});

const obrisiVideo = async (video) => {
  try {
    await deleteDoc(doc(db, 'videa', video.id));
  } catch (error) {
    console.error('Greška pri brisanju videa:', error);
  }
};

const makniVideoZaDan = (datum) => {
  const taj = videa.value.filter(v => v.datum === datum);
  if (taj.length) obrisiVideo(najnoviji(taj));
};

const resetirajFormu = () => {
  forma.value = { ...praznaForma(), datum: odabraniDanDatum.value || '' };
};

// ukljuciTeren: brza tipka na retku - otvori formu s već uključenim poljem za teren
const otvoriModalUnos = (unos = null, ukljuciTeren = false) => {
  uredujeUnos.value = unos;
  forma.value = unos
    ? {
        datum: unos.datum, pocetnoVrijeme: unos.pocetnoVrijeme, zavrsnoVrijeme: unos.zavrsnoVrijeme, opis: unos.opis || '',
        teren: !!unos.terenSat || ukljuciTeren, terenSat: unos.terenSat || '', terenNapomena: unos.terenNapomena || ''
      }
    : { ...praznaForma(), datum: odabraniDanDatum.value || '' };
  prikaziModalUnos.value = true;
};

const zatvoriModalUnos = () => {
  prikaziModalUnos.value = false;
  uredujeUnos.value = null;
  resetirajFormu();
};

const spremiUnos = async () => {
  const sati = izracunajSate(forma.value.pocetnoVrijeme, forma.value.zavrsnoVrijeme);
  if (sati <= 0) {
    obavijesti('Neispravno radno vrijeme.');
    return;
  }

  if (forma.value.teren && !forma.value.terenSat) {
    obavijesti('Upiši u koliko sati je teren.');
    return;
  }
  // teren je samo oznaka na danu - ne mijenja sate ni zaradu
  const teren = forma.value.teren
    ? { terenSat: forma.value.terenSat, terenNapomena: forma.value.terenNapomena.trim() }
    : { terenSat: null, terenNapomena: '' };

  try {
    if (uredujeUnos.value) {
      // satnica ostaje ona koja je bila snimljena na danu - ne mijenja se naknadno
      const satnicaZaUnos = uredujeUnos.value.placaPoSatu ?? trenutnaSatnica.value;
      await updateDoc(doc(db, 'raspored-aktivnosti', uredujeUnos.value.id), {
        datum: forma.value.datum,
        pocetnoVrijeme: forma.value.pocetnoVrijeme,
        zavrsnoVrijeme: forma.value.zavrsnoVrijeme,
        opis: forma.value.opis,
        ...teren,
        satiRada: sati,
        zarada: Math.round(sati * satnicaZaUnos * 100) / 100
      });
    } else {
      await addDoc(collection(db, 'raspored-aktivnosti'), {
        datum: forma.value.datum,
        pocetnoVrijeme: forma.value.pocetnoVrijeme,
        zavrsnoVrijeme: forma.value.zavrsnoVrijeme,
        opis: forma.value.opis,
        ...teren,
        satiRada: sati,
        placaPoSatu: trenutnaSatnica.value,
        zarada: Math.round(sati * trenutnaSatnica.value * 100) / 100,
        kreirano: serverTimestamp()
      });
    }
    odabraniDanDatum.value = forma.value.datum;
    zatvoriModalUnos();
  } catch (error) {
    console.error('Greška pri spremanju unosa:', error);
    obavijesti('Greška pri spremanju unosa.');
  }
};

const potvrdiBrisanje = async () => {
  if (!unosZaBrisanje.value) return;
  try {
    await deleteDoc(doc(db, 'raspored-aktivnosti', unosZaBrisanje.value.id));
  } catch (error) {
    console.error('Greška pri brisanju unosa:', error);
  } finally {
    unosZaBrisanje.value = null;
  }
};

const otvoriModalSatnicu = () => {
  novaSatnica.value = trenutnaSatnica.value;
  prikaziModalSatnicu.value = true;
};

const spremiSatnicu = async () => {
  try {
    await setDoc(doc(db, 'placa-postavke', 'trenutna'), { eurPoSatu: novaSatnica.value }, { merge: true });
    trenutnaSatnica.value = novaSatnica.value;
    prikaziModalSatnicu.value = false;
  } catch (error) {
    console.error('Greška pri spremanju satnice:', error);
  }
};

// u kalendaru dan ostaje "Rad", a teren se samo dopiše u naslov
const zaKalendar = (u) => (u.terenSat ? { ...u, opis: `${u.opis || 'Rad'} (teren ${u.terenSat})` } : u);

const preuzmiUKalendar = (unos) => {
  preuzmiICS(zaKalendar(unos));
};

const prikaziPoruku = (uspjeh, tekst) => {
  poruka.value = { uspjeh, tekst };
  setTimeout(() => { poruka.value = null; }, 6000);
};

const prebaciUPrihode = async () => {
  if (!mozePrebaciti.value || prebacivanjeUTijeku.value) return;
  prebacivanjeUTijeku.value = true;

  try {
    const godina = prikazaniMjesec.value.getFullYear();
    const mjesecIndeks = prikazaniMjesec.value.getMonth();
    const prviDan = new Date(godina, mjesecIndeks, 1);
    const zadnjiDan = new Date(godina, mjesecIndeks + 1, 0);

    await addDoc(collection(db, 'prihodi'), {
      nazivEventa: `Biznis-baza za ${nazviMjeseci[mjesecIndeks]} ${godina}`,
      cijena: Math.round(ukupnoZaradaMjesec.value * 100) / 100,
      datumSnimanja: uISO(prviDan),
      datumZavrsetak: uISO(zadnjiDan),
      putniTrosak: 0,
      danoBratu: 0,
      suradnici: [],
      lokacija: '',
      placeno: false,
      izBiznisbaze: true
    });

    await setDoc(doc(db, 'biznisbaza-prebacivanja', mjesecKljuc.value), {
      prebaceno: true,
      datumPrebacivanja: serverTimestamp(),
      iznos: ukupnoZaradaMjesec.value
    });

    prikaziPoruku(true, `Prebačeno u Prihodi: ${formatCurrency(ukupnoZaradaMjesec.value)} za ${nazivMjesecaGodina.value}.`);
  } catch (error) {
    console.error('Greška pri prebacivanju u Prihodi:', error);
    prikaziPoruku(false, 'Greška pri prebacivanju u Prihodi.');
  } finally {
    prebacivanjeUTijeku.value = false;
  }
};

// ==================== TJEDNI ALATI ====================
const sljedeciPonedjeljakIso = () => {
  const danas = new Date();
  const dan = danas.getDay(); // 0=Ned..6=Sub
  const danaDoPon = dan === 0 ? 1 : (dan === 1 ? 7 : 8 - dan);
  const ponedjeljak = new Date(danas);
  ponedjeljak.setDate(danas.getDate() + danaDoPon);
  return uISO(ponedjeljak);
};

const otvoriModalTjedan = () => {
  if (!tjedanOd.value) {
    tjedanOd.value = sljedeciPonedjeljakIso();
    const nedjelja = new Date(tjedanOd.value);
    nedjelja.setDate(nedjelja.getDate() + 6);
    tjedanDo.value = uISO(nedjelja);
  }
  porukaKopiranja.value = '';
  prikazTekstaIzvjestaja.value = '';
  prikaziModalTjedan.value = true;
};

const dodajTjedanUKalendar = () => {
  preuzmiVisestrukiICS(unosiZaTjedan.value.map(zaKalendar), `raspored-${tjedanOd.value}.ics`);
};

const izgradiTekstIzvjestaja = () => {
  const linije = unosiZaTjedan.value.map(u =>
    `${formatKratkiDatum(u.datum)}: ${u.pocetnoVrijeme}-${u.zavrsnoVrijeme}${u.opis ? ' (' + u.opis + ')' : ''}${u.terenSat ? ', teren ' + u.terenSat : ''}`
  );
  return `Raspored ${formatKratkiDatum(tjedanOd.value)} - ${formatKratkiDatum(tjedanDo.value)}\n\n${linije.join('\n')}\n\nUkupno: ${formatSati(ukupnoSatiTjedan.value)}`;
};

const kopirajIzvjestaj = async () => {
  const tekst = izgradiTekstIzvjestaja();
  prikazTekstaIzvjestaja.value = tekst;
  try {
    await navigator.clipboard.writeText(tekst);
    porukaKopiranja.value = 'Kopirano - zalijepi gdje god trebaš poslati.';
  } catch (error) {
    porukaKopiranja.value = 'Kopiranje nije uspjelo - označi tekst ispod ručno.';
  }
};

const spremiKaoPredlozak = async () => {
  const naziv = prompt('Naziv predloška:', `Tjedan ${formatKratkiDatum(tjedanOd.value)}`);
  if (!naziv) return;

  const pocetak = new Date(tjedanOd.value);
  const dani = unosiZaTjedan.value.map(u => {
    const danOffset = Math.round((new Date(u.datum) - pocetak) / (1000 * 60 * 60 * 24));
    return { danOffset, pocetnoVrijeme: u.pocetnoVrijeme, zavrsnoVrijeme: u.zavrsnoVrijeme, opis: u.opis || '' };
  });

  try {
    await addDoc(collection(db, 'biznisbaza-predlosci'), { naziv, dani, kreirano: serverTimestamp() });
    prikaziPoruku(true, `Predložak "${naziv}" spremljen.`);
  } catch (error) {
    console.error('Greška pri spremanju predloška:', error);
    prikaziPoruku(false, 'Greška pri spremanju predloška.');
  }
};

const primijeniPredlozak = async (predlozak) => {
  if (!tjedanOd.value) return;
  if (!confirm(`Primijeniti "${predlozak.naziv}" na tjedan koji počinje ${formatKratkiDatum(tjedanOd.value)}?`)) return;

  const pocetak = new Date(tjedanOd.value);
  try {
    for (const dan of predlozak.dani) {
      const ciljniDatum = new Date(pocetak);
      ciljniDatum.setDate(pocetak.getDate() + dan.danOffset);
      const sati = izracunajSate(dan.pocetnoVrijeme, dan.zavrsnoVrijeme);

      await addDoc(collection(db, 'raspored-aktivnosti'), {
        datum: uISO(ciljniDatum),
        pocetnoVrijeme: dan.pocetnoVrijeme,
        zavrsnoVrijeme: dan.zavrsnoVrijeme,
        opis: dan.opis || '',
        satiRada: sati,
        placaPoSatu: trenutnaSatnica.value,
        zarada: Math.round(sati * trenutnaSatnica.value * 100) / 100,
        kreirano: serverTimestamp()
      });
    }
    prikaziPoruku(true, `Predložak "${predlozak.naziv}" primijenjen na ${predlozak.dani.length} dana.`);
  } catch (error) {
    console.error('Greška pri primjeni predloška:', error);
    prikaziPoruku(false, 'Greška pri primjeni predloška.');
  }
};

const obrisiPredlozak = async (predlozak) => {
  if (!confirm(`Obrisati predložak "${predlozak.naziv}"?`)) return;
  try {
    await deleteDoc(doc(db, 'biznisbaza-predlosci', predlozak.id));
  } catch (error) {
    console.error('Greška pri brisanju predloška:', error);
  }
};

// povuci prema dolje za osvježavanje (mobitel)
// podaci ove stranice se već osvježavaju uživo - nema što dodatno povlačiti
const odjaviOsvjezavanje = postaviOsvjezavanje(async () => {});
onBeforeUnmount(odjaviOsvjezavanje);
</script>

<style scoped>
.biznisbaza {
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
  margin-bottom: 10px;
  font-size: 28px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.satnica-traka {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.satnica-oznaka {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.satnica-iznos {
  color: var(--text-heading);
  font-weight: 700;
  font-size: 1.1rem;
}

.gumb-satnica {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.gumb-satnica:hover {
  background-color: var(--border-color);
}

.iphone-eventi {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.iphone-eventi-zaglavlje {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.iphone-eventi-zaglavlje .material-icons {
  font-size: 16px;
}

.iphone-eventi-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.iphone-event-redak {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}

.iphone-event-datum {
  color: var(--text-muted);
  font-weight: 600;
  min-width: 48px;
  flex-shrink: 0;
}

.iphone-event-naslov {
  color: var(--text-heading);
}

.navigacija-mjeseca {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.navigacija-mjeseca h3 {
  margin: 0;
  color: var(--text-heading);
  text-transform: capitalize;
}

.gumb-navigacije {
  background: var(--bg-card-muted);
  border: 1px solid var(--border-color);
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-heading);
}

.gumb-navigacije:hover {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

@keyframes pojaviSe {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.oznaka-prebaceno {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--success);
  font-size: 0.9rem;
  font-weight: 500;
}

/* ==================== KALENDARSKA MREŽA ==================== */
.mreza-kalendara {
  display: grid;
  /* minmax(0, 1fr): sedam jednakih stupaca, tekst unosa se skraćuje umjesto da širi stupac */
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.zaglavlje-dana {
  background: var(--accent);
  color: var(--on-accent);
  padding: 10px 4px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.dan-kalendara {
  min-width: 0;
  background: var(--bg-card);
  min-height: 72px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;
}

.dan-kalendara:hover {
  background: var(--bg-card-muted);
}

.dan-kalendara.drugi-mjesec {
  background: var(--bg-page);
  color: var(--text-muted);
}

.dan-kalendara.danas {
  box-shadow: inset 0 0 0 2px var(--accent);
}

.dan-kalendara.odabran {
  background: var(--bg-card-muted);
  box-shadow: inset 0 0 0 2px var(--accent-soft);
}

.dan-kalendara.ima-unose {
  border-left: 3px solid var(--success);
}

.broj-dana {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-heading);
  margin-bottom: 2px;
}

.pregled-unosa {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tocka-unosa {
  background: var(--accent);
  color: var(--on-accent);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vise-unosa {
  font-size: 9px;
  color: var(--text-muted);
}

.dani-odabranog-dana {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 20px;
  margin-bottom: 20px;
}

.dani-odabranog-dana h3 {
  margin: 0 0 14px;
  color: var(--text-heading);
  text-transform: capitalize;
}

.prazno {
  text-align: center;
  padding: 20px 0;
  color: var(--text-muted);
}

.lista-unosa {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.redak-unosa {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 14px;
  background-color: var(--bg-card-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  padding: 14px 16px;
}

.redak-vrijeme {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 0.9rem;
}

.redak-opis {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.redak-brojevi {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.redak-sati {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.redak-zarada {
  color: var(--success);
  font-weight: 700;
}

.redak-akcije {
  display: flex;
  gap: 4px;
}

.gumb-akcija {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 6px;
  border-radius: 6px;
  display: flex;
}

.gumb-akcija:hover {
  background-color: var(--bg-card-muted);
  color: var(--accent);
}

.gumb-akcija.obrisi:hover {
  color: var(--danger);
}

/* ==================== TEREN I VIDEA ==================== */
.redak-teren {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
}

.redak-teren .material-icons {
  font-size: 16px;
}

.prekidac {
  display: flex !important;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.prekidac input {
  width: 20px !important;
  height: 20px;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}

.videa-povijest {
  margin-top: 25px;
  padding: 20px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.vp-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.vp-naslov {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vp-naslov .material-icons {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-card-muted);
  color: var(--accent);
}

.vp-naslov h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-heading);
}

.vp-godina {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--text-heading);
}

.vp-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vp-redak {
  display: grid;
  grid-template-columns: 90px 1fr 36px;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 8px;
}

.vp-redak.aktivan {
  background: var(--bg-card-muted);
}

.vp-mjesec {
  font-size: 0.9rem;
  color: var(--text-body);
}

.vp-traka {
  height: 8px;
  border-radius: 4px;
  background: var(--bg-card-muted);
  overflow: hidden;
}

.vp-redak.aktivan .vp-traka {
  background: var(--border-color);
}

.vp-traka-ispuna {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--accent);
}

.vp-broj {
  text-align: right;
  font-weight: 700;
  color: var(--text-heading);
}

.vp-redak.prazan .vp-mjesec,
.vp-redak.prazan .vp-broj {
  color: var(--text-muted);
  font-weight: 400;
}

.vp-ukupno {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
}

.vp-ukupno strong {
  font-size: 1.5rem;
  color: var(--text-heading);
}

.videa-dan {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background-color: var(--bg-card-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
}

.videa-dan-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.videa-dan-info > .material-icons {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--accent);
}

.videa-dan-tekst {
  display: flex;
  flex-direction: column;
}

.videa-dan-naziv {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.videa-dan-broj {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-heading);
}

.videa-dan-akcije {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gumb-video-dodaj {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 22px 0 16px;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.gumb-video-dodaj:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.gumb-video-dodaj:active {
  transform: scale(0.97);
}

.gumb-video-makni {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
}

.gumb-video-makni:hover:not(:disabled) {
  color: var(--danger);
  border-color: var(--danger);
}

.gumb-video-makni:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (max-width: 768px) {
  .videa-dan {
    flex-direction: column;
    align-items: stretch;
  }

  .videa-dan-akcije {
    width: 100%;
  }

  .gumb-video-dodaj {
    flex: 1;
    justify-content: center;
  }
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
}

.modal {
  background-color: var(--bg-card);
  border: none;
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-card);
  width: 90%;
  max-width: 480px;
  max-height: 100%;
  overflow-y: auto;
}

.modal-siroki {
  max-width: 560px;
}

.tjedni-pregled {
  background: var(--bg-card-muted);
  border-radius: var(--radius-small);
  padding: 12px 16px;
  margin-bottom: 16px;
  max-height: 220px;
  overflow-y: auto;
}

.tjedni-redak {
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  gap: 10px;
  padding: 6px 0;
  font-size: 0.85rem;
  color: var(--text-heading);
  border-bottom: 1px solid var(--border-color);
}

.tjedni-redak:last-child {
  border-bottom: none;
}

.tjedni-opis {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tjedni-ukupno {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid var(--border-color);
  font-weight: 700;
  color: var(--text-heading);
}

.akcije-tjedna {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.akcije-tjedna .gumb-spremiti,
.akcije-tjedna .gumb-odustati {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.akcije-tjedna button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pregled-izvjestaja {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-page);
  color: var(--text-body);
  font-family: monospace;
  font-size: 0.8rem;
  margin-bottom: 16px;
  resize: vertical;
}

.razdjelnik-predlozaka {
  border-top: 1px solid var(--border-color);
  margin: 10px 0 16px;
}

.forma h4 {
  margin: 0 0 6px;
  color: var(--text-heading);
}

.gumb-puna-sirina {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.lista-predlozaka {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.predlozak-redak {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card-muted);
  border-radius: 8px;
  padding: 8px 12px;
}

.predlozak-naziv {
  flex: 1;
  color: var(--text-heading);
  font-weight: 500;
  font-size: 0.9rem;
}

.predlozak-info {
  color: var(--text-muted);
  font-size: 0.8rem;
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
.grupa-polja select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--font-sans);
  background: var(--bg-page);
  color: var(--text-body);
}

.grupa-vrijeme {
  display: flex;
  gap: 12px;
}

.grupa-vrijeme > div {
  flex: 1;
}

.pregled-izracuna {
  display: flex;
  justify-content: space-between;
  background: var(--bg-card-muted);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--text-heading);
}

.napomena-satnica {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: -8px 0 16px;
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

.poruka-rezultat {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.poruka-rezultat.uspjeh {
  background-color: #d4edda;
  color: #155724;
}

.poruka-rezultat.greska {
  background-color: #f8d7da;
  color: #721c24;
}

@media (max-width: 768px) {
  .satnica-traka {
    padding: 14px 16px;
    gap: 8px 14px;
  }

  .gumb-satnica {
    font-size: 0.8rem;
    padding: 7px 12px;
  }

  .navigacija-mjeseca {
    padding: 12px 14px;
  }

  .navigacija-mjeseca h3 {
    font-size: 0.95rem;
  }

  .dan-kalendara {
    min-height: 54px;
    padding: 4px;
  }

  .broj-dana {
    font-size: 11px;
  }

  .tocka-unosa {
    font-size: 10px;
  }

  .redak-unosa {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "detalji detalji"
      "brojevi akcije";
    row-gap: 10px;
  }

  .redak-detalji { grid-area: detalji; }

  .redak-brojevi {
    grid-area: brojevi;
    align-items: flex-start;
    text-align: left;
    flex-direction: row;
    gap: 10px;
  }

  .redak-akcije {
    grid-area: akcije;
    justify-content: flex-end;
  }

  .tjedni-redak {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "datum vrijeme" "opis opis";
  }

  .tjedni-redak span:nth-child(1) { grid-area: datum; }
  .tjedni-redak span:nth-child(2) { grid-area: vrijeme; }
  .tjedni-opis { grid-area: opis; white-space: normal; }

  .akcije-tjedna {
    flex-direction: column;
  }
}

/* ==================== MOBITEL: dodatna prilagodba ==================== */
@media (max-width: 768px) {
  .videa-povijest {
    padding: 16px;
  }

  .vp-redak {
    grid-template-columns: 78px 1fr 30px;
    gap: 8px;
  }

  /* iOS zumira polja sa fontom manjim od 16px */
  .grupa-polja input:not([type='checkbox']),
  .grupa-polja select,
  .grupa-polja textarea {
    font-size: 16px;
    min-height: 44px;
  }

  .modal {
    max-height: 100%;
  }

  .gumb-akcija {
    padding: 9px;
  }

  .videa-dan-broj {
    font-size: 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
}
</style>
