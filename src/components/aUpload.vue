<template>
  <div class="galerija">
    <div class="naslov-sekcija">
      <h2 class="glavni-naslov">Galerija fotografija</h2>
    </div>
    
    <div class="glavni-sadrzaj">
      <div class="galerija-okvir">
        <div class="mediji-lista" v-if="filtrirani.length > 0">
          <div class="mediji-mreza">
            <div 
              v-for="(medij, index) in filtrirani" 
              :key="medij.id || index" 
              class="medij-kartica"
            >
              <div class="brisanje-prekrivac">
                <button @click.stop="potvrdiBrisanje(medij)" class="brisi-gumb" title="Obriši sliku">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>

              <div class="medij-prikaz" @click="otvoriPovecanu(medij)">
                <template v-if="medij.fileCategory === 'image'">
                  <img 
                    :src="medij.publicUrl" 
                    :alt="medij.fileName" 
                    @error="slikaGreska"
                  />
                </template>
                <template v-else-if="medij.fileCategory === 'video'">
                  <video 
                    :src="medij.publicUrl" 
                    @error="videoGreska"
                  ></video>
                </template>
                <div v-else class="ostalo-prikaz">
                  <span>{{ medij.fileCategory || 'Nepoznati tip' }}</span>
                </div>
              </div>
              <div class="medij-podaci">
                <p class="medij-naziv">{{ skratiNaziv(medij.fileName, 25) }}</p>
                <div class="medij-detalji">
                  <span class="korisnik-email">{{ medij.userEmail }}</span>
                  <span class="datum-upload">{{ formatirajDatum(medij.uploadedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!uploadAktivan" class="prazno">
          <p v-if="odabraniEmail">Nema uploadanih medija za {{ odabraniEmail }}</p>
          <p v-else>Nema uploadanih medija</p>
          <p class="prazno-opis">Koristite panel sa strane za upload</p>
        </div>
      </div>
      
      <div class="upload-panel">
        <h3 class="panel-naslov">Dodaj nove slike</h3>
        
        <div class="grupa-polja">
          <label for="korisnik-dropdown">Korisnik:</label>
          <div class="padajuci-izbornik">
            <div class="odabrani-korisnik" @click="prekidacPadajuci">
              {{ odabraniEmail || 'Odaberite korisnika' }}
              <span class="strelica">▼</span>
            </div>
            <div class="izbornik-lista" v-if="prikaziPadajuci">
              <div 
                v-for="korisnik in korisnici" 
                :key="korisnik.id" 
                class="izbornik-stavka"
                @click="odaberiKorisnika(korisnik.email)"
                :class="{ 'aktivna': odabraniEmail === korisnik.email }"
              >
                {{ korisnik.email }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-kontrole">
          <button 
            class="filter-gumb" 
            @click="prekidacFilter"
            :class="{ 'aktivan': prikaziSamoOdabranog }"
          >
            {{ prikaziSamoOdabranog ? 'Prikaži sve' : 'Prikaži samo odabranog' }}
          </button>
          <button 
            class="brisi-sve-gumb" 
            @click="potvrdiBrisanjeSvihKorisnika"
            :disabled="!odabraniEmail || filtrirani.length === 0"
            v-if="prikaziSamoOdabranog && odabraniEmail"
          >
            Obriši sve od {{ odabraniEmail }}
          </button>
        </div>
        
        <div 
          class="upload-zona" 
          @click="pokreniOdabir" 
          @dragover.prevent="povuciPreko"
          @dragleave.prevent="povuciVan"
          @drop.prevent="ispustiDatoteke"
          :class="{ 'povlaci-preko': povlaciPreko, 'ima-datoteke': odabraneDatoteke.length > 0 }"
        >
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            @change="promjenaDatoteka" 
            accept="image/*,video/*"
            multiple
          />
          
          <div v-if="odabraneDatoteke.length === 0" class="upload-poruka">
            <div class="upload-ikona">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p class="glavni-tekst">Povucite datoteke ili kliknite za odabir</p>
            <p class="upload-napomena">Podržava slike (JPG, PNG, GIF) i videove (MP4, MOV)</p>
          </div>
          
          <div v-else class="odabrane">
            <div class="datoteke-naslov">
              <h4>Odabrane datoteke ({{ odabraneDatoteke.length }})</h4>
              <button class="ukloni-sve-gumb" @click.stop="uklonoSveDatoteke" title="Ukloni sve">
                ✕ Ukloni sve
              </button>
            </div>
            <div class="datoteke-lista">
              <div 
                v-for="(datoteka, index) in odabraneDatoteke.slice(0, 5)" 
                :key="index"
                class="datoteka-stavka"
              >
                <div class="datoteka-prikaz">
                  <img 
                    v-if="datoteka.tip === 'image'" 
                    :src="datoteka.previewUrl" 
                    alt="Preview" 
                  />
                  <div v-else-if="datoteka.tip === 'video'" class="video-prikaz">
                    🎬
                  </div>
                </div>
                <div class="datoteka-podaci">
                  <span class="datoteka-naziv">{{ skratiNaziv(datoteka.file.name, 20) }}</span>
                  <span class="datoteka-velicina">{{ formatirajVelicinu(datoteka.file.size) }}</span>
                </div>
              </div>
              <div v-if="odabraneDatoteke.length > 5" class="vise-datoteka">
                + {{ odabraneDatoteke.length - 5 }} više datoteka...
              </div>
            </div>
            <div class="ukupna-velicina">
              Ukupna veličina: {{ formatirajVelicinu(ukupnaVelicina) }}
            </div>
          </div>
        </div>
        
        <div class="upload-akcije">
          <button 
            class="upload-gumb" 
            @click="uploadajSveDatoteke" 
            :disabled="odabraneDatoteke.length === 0 || !odabraniEmail || uploadAktivan"
          >
            {{ uploadAktivan ? `Upload ${trenutniUpload}/${odabraneDatoteke.length}` : `Upload ${odabraneDatoteke.length} datoteka` }}
          </button>
          <div v-if="uploadAktivan" class="progress-okvir">
            <div class="progress-traka">
              <div class="progress" :style="{ width: `${ukupniProgress}%` }"></div>
            </div>
            <div class="progress-tekst">
              {{ trenutniUpload }}/{{ odabraneDatoteke.length }} - {{ Math.round(ukupniProgress) }}%
            </div>
          </div>
        </div>
        
        <div v-if="statusPoruka" class="status-poruka" :class="{ 'uspjeh': !jeGreska, 'greska': jeGreska }">
          {{ statusPoruka }}
        </div>
      </div>
    </div>
    
    <div class="povecani-prikaz" v-if="aktivniMedij" @click="zatvoriPovecanu">
      <div class="povecani-sadrzaj" @click.stop>
        <button class="zatvori-gumb" @click="zatvoriPovecanu">✕</button>
        <div class="povecani-medij">
          <img v-if="aktivniMedij.fileCategory === 'image'" :src="aktivniMedij.publicUrl" alt="Preview u punoj veličini" />
          <video v-else-if="aktivniMedij.fileCategory === 'video'" :src="aktivniMedij.publicUrl" controls autoplay></video>
        </div>
      </div>
    </div>
    
    <div class="modal-pozadina" v-if="zaBrisanjeMedij" @click="zaBrisanjeMedij = null">
      <div class="modal-potvrda" @click.stop>
        <h4>Potvrda brisanja</h4>
        <p>Jeste li sigurni da želite trajno obrisati ovu datoteku?</p>
        <p class="datoteka-za-brisanje">{{ zaBrisanjeMedij ? zaBrisanjeMedij.fileName : '' }}</p>
        <div class="modal-akcije">
          <button class="odustani-gumb" @click="zaBrisanjeMedij = null">Odustani</button>
          <button class="potvrdi-gumb" @click="obrisiDatoteku" :disabled="brisanjeAktivno">
            {{ brisanjeAktivno ? 'Brišem...' : 'Obriši' }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-pozadina" v-if="zaBrisanjeSviKorisnik" @click="zaBrisanjeSviKorisnik = null">
      <div class="modal-potvrda" @click.stop>
        <h4>Potvrda brisanja svih slika</h4>
        <p>Jeste li sigurni da želite trajno obrisati SVE slike korisnika?</p>
        <p class="korisnik-za-brisanje">{{ zaBrisanjeSviKorisnik }}</p>
        <p class="broj-datoteka">Ukupno {{ filtrirani.length }} datoteka će biti obrisano!</p>
        <div class="modal-akcije">
          <button class="odustani-gumb" @click="zaBrisanjeSviKorisnik = null">Odustani</button>
          <button class="potvrdi-gumb" @click="obrisiSveKorisnika" :disabled="brisanjeAktivno">
            {{ brisanjeAktivno ? 'Brišem...' : 'Obriši sve' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { supabase } from '../services/supabase';
import { db } from '../services/firebase';
import { 
  collection, 
  onSnapshot,
  doc,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

const korisnici = ref([]);
const odabraniEmail = ref(localStorage.getItem('odabraniKorisnik') || null);
const prikaziPadajuci = ref(false);
const fileInput = ref(null);
const uploadAktivan = ref(false);
const statusPoruka = ref('');
const jeGreska = ref(false);
const uploadaniMediji = ref([]);
const aktivniMedij = ref(null);
const zaBrisanjeMedij = ref(null);
const zaBrisanjeSviKorisnik = ref(null);
const brisanjeAktivno = ref(false);
const prikaziSamoOdabranog = ref(localStorage.getItem('prikaziSamoOdabranog') === 'true');
const odabraneDatoteke = ref([]);
const povlaciPreko = ref(false);
const trenutniUpload = ref(0);
const ukupniProgress = ref(0);

let unsubscribe = null;
let unsubscribeUploads = null;

const filtrirani = computed(() => {
  if (!prikaziSamoOdabranog.value || !odabraniEmail.value) {
    return uploadaniMediji.value;
  }
  return uploadaniMediji.value.filter(medij => medij.userEmail === odabraniEmail.value);
});

const ukupnaVelicina = computed(() => {
  return odabraneDatoteke.value.reduce((total, datoteka) => total + datoteka.file.size, 0);
});

const povuciPreko = (event) => {
  event.preventDefault();
  povlaciPreko.value = true;
};

const povuciVan = (event) => {
  event.preventDefault();
  povlaciPreko.value = false;
};

const ispustiDatoteke = (event) => {
  event.preventDefault();
  povlaciPreko.value = false;
  
  const datoteke = Array.from(event.dataTransfer.files);
  procesuirajDatoteke(datoteke);
};

const valjanaDatoteka = (file) => {
  const validniTipovi = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm'
  ];
  return validniTipovi.includes(file.type);
};

const procesuirajDatoteke = async (datoteke) => {
  const noveDatoteke = [];
  
  for (const file of datoteke) {
    if (valjanaDatoteka(file)) {
      const tip = file.type.startsWith('image/') ? 'image' : 'video';
      let previewUrl = null;
      
      if (tip === 'image') {
        previewUrl = URL.createObjectURL(file);
      }
      
      noveDatoteke.push({
        file,
        tip,
        previewUrl
      });
    }
  }
  
  odabraneDatoteke.value = [...odabraneDatoteke.value, ...noveDatoteke];
  resetirajStatus();
  
  if (noveDatoteke.length > 0) {
    statusPoruka.value = `Dodano ${noveDatoteke.length} datoteka za upload`;
    jeGreska.value = false;
  }
};

const promjenaDatoteka = async (event) => {
  const datoteke = Array.from(event.target.files);
  await procesuirajDatoteke(datoteke);
};

const pokreniOdabir = () => {
  if (odabraneDatoteke.value.length === 0) {
    fileInput.value.click();
  }
};

const uklonoSveDatoteke = () => {
  odabraneDatoteke.value.forEach(datoteka => {
    if (datoteka.previewUrl) {
      URL.revokeObjectURL(datoteka.previewUrl);
    }
  });
  
  odabraneDatoteke.value = [];
  resetirajStatus();
};

const uploadajSveDatoteke = async () => {
  if (odabraneDatoteke.value.length === 0 || !odabraniEmail.value) {
    statusPoruka.value = 'Molimo odaberite datoteke i korisnika';
    jeGreska.value = true;
    return;
  }
  
  try {
    uploadAktivan.value = true;
    trenutniUpload.value = 0;
    ukupniProgress.value = 0;
    statusPoruka.value = 'Upload u tijeku...';
    jeGreska.value = false;
    
    const ukupnoDatoteka = odabraneDatoteke.value.length;
    
    for (let i = 0; i < ukupnoDatoteka; i++) {
      const datoteka = odabraneDatoteke.value[i];
      trenutniUpload.value = i + 1;
      
      try {
        await uploadajDatoteku(datoteka);
        ukupniProgress.value = ((i + 1) / ukupnoDatoteka) * 100;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Greška pri uploadu datoteke ${datoteka.file.name}:`, error);
      }
    }
    
    statusPoruka.value = `Uspješno uploadano ${ukupnoDatoteka} datoteka!`;
    jeGreska.value = false;
    
    setTimeout(() => {
      uklonoSveDatoteke();
    }, 2000);
    
  } catch (error) {
    console.error('Greška pri uploadu:', error);
    statusPoruka.value = `Greška pri uploadu: ${error.message}`;
    jeGreska.value = true;
  } finally {
    uploadAktivan.value = false;
    trenutniUpload.value = 0;
    ukupniProgress.value = 0;
  }
};

const uploadajDatoteku = async (datoteka) => {
  const file = datoteka.file;
  const tip = datoteka.tip;
  
  const datumVrijeme = new Date().toISOString().replace(/[:.]/g, '-');
  const korisnikDio = odabraniEmail.value.replace('@', '_at_');
  const tipBucketDio = tip === 'image' ? 'images' : 'video';
  const datotekaNaziv = `${datumVrijeme}_${file.name.replace(/\s+/g, '_')}`;
  const putanja = `${korisnikDio}/${datotekaNaziv}`;
  
  const { data, error } = await supabase.storage
    .from(tipBucketDio)
    .upload(putanja, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });
  
  if (error) {
    throw error;
  }
  
  const { data: urlData } = supabase.storage
    .from(tipBucketDio)
    .getPublicUrl(putanja);
  
  if (!urlData || !urlData.publicUrl) {
    throw new Error('Problem prilikom dohvaćanja javnog URL-a');
  }
  
  const publicUrl = urlData.publicUrl;
  
  const noviMedij = {
    id: 'temp_' + Date.now() + '_' + Math.random(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: putanja,
    bucketName: tipBucketDio,
    publicUrl: publicUrl,
    uploadedAt: new Date(),
    userEmail: odabraniEmail.value,
    fileCategory: tip
  };
  
  uploadaniMediji.value = [noviMedij, ...uploadaniMediji.value];

  const trajna_medij_lista = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
  trajna_medij_lista.unshift(noviMedij);  
  localStorage.setItem('uploadani_mediji', JSON.stringify(trajna_medij_lista));

  try {
    const docRef = await addDoc(collection(db, 'uploads'), {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: putanja,
      bucketName: tipBucketDio,
      publicUrl: publicUrl,
      uploadedAt: serverTimestamp(),
      userEmail: odabraniEmail.value,
      fileCategory: tip
    });
    
    const index = uploadaniMediji.value.findIndex(medij => medij.id === noviMedij.id);
    if (index !== -1) {
      uploadaniMediji.value[index].id = docRef.id;
    }
    
  } catch (firestoreError) {
    console.error('Firestore error:', firestoreError);
  }
};

const prekidacFilter = () => {
  prikaziSamoOdabranog.value = !prikaziSamoOdabranog.value;
  localStorage.setItem('prikaziSamoOdabranog', prikaziSamoOdabranog.value.toString());
};

const prekidacPadajuci = () => {
  prikaziPadajuci.value = !prikaziPadajuci.value;
};

const odaberiKorisnika = (email) => {
  odabraniEmail.value = email;
  localStorage.setItem('odabraniKorisnik', email);
  prikaziPadajuci.value = false;
};

const formatirajVelicinu = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatirajDatum = (timestamp) => {
  if (!timestamp) return 'Nepoznat datum';
  
  const date = timestamp instanceof Date ? timestamp : 
              timestamp.seconds ? new Date(timestamp.seconds * 1000) : 
              new Date(timestamp);
              
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

const skratiNaziv = (naziv, maxLength) => {
  if (!naziv) return '';
  if (naziv.length <= maxLength) return naziv;
  
  const ekstenzija = naziv.lastIndexOf('.');
  if (ekstenzija !== -1 && ekstenzija > maxLength - 6) {
    const ext = naziv.substring(ekstenzija);
    return naziv.substring(0, maxLength - 3 - ext.length) + '...' + ext;
  }
  
  return naziv.substring(0, maxLength - 3) + '...';
};

const slikaGreska = (event) => {
  console.error('Greška učitavanja slike:', event.target.src);
  event.target.style.display = 'none';
  event.target.classList.add('error-image');
  
  const placeholder = document.createElement('div');
  placeholder.className = 'slika-greska-placeholder';
  placeholder.innerHTML = `
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
    <p>Slika se ne može prikazati</p>
  `;
  
  event.target.parentNode.appendChild(placeholder);
};

const videoGreska = (event) => {
  console.error('Greška učitavanja videa:', event.target.src);
  event.target.classList.add('error-video');
  const parent = event.target.parentNode;
  const errorMessage = document.createElement('div');
  errorMessage.className = 'video-error-message';
  errorMessage.textContent = 'Video nije moguće prikazati';
  parent.replaceChild(errorMessage, event.target);
};

const otvoriPovecanu = (medij) => {
  aktivniMedij.value = medij;
  document.body.style.overflow = 'hidden'; 
};

const zatvoriPovecanu = () => {
  aktivniMedij.value = null;
  document.body.style.overflow = 'auto'; 
};

const potvrdiBrisanje = (medij) => {
  zaBrisanjeMedij.value = medij;
};

const potvrdiBrisanjeSvihKorisnika = () => {
  if (odabraniEmail.value && filtrirani.value.length > 0) {
    zaBrisanjeSviKorisnik.value = odabraniEmail.value;
  }
};

const obrisiDatoteku = async () => {
  if (!zaBrisanjeMedij.value || brisanjeAktivno.value) return;
  
  try {
    brisanjeAktivno.value = true;
    const medij = zaBrisanjeMedij.value;
    
    statusPoruka.value = 'Brisanje u tijeku...';
    jeGreska.value = false;
    
    try {
      const { error } = await supabase.storage
        .from(medij.bucketName)
        .remove([medij.filePath]);
        
      if (error) {
        console.error('Greška pri brisanju iz Supabase:', error);
      }
    } catch (storageError) {
      console.error('Neuspjelo brisanje iz Supabase storage:', storageError);
    }
    
    if (medij.id && !medij.id.startsWith('temp_')) {
      try {
        await deleteDoc(doc(db, 'uploads', medij.id));
      } catch (firestoreError) {
        console.error('Neuspjelo brisanje iz Firestore:', firestoreError);
      }
    }
    
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    const index = lokalni_mediji.findIndex(m => 
      (m.id === medij.id) || 
      (m.fileName === medij.fileName && m.filePath === medij.filePath)
    );
    
    if (index !== -1) {
      lokalni_mediji.splice(index, 1);
      localStorage.setItem('uploadani_mediji', JSON.stringify(lokalni_mediji));
    }
    
    const reaktivni_index = uploadaniMediji.value.findIndex(m => 
      (m.id === medij.id) || 
      (m.fileName === medij.fileName && m.filePath === medij.filePath)
    );
    
    if (reaktivni_index !== -1) {
      uploadaniMediji.value.splice(reaktivni_index, 1);
    }
    
    statusPoruka.value = 'Datoteka je uspješno obrisana';
    jeGreska.value = false;
    zaBrisanjeMedij.value = null;
    
    setTimeout(() => {
      if (statusPoruka.value === 'Datoteka je uspješno obrisana') {
        statusPoruka.value = '';
      }
    }, 3000);
    
  } catch (error) {
    console.error('Greška pri brisanju datoteke:', error);
    statusPoruka.value = `Greška pri brisanju: ${error.message}`;
    jeGreska.value = true;
  } finally {
    brisanjeAktivno.value = false;
  }
};

const obrisiSveKorisnika = async () => {
  if (!zaBrisanjeSviKorisnik.value || brisanjeAktivno.value) return;
  
  try {
    brisanjeAktivno.value = true;
    const korisnikEmail = zaBrisanjeSviKorisnik.value;
    const sviMediji = filtrirani.value;
    
    statusPoruka.value = `Brišem ${sviMediji.length} datoteka...`;
    jeGreska.value = false;
    
    for (const medij of sviMediji) {
      try {
        await supabase.storage
          .from(medij.bucketName)
          .remove([medij.filePath]);
        
        if (medij.id && !medij.id.startsWith('temp_')) {
          await deleteDoc(doc(db, 'uploads', medij.id));
        }
      } catch (error) {
        console.error(`Greška pri brisanju ${medij.fileName}:`, error);
      }
    }
    
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    const filtrirani_mediji = lokalni_mediji.filter(m => m.userEmail !== korisnikEmail);
    localStorage.setItem('uploadani_mediji', JSON.stringify(filtrirani_mediji));
    
    uploadaniMediji.value = uploadaniMediji.value.filter(m => m.userEmail !== korisnikEmail);
    
    statusPoruka.value = `Uspješno obrisano ${sviMediji.length} datoteka korisnika ${korisnikEmail}`;
    jeGreska.value = false;
    zaBrisanjeSviKorisnik.value = null;
    
    setTimeout(() => {
      statusPoruka.value = '';
    }, 5000);
    
  } catch (error) {
    console.error('Greška pri brisanju svih datoteka:', error);
    statusPoruka.value = `Greška pri brisanju: ${error.message}`;
    jeGreska.value = true;
  } finally {
    brisanjeAktivno.value = false;
  }
};

const resetirajStatus = () => {
  statusPoruka.value = '';
  jeGreska.value = false;
};

onMounted(() => {
  document.addEventListener('click', (event) => {
    const dropdownContainer = document.querySelector('.padajuci-izbornik');
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
      prikaziPadajuci.value = false;
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && aktivniMedij.value) {
      zatvoriPovecanu();
    }
  });
  
  const usersRef = collection(db, 'users');
  
  unsubscribe = onSnapshot(usersRef, (snapshot) => {
    const korisniciLista = [];
    snapshot.forEach((doc) => {
      korisniciLista.push({ id: doc.id, ...doc.data() });
    });
    korisnici.value = korisniciLista;
  }, (error) => {
    console.error('Greška pri dohvaćanju korisnika:', error);
  });
  
  const uploadsRef = collection(db, 'uploads');
  const uploadsQuery = query(uploadsRef, orderBy('uploadedAt', 'desc'), limit(50));
  
  unsubscribeUploads = onSnapshot(uploadsQuery, (snapshot) => {
    const mediji = [];
    snapshot.forEach((doc) => {
      const podaci = doc.data();
      mediji.push({ id: doc.id, ...podaci });
    });
    
    localStorage.setItem('uploadani_mediji', JSON.stringify(mediji));
    uploadaniMediji.value = mediji;
  }, (error) => {
    console.error('Greška pri dohvaćanju uploadanih medija:', error);
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    if (lokalni_mediji.length > 0) {
      uploadaniMediji.value = lokalni_mediji;
    }
  });
  
  const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
  if (lokalni_mediji.length > 0) {
    uploadaniMediji.value = lokalni_mediji;
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  
  if (unsubscribeUploads) {
    unsubscribeUploads();
  }
  
  odabraneDatoteke.value.forEach(datoteka => {
    if (datoteka.previewUrl) {
      URL.revokeObjectURL(datoteka.previewUrl);
    }
  });
  
  document.body.style.overflow = 'auto';
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.galerija {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.naslov-sekcija {
  text-align: center;
  margin-bottom: 30px;
}

.glavni-naslov {
  color: #123458;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2rem;
  position: relative;
  display: inline-block;
}

.glavni-naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.glavni-sadrzaj {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

@media (max-width: 768px) {
  .galerija {
    padding: 15px;
    margin: 10px;
  }
  
  .glavni-naslov {
    font-size: 1.5rem;
  }
  
  .glavni-sadrzaj {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .upload-panel {
    order: -1;
  }
}

.galerija-okvir {
  min-height: 400px;
}

.mediji-lista {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
  height: 100%;
}

@media (max-width: 768px) {
  .mediji-lista {
    padding: 15px;
  }
}

.mediji-mreza {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .mediji-mreza {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .mediji-mreza {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
}

.medij-kartica {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid #123458;
  position: relative;
}

.medij-kartica:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(18, 52, 88, 0.15);
  border-color: #123458;
}

@media (max-width: 768px) {
  .medij-kartica:hover {
    transform: translateY(-4px);
  }
}

.brisanje-prekrivac {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.medij-kartica:hover .brisanje-prekrivac {
  opacity: 1;
}

@media (max-width: 768px) {
  .brisanje-prekrivac {
    opacity: 1;
  }
}

.brisi-gumb {
  background-color: rgba(229, 57, 53, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .brisi-gumb {
    width: 28px;
    height: 28px;
  }
  
  .brisi-gumb svg {
    width: 14px;
    height: 14px;
  }
}

.brisi-gumb:hover {
  background-color: rgba(229, 57, 53, 1);
  transform: scale(1.1);
}

.medij-prikaz {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative;
  background-color: #F1EFEC;
  cursor: pointer;
}

@media (max-width: 768px) {
  .medij-prikaz {
    height: 140px;
  }
}

@media (max-width: 480px) {
  .medij-prikaz {
    height: 120px;
  }
}

.medij-prikaz img,
.medij-prikaz video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.medij-kartica:hover .medij-prikaz img,
.medij-kartica:hover .medij-prikaz video {
  transform: scale(1.05);
}

.ostalo-prikaz {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F1EFEC;
  color: #6c757d;
  font-size: 0.8rem;
}

.medij-podaci {
  padding: 12px;
  background-color: #F1EFEC;
  border-top: 1px solid #123458;
}

@media (max-width: 768px) {
  .medij-podaci {
    padding: 10px;
  }
}

.medij-naziv {
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .medij-naziv {
    font-size: 0.8rem;
  }
}

.medij-detalji {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #5D8AA8;
  margin-bottom: 6px;
}

@media (max-width: 768px) {
  .medij-detalji {
    font-size: 0.65rem;
    flex-direction: column;
    gap: 2px;
  }
}

.korisnik-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
}

@media (max-width: 768px) {
  .korisnik-email {
    max-width: 100%;
  }
}

.datum-upload {
  color: #6c757d;
  font-weight: 500;
}

.prazno {
  background-color: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  border: 1px solid #D4C9BE;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .prazno {
    padding: 30px 15px;
  }
}

.prazno p {
  margin: 5px 0;
  color: #123458;
  font-weight: 500;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .prazno p {
    font-size: 0.9rem;
  }
}

.prazno-opis {
  color: #6c757d;
  font-size: 0.85rem !important;
  font-weight: 400 !important;
  margin-top: 10px !important;
}

.upload-panel {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

@media (max-width: 768px) {
  .upload-panel {
    padding: 15px;
  }
}

.panel-naslov {
  color: #123458;
  margin: 0 0 15px 0;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  position: relative;
}

@media (max-width: 768px) {
  .panel-naslov {
    font-size: 1rem;
    margin-bottom: 12px;
  }
}

.panel-naslov::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background-color: #123458;
  border-radius: 2px;
}

.grupa-polja {
  margin-bottom: 12px;
}

.grupa-polja label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #123458;
  font-size: 0.85rem;
}

.padajuci-izbornik {
  position: relative;
  width: 100%;
}

.odabrani-korisnik {
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .odabrani-korisnik {
    padding: 12px;
    font-size: 0.9rem;
  }
}

.odabrani-korisnik:hover {
  border-color: #5D8AA8;
  box-shadow: 0 3px 8px rgba(93, 138, 168, 0.15);
}

.strelica {
  font-size: 0.7rem;
  color: #123458;
}

.izbornik-lista {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 5px;
}

.izbornik-stavka {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .izbornik-stavka {
    padding: 12px;
    font-size: 0.9rem;
  }
}

.izbornik-stavka:hover {
  background-color: rgba(93, 138, 168, 0.08);
}

.izbornik-stavka.aktivna {
  background-color: #123458;
  color: white;
  font-weight: 500;
}

.filter-kontrole {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-gumb {
  width: 100%;
  padding: 10px 12px;
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .filter-gumb {
    padding: 12px;
    font-size: 0.85rem;
  }
}

.filter-gumb:hover {
  background-color: #1c4c80;
}

.filter-gumb.aktivan {
  background-color: #1c4c80;
  box-shadow: 0 2px 8px rgba(18, 52, 88, 0.3);
}

.brisi-sve-gumb {
  width: 100%;
  padding: 10px 12px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .brisi-sve-gumb {
    padding: 12px;
    font-size: 0.85rem;
  }
}

.brisi-sve-gumb:hover:not(:disabled) {
  background-color: #c62828;
}

.brisi-sve-gumb:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-zona {
  border: 2px dashed #D4C9BE;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  margin: 12px 0;
  transition: all 0.3s ease;
  background-color: rgba(212, 201, 190, 0.1);
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 768px) {
  .upload-zona {
    min-height: 120px;
    padding: 12px;
  }
}

.upload-zona:hover,
.upload-zona.povlaci-preko {
  border-color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.1);
  transform: translateY(-2px);
}

.upload-zona.ima-datoteke {
  padding: 12px;
  min-height: auto;
}

.upload-ikona {
  color: #123458;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .upload-ikona svg {
    width: 30px;
    height: 30px;
  }
}

.glavni-tekst {
  color: #123458;
  margin: 8px 0;
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .glavni-tekst {
    font-size: 0.85rem;
  }
}

.upload-napomena {
  font-size: 0.75rem;
  color: #6c757d;
  margin: 6px 0;
}

@media (max-width: 768px) {
  .upload-napomena {
    font-size: 0.7rem;
  }
}

.odabrane {
  background-color: rgba(93, 138, 168, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #5D8AA8;
}

.datoteke-naslov {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #D4C9BE;
}

.datoteke-naslov h4 {
  margin: 0;
  color: #123458;
  font-size: 0.9rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .datoteke-naslov h4 {
    font-size: 0.85rem;
  }
}

.ukloni-sve-gumb {
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .ukloni-sve-gumb {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}

.ukloni-sve-gumb:hover {
  background-color: #c62828;
  transform: translateY(-1px);
}

.datoteke-lista {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .datoteke-lista {
    max-height: 120px;
  }
}

.datoteka-stavka {
  display: flex;
  align-items: center;
  padding: 6px;
  margin-bottom: 6px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
  transition: all 0.2s;
}

.datoteka-stavka:hover {
  border-color: #5D8AA8;
  box-shadow: 0 2px 8px rgba(93, 138, 168, 0.1);
}

.datoteka-prikaz {
  width: 35px;
  height: 35px;
  margin-right: 8px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #D4C9BE;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F1EFEC;
}

@media (max-width: 768px) {
  .datoteka-prikaz {
    width: 30px;
    height: 30px;
  }
}

.datoteka-prikaz img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-prikaz {
  font-size: 1rem;
  color: #5D8AA8;
}

@media (max-width: 768px) {
  .video-prikaz {
    font-size: 0.9rem;
  }
}

.datoteka-podaci {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.datoteka-naziv {
  font-weight: 500;
  color: #123458;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

@media (max-width: 768px) {
  .datoteka-naziv {
    font-size: 0.7rem;
  }
}

.datoteka-velicina {
  font-size: 0.65rem;
  color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.1);
  padding: 2px 5px;
  border-radius: 8px;
  display: inline-block;
  width: fit-content;
}

@media (max-width: 768px) {
  .datoteka-velicina {
    font-size: 0.6rem;
  }
}

.vise-datoteka {
  text-align: center;
  color: #5D8AA8;
  font-style: italic;
  font-size: 0.75rem;
  padding: 8px;
  background-color: rgba(93, 138, 168, 0.05);
  border-radius: 6px;
  border: 1px dashed #5D8AA8;
}

@media (max-width: 768px) {
  .vise-datoteka {
    font-size: 0.7rem;
  }
}

.ukupna-velicina {
  text-align: center;
  font-weight: 600;
  color: #123458;
  font-size: 0.8rem;
  padding: 6px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
}

@media (max-width: 768px) {
  .ukupna-velicina {
    font-size: 0.75rem;
  }
}

.upload-akcije {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-gumb {
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 6px rgba(18, 52, 88, 0.2);
  font-size: 0.85rem;
  width: 100%;
}

@media (max-width: 768px) {
  .upload-gumb {
    padding: 14px;
    font-size: 0.9rem;
  }
}

.upload-gumb:hover:not(:disabled) {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(18, 52, 88, 0.3);
}

.upload-gumb:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.progress-okvir {
  width: 100%;
}

.progress-traka {
  width: 100%;
  height: 8px;
  background-color: #D4C9BE;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 6px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #123458, #5D8AA8);
  border-radius: 8px;
  transition: width 0.3s ease;
}

.progress-tekst {
  text-align: center;
  font-size: 0.75rem;
  color: #123458;
  font-weight: 500;
}

@media (max-width: 768px) {
  .progress-tekst {
    font-size: 0.7rem;
  }
}

.status-poruka {
  margin: 10px 0;
  padding: 8px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .status-poruka {
    font-size: 0.75rem;
  }
}

.status-poruka.uspjeh {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid #10B981;
}

.status-poruka.greska {
  background-color: rgba(229, 57, 53, 0.1);
  color: #E53935;
  border: 1px solid #E53935;
}

.povecani-prikaz {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .povecani-prikaz {
    padding: 10px;
  }
}

.povecani-sadrzaj {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.zatvori-gumb {
  position: absolute;
  top: -35px;
  right: 0;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  z-index: 10;
}

@media (max-width: 768px) {
  .zatvori-gumb {
    top: -30px;
    width: 25px;
    height: 25px;
    font-size: 0.9rem;
  }
}

.zatvori-gumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.povecani-medij {
  display: flex;
  align-items: center;
  justify-content: center;
}

.povecani-medij img,
.povecani-medij video {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 5px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .povecani-medij img,
  .povecani-medij video {
    max-height: 85vh;
  }
}

.modal-pozadina {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

@media (max-width: 768px) {
  .modal-pozadina {
    padding: 15px;
  }
}

.modal-potvrda {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.3s;
}

@media (max-width: 768px) {
  .modal-potvrda {
    padding: 15px;
    max-width: 350px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-potvrda h4 {
  color: #123458;
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid #D4C9BE;
  padding-bottom: 8px;
}

@media (max-width: 768px) {
  .modal-potvrda h4 {
    font-size: 1rem;
  }
}

.modal-potvrda p {
  margin: 8px 0;
  color: #333;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 768px) {
  .modal-potvrda p {
    font-size: 0.85rem;
  }
}

.datoteka-za-brisanje {
  font-weight: 500;
  color: #e53935;
  background-color: rgba(229, 57, 53, 0.1);
  padding: 6px;
  border-radius: 5px;
  margin: 10px 0;
  word-break: break-all;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .datoteka-za-brisanje {
    font-size: 0.75rem;
  }
}

.korisnik-za-brisanje {
  font-weight: 600;
  color: #123458;
  background-color: rgba(18, 52, 88, 0.1);
  padding: 6px;
  border-radius: 5px;
  margin: 10px 0;
  text-align: center;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .korisnik-za-brisanje {
    font-size: 0.75rem;
  }
}

.broj-datoteka {
  font-weight: 500;
  color: #e53935;
  background-color: rgba(229, 57, 53, 0.1);
  padding: 6px;
  border-radius: 5px;
  margin: 10px 0;
  text-align: center;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .broj-datoteka {
    font-size: 0.75rem;
  }
}

.modal-akcije {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  gap: 10px;
}

@media (max-width: 768px) {
  .modal-akcije {
    flex-direction: column;
    gap: 8px;
  }
}

.odustani-gumb {
  padding: 10px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .odustani-gumb {
    padding: 12px;
    font-size: 0.9rem;
  }
}

.odustani-gumb:hover {
  background-color: #5a6268;
}

.potvrdi-gumb {
  padding: 10px 15px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .potvrdi-gumb {
    padding: 12px;
    font-size: 0.9rem;
  }
}

.potvrdi-gumb:hover:not(:disabled) {
  background-color: #c62828;
}

.potvrdi-gumb:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-image, 
.error-video {
  opacity: 0.7;
  border: 2px solid #E53935;
}

.slika-greska-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(229, 57, 53, 0.1);
  color: #E53935;
  padding: 15px;
  text-align: center;
  border: 2px dashed #E53935;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .slika-greska-placeholder {
    padding: 10px;
  }
  
  .slika-greska-placeholder svg {
    width: 40px;
    height: 40px;
  }
}

.slika-greska-placeholder p {
  margin: 8px 0 0 0;
  font-weight: 500;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .slika-greska-placeholder p {
    font-size: 0.75rem;
  }
}

.video-error-message {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(229, 57, 53, 0.1);
  color: #E53935;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .video-error-message {
    font-size: 0.7rem;
  }
}
</style>