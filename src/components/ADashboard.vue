<template>
  <div class="admin-ploca">
    <div class="bocna-traka" :class="{ 'otvorena': bocnaTrakaOtvorena }">
      <div class="bocna-traka-sadrzaj">
        <button class="zatvori-bocnu-traku" @click="toggleBocnaTraka">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="bocna-profil-sekcija">
          <div class="bocna-profil-ikona">
            {{ korisnikInicijali }}
          </div>
          <div class="bocna-korisnik-info">
            <div class="bocna-korisnik-email">{{ korisnikEmail }}</div>
            <div class="bocna-korisnik-uloga">Administrator</div>
          </div>
          <button class="gumb-tema" @click="toggleTemu">
            <span class="material-icons">{{ temaState.tamna ? 'light_mode' : 'dark_mode' }}</span>
            {{ temaState.tamna ? 'Svijetla tema' : 'Tamna tema' }}
          </button>

          <button v-if="faceIdCredentiali.length === 0" class="gumb-tema" @click="registrirajFaceId">
            <span class="material-icons">face</span>
            Registriraj Face ID
          </button>
          <div v-else class="faceid-lista">
            <div v-for="zapis in faceIdCredentiali" :key="zapis.id" class="faceid-redak">
              <span class="material-icons">verified_user</span>
              <span class="faceid-naziv">{{ zapis.naziv }}</span>
              <button class="faceid-ukloni" title="Ukloni" @click="ukloniFaceIdZapis(zapis)">
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <div class="odjava-sekcija">
            <button class="gumb-odjava" @click="odjaviKorisnika">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Odjava
            </button>
          </div>
        </div>

        <nav class="bocna-navigacija">
          <router-link
            v-for="stavka in navStavke"
            :key="stavka.to"
            :to="stavka.to"
            class="nav-stavka"
            v-bind="stavka.exact ? { 'exact-active-class': 'aktivna' } : { 'active-class': 'aktivna' }"
          >
            {{ stavka.label }}
          </router-link>
        </nav>
      </div>
    </div>

    <div v-if="bocnaTrakaOtvorena" class="bocna-overlay" @click="toggleBocnaTraka"></div>

    <button v-if="!bocnaTrakaOtvorena" class="otvori-bocnu-traku" @click="toggleBocnaTraka">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <div class="glavni-sadrzaj" :class="{ 'pomjeren': bocnaTrakaOtvorena }">
      <div class="sadrzaj-omotac">
        <div v-if="$route.path === '/admin'" class="dashboard-stranica">
          <div v-if="ucitavaPodatke" class="ucitavanje">
            <p>Učitavaju se podaci...</p>
          </div>

          <template v-else>
            <div class="pozdrav-traka">
              <h1 class="pozdrav-naslov">{{ pozdravTekst }}</h1>
              <span class="pozdrav-datum">{{ danasnjiDatumTekst }}</span>
            </div>

            <div class="pregled-grid">
              <router-link to="/admin/kalendar" class="pregled-kartica">
                <div class="pregled-ikona pregled-kalendar"><span class="material-icons">event</span></div>
                <div class="pregled-podaci">
                  <h3>Kalendar</h3>
                  <p class="pregled-glavno" v-if="sljedeciEvent">{{ sljedeciEvent.naslov }}</p>
                  <p class="pregled-glavno" v-else>Nema nadolazećih eventa</p>
                  <span v-if="sljedeciEvent" class="pregled-sub">{{ sljedeciEventOznaka }}<template v-if="eventiOvajTjedan > 1"> · još {{ eventiOvajTjedan - 1 }} ovaj tjedan</template></span>
                </div>
              </router-link>

              <router-link to="/admin/biznisbaza" class="pregled-kartica">
                <div class="pregled-ikona pregled-biznisbaza"><span class="material-icons">event_available</span></div>
                <div class="pregled-podaci">
                  <h3>BiznisBaza</h3>
                  <p class="pregled-glavno">{{ formatCurrency(biznisBazaOvajMjesecZarada) }}</p>
                  <span class="pregled-sub">{{ biznisBazaOvajMjesecSati.toFixed(1) }} h ovaj mjesec</span>
                </div>
              </router-link>

              <router-link to="/admin/zdravlje" class="pregled-kartica">
                <div class="pregled-ikona pregled-zdravlje"><span class="material-icons">monitor_heart</span></div>
                <div class="pregled-podaci">
                  <h3>Zdravlje</h3>
                  <p class="pregled-glavno" v-if="zadnjiZdravljeDan">{{ (zadnjiZdravljeDan.steps || 0).toLocaleString('hr-HR') }} koraka</p>
                  <p class="pregled-glavno" v-else>Nema podataka</p>
                  <span v-if="zadnjiZdravljeDan?.sleep_seconds" class="pregled-sub">San {{ formatSatiZdravlje(zadnjiZdravljeDan.sleep_seconds) }}</span>
                </div>
              </router-link>

              <router-link to="/admin/auto" class="pregled-kartica">
                <div class="pregled-ikona pregled-auto"><span class="material-icons">directions_car</span></div>
                <div class="pregled-podaci">
                  <h3>Auto</h3>
                  <p class="pregled-glavno">{{ formatCurrency(autoOvajMjesecTrosak) }}</p>
                  <span class="pregled-sub" :class="{ upozorenje: !autoOvajMjesecUpisano }">{{ autoOvajMjesecUpisano ? 'troška ovaj mjesec' : 'nisi upisao stanje ovaj mjesec' }}</span>
                </div>
              </router-link>
            </div>

            <div class="sekcija-dvostupci">
              <div class="sekcija uvid-kartica">
                <div class="sekcija-zaglavlje"><h2>{{ nazivOvogMjeseca }}</h2></div>
                <div class="uvid-glavni">
                  <span class="uvid-broj">{{ formatCurrency(ovajMjesecUkupno) }}</span>
                  <span class="uvid-trend" :class="trendKlasa">
                    <span class="material-icons">{{ promjenaGodisnje === null ? 'remove' : (promjenaGodisnje >= 0 ? 'trending_up' : 'trending_down') }}</span>
                    {{ promjenaGodisnje === null ? `Nema prihoda u ${nazivIstogMjesecaLani} za usporedbu` : `${promjenaGodisnje >= 0 ? '+' : ''}${promjenaGodisnje.toFixed(0)}% u odnosu na ${nazivIstogMjesecaLani}` }}
                  </span>
                </div>
                <div class="uvid-podredak">
                  <span>{{ ovajMjesecPrihodi.length }} {{ ovajMjesecPrihodi.length === 1 ? 'event' : 'eventa' }} · {{ ovajMjesecRadniDani }} {{ ovajMjesecRadniDani === 1 ? 'radni dan' : 'radnih dana' }} · {{ formatCurrency(ovajMjesecZaradaPoDanu) }} po danu</span>
                  <span>{{ nazivIstogMjesecaLani }}: {{ formatCurrency(istiMjesecLaniUkupno) }}</span>
                  <span class="uvid-neto-red">Neto: {{ formatCurrency(ovajMjesecNeto) }} ({{ formatCurrency(ovajMjesecNetoPoDanu) }} po danu)</span>
                </div>
                <div class="event-tagovi" v-if="ovajMjesecEventi.length">
                  <span class="event-tag" v-for="(e, i) in ovajMjesecEventi" :key="i">{{ e }}</span>
                </div>
              </div>

              <div class="sekcija uvid-kartica">
                <div class="sekcija-zaglavlje"><h2>Sveukupno (svih vremena)</h2></div>
                <div class="uvid-glavni">
                  <span class="uvid-broj">{{ formatCurrency(prosjekPoDanuSvihVremena) }}</span>
                  <span class="uvid-trend neutralno">
                    <span class="material-icons">calendar_month</span>
                    prosječna zarada po radnom danu
                  </span>
                </div>
                <div class="uvid-podredak">
                  <span>Ukupno zarađeno: {{ formatCurrency(ukupnoPrihodaSvihVremena) }}</span>
                  <span>{{ ukupnoRadnihDana }} {{ ukupnoRadnihDana === 1 ? 'radni dan' : 'radnih dana' }} · {{ prihodi.length }} {{ prihodi.length === 1 ? 'event' : 'eventa' }}</span>
                  <span class="uvid-neto-red">Neto: {{ formatCurrency(ukupnoNetoSvihVremena) }} ({{ formatCurrency(netoPoDanuSvihVremena) }} po danu)</span>
                </div>
              </div>
            </div>

            <div class="sekcija">
              <div class="sekcija-zaglavlje">
                <h2>Usporedba po godinama</h2>
              </div>
              <div v-if="godisnjaUsporedba.length === 0" class="prazan-sadrzaj">
                <p>Nema podataka</p>
              </div>
              <div v-else class="godine-graf">
                <div v-for="g in godisnjaUsporedba" :key="g.godina" class="godina-stupac">
                  <span class="godina-iznos">{{ formatCurrency(g.ukupno) }}</span>
                  <span
                    class="godina-promjena"
                    v-if="g.promjena !== null"
                    :class="g.promjena >= 0 ? 'pozitivno' : 'negativno'"
                  >{{ g.promjena >= 0 ? '+' : '' }}{{ g.promjena.toFixed(0) }}%</span>
                  <div class="godina-stupac-omotac">
                    <div
                      class="godina-stupac-traka"
                      :class="{ trenutna: g.trenutna }"
                      :style="{ height: g.visinaPx + 'px' }"
                    ></div>
                  </div>
                  <span class="godina-naziv">{{ g.godina }}</span>
                </div>
              </div>
            </div>

            <div class="sekcija">
              <div class="sekcija-zaglavlje">
                <h2>Pregled po mjesecima</h2>
                <select v-model="odabranaGodinaGrafa" class="godina-select">
                  <option v-for="g in dostupneGodineZaGraf" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
              <div v-if="mjeseciGraf.length === 0" class="prazan-sadrzaj">
                <p>Nema prihoda za {{ odabranaGodinaGrafa }}. godinu</p>
              </div>
              <div v-else class="mjeseci-graf">
                <div v-for="m in mjeseciGraf" :key="m.mjesec" class="mjesec-stupac">
                  <span class="mjesec-iznos" v-if="m.ukupno > 0">{{ formatCurrency(m.ukupno) }}</span>
                  <div class="mjesec-stupac-omotac">
                    <div
                      class="mjesec-stupac-traka"
                      :class="{ trenutni: m.trenutni }"
                      :style="{ height: m.visinaPx + 'px' }"
                    ></div>
                  </div>
                  <span class="mjesec-naziv">{{ m.kratica }}</span>
                </div>
              </div>
            </div>

            <div class="sekcija">
              <div class="sekcija-zaglavlje">
                <h2>Dani u tjednu</h2>
                <span class="lokacije-ukupno" v-if="najcesciDanUTjednu">Najčešće radiš {{ najcesciDanUTjednu.naziv }}</span>
              </div>
              <div v-if="ukupnoRadnihDanaZaTjedan === 0" class="prazan-sadrzaj">
                <p>Nema podataka</p>
              </div>
              <div v-else class="dani-graf">
                <div v-for="dan in raspodjelaPoDanima" :key="dan.naziv" class="dan-stupac">
                  <span class="dan-postotak">{{ dan.postotak.toFixed(0) }}%</span>
                  <div class="dan-stupac-traka-omotac">
                    <div
                      class="dan-stupac-traka"
                      :class="{ najcesci: najcesciDanUTjednu && dan.naziv === najcesciDanUTjednu.naziv }"
                      :style="{ height: dan.visinaPx + 'px' }"
                    ></div>
                  </div>
                  <span class="dan-naziv">{{ dan.naziv }}</span>
                  <span class="dan-broj">{{ dan.broj }}</span>
                </div>
              </div>
            </div>

            <div class="sekcija" v-if="suradniciSummary.length > 0">
              <div class="sekcija-zaglavlje">
                <h2>S kime najviše radiš</h2>
              </div>
              <div class="suradnici-lista">
                <div v-for="(s, i) in suradniciSummary" :key="s.ime" class="suradnik-red">
                  <span class="suradnik-rang">{{ i + 1 }}.</span>
                  <span class="suradnik-tockica" :style="{ backgroundColor: bojaZaSuradnika(s.ime) }"></span>
                  <span class="suradnik-ime">{{ s.ime }}</span>
                  <span class="suradnik-broj">{{ s.brojEventa }} {{ s.brojEventa === 1 ? 'event' : 'eventa' }}</span>
                </div>
              </div>
            </div>

            <div class="sekcija">
              <div class="sekcija-zaglavlje">
                <h2>Lokacije</h2>
                <span class="lokacije-ukupno">{{ lokacijeSummary.length }} {{ lokacijeSummary.length === 1 ? 'grad' : 'gradova' }} · {{ ukupnoRadnihDana }} radnih dana ukupno</span>
              </div>
              <div v-if="lokacijeSummary.length === 0" class="prazan-sadrzaj">
                <p>Nema unesenih lokacija</p>
              </div>
              <div v-else class="lokacije-lista">
                <div v-for="grad in lokacijeSummary" :key="grad.grad" class="grad-grupa">
                  <div class="grad-red" @click="toggleGrad(grad.grad)">
                    <span class="material-icons grad-strelica">{{ prosireniGradovi.has(grad.grad) ? 'expand_more' : 'chevron_right' }}</span>
                    <span class="grad-naziv">{{ grad.grad }}</span>
                    <span class="grad-broj">{{ grad.brojEventa }} {{ grad.brojEventa === 1 ? 'event' : 'eventa' }}</span>
                    <span class="grad-dani">{{ grad.radniDani }} {{ grad.radniDani === 1 ? 'radni dan' : 'radnih dana' }}</span>
                  </div>
                  <div v-if="prosireniGradovi.has(grad.grad)" class="adrese-lista">
                    <div v-for="adr in grad.adrese" :key="adr.adresa" class="adresa-red">
                      <span class="adresa-naziv" :title="adr.adresa">{{ adr.adresa }}</span>
                      <span class="adresa-broj">{{ adr.brojEventa }} {{ adr.brojEventa === 1 ? 'event' : 'eventa' }}</span>
                      <span class="adresa-dani">{{ adr.radniDani }} {{ adr.radniDani === 1 ? 'dan' : 'dana' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <router-view v-else v-slot="{ Component }">
          <transition name="stranica-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <ABottomNav
      :korisnik-email="korisnikEmail"
      :tema-tamna="temaState.tamna"
      @toggle-tema="toggleTemu"
      @odjava="odjaviKorisnika"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { db, auth } from '@/services/firebase.js';
import { navStavke } from '@/config/navigacija.js';
import ABottomNav from './ABottomNav.vue';
import { dohvatiRegistrirane, registrirajNoviCredential, ukloniCredential, jePodrzano } from '@/services/webauthn.js';
import {
  collection,
  getDocs
} from 'firebase/firestore';

const router = useRouter();
const { logout: authLogout } = useAuth();
const { state: temaState, toggleTemu } = useTheme();

const bocnaTrakaOtvorena = ref(false);
const prihodi = ref([]);
const kalendarEventi = ref([]);
const biznisBazaUnosi = ref([]);
const zdravljeDaniList = ref([]);
const autoUnosi = ref([]);
const ucitavaPodatke = ref(true);
const faceIdCredentiali = ref([]);

const korisnikEmail = computed(() => 'naddinko@gmail.com');
const korisnikInicijali = computed(() => korisnikEmail.value.charAt(0).toUpperCase());

const toggleBocnaTraka = () => {
  bocnaTrakaOtvorena.value = !bocnaTrakaOtvorena.value;
};

const odjaviKorisnika = async () => {
  try {
    await authLogout();
    router.push('/login');
  } catch (error) {
    console.error('Greška prilikom odjave:', error);
  }
};

const ucitajPodatke = async () => {
  ucitavaPodatke.value = true;
  try {
    const [prihodiSnap, kalendarSnap, biznisBazaSnap, zdravljeSnap, autoSnap] = await Promise.all([
      getDocs(collection(db, 'prihodi')),
      getDocs(collection(db, 'kalendar-eventi')),
      getDocs(collection(db, 'raspored-aktivnosti')),
      getDocs(collection(db, 'zdravlje-dani')),
      getDocs(collection(db, 'auto')),
    ]);
    prihodi.value = prihodiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    kalendarEventi.value = kalendarSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    biznisBazaUnosi.value = biznisBazaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    zdravljeDaniList.value = zdravljeSnap.docs
      .map(d => ({ datum: d.id, ...d.data() }))
      .sort((a, b) => b.datum.localeCompare(a.datum));
    autoUnosi.value = autoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Greška pri učitavanju podataka za dashboard:', error);
  } finally {
    ucitavaPodatke.value = false;
  }
};

// ==================== PREGLED (Kalendar / BiznisBaza / Zdravlje / Auto) ====================
const danStringLokalno = (d) => {
  const godina = d.getFullYear();
  const mjesec = String(d.getMonth() + 1).padStart(2, '0');
  const dan = String(d.getDate()).padStart(2, '0');
  return `${godina}-${mjesec}-${dan}`;
};

const pozdravTekst = computed(() => {
  const sat = new Date().getHours();
  if (sat < 5) return 'Laku noć 🌙';
  if (sat < 11) return 'Dobro jutro 👋';
  if (sat < 18) return 'Dobar dan 👋';
  return 'Dobra večer 👋';
});

const danasnjiDatumTekst = computed(() =>
  new Date().toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })
);

