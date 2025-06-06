<template>
  <div class="kontejner-kalendara">
    <h1 class="naslov">Kalendar</h1>
    
    <div class="zaglavlje-kalendara">
      <div class="akcije-zaglavlja">
        <button @click="prikaziEmailPostavke = true" class="gumb-postavke">
          Email postavke
        </button>
        <button @click="prikaziModalDodajDogadaj = true" class="gumb-dodaj-dogadaj">
          + Dodaj događaj
        </button>
      </div>
    </div>

    <div v-if="prikaziEmailPostavke" class="prekrivka-modala" @click="zatvoriEmailPostavke">
      <div class="modal" @click.stop>
        <div class="zaglavlje-modala">
          <h3>Email Notifikacije</h3>
          <button @click="zatvoriEmailPostavke" class="gumb-zatvaranja">&times;</button>
        </div>
        
        <div class="forma-postavki">
          <div class="grupa-polja">
            <label class="oznaka-checkboxa">
              <input 
                type="checkbox" 
                v-model="emailPostavke.omoguceno"
                @change="spremiEmailPostavke"
              >
              <span>Omogući email podsjetnike</span>
            </label>
          </div>
          
          <div v-if="emailPostavke.omoguceno" class="grupa-polja">
            <label>Pošalji podsjetnik:</label>
            <select v-model="emailPostavke.danaaPrijeDogadaja" @change="spremiEmailPostavke">
              <option value="1">1 dan prije</option>
              <option value="2">2 dana prije</option>
              <option value="3">3 dana prije</option>
              <option value="7">7 dana prije</option>
            </select>
          </div>

          <div v-if="emailPostavke.omoguceno" class="grupa-polja">
            <label>Vrijeme slanja:</label>
            <select v-model="emailPostavke.vrijemeSlanja" @change="spremiEmailPostavke">
              <option value="06:00">06:00 </option>
              <option value="07:00">07:00 </option>
              <option value="08:00">08:00 </option>
              <option value="09:00">09:00 </option>
              <option value="10:00">10:00 </option>
              <option value="12:00">12:00 </option>
              <option value="14:00">14:00 </option>
              <option value="16:00">16:00 </option>
              <option value="18:00">18:00 </option>
              <option value="20:00">20:00 </option>
            </select>
          </div>

          <div v-if="emailPostavke.omoguceno" class="status-notifikacija">
            <h4>Aktivne notifikacije:</h4>
            <p v-if="emailNotifikacije.filter(n => !n.poslan).length === 0" class="nema-notifikacija">
              Nema aktivnih notifikacija
            </p>
            <div v-else class="aktivne-notifikacije">
              <div v-for="notifikacija in emailNotifikacije.filter(n => !n.poslan)" :key="notifikacija.id" class="stavka-notifikacije">
                <div class="detalji-notifikacije">
                  <span class="naslov-dogadaja">{{ notifikacija.naslovDogadaja }}</span>
                  <span class="datum-notifikacije">{{ formatirajDatumNotifikacije(notifikacija.datumNotifikacije) }}</span>
                </div>
                <span :class="['zakazano-vrijeme', { 'hitno': notifikacija.hitno }]">
                  {{ notifikacija.hitno ? 'HITNO' : (notifikacija.zakazanoVrijeme || '08:00') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="navigacija-kalendara">
      <button @click="prethodniMjesec" class="gumb-navigacije">&lt;</button>
      <h3>{{ trenutniMjesecGodina }}</h3>
      <button @click="sljedeciMjesec" class="gumb-navigacije">&gt;</button>
    </div>

    <div class="mreza-kalendara">
      <div class="zaglavlje-dana" v-for="dan in daniTjedna" :key="dan">
        {{ dan }}
      </div>

      <div 
        v-for="dan in daniKalendara" 
        :key="dan.datum"
        :class="['dan-kalendara', {
          'drugi-mjesec': !dan.jeTrenutniMjesec,
          'danas': dan.jeDanas,
          'ima-dogadaje': dan.dogadaji.length > 0,
          [`dogadaj-${dan.dogadaji[0]?.boja}`]: dan.dogadaji.length > 0
        }]"
        @click="odaberiDan(dan)"
      >
        <span class="broj-dana">{{ dan.brojDana }}</span>
        <div class="pregled-dogadaja">
          <div 
            v-for="dogadaj in dan.dogadaji.slice(0, 2)" 
            :key="dogadaj.id"
            :class="['tocka-dogadaja', `dogadaj-${dogadaj.boja}`]"
            :title="dogadaj.klijent"
          >
            {{ dogadaj.klijent.substring(0, 12) }}{{ dogadaj.klijent.length > 12 ? '...' : '' }}
          </div>
          <div v-if="dan.dogadaji.length > 2" class="vise-dogadaja">
            +{{ dan.dogadaji.length - 2 }} više
          </div>
        </div>
      </div>
    </div>

    <div v-if="odabraniDan" class="dogadaji-odabranog-dana">
      <h3>Događaji za {{ formatirajDatum(odabraniDan.datum) }}</h3>
      <div v-if="odabraniDan.dogadaji.length === 0" class="nema-dogadaja">
        Nema događaja za ovaj dan
      </div>
      <div v-else>
        <div 
          v-for="dogadaj in odabraniDan.dogadaji" 
          :key="dogadaj.id"
          :class="['stavka-dogadaja', `dogadaj-${dogadaj.boja}`]"
        >
          <div class="detalji-dogadaja">
            <div class="klijent-dogadaja">{{ dogadaj.klijent }}</div>
            <div class="datumi-dogadaja">
              <span v-if="dogadaj.pocetniDatum === dogadaj.zavrsniDatum">
                {{ formatirajDatum(dogadaj.pocetniDatum) }}
              </span>
              <span v-else>
                {{ formatirajDatum(dogadaj.pocetniDatum) }} - {{ formatirajDatum(dogadaj.zavrsniDatum) }}
              </span>
            </div>
            <div class="opis-dogadaja">{{ dogadaj.opis }}</div>
            <div v-if="emailPostavke.omoguceno && imaNotifikaciju(dogadaj.id)" class="indikator-emaila">
              <span v-if="jeHitnaNotifikacija(dogadaj.id)">
                 Email poslan odmah (hitno)
              </span>
              <span v-else>
                Email podsjetnik aktiviran
              </span>
            </div>
          </div>
          <div class="akcije-dogadaja">
            <button 
              @click="urediDogadaj(dogadaj)" 
              class="gumb-urediti"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Uredi
            </button>
            <button 
              @click="obrisiDogadaj(dogadaj.id)" 
              class="gumb-obrisati"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Obriši
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="prikaziModalDodajDogadaj || uredujeDogadaj" class="prekrivka-modala" @click="zatvoriModal">
      <div class="modal" @click.stop>
        <div class="zaglavlje-modala">
          <h3>{{ uredujeDogadaj ? 'Uredi događaj' : 'Dodaj novi događaj' }}</h3>
          <button @click="zatvoriModal" class="gumb-zatvaranja">&times;</button>
        </div>
        
        <form @submit.prevent="spremiDogadaj" class="forma-dogadaja">
          <div class="grupa-polja">
            <label>Klijent:</label>
            <input 
              v-model="formaDogadaja.klijent" 
              type="text" 
              required 
              placeholder="Ime i prezime klijenta"
            >
          </div>

          <div class="grupa-polja">
            <label>Početni datum:</label>
            <input 
              v-model="formaDogadaja.pocetniDatum" 
              type="date" 
              required
            >
          </div>

          <div class="grupa-polja">
            <label>Završni datum:</label>
            <input 
              v-model="formaDogadaja.zavrsniDatum" 
              type="date" 
              required
            >
          </div>

          <div class="grupa-polja">
            <label>Boja pozadine:</label>
            <div class="opcije-boja">
              <label v-for="boja in opcijeBoja" :key="boja.vrijednost" class="opcija-boje">
                <input 
                  type="radio" 
                  :value="boja.vrijednost" 
                  v-model="formaDogadaja.boja"
                  required
                >
                <span :class="['pregled-boje', `boja-${boja.vrijednost}`]">{{ boja.oznaka }}</span>
              </label>
            </div>
          </div>

          <div class="grupa-polja">
            <label>Opis:</label>
            <textarea 
              v-model="formaDogadaja.opis" 
              placeholder="Detalji o događaju..."
              rows="4"
              required
            ></textarea>
          </div>

          <div v-if="emailPostavke.omoguceno" class="grupa-polja">
            <label>Email podsjetnik:</label>
            <div class="prekidac">
              <input 
                type="checkbox" 
                v-model="formaDogadaja.emailNotifikacija"
                class="unos-prekidaca"
                id="emailPrekidacDogadaja"
              >
              <label for="emailPrekidacDogadaja" class="oznaka-prekidaca">
                <span class="klizac-prekidaca"></span>
              </label>
              <span class="tekst-prekidaca">
                Pošalji podsjetnik {{ emailPostavke.danaaPrijeDogadaja }} {{ emailPostavke.danaaPrijeDogadaja === 1 ? 'dan' : 'dana' }} prije u {{ emailPostavke.vrijemeSlanja }}
              </span>
            </div>
          </div>

          <div class="akcije-forme">
            <button type="button" @click="zatvoriModal" class="gumb-odustati">Odustani</button>
            <button type="submit" class="gumb-spremiti">
              {{ uredujeDogadaj ? 'Spremi promjene' : 'Dodaj događaj' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <Transition name="nestanak">
      <div 
        v-if="dogadajZaBrisanje" 
        class="pozadina" 
        @click="otkaziOstanak"
      >
        <div 
          class="modal-potvrda" 
          @click.stop
        >
          <div class="zaglavlje-modala">
            <h2>Potvrda brisanja</h2>
          </div>
          <div class="sadrzaj-potvrde">
            <span class="material-icons upozorenje">warning</span>
            <p>Jeste li sigurni da želite obrisati ovaj događaj?</p>
          </div>
          <div class="gumbovi-potvrde">
            <button 
              class="gumb-odustati" 
              @click="otkaziOstanak"
            >Odustani</button>
            <button 
              class="gumb-potvrditi" 
              @click="potvrdiBrisanje"
            >Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="prikaziRezultatHitnogEmaila" :class="['rezultat-hitnog-emaila', prikaziRezultatHitnogEmaila.uspjeh ? 'uspjeh' : 'greska']">
      <div class="sadrzaj-rezultata">
        <span class="ikona-rezultata">{{ prikaziRezultatHitnogEmaila.uspjeh ? '✅' : '❌' }}</span>
        <span class="poruka-rezultata">{{ prikaziRezultatHitnogEmaila.poruka }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import emailjs from '@emailjs/browser';

export default {
  name: 'HrvatskiKalendar',
  data() {
    return {
      trenutniDatum: new Date(),
      odabraniDan: null,
      prikaziModalDodajDogadaj: false,
      prikaziEmailPostavke: false,
      uredujeDogadaj: null,
      prikaziRezultatHitnogEmaila: null, 
      daniTjedna: ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
      opcijeBoja: [
        { vrijednost: 'zuta', oznaka: 'Žuta' },
        { vrijednost: 'zelena', oznaka: 'Zelena' },
        { vrijednost: 'plava', oznaka: 'Plava' },
        { vrijednost: 'narancasta', oznaka: 'Narančasta' },
        { vrijednost: 'ljubicasta', oznaka: 'Ljubičasta' },
        { vrijednost: 'crvena', oznaka: 'Crvena' },
        { vrijednost: 'tirkizna', oznaka: 'Tirkizna' },
        { vrijednost: 'ruzicasta', oznaka: 'Ružičasta' }
      ],
      dogadaji: JSON.parse(localStorage.getItem('kalendar-dogadaji')) || [],
      emailNotifikacije: JSON.parse(localStorage.getItem('email-notifikacije')) || [],
      emailPostavke: {
        omoguceno: JSON.parse(localStorage.getItem('email-postavke-omoguceno')) || false,
        emailPrimatelja: 'naddinko@gmail.com',
        danaaPrijeDogadaja: parseInt(localStorage.getItem('email-dana-prije')) || 3,
        vrijemeSlanja: localStorage.getItem('email-vrijeme-slanja') || '08:00'
      },
      dogadajZaBrisanje: null,
      formaDogadaja: {
        klijent: '',
        pocetniDatum: '',
        zavrsniDatum: '',
        boja: 'plava',
        opis: '',
        emailNotifikacija: true
      }
    };
  },

  computed: {
    trenutniMjesecGodina() {
      return this.trenutniDatum.toLocaleDateString('hr-HR', { 
        month: 'long', 
        year: 'numeric' 
      });
    },

    daniKalendara() {
      const godina = this.trenutniDatum.getFullYear();
      const mjesec = this.trenutniDatum.getMonth();
      
      const danas = new Date();
      const danasString = `${danas.getFullYear()}-${String(danas.getMonth() + 1).padStart(2, '0')}-${String(danas.getDate()).padStart(2, '0')}`;
      
      const prviDanMjeseca = new Date(godina, mjesec, 1);
      let pocetniDatum = new Date(prviDanMjeseca);
      
      const danTjedna = prviDanMjeseca.getDay();
      const danaZaOduzeti = danTjedna === 0 ? 6 : danTjedna - 1;
      pocetniDatum.setDate(prviDanMjeseca.getDate() - danaZaOduzeti);
      
      const daniKalendara = [];
      
      for (let i = 0; i < 42; i++) {
        const trenutniDatum = new Date(pocetniDatum);
        trenutniDatum.setDate(pocetniDatum.getDate() + i);
        
        const datumString = `${trenutniDatum.getFullYear()}-${String(trenutniDatum.getMonth() + 1).padStart(2, '0')}-${String(trenutniDatum.getDate()).padStart(2, '0')}`;
        const jeTrenutniMjesec = trenutniDatum.getMonth() === mjesec;
        const jeDanas = datumString === danasString;
        
        daniKalendara.push({
          datum: datumString,
          brojDana: trenutniDatum.getDate(),
          jeTrenutniMjesec,
          jeDanas,
          dogadaji: this.dohvatiDogadajeZaDatum(datumString)
        });
      }
      
      return daniKalendara;
    }
  },

  mounted() {
    emailjs.init('032xWrX5Q1Y5iEczS');

    setInterval(() => {
      this.provjeriIPosaljiNotifikacije();
    }, 5 * 60 * 1000);
    
    this.provjeriIPosaljiNotifikacije();
  },

  methods: {
    dohvatiDogadajeZaDatum(datumString) {
      return this.dogadaji.filter(dogadaj => {
        const pocetakDogadaja = new Date(dogadaj.pocetniDatum);
        const krajDogadaja = new Date(dogadaj.zavrsniDatum);
        const trenutniDatum = new Date(datumString);
        
        return trenutniDatum >= pocetakDogadaja && trenutniDatum <= krajDogadaja;
      });
    },

    prethodniMjesec() {
      this.trenutniDatum = new Date(
        this.trenutniDatum.getFullYear(), 
        this.trenutniDatum.getMonth() - 1, 
        1
      );
      this.odabraniDan = null;
    },

    sljedeciMjesec() {
      this.trenutniDatum = new Date(
        this.trenutniDatum.getFullYear(), 
        this.trenutniDatum.getMonth() + 1, 
        1
      );
      this.odabraniDan = null;
    },

    odaberiDan(dan) {
      this.odabraniDan = dan;
    },

    zatvoriModal() {
      this.prikaziModalDodajDogadaj = false;
      this.uredujeDogadaj = null;
      this.resetirajFormuDogadaja();
    },

    zatvoriEmailPostavke() {
      this.prikaziEmailPostavke = false;
    },

    resetirajFormuDogadaja() {
      this.formaDogadaja = {
        klijent: '',
        pocetniDatum: '',
        zavrsniDatum: '',
        boja: 'plava',
        opis: '',
        emailNotifikacija: this.emailPostavke.omoguceno
      };
    },

    urediDogadaj(dogadaj) {
      this.uredujeDogadaj = dogadaj;
      this.formaDogadaja = { 
        ...dogadaj,
        emailNotifikacija: this.imaNotifikaciju(dogadaj.id)
      };
    },

    spremiDogadaj() {
      if (new Date(this.formaDogadaja.zavrsniDatum) < new Date(this.formaDogadaja.pocetniDatum)) {
        alert('Završni datum ne može biti prije početnog datuma!');
        return;
      }

      if (this.uredujeDogadaj) {
        const indeks = this.dogadaji.findIndex(d => d.id === this.uredujeDogadaj.id);
        if (indeks !== -1) {
          this.dogadaji[indeks] = { ...this.formaDogadaja, id: this.uredujeDogadaj.id };
          this.azurirajEmailNotifikaciju(this.dogadaji[indeks]);
        }
      } else {
        const noviDogadaj = {
          ...this.formaDogadaja,
          id: Date.now()
        };
        this.dogadaji.push(noviDogadaj);
        this.stvoriEmailNotifikaciju(noviDogadaj);
      }
      
      this.spremiULocalStorage();
      this.zatvoriModal();
      
      if (this.odabraniDan) {
        this.odabraniDan.dogadaji = this.dohvatiDogadajeZaDatum(this.odabraniDan.datum);
      }
    },

    stvoriEmailNotifikaciju(dogadaj) {
      if (!this.emailPostavke.omoguceno || !this.formaDogadaja.emailNotifikacija) {
        return;
      }

      const datumDogadaja = new Date(dogadaj.pocetniDatum);
      const danas = new Date();
      
      datumDogadaja.setHours(0, 0, 0, 0);
      danas.setHours(0, 0, 0, 0);

      const razlikaVremena = datumDogadaja - danas;
      const danaDoDogadaja = Math.floor(razlikaVremena / (1000 * 60 * 60 * 24));
      
      console.log(`Događaj: ${dogadaj.klijent}`);
      console.log(`Datum događaja: ${dogadaj.pocetniDatum}`);
      console.log(`Danas: ${danas.toISOString().split('T')[0]}`);
      console.log(`Dana do događaja: ${danaDoDogadaja}`);
      console.log(`Postavka podsjetnika: ${this.emailPostavke.danaaPrijeDogadaja} dana prije`);
      
      if (danaDoDogadaja <= this.emailPostavke.danaaPrijeDogadaja) {
        console.log(`HITNO: Šalje se email odmah! (${danaDoDogadaja} <= ${this.emailPostavke.danaaPrijeDogadaja})`);
        this.posaljiHitnuNotifikaciju(dogadaj, danaDoDogadaja);
        return;
      }
      
      console.log(`Zakazujem email za kasnije`);
      const datumNotifikacije = new Date(datumDogadaja);
      datumNotifikacije.setDate(datumDogadaja.getDate() - this.emailPostavke.danaaPrijeDogadaja);
      
      const [sati, minute] = this.emailPostavke.vrijemeSlanja.split(':');
      datumNotifikacije.setHours(parseInt(sati), parseInt(minute), 0, 0);
      const sada = new Date();
      if (datumNotifikacije > sada) {
        const notifikacija = {
          id: `notifikacija_${dogadaj.id}`,
          idDogadaja: dogadaj.id,
          naslovDogadaja: dogadaj.klijent,
          datumDogadaja: dogadaj.pocetniDatum,
          opisDogadaja: dogadaj.opis,
          datumNotifikacije: datumNotifikacije.toISOString(),
          poslan: false,
          emailPrimatelja: this.emailPostavke.emailPrimatelja,
          zakazanoVrijeme: this.emailPostavke.vrijemeSlanja,
          hitno: false
        };

        this.emailNotifikacije.push(notifikacija);
        this.spremiEmailNotifikacije();
        console.log(`Email notifikacija zakazana za: ${datumNotifikacije.toLocaleString('hr-HR')}`);
      }
    },

    async posaljiHitnuNotifikaciju(dogadaj, danaOstalo) {
      console.log(`Šalje se hitni email za: ${dogadaj.klijent} (${danaOstalo} dana)`);
      
      const formatiranDatumDogadaja = new Date(dogadaj.pocetniDatum).toLocaleDateString('hr-HR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const parametriPredloska = {
        to_email: this.emailPostavke.emailPrimatelja,
        to_name: 'Korisnik',
        event_title: dogadaj.klijent,
        event_date: formatiranDatumDogadaja,
        event_description: dogadaj.opis,
        days_left: danaOstalo,
        subject: `Hitno: ${dogadaj.klijent} - ${danaOstalo === 0 ? 'DANAS' : danaOstalo === 1 ? 'SUTRA' : `za ${danaOstalo} dana`}!`,
        immediate: true
      };

      console.log('Šalje se email s parametrima:', parametriPredloska);

      try {
        const odgovor = await emailjs.send(
          'service_a3qcvtx',
          'template_ksb59iv',
          parametriPredloska
        );

        console.log('EmailJS Odgovor:', odgovor);

        if (odgovor.status === 200) {
          const notifikacija = {
            id: `notifikacija_${dogadaj.id}`,
            idDogadaja: dogadaj.id,
            naslovDogadaja: dogadaj.klijent,
            datumDogadaja: dogadaj.pocetniDatum,
            opisDogadaja: dogadaj.opis,
            datumNotifikacije: new Date().toISOString(),
            poslan: true,
            emailPrimatelja: this.emailPostavke.emailPrimatelja,
            zakazanoVrijeme: 'ODMAH',
            hitno: true
          };

          this.emailNotifikacije.push(notifikacija);
          this.spremiEmailNotifikacije();
  
          this.prikaziRezultatHitnogEmaila = {
            uspjeh: true,
            poruka: `Email poslan odmah! Događaj "${dogadaj.klijent}" je ${danaOstalo === 0 ? 'DANAS' : danaOstalo === 1 ? 'SUTRA' : `za ${danaOstalo} dana`}.`
          };
          
          console.log(`Hitna email notifikacija uspješno poslana za: ${dogadaj.klijent}`);
        }
      } catch (greska) {
        console.error('Greška pri slanju emaila:', greska);
        this.prikaziRezultatHitnogEmaila = {
          uspjeh: false,
          poruka: `Greška pri slanju hitnog emaila: ${greska.message || greska.text || 'Nepoznata greška'}`
        };
      }

      setTimeout(() => {
        this.prikaziRezultatHitnogEmaila = null;
      }, 8000);
    },

    azurirajEmailNotifikaciju(dogadaj) {
      this.emailNotifikacije = this.emailNotifikacije.filter(n => n.idDogadaja !== dogadaj.id);
      this.stvoriEmailNotifikaciju(dogadaj);
    },

    obrisiEmailNotifikaciju(idDogadaja) {
      this.emailNotifikacije = this.emailNotifikacije.filter(n => n.idDogadaja !== idDogadaja);
      this.spremiEmailNotifikacije();
    },

    imaNotifikaciju(idDogadaja) {
      return this.emailNotifikacije.some(n => n.idDogadaja === idDogadaja);
    },

    jeHitnaNotifikacija(idDogadaja) {
      const notifikacija = this.emailNotifikacije.find(n => n.idDogadaja === idDogadaja);
      return notifikacija && notifikacija.hitno;
    },

    async provjeriIPosaljiNotifikacije() {
      if (!this.emailPostavke.omoguceno) return;

      const sada = new Date();
      
      for (const notifikacija of this.emailNotifikacije) {
        if (!notifikacija.poslan && new Date(notifikacija.datumNotifikacije) <= sada) {
          await this.posaljiEmailNotifikaciju(notifikacija);
        }
      }
    },

    async posaljiEmailNotifikaciju(notifikacija) {
      try {
        const formatiranDatumDogadaja = new Date(notifikacija.datumDogadaja).toLocaleDateString('hr-HR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const parametriPredloska = {
          to_email: notifikacija.emailPrimatelja,
          to_name: 'Korisnik',
          event_title: notifikacija.naslovDogadaja,
          event_date: formatiranDatumDogadaja,
          event_description: notifikacija.opisDogadaja,
          days_left: this.emailPostavke.danaaPrijeDogadaja,
          subject: `Podsjetnik: ${notifikacija.naslovDogadaja}`
        };

        const odgovor = await emailjs.send(
          'service_a3qcvtx',
          'template_ksb59iv',
          parametriPredloska
        );

        if (odgovor.status === 200) {
          notifikacija.poslan = true;
          this.spremiEmailNotifikacije();
          console.log(`Email notifikacija poslana za događaj: ${notifikacija.naslovDogadaja}`);
        }
      } catch (greska) {
        console.error('Greška pri slanju email notifikacije:', greska);
      }
    },

    obrisiDogadaj(idDogadaja) {
      this.dogadajZaBrisanje = idDogadaja;
    },

    potvrdiBrisanje() {
      if (this.dogadajZaBrisanje) {
        this.dogadaji = this.dogadaji.filter(dogadaj => dogadaj.id !== this.dogadajZaBrisanje);
        this.obrisiEmailNotifikaciju(this.dogadajZaBrisanje);
        this.spremiULocalStorage();
        
        if (this.odabraniDan) {
          this.odabraniDan.dogadaji = this.dohvatiDogadajeZaDatum(this.odabraniDan.datum);
        }
        
        this.dogadajZaBrisanje = null;
      }
    },

    otkaziOstanak() {
      this.dogadajZaBrisanje = null;
    },

    spremiULocalStorage() {
      localStorage.setItem('kalendar-dogadaji', JSON.stringify(this.dogadaji));
    },

    spremiEmailNotifikacije() {
      localStorage.setItem('email-notifikacije', JSON.stringify(this.emailNotifikacije));
    },

    spremiEmailPostavke() {
      localStorage.setItem('email-postavke-omoguceno', JSON.stringify(this.emailPostavke.omoguceno));
      localStorage.setItem('email-dana-prije', this.emailPostavke.danaaPrijeDogadaja.toString());
      localStorage.setItem('email-vrijeme-slanja', this.emailPostavke.vrijemeSlanja);
    },

    formatirajDatum(datumString) {
      return new Date(datumString).toLocaleDateString('hr-HR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },

    formatirajDatumNotifikacije(datumString) {
      return new Date(datumString).toLocaleDateString('hr-HR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  watch: {
    'formaDogadaja.pocetniDatum'(noviPocetniDatum) {
      if (noviPocetniDatum && !this.formaDogadaja.zavrsniDatum) {
        this.formaDogadaja.zavrsniDatum = noviPocetniDatum;
      }
      if (noviPocetniDatum && this.formaDogadaja.zavrsniDatum && new Date(this.formaDogadaja.zavrsniDatum) < new Date(noviPocetniDatum)) {
        this.formaDogadaja.zavrsniDatum = noviPocetniDatum;
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.kontejner-kalendara {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
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

.zaglavlje-kalendara {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.akcije-zaglavlja {
  display: flex;
  gap: 10px;
}

.gumb-postavke {
  background-color: #123458;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.gumb-postavke:hover {
  background-color: #1c4c80;
}

.gumb-dodaj-dogadaj {
  background-color: #123458;
  color: #F1EFEC;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.gumb-dodaj-dogadaj:hover {
  background-color: #1c4c80;
}

.forma-postavki {
  padding: 20px;
}

.oznaka-checkboxa {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.oznaka-checkboxa input[type="checkbox"] {
  width: auto;
}

.status-notifikacija {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.status-notifikacija h4 {
  margin: 0 0 10px 0;
  color: #123458;
}

.nema-notifikacija {
  color: #6c757d;
  font-style: italic;
}

.aktivne-notifikacije {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stavka-notifikacije {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  border-left: 3px solid #28a745;
}

.detalji-notifikacije {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.naslov-dogadaja {
  font-weight: 500;
}

.datum-notifikacije {
  font-size: 0.9rem;
  color: #6c757d;
}

.zakazano-vrijeme {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 600;
  background-color: #e8f5e8;
  padding: 2px 6px;
  border-radius: 3px;
}

.zakazano-vrijeme.hitno {
  background-color: #fff3cd;
  color: #856404;
  font-weight: 700;
  border: 1px solid #ffeaa7;
}

.prekidac {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.unos-prekidaca {
  display: none;
}

.oznaka-prekidaca {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.klizac-prekidaca {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.unos-prekidaca:checked + .oznaka-prekidaca {
  background-color: #123458;
}

.unos-prekidaca:checked + .oznaka-prekidaca .klizac-prekidaca {
  transform: translateX(26px);
}

.tekst-prekidaca {
  font-size: 14px;
  color: #123458;
  font-weight: 500;
}

.indikator-emaila {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #e8f5e8;
  color: #28a745;
  font-size: 0.8rem;
  border-radius: 4px;
  display: inline-block;
}

.rezultat-hitnog-emaila {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 400px;
  animation: klizanjeUdesno 0.5s ease;
}

@keyframes klizanjeUdesno {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.rezultat-hitnog-emaila.uspjeh {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.rezultat-hitnog-emaila.greska {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.sadrzaj-rezultata {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ikona-rezultata {
  font-size: 1.2rem;
}

.poruka-rezultata {
  font-weight: 500;
  line-height: 1.4;
}

.navigacija-kalendara {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.navigacija-kalendara h3 {
  margin: 0;
  color: #123458;
  font-size: 20px;
  font-weight: 500;
  text-transform: capitalize;
}

.gumb-navigacije {
  background: #D4C9BE;
  border: 1px solid #D4C9BE;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #123458;
}

.gumb-navigacije:hover {
  background: #123458;
  color: #F1EFEC;
  border-color: #123458;
}

.mreza-kalendara {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #D4C9BE;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.zaglavlje-dana {
  background: #123458;
  color: #F1EFEC;
  padding: 12px 5px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
}

.dan-kalendara {
  background: white;
  min-height: 80px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.dan-kalendara:hover {
  background: rgba(212, 201, 190, 0.1);
}

.dan-kalendara.drugi-mjesec {
  background: #F1EFEC;
  color: #5D8AA8;
}

.dan-kalendara.danas {
  background: #ffebee !important;
  border: 2px solid #ef5350 !important;
}

.dan-kalendara.ima-dogadaje {
  border-left: 4px solid;
}

.dan-kalendara.ima-dogadaje.dogadaj-zuta { border-left-color: #ffc107; }
.dan-kalendara.ima-dogadaje.dogadaj-zelena { border-left-color: #4caf50; }
.dan-kalendara.ima-dogadaje.dogadaj-plava { border-left-color: #2196f3; }
.dan-kalendara.ima-dogadaje.dogadaj-narancasta { border-left-color: #ff9800; }
.dan-kalendara.ima-dogadaje.dogadaj-ljubicasta { border-left-color: #9c27b0; }
.dan-kalendara.ima-dogadaje.dogadaj-crvena { border-left-color: #f44336; }
.dan-kalendara.ima-dogadaje.dogadaj-tirkizna { border-left-color: #009688; }
.dan-kalendara.ima-dogadaje.dogadaj-ruzicasta { border-left-color: #e91e63; }

.broj-dana {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 4px;
  color: #123458;
}

.dan-kalendara.danas .broj-dana {
  color: #d32f2f !important;
  font-weight: 700 !important;
}

.pregled-dogadaja {
  flex: 1;
}

.tocka-dogadaja {
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  margin: 1px 0;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.dogadaj-zuta { background: #ffc107; color: #000; }
.dogadaj-zelena { background: #4caf50; }
.dogadaj-plava { background: #2196f3; }
.dogadaj-narancasta { background: #ff9800; }
.dogadaj-ljubicasta { background: #9c27b0; }
.dogadaj-crvena { background: #f44336; }
.dogadaj-tirkizna { background: #009688; }
.dogadaj-ruzicasta { background: #e91e63; }

.vise-dogadaja {
  font-size: 9px;
  color: #5D8AA8;
  margin-top: 2px;
  font-weight: 500;
}

.dogadaji-odabranog-dana {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dogadaji-odabranog-dana h3 {
  margin: 0 0 16px 0;
  color: #123458;
  font-size: 18px;
  font-weight: 500;
}

.nema-dogadaja {
  color: #5D8AA8;
  font-style: italic;
  text-align: center;
  padding: 15px;
  font-size: 14px;
}

.stavka-dogadaja {
  display: flex;
  align-items: center;
  padding: 16px;
  margin: 12px 0;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.stavka-dogadaja.dogadaj-zuta { background: #F1EFEC; border-left-color: #ffc107; }
.stavka-dogadaja.dogadaj-zelena { background: #F1EFEC; border-left-color: #4caf50; }
.stavka-dogadaja.dogadaj-plava { background: #F1EFEC; border-left-color: #2196f3; }
.stavka-dogadaja.dogadaj-narancasta { background: #F1EFEC; border-left-color: #ff9800; }
.stavka-dogadaja.dogadaj-ljubicasta { background: #F1EFEC; border-left-color: #9c27b0; }
.stavka-dogadaja.dogadaj-crvena { background: #F1EFEC; border-left-color: #f44336; }
.stavka-dogadaja.dogadaj-tirkizna { background: #F1EFEC; border-left-color: #009688; }
.stavka-dogadaja.dogadaj-ruzicasta { background: #F1EFEC; border-left-color: #e91e63; }

.stavka-dogadaja:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.detalji-dogadaja {
  flex: 1;
}

.klijent-dogadaja {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 16px;
  color: #123458;
}

.datumi-dogadaja {
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 14px;
  color: #5D8AA8;
}

.opis-dogadaja {
  color: #030303;
  font-size: 14px;
  line-height: 1.4;
}

.akcije-dogadaja {
  display: flex;
  gap: 8px;
}

.gumb-urediti, .gumb-obrisati {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.gumb-urediti {
  background-color: #123458;
  color: #F1EFEC;
}

.gumb-urediti:hover {
  background-color: #1c4c80;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(18, 52, 88, 0.2);
}

.gumb-obrisati {
  background-color: #f44336;
  color: white;
}

.gumb-obrisati:hover {
  background-color: #f56358;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 99, 88, 0.2);
}

.prekrivka-modala {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(3, 3, 3, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #F1EFEC;
  padding: 0;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.zaglavlje-modala {
  background: #123458;
  color: #F1EFEC;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zaglavlje-modala h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.gumb-zatvaranja {
  background: transparent;
  color: #F1EFEC;
  border: none;
  font-size: 20px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.gumb-zatvaranja:hover {
  background: rgba(241, 239, 236, 0.2);
  border-radius: 50%;
}

.forma-dogadaja {
  padding: 20px;
}

.grupa-polja {
  margin-bottom: 20px;
}

.grupa-polja label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #123458;
  font-size: 14px;
}

.grupa-polja input,
.grupa-polja textarea,
.grupa-polja select {
  width: 100%;
  padding: 10px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Roboto', sans-serif;
  background: white;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.grupa-polja input:focus,
.grupa-polja textarea:focus,
.grupa-polja select:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.opcije-boja {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.opcija-boje {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.opcija-boje:hover {
  background: rgba(212, 201, 190, 0.3);
}

.opcija-boje input[type="radio"] {
  width: auto;
  margin-right: 8px;
}

.pregled-boje {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  min-width: 80px;
  text-align: center;
}

.boja-zuta { background: #ffc107; color: #000; }
.boja-zelena { background: #4caf50; }
.boja-plava { background: #2196f3; }
.boja-narancasta { background: #ff9800; }
.boja-ljubicasta { background: #9c27b0; }
.boja-crvena { background: #f44336; }
.boja-tirkizna { background: #009688; }
.boja-ruzicasta { background: #e91e63; }

.akcije-forme {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #D4C9BE;
}

.gumb-odustati, .gumb-spremiti {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.gumb-odustati {
  background: #D4C9BE;
  color: #123458;
}

.gumb-odustati:hover {
  background: #c5b7a9;
}

.gumb-spremiti {
  background: #123458;
  color: #F1EFEC;
}

.gumb-spremiti:hover {
  background: #1c4c80;
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

.modal-potvrda {
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sadrzaj-potvrde {
  padding: 24px;
  text-align: center;
}

.sadrzaj-potvrde .upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
  display: block;
}

.sadrzaj-potvrde p {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #030303;
}

.gumbovi-potvrde {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 24px 24px;
}

.gumb-potvrditi {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  background-color: #f44336;
  color: #F1EFEC;
}

.gumb-potvrditi:hover {
  background-color: #f56358;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 99, 88, 0.2);
}

.nestanak-enter-active, .nestanak-leave-active {
  transition: opacity 0.3s ease;
}
.nestanak-enter-from, .nestanak-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .kontejner-kalendara {
    padding: 15px;
  }
  
  .akcije-zaglavlja {
    flex-direction: column;
    gap: 8px;
  }
  
  .dan-kalendara {
    min-height: 60px;
    padding: 6px;
  }
  
  .zaglavlje-dana {
    padding: 10px 3px;
    font-size: 12px;
  }
  
  .stavka-dogadaja {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .akcije-dogadaja {
    align-self: flex-end;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
  
  .opcije-boja {
    grid-template-columns: 1fr;
  }
  
  .akcije-forme {
    flex-direction: column;
  }
  
  .gumb-odustati, .gumb-spremiti {
    width: 100%;
  }

  .stavka-notifikacije {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .prekidac {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .kontejner-kalendara {
    padding: 10px;
  }
  
  .zaglavlje-kalendara {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .navigacija-kalendara {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .dan-kalendara {
    min-height: 50px;
    padding: 4px;
  }
  
  .broj-dana {
    font-size: 14px;
  }
  
  .tocka-dogadaja {
    font-size: 8px;
    padding: 1px 2px;
  }
}
</style>