const eventiOvajTjedan = computed(() => {
  const danasStr = danStringLokalno(new Date());
  const zaTjedanDana = new Date();
  zaTjedanDana.setDate(zaTjedanDana.getDate() + 7);
  const zaTjedanStr = danStringLokalno(zaTjedanDana);
  return kalendarEventi.value.filter(e => e.dan >= danasStr && e.dan <= zaTjedanStr).length;
});

const sljedeciEvent = computed(() => {
  const danasStr = danStringLokalno(new Date());
  const buduci = kalendarEventi.value
    .filter(e => e.dan >= danasStr)
    .sort((a, b) => (a.dan === b.dan ? (a.pocetak || '').localeCompare(b.pocetak || '') : a.dan.localeCompare(b.dan)));
  return buduci[0] || null;
});

const sljedeciEventOznaka = computed(() => {
  if (!sljedeciEvent.value) return '';
  const danasStr = danStringLokalno(new Date());
  const sutraDatum = new Date();
  sutraDatum.setDate(sutraDatum.getDate() + 1);
  const sutraStr = danStringLokalno(sutraDatum);
  if (sljedeciEvent.value.dan === danasStr) return 'Danas';
  if (sljedeciEvent.value.dan === sutraStr) return 'Sutra';
  return new Date(sljedeciEvent.value.dan).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long' });
});

const trenutniMjesecPrefiks = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const biznisBazaOvajMjesecUnosi = computed(() =>
  biznisBazaUnosi.value.filter(u => u.datum && u.datum.startsWith(trenutniMjesecPrefiks.value))
);
const biznisBazaOvajMjesecSati = computed(() =>
  biznisBazaOvajMjesecUnosi.value.reduce((s, u) => s + (parseFloat(u.satiRada) || 0), 0)
);
const biznisBazaOvajMjesecZarada = computed(() =>
  biznisBazaOvajMjesecUnosi.value.reduce((s, u) => s + (parseFloat(u.zarada) || 0), 0)
);

const zadnjiZdravljeDan = computed(() => zdravljeDaniList.value[0] || null);

const formatSatiZdravlje = (sekunde) => {
  if (!sekunde) return '-';
  const h = Math.floor(sekunde / 3600);
  const m = Math.round((sekunde % 3600) / 60);
  return `${h}h ${m}min`;
};

const autoOvajMjesecTrosak = computed(() => {
  const mjesecPrefiks = trenutniMjesecPrefiks.value;
  const troskovi = autoUnosi.value
    .filter(u => (u.tip === 'servis' || u.tip === 'registracija') && u.datum && u.datum.startsWith(mjesecPrefiks))
    .reduce((s, u) => s + (parseFloat(u.iznos) || 0), 0);
  const gorivo = autoUnosi.value
    .filter(u => u.tip === 'ocitanje-km' && u.mjesec === mjesecPrefiks && u.litreGoriva && u.cijenaPoLitri)
    .reduce((s, u) => s + (u.litreGoriva * u.cijenaPoLitri), 0);
  return troskovi + gorivo;
});

const autoOvajMjesecUpisano = computed(() =>
  autoUnosi.value.some(u => u.tip === 'ocitanje-km' && u.mjesec === trenutniMjesecPrefiks.value)
);

// ==================== OVAJ MJESEC VS ISTI MJESEC PROŠLE GODINE ====================
const nazviMjeseci = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
];

const danas = new Date();
const pocetakOvogMjeseca = new Date(danas.getFullYear(), danas.getMonth(), 1);
const pocetakIstogMjesecaLani = new Date(danas.getFullYear() - 1, danas.getMonth(), 1);
const krajIstogMjesecaLani = new Date(danas.getFullYear() - 1, danas.getMonth() + 1, 0, 23, 59, 59);

const nazivOvogMjeseca = computed(() => `${nazviMjeseci[danas.getMonth()]} ${danas.getFullYear()}`);
const nazivIstogMjesecaLani = computed(() => `${nazviMjeseci[danas.getMonth()]} ${danas.getFullYear() - 1}`);

// ono sto je stvarno tvoje s prihoda (i putni trosak i dano bratu iskljuceni) - koristi se za "Neto" liniju
const netoZaPrihod = (p) => {
  return (parseFloat(p.cijena) || 0) - (parseFloat(p.putniTrosak) || 0) - (parseFloat(p.danoBratu) || 0);
};

// "Ukupno" iskljucuje samo bratov dio (to nikad nije tvoje), ali NE i putni trosak - taj ostaje u "Ukupno"
const bezBrataZaPrihod = (p) => {
  return (parseFloat(p.cijena) || 0) - (parseFloat(p.danoBratu) || 0);
};

const ovajMjesecPrihodi = computed(() => {
  return prihodi.value.filter(p => p.datumSnimanja && new Date(p.datumSnimanja) >= pocetakOvogMjeseca);
});

const istiMjesecLaniPrihodi = computed(() => {
  return prihodi.value.filter(p => {
    if (!p.datumSnimanja) return false;
    const d = new Date(p.datumSnimanja);
    return d >= pocetakIstogMjesecaLani && d <= krajIstogMjesecaLani;
  });
});

// bruto (puna cijena) - glavni broj na kartici; neto se prikazuje odvojeno ispod
const ovajMjesecUkupno = computed(() => ovajMjesecPrihodi.value.reduce((s, p) => s + bezBrataZaPrihod(p), 0));
const istiMjesecLaniUkupno = computed(() => istiMjesecLaniPrihodi.value.reduce((s, p) => s + bezBrataZaPrihod(p), 0));
const ovajMjesecNeto = computed(() => ovajMjesecPrihodi.value.reduce((s, p) => s + netoZaPrihod(p), 0));
const ovajMjesecNetoPoDanu = computed(() => {
  if (ovajMjesecRadniDani.value === 0) return 0;
  return ovajMjesecNeto.value / ovajMjesecRadniDani.value;
});

const promjenaGodisnje = computed(() => {
  if (istiMjesecLaniUkupno.value === 0) return null;
  return ((ovajMjesecUkupno.value - istiMjesecLaniUkupno.value) / istiMjesecLaniUkupno.value) * 100;
});

const trendKlasa = computed(() => {
  if (promjenaGodisnje.value === null) return 'neutralno';
  return promjenaGodisnje.value >= 0 ? 'pozitivno' : 'negativno';
});

const brojDanaPrihoda = (p) => {
  if (!p?.datumZavrsetak || !p?.datumSnimanja) return 1;
  const pocetak = new Date(p.datumSnimanja);
  const kraj = new Date(p.datumZavrsetak);
  const dani = Math.round((kraj - pocetak) / (1000 * 60 * 60 * 24)) + 1;
  return dani > 0 ? dani : 1;
};

const ovajMjesecRadniDani = computed(() => {
  return ovajMjesecPrihodi.value.reduce((s, p) => s + brojDanaPrihoda(p), 0);
});

const ovajMjesecZaradaPoDanu = computed(() => {
  if (ovajMjesecRadniDani.value === 0) return 0;
  return ovajMjesecUkupno.value / ovajMjesecRadniDani.value;
});

const ovajMjesecEventi = computed(() => {
  return ovajMjesecPrihodi.value.map(p => p.nazivEventa).filter(Boolean);
});

// ==================== SVEUKUPNO (SVIH VREMENA) ====================
// "Ukupno" ovdje ne racuna bratov dio, ali racuna putni trosak - pun neto je posebna linija ispod
const ukupnoPrihodaSvihVremena = computed(() => {
  return prihodi.value.reduce((s, p) => s + bezBrataZaPrihod(p), 0);
});

const ukupnoNetoSvihVremena = computed(() => {
  return prihodi.value.reduce((s, p) => s + netoZaPrihod(p), 0);
});

const netoPoDanuSvihVremena = computed(() => {
  if (ukupnoRadnihDana.value === 0) return 0;
  return ukupnoNetoSvihVremena.value / ukupnoRadnihDana.value;
});

const prosjekPoDanuSvihVremena = computed(() => {
  if (ukupnoRadnihDana.value === 0) return 0;
  return ukupnoPrihodaSvihVremena.value / ukupnoRadnihDana.value;
});

// ==================== SURADNICI ====================
// ista paleta i logika kao u APrihodi.vue - da isto ime uvijek dobije istu boju na obje stranice
const paletaBojaSuradnika = [
  '#5D8AA8', '#9C7A54', '#8E44AD', '#E67E22', '#16A085', '#3949AB', '#C2185B', '#6D4C41',
  '#00838F', '#AD1457', '#558B2F', '#4527A0', '#D84315', '#00695C', '#757575', '#1565C0'
];

// stariji prihodi imaju jednog suradnika kao string (suradnik), noviji kao niz (suradnici) - ujednacavamo
const suradniciZaPrihod = (prihod) => {
  if (Array.isArray(prihod?.suradnici) && prihod.suradnici.length) return prihod.suradnici;
  if (prihod?.suradnik?.trim()) return [prihod.suradnik.trim()];
  return [];
};

// abecedna lista svih poznatih suradnika - boja se dodjeljuje po redoslijedu u ovoj listi,
// ne po hashu imena, da se garantirano ne poklope dok god ima manje ljudi nego boja u paleti
const postojeciSuradnici = computed(() => {
  const skup = new Set();
  prihodi.value.forEach(p => {
    suradniciZaPrihod(p).forEach(ime => skup.add(ime));
  });
  return Array.from(skup).sort((a, b) => a.localeCompare(b, 'hr'));
});

const bojaZaSuradnika = (ime) => {
  if (!ime) return paletaBojaSuradnika[0];
  const indeks = postojeciSuradnici.value.indexOf(ime);
  if (indeks === -1) return paletaBojaSuradnika[0];
  return paletaBojaSuradnika[indeks % paletaBojaSuradnika.length];
};

const suradniciSummary = computed(() => {
  const mapa = {};
  prihodi.value.forEach(p => {
    suradniciZaPrihod(p).forEach(ime => {
      mapa[ime] = (mapa[ime] || 0) + 1;
    });
  });
  return Object.entries(mapa)
    .map(([ime, brojEventa]) => ({ ime, brojEventa }))
    .sort((a, b) => b.brojEventa - a.brojEventa);
});

// ==================== LOKACIJE ====================
// Nominatim adrese za HR variraju u strukturi (grad/opcina/zupanija/posta se ne pojavljuju uvijek
// istim redoslijedom, a poštanski broj zna biti spojen s nazivom mjesta, npr. "52404 Svetvinčenat").
// Zato filtriramo prepoznatljive dijelove (drzava, zupanija, posta) umjesto da ih skidamo po poziciji.
const izvuciGrad = (lokacija) => {
  if (!lokacija) return 'Nepoznato';
  let dijelovi = lokacija.split(',').map(d => d.trim()).filter(Boolean);
  if (dijelovi.length === 0) return 'Nepoznato';

  const izvorniPrvi = dijelovi[0];

  // makni drzavu i zupaniju gdje god se nalazile u nizu
  dijelovi = dijelovi.filter(d => !/hrvatska|croatia/i.test(d) && !/županija/i.test(d));
  // makni segmente koji su samo postanski broj
  dijelovi = dijelovi.filter(d => !/^\d{4,6}$/.test(d));
  // skini postanski broj spojen s nazivom mjesta (npr. "52404 Svetvinčenat" -> "Svetvinčenat")
  dijelovi = dijelovi.map(d => d.replace(/^\d{4,6}[\s-]+/, ''));

  if (dijelovi.length === 0) return izvorniPrvi;

  const grad = dijelovi[dijelovi.length - 1].replace(/^(Grad|Općina)\s+/i, '').trim();
  return grad || izvorniPrvi;
};

const lokacijeSummary = computed(() => {
  const gradovi = {};

  prihodi.value.forEach(p => {
    const punaAdresa = p.lokacija?.trim() || 'Nepoznato';
    const grad = izvuciGrad(punaAdresa);
    const dani = brojDanaPrihoda(p);

    if (!gradovi[grad]) {
      gradovi[grad] = { grad, radniDani: 0, brojEventa: 0, adrese: {} };
    }
    gradovi[grad].radniDani += dani;
    gradovi[grad].brojEventa++;

    if (!gradovi[grad].adrese[punaAdresa]) {
      gradovi[grad].adrese[punaAdresa] = { adresa: punaAdresa, radniDani: 0, brojEventa: 0 };
    }
    gradovi[grad].adrese[punaAdresa].radniDani += dani;
    gradovi[grad].adrese[punaAdresa].brojEventa++;
  });

  return Object.values(gradovi)
    .map(g => ({ ...g, adrese: Object.values(g.adrese).sort((a, b) => b.radniDani - a.radniDani) }))
    .sort((a, b) => b.radniDani - a.radniDani);
});

const ukupnoRadnihDana = computed(() => {
  return lokacijeSummary.value.reduce((s, grad) => s + grad.radniDani, 0);
});

const prosireniGradovi = ref(new Set());
const toggleGrad = (grad) => {
  if (prosireniGradovi.value.has(grad)) {
    prosireniGradovi.value.delete(grad);
  } else {
    prosireniGradovi.value.add(grad);
  }
};

// ==================== USPOREDBA PO GODINAMA ====================
const godisnjaUsporedba = computed(() => {
  const mapa = {};
  prihodi.value.forEach(p => {
    if (!p.datumSnimanja) return;
    const godina = new Date(p.datumSnimanja).getFullYear();
    if (isNaN(godina)) return;
    mapa[godina] = (mapa[godina] || 0) + bezBrataZaPrihod(p);
  });

  const godine = Object.keys(mapa).map(Number).sort((a, b) => a - b);
  if (godine.length === 0) return [];

  const trenutnaGodina = new Date().getFullYear();
  const maxUkupno = Math.max(...godine.map(g => mapa[g]), 0);

  return godine.map((godina, i) => {
    const ukupno = mapa[godina];
    const prosla = i > 0 ? mapa[godine[i - 1]] : null;
    const promjena = prosla ? ((ukupno - prosla) / prosla) * 100 : null;

    return {
      godina,
      ukupno,
      promjena,
      trenutna: godina === trenutnaGodina,
      visinaPx: maxUkupno > 0 ? Math.max(6, Math.round((ukupno / maxUkupno) * 140)) : 0
    };
  });
});

// ==================== PREGLED PO MJESECIMA (GRAF) ====================
const kraticeMjeseci = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

const odabranaGodinaGrafa = ref(new Date().getFullYear().toString());

const dostupneGodineZaGraf = computed(() => {
  const godine = new Set([new Date().getFullYear().toString()]);
  prihodi.value.forEach(p => {
    if (p.datumSnimanja) {
      godine.add(new Date(p.datumSnimanja).getFullYear().toString());
    }
  });
  return Array.from(godine).sort((a, b) => b - a);
});

const mjeseciGraf = computed(() => {
  const iznosiPoMjesecu = Array(12).fill(0);
  let imaPodataka = false;

  prihodi.value.forEach(p => {
    if (!p.datumSnimanja) return;
    const d = new Date(p.datumSnimanja);
    if (d.getFullYear().toString() !== odabranaGodinaGrafa.value) return;
    iznosiPoMjesecu[d.getMonth()] += bezBrataZaPrihod(p);
    imaPodataka = true;
  });

  if (!imaPodataka) return [];

  const maxIznos = Math.max(...iznosiPoMjesecu, 0);
  const trenutniDatum = new Date();
  const trenutniJeOdabranaGodina = trenutniDatum.getFullYear().toString() === odabranaGodinaGrafa.value;

  return kraticeMjeseci.map((kratica, i) => ({
    mjesec: i,
    kratica,
    ukupno: iznosiPoMjesecu[i],
    trenutni: trenutniJeOdabranaGodina && trenutniDatum.getMonth() === i,
    visinaPx: maxIznos > 0 ? Math.max(4, Math.round((iznosiPoMjesecu[i] / maxIznos) * 140)) : 0
  }));
});

// ==================== DANI U TJEDNU ====================
const naziviDanaTjedna = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
// JS getDay() vraca 0=Ned..6=Sub, mapiramo na poredak Pon..Ned (index 0..6)
const indeksDanaTjedna = (jsDan) => (jsDan + 6) % 7;

const raspodjelaPoDanima = computed(() => {
  const brojaci = [0, 0, 0, 0, 0, 0, 0];

  prihodi.value.forEach(p => {
    if (!p.datumSnimanja) return;
    const pocetak = new Date(p.datumSnimanja);
    const kraj = p.datumZavrsetak ? new Date(p.datumZavrsetak) : pocetak;
    if (isNaN(pocetak) || isNaN(kraj)) return;

    const trenutni = new Date(pocetak);
    while (trenutni <= kraj) {
      brojaci[indeksDanaTjedna(trenutni.getDay())]++;
      trenutni.setDate(trenutni.getDate() + 1);
    }
  });

  const ukupno = brojaci.reduce((s, b) => s + b, 0);

  const sirovo = naziviDanaTjedna.map((naziv, i) => ({
    naziv,
    broj: brojaci[i],
    postotak: ukupno > 0 ? (brojaci[i] / ukupno) * 100 : 0
  }));

  const maxPostotak = Math.max(...sirovo.map(d => d.postotak), 0);

  return sirovo.map(d => ({
    ...d,
    visinaPx: maxPostotak > 0 ? Math.max(6, Math.round((d.postotak / maxPostotak) * 140)) : 0
  }));
});

const ukupnoRadnihDanaZaTjedan = computed(() => {
  return raspodjelaPoDanima.value.reduce((s, d) => s + d.broj, 0);
});

const najcesciDanUTjednu = computed(() => {
  if (ukupnoRadnihDanaZaTjedan.value === 0) return null;
  return [...raspodjelaPoDanima.value].sort((a, b) => b.broj - a.broj)[0];
});

const formatCurrency = (value) => {
  return `${parseFloat(value || 0).toFixed(2)} EUR`;
};

const registrirajFaceId = async () => {
  if (!jePodrzano()) {
    alert('Ovaj uređaj/preglednik ne podržava Face ID / Touch ID / Windows Hello.');
    return;
  }
  const nazivUredaja = prompt('Naziv uređaja (npr. iPhone):', 'iPhone') || 'Uređaj';
  try {
    const idToken = await auth.currentUser.getIdToken();
    await registrirajNoviCredential(idToken, nazivUredaja);
    faceIdCredentiali.value = await dohvatiRegistrirane();
    alert('Face ID je registriran na ovom uređaju.');
  } catch (error) {
    console.error('Greška pri registraciji Face ID:', error);
    alert('Registracija nije uspjela: ' + error.message);
  }
};

const ukloniFaceIdZapis = async (zapis) => {
  if (!confirm(`Ukloniti Face ID za "${zapis.naziv}"?`)) return;
  try {
    await ukloniCredential(zapis);
    faceIdCredentiali.value = faceIdCredentiali.value.filter(c => c.id !== zapis.id);
  } catch (error) {
    console.error('Greška pri uklanjanju Face ID zapisa:', error);
  }
};

onMounted(() => {
  ucitajPodatke();
  dohvatiRegistrirane().then(lista => { faceIdCredentiali.value = lista; });
});
</script>

<style scoped>
.admin-ploca {
  display: flex;
  height: 100vh;
  background-color: var(--bg-page);
  font-family: 'Roboto', sans-serif;
  position: relative;
}

.bocna-traka {
  position: fixed;
  left: -250px;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: rgba(18, 52, 88, 0.78);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  color: white;
  transition: left 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.bocna-traka.otvorena {
  left: 0;
}

.bocna-traka-sadrzaj {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.zatvori-bocnu-traku {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.zatvori-bocnu-traku:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.bocna-profil-sekcija {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.bocna-profil-ikona {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
  margin: 0 auto;
}

.bocna-korisnik-info {
  text-align: center;
}

.bocna-korisnik-email {
  font-size: 0.9rem;
  opacity: 0.9;
  word-break: break-word;
  margin-bottom: 4px;
}

.bocna-korisnik-uloga {
  font-size: 0.8rem;
  opacity: 0.7;
  color: #D4C9BE;
}

.odjava-sekcija {
  display: flex;
  justify-content: center;
}

.gumb-tema {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  margin-bottom: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gumb-tema .material-icons {
  font-size: 18px;
}

.gumb-tema:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.faceid-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.faceid-redak {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  font-size: 0.8rem;
}

.faceid-redak .material-icons:first-child {
  font-size: 16px;
  color: #8FB2CC;
}

.faceid-naziv {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.faceid-ukloni {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  padding: 2px;
}

.faceid-ukloni .material-icons {
  font-size: 16px;
}

.gumb-odjava {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gumb-odjava:hover {
  background-color: #c62828;
}

.bocna-navigacija {
  flex: 1;
  margin-bottom: 10px;
}

.nav-stavka {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 5px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  cursor: pointer;
  text-align: center;
}

.nav-stavka:hover,
.nav-stavka.aktivna {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-stavka.aktivna {
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid #D4C9BE;
}

.bocna-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

.otvori-bocnu-traku {
  position: fixed;
  top: 15px;
  left: 15px;
  background-color: #123458;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.otvori-bocnu-traku:hover {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.glavni-sadrzaj {
  flex: 1;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
  /* na iPhoneu (viewport-fit=cover + black-translucent) sadržaj se crta ispod
     statusne trake/dynamic islanda - ovo ga spusti ispod njih */
  padding-top: env(safe-area-inset-top, 0px);
}

.glavni-sadrzaj.pomjeren {
  margin-left: 250px;
}

.glavni-sadrzaj.pomjeren {
  margin-left: 300px;
}

.sadrzaj-omotac {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

.dashboard-stranica {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.ucitavanje {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-radius: var(--radius-card);
  padding: 40px;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
}

.sekcija-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
  flex-wrap: wrap;
}

.sekcija-zaglavlje h2 {
  color: var(--text-heading);
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
}

.gumb-kalendar {
  padding: 10px 18px;
  background-color: var(--accent);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gumb-kalendar:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}


.prazan-sadrzaj {
  color: var(--text-heading);
  padding: 30px 20px;
  text-align: center;
}

.prazan-sadrzaj p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.sekcija-dvostupci {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

/* ==================== POZDRAVNA TRAKA ==================== */
.pozdrav-traka {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.pozdrav-naslov {
  margin: 0;
  color: var(--text-heading);
  font-weight: 700;
  font-size: 1.8rem;
}

.pozdrav-datum {
  color: var(--text-muted);
  font-size: 1rem;
  text-transform: capitalize;
}

/* ==================== PREGLED (Kalendar / BiznisBaza / Zdravlje / Auto) ==================== */
.pregled-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.pregled-kartica {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 18px;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pregled-kartica:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.pregled-ikona {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--bg-card-muted);
  color: var(--accent);
}

.pregled-kalendar {
  background-color: color-mix(in srgb, var(--accent-soft) 20%, transparent);
  color: var(--accent-soft);
}

.pregled-biznisbaza {
  background-color: color-mix(in srgb, var(--success) 18%, transparent);
  color: var(--success);
}

.pregled-zdravlje {
  background-color: color-mix(in srgb, var(--danger) 16%, transparent);
  color: var(--danger);
}

.pregled-auto {
  background-color: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.pregled-podaci {
  min-width: 0;
}

.pregled-podaci h3 {
  margin: 0 0 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.pregled-glavno {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pregled-sub {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.pregled-sub.upozorenje {
  color: var(--danger);
  font-weight: 500;
}

/* ==================== UVID KARTICE (Ovaj mjesec / Oprema / Vjernost) ==================== */
.uvid-glavni {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.uvid-broj {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-heading);
}

.uvid-trend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.uvid-trend .material-icons {
  font-size: 20px;
}

.uvid-trend.pozitivno { color: var(--success); }
.uvid-trend.negativno { color: var(--danger); }
.uvid-trend.neutralno { color: var(--text-muted); }

.uvid-podredak {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.uvid-neto-red {
  color: #9C7A54;
  font-style: italic;
}

.event-tagovi {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.event-tag {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid var(--border-color);
}

/* ==================== SURADNICI ==================== */
.suradnici-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suradnik-red {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-bottom: 1px solid var(--bg-card-muted);
}

.suradnik-red:last-child {
  border-bottom: none;
}

.suradnik-rang {
  color: var(--text-muted);
  font-weight: 700;
  width: 20px;
}

.suradnik-tockica {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.suradnik-ime {
  flex: 1;
  color: var(--text-heading);
  font-weight: 500;
}

.suradnik-broj {
  color: var(--success);
  font-weight: 700;
  font-size: 0.9rem;
}

/* ==================== LOKACIJE ==================== */
.lokacije-ukupno {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.lokacije-lista {
  display: flex;
  flex-direction: column;
  max-height: 560px;
  overflow-y: auto;
}

.grad-grupa {
  border-bottom: 1px solid var(--bg-card-muted);
}

.grad-grupa:last-child {
  border-bottom: none;
}

.grad-red {
  display: grid;
  grid-template-columns: 28px 1fr 100px 140px;
  gap: 10px;
  align-items: center;
  padding: 14px 10px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.grad-red:hover {
  background-color: var(--bg-card-muted);
}

.grad-strelica {
  color: var(--text-muted);
  font-size: 20px;
}

.grad-naziv {
  color: var(--text-heading);
  font-weight: 600;
}

.grad-broj,
.grad-dani {
  color: var(--text-heading);
  font-weight: 600;
  text-align: right;
  font-size: 0.9rem;
  white-space: nowrap;
}

.grad-dani {
  color: var(--success);
}

.adrese-lista {
  display: flex;
  flex-direction: column;
  padding: 0 10px 12px 48px;
}

.adresa-red {
  display: grid;
  grid-template-columns: 1fr 90px 90px;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  font-size: 0.85rem;
}

.adresa-naziv {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adresa-broj,
.adresa-dani {
  color: var(--text-heading);
  text-align: right;
  white-space: nowrap;
}

.godina-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: var(--bg-card);
  color: var(--text-heading);
  font-weight: 500;
}

.godina-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(18, 52, 88, 0.1);
}

/* ==================== PREGLED PO MJESECIMA (GRAF) ==================== */
.mjeseci-graf {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.mjesec-stupac {
  flex: 1;
  min-width: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mjesec-iznos {
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.7rem;
  white-space: nowrap;
}

.mjesec-stupac-omotac {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mjesec-stupac-traka {
  width: 60%;
  max-width: 32px;
  background-color: var(--border-color);
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.mjesec-stupac-traka.trenutni {
  background-color: var(--accent);
}

.mjesec-naziv {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8rem;
}

/* ==================== USPOREDBA PO GODINAMA ==================== */
.godine-graf {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 28px;
  padding-top: 10px;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.godina-stupac {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 70px;
}

.godina-iznos {
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
}

.godina-promjena {
  font-size: 0.75rem;
  font-weight: 600;
}

.godina-promjena.pozitivno { color: var(--success); }
.godina-promjena.negativno { color: var(--danger); }

.godina-stupac-omotac {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.godina-stupac-traka {
  width: 56px;
  background-color: var(--border-color);
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.godina-stupac-traka.trenutna {
  background-color: var(--accent);
}

.godina-naziv {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 0.9rem;
}

/* ==================== DANI U TJEDNU ==================== */
.dani-graf {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.dan-stupac {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dan-postotak {
  color: var(--text-heading);
  font-weight: 700;
  font-size: 0.95rem;
}

.dan-stupac-traka-omotac {
  width: 100%;
  max-width: 44px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.dan-stupac-traka {
  width: 100%;
  background-color: var(--border-color);
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.dan-stupac-traka.najcesci {
  background-color: var(--accent);
}

.dan-naziv {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 0.85rem;
}

.dan-broj {
  color: var(--text-muted);
  font-size: 0.75rem;
}

@media (max-width: 1024px) {
  .glavni-sadrzaj.pomjeren {
    margin-left: 0;
  }
  
  .bocna-overlay {
    display: block;
  }

  .sadrzaj-omotac {
    padding: 30px;
  }

  .sekcija {
    padding: 30px;
  }

  .sekcija-dvostupci {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sadrzaj-omotac {
    padding: 20px;
  }

  .grad-red {
    grid-template-columns: 22px minmax(0, 1fr) auto auto;
    gap: 8px;
    font-size: 0.85rem;
  }

  .grad-naziv {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .grad-broj, .grad-dani {
    font-size: 0.78rem;
  }

  .adrese-lista {
    padding-left: 32px;
  }

  .adresa-red {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    font-size: 0.8rem;
  }

  .adresa-broj, .adresa-dani {
    font-size: 0.75rem;
  }

  .godina-select {
    width: 100%;
  }

  .sekcija {
    padding: 20px;
  }

  .sekcija-zaglavlje h2 {
    font-size: 1.3rem;
  }

  .sekcija-zaglavlje {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .gumb-kalendar {
    text-align: center;
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .sekcija-dvostupci {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .uvid-broj {
    font-size: 1.8rem;
  }

  .bocna-traka,
  .otvori-bocnu-traku,
  .bocna-overlay {
    display: none !important;
  }

  .glavni-sadrzaj.pomjeren {
    margin-left: 0;
  }

  .sadrzaj-omotac {
    padding-bottom: 88px;
  }

  .traka-sadrzaj {
    padding: 0 20px;
  }
}

@media (max-width: 480px) {
  .sadrzaj-omotac {
    padding: 15px;
  }

  .dashboard-stranica {
    gap: 25px;
  }

  .sekcija {
    padding: 15px;
  }

  .sekcija-zaglavlje h2 {
    font-size: 1.1rem;
  }

  .uvid-broj {
    font-size: 1.5rem;
  }

  .adresa-red {
    font-size: 0.72rem;
    gap: 2px 6px;
  }

  .grad-red {
    font-size: 0.78rem;
    gap: 2px 6px;
  }

  .traka-sadrzaj {
    padding: 0 15px;
  }

  .bocna-traka-sadrzaj {
    padding: 15px;
  }

  .gumb-kalendar {
    padding: 8px 14px;
    font-size: 0.85rem;
  }

  .prazan-sadrzaj p {
    font-size: 0.9rem;
  }
}
</style